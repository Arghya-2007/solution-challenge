import os
import json
import numpy as np
import pandas as pd
from scipy import stats
from google import genai
from google.genai import types
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def calculate_severity(metric_type, metrics):
    """
    Heuristic to determine severity level based on bias metrics.
    Levels: critical, high, moderate, low, safe
    """
    p_val = metrics.get("chi_square_p_value") or metrics.get("p_value") or metrics.get("variance_p_value", 1.0)
    
    if metric_type == "categorical_disparity":
        air = metrics.get("adverse_impact_ratio", 1.0)
        if air < 0.5 and p_val < 0.01: return "critical"
        if air < 0.8 and p_val < 0.05: return "high"
        if air < 0.9 and p_val < 0.05: return "moderate"
        if air < 0.9 or p_val < 0.05: return "low"
        return "safe"
    
    elif metric_type == "linear_correlation":
        r = abs(metrics.get("pearson_r_coefficient", 0.0))
        if r > 0.5 and p_val < 0.01: return "critical"
        if r > 0.3 and p_val < 0.05: return "high"
        if r > 0.1 and p_val < 0.05: return "moderate"
        if r > 0.05 or p_val < 0.05: return "low"
        return "safe"
        
    elif metric_type == "continuous_variance_analysis":
        if p_val < 0.001: return "critical"
        if p_val < 0.01: return "high"
        if p_val < 0.05: return "moderate"
        if p_val < 0.1: return "low"
        return "safe"
        
    return "low"

def calculate_risk_score(metric_type, metrics):
    """
    Calculates a continuous risk score from 0 to 100 based on effect size and statistical significance.
    """
    p_val = metrics.get("chi_square_p_value") or metrics.get("p_value") or metrics.get("variance_p_value", 1.0)
    base_risk = 0.0

    if metric_type == "categorical_disparity":
        air = metrics.get("adverse_impact_ratio", 1.0)
        base_risk = min(100.0, max(0.0, (1.0 - air) * 200.0))
    elif metric_type == "linear_correlation":
        r = abs(metrics.get("pearson_r_coefficient", 0.0))
        base_risk = min(100.0, r * 200.0)
    elif metric_type == "continuous_variance_analysis":
        # Logarithmic scale for p-values
        base_risk = min(100.0, max(0.0, -20.0 * np.log10(p_val + 1e-10)))

    # Confidence multiplier
    if p_val < 0.01:
        multiplier = 1.0
    elif p_val < 0.05:
        multiplier = 0.8
    else:
        multiplier = 0.2

    return int(round(base_risk * multiplier))

def generate_mathematical_metrics(df: pd.DataFrame, target_col: str, protected_cols: list) -> dict:
    """
    Universally computes baseline statistics, group fairness disparities, statistical significance 
    (Chi-Square, ANOVA, Pearson, T-test), and missingness biases using native Pandas and SciPy operations.
    """
    df = df.copy()
    
    report = {
        "global_stats": {
            "total_records": len(df),
            "severity": "safe",
            "overall_risk_score": 0
        },
        "attribute_analysis": {},
        "missingness_analysis": {}
    }
    
    # 1. DYNAMIC TARGET PROFILE IDENTIFICATION
    # Drop NaNs in target immediately so we don't treat them as a class
    df = df.dropna(subset=[target_col]).copy()
    
    is_numeric = pd.api.types.is_numeric_dtype(df[target_col])
    unique_vals = df[target_col].unique()
    
    if not is_numeric and len(unique_vals) > 2:
        # Force string targets to binary by keeping only the top 2 most frequent classes
        top_classes = df[target_col].value_counts().nlargest(2).index
        df = df[df[target_col].isin(top_classes)].copy()
        unique_vals = df[target_col].unique()

    is_target_binary = len(unique_vals) <= 2 or pd.api.types.is_bool_dtype(df[target_col])
    
    if is_target_binary:
        unique_vals = sorted(list(unique_vals))
        if len(unique_vals) == 2:
            val_map = {unique_vals[0]: 0, unique_vals[1]: 1}
        elif len(unique_vals) == 1:
            val_map = {unique_vals[0]: 1}
        else:
            val_map = {}
            
        df[target_col] = df[target_col].map(val_map)
        report["global_stats"]["target_type"] = "binary"
        report["global_stats"]["base_positive_rate"] = float(df[target_col].mean()) if len(df) > 0 else 0.0
    else:
        report["global_stats"]["target_type"] = "continuous"
        report["global_stats"]["global_mean"] = float(df[target_col].mean()) if len(df) > 0 else 0.0
        report["global_stats"]["global_std_dev"] = float(df[target_col].std()) if len(df) > 1 else 0.0
        
    severities = []
    risk_scores = []
    
    for col in protected_cols:
        if col not in df.columns:
            continue
            
        # ----------------------------------------------------
        # APPROACH A: TARGET IS BINARY (Classification)
        # ----------------------------------------------------
        if is_target_binary:
            group_rates = {str(k): float(v) for k, v in df.groupby(col)[target_col].mean().to_dict().items()}
            max_rate = max(group_rates.values()) if max(group_rates.values()) > 0 else 1.0
            min_rate = min(group_rates.values())
            
            adverse_impact = min_rate / max_rate
            statistical_parity_diff = max_rate - min_rate
            
            # Chi-Square Significance Test
            contingency_table = pd.crosstab(df[col], df[target_col]).values
            if contingency_table.shape[0] >= 2 and contingency_table.shape[1] >= 2:
                chi2_stat, p_val, _, _ = stats.chi2_contingency(contingency_table)
            else:
                p_val = 1.0
                
            metrics = {
                "metric_type": "categorical_disparity",
                "selection_rates": group_rates,
                "adverse_impact_ratio": round(float(adverse_impact), 3),
                "statistical_parity_difference": round(float(statistical_parity_diff), 3),
                "chi_square_p_value": round(float(p_val), 4),
                "is_statistically_significant": bool(p_val < 0.05),
                "status": "FAIL" if (adverse_impact < 0.80 and p_val < 0.05) else "PASS"
            }
            metrics["severity"] = calculate_severity("categorical_disparity", metrics)
            metrics["attribute_risk_score"] = calculate_risk_score("categorical_disparity", metrics)
            report["attribute_analysis"][col] = metrics
            severities.append(metrics["severity"])
            risk_scores.append(metrics["attribute_risk_score"])
            
        # ----------------------------------------------------
        # APPROACH B: TARGET IS CONTINUOUS NUMERICAL (Regression)
        # ----------------------------------------------------
        else:
            if pd.api.types.is_numeric_dtype(df[col]) and not pd.api.types.is_bool_dtype(df[col]):
                # Pearson Linear Correlation for Continuous vs Continuous
                clean_pair = df[[col, target_col]].dropna()
                if len(clean_pair) > 2:
                    r_coef, p_val = stats.pearsonr(clean_pair[col], clean_pair[target_col])
                    metrics = {
                        "metric_type": "linear_correlation",
                        "pearson_r_coefficient": round(float(r_coef), 3),
                        "p_value": round(float(p_val), 4),
                        "linear_bias_detected": bool(p_val < 0.05 and abs(r_coef) > 0.1),
                        "status": "FAIL" if (p_val < 0.05 and abs(r_coef) > 0.1) else "PASS"
                    }
                    metrics["severity"] = calculate_severity("linear_correlation", metrics)
                    metrics["attribute_risk_score"] = calculate_risk_score("linear_correlation", metrics)
                    report["attribute_analysis"][col] = metrics
                    severities.append(metrics["severity"])
                    risk_scores.append(metrics["attribute_risk_score"])
            else:
                # ANOVA / T-Test for Categorical vs Continuous
                groups = [df[df[col] == g][target_col].dropna().values for g in df[col].dropna().unique()]
                if len(groups) >= 2:
                    if len(groups) > 2:
                        f_stat, p_val = stats.f_oneway(*groups)
                    else:
                        f_stat, p_val = stats.ttest_ind(groups[0], groups[1], equal_var=False)
                        
                    group_means = {str(k): float(v) for k, v in df.groupby(col)[target_col].mean().to_dict().items()}
                    
                    metrics = {
                        "metric_type": "continuous_variance_analysis",
                        "group_means": group_means,
                        "variance_p_value": round(float(p_val), 4),
                        "is_statistically_significant": bool(p_val < 0.05),
                        "status": "FAIL" if p_val < 0.05 else "PASS"
                    }
                    metrics["severity"] = calculate_severity("continuous_variance_analysis", metrics)
                    metrics["attribute_risk_score"] = calculate_risk_score("continuous_variance_analysis", metrics)
                    report["attribute_analysis"][col] = metrics
                    severities.append(metrics["severity"])
                    risk_scores.append(metrics["attribute_risk_score"])

        # ----------------------------------------------------
        # 2. MISSINGNESS IMPACT AUDIT
        # ----------------------------------------------------
        flag_col = f"{col}_was_missing"
        if flag_col in df.columns and df[flag_col].sum() > 0:
            missing_group_rates = df.groupby(flag_col)[target_col].mean().to_dict()
            provided_rate = float(missing_group_rates.get(0, 0.0))
            imputed_rate = float(missing_group_rates.get(1, 0.0))
            
            threshold = 0.05 if is_target_binary else float(df[target_col].std() * 0.1)
            
            report["missingness_analysis"][col] = {
                "provided_data_mean": round(provided_rate, 3),
                "imputed_data_mean": round(imputed_rate, 3),
                "disparity_detected": bool(abs(provided_rate - imputed_rate) > threshold)
            }

    # Determine global severity and risk score
    severity_order = {"critical": 4, "high": 3, "moderate": 2, "low": 1, "safe": 0}
    if severities:
        max_severity_val = max([severity_order.get(s, 0) for s in severities])
        report["global_stats"]["severity"] = [k for k, v in severity_order.items() if v == max_severity_val][0]
    
    if risk_scores:
        report["global_stats"]["overall_risk_score"] = max(risk_scores)
            
    # ----------------------------------------------------
    # 3. INTERSECTIONALITY FEATURE MATRIX 
    # ----------------------------------------------------
    categorical_protected = [c for c in protected_cols if c in df.columns and (not pd.api.types.is_numeric_dtype(df[c]) or pd.api.types.is_bool_dtype(df[c]))]
    if len(categorical_protected) >= 2:
        col1, col2 = categorical_protected[0], categorical_protected[1]
        matrix_df = df.groupby([col1, col2])[target_col].mean().unstack().fillna(0.0)
        
        matrix_dict = {str(k): {str(sub_k): float(sub_v) for sub_k, sub_v in v.items()} 
                       for k, v in matrix_df.to_dict().items()}
        
        report["intersectionality"] = {
            "attributes": [col1, col2],
            "matrix": matrix_dict
        }
        
    return report

def generate_comprehensive_ai_report(metrics_payload: dict) -> tuple:
    """
    Feeds the computed mathematical JSON payload into Gemini to generate BOTH
    an analytical narrative report and column-specific recommendations in a single call.
    """
    try:
        import google.auth
        credentials, default_project_id = google.auth.default()
        project_id = os.getenv("GOOGLE_CLOUD_PROJECT") or default_project_id
        location = os.getenv("GOOGLE_CLOUD_LOCATION", "asia-south1")
        
        client = genai.Client(vertexai=True, project=project_id, location=location)
        
        import copy
        trimmed_payload = copy.deepcopy(metrics_payload)
        if "intersectionality" in trimmed_payload:
            del trimmed_payload["intersectionality"]
            
        prompt = f"""
        You are the core AI Insights engine of an Enterprise Bias Mitigation and Fairness Auditing SaaS.
        Analyze the following calculated statistical bias payload extracted from an uploaded user dataset:
        
        {json.dumps(trimmed_payload, indent=2)}
        
        You have TWO tasks:
        1. Generate a precise, professional, and clinical executive summary report formatted in Markdown.
           Use exactly these headers:
           ### 🔍 Executive Diagnosis
           ### 🚨 Critical Disparities
           ### 📉 Data Collection Flaws
           Maintain a high-fidelity data scientist tone.
           
        2. Provide plain-language, non-technical recommendations for each protected column in the `attribute_analysis` section to reduce bias. 
           DO NOT use statistical jargon like "p-value" or "AIR". Focus on "What to do next".
           
        Return a JSON object strictly following this structure:
        {{
            "executive_summary_markdown": "<your markdown string here>",
            "recommendations": {{
                "column_name": "Recommendation string"
            }}
        }}
        """
        
        response = client.models.generate_content(
            model=os.getenv('GEMINI_MODEL', 'gemini-3.1-pro-preview'),
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.0,
                response_mime_type="application/json"
            )
        )
        
        result = json.loads(response.text)
        return result.get("executive_summary_markdown", ""), result.get("recommendations", {})
    except Exception as e:
        print(f"Warning: AI Narrative generation failed ({e})")
        return f"### 🔍 Executive Diagnosis\nWarning: AI generation failed ({e}). Please review the raw metrics.", {}

def create_comprehensive_audit_report(df: pd.DataFrame, target_col: str, protected_cols: list, protected_classification: dict = None) -> tuple:
    """
    Main orchestrator function.
    Returns a tuple containing:
    1. A serialized JSON payload (for visual UI chart elements)
    2. A structured Markdown Text Report string (generated by Gemini)
    """
    import time
    print("Starting generate_mathematical_metrics...")
    t0 = time.time()
    raw_metrics = generate_mathematical_metrics(df, target_col, protected_cols)
    print(f"Finished generate_mathematical_metrics in {time.time()-t0:.2f}s")
    
    if protected_classification:
        raw_metrics["protected_classification"] = protected_classification
    
    # Generate both narrative and recommendations in a single fast AI call
    print("Starting generate_comprehensive_ai_report...")
    t0 = time.time()
    markdown_narrative, recommendations = generate_comprehensive_ai_report(raw_metrics)
    print(f"Finished generate_comprehensive_ai_report in {time.time()-t0:.2f}s")
    
    # Merge recommendations back into the raw_metrics
    if recommendations and isinstance(recommendations, dict):
        for col, rec in recommendations.items():
            if col in raw_metrics["attribute_analysis"]:
                raw_metrics["attribute_analysis"][col]["recommendation"] = rec
        
    return raw_metrics, markdown_narrative