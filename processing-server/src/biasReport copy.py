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


class Computes:
    pass


def generate_mathematical_metrics(df: pd.DataFrame, target_col: str, protected_cols: list) -> dict:
    """
    Computes baseline statistics, group fairness disparities, missingness biases,
    and intersectional data matrices using native Pandas mathematical operations.
    """
    report = {
        "global_stats": {
            "total_records": len(df),
            "base_positive_rate": float(df[target_col].mean())
        },
        "attribute_analysis": {},
        "missingness_analysis": {}
    }
    
    for col in protected_cols:
        if col not in df.columns:
            continue
            
        # 1. Group Fairness Metrics Slicing
        # Convert group outcomes to standard native python floats to prevent serialization issues
        group_rates = {str(k): float(v) for k, v in df.groupby(col)[target_col].mean().to_dict().items()}
        
        # Calculate Disparate Impact & Statistical Parity
        max_rate = max(group_rates.values()) if max(group_rates.values()) > 0 else 1.0
        min_rate = min(group_rates.values())
        
        disparate_impact = min_rate / max_rate
        statistical_parity_diff = max_rate - min_rate
        
        report["attribute_analysis"][col] = {
            "selection_rates": group_rates,
            "disparate_impact_ratio": round(float(disparate_impact), 3),
            "statistical_parity_difference": round(float(statistical_parity_diff), 3),
            "status": "FAIL" if disparate_impact < 0.80 else "PASS"
        }
        
        # 2. Missingness Impact Audit
        flag_col = f"{col}_was_missing"
        if flag_col in df.columns and df[flag_col].sum() > 0:
            missing_group_rates = df.groupby(flag_col)[target_col].mean().to_dict()
            
            provided_rate = float(missing_group_rates.get(0, 0.0))
            imputed_rate = float(missing_group_rates.get(1, 0.0))
            
            report["missingness_analysis"][col] = {
                "provided_data_success_rate": round(provided_rate, 3),
                "imputed_data_success_rate": round(imputed_rate, 3),
                "disparity_detected": bool(abs(provided_rate - imputed_rate) > 0.05)
            }
            
    # 3. Intersectionality Feature Matrix (Top 2 compounding attributes)
    if len(protected_cols) >= 2:
        col1, col2 = protected_cols[0], protected_cols[1]
        matrix_df = df.groupby([col1, col2])[target_col].mean().unstack().fillna(0.0)
        
        # Safe nested dictionary parsing to strictly avoid NumPy runtime type crashes
        matrix_dict = {str(k): {str(sub_k): float(sub_v) for sub_k, sub_v in v.items()} 
                       for k, v in matrix_df.to_dict().items()}
        
        report["intersectionality"] = {
            "attributes": [col1, col2],
            "matrix": matrix_dict
        }
        
    return report


def generate_ai_executive_summary(metrics_payload: dict) -> str:
    """
    Feeds the computed mathematical JSON payload into the Gemini 1.5 Flash model
    to generate an analytical narrative report for the dashboard frontend.
    """
    # Ensure your API key environment variable is configured natively
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        return "### 🔍 Executive Diagnosis\nWarning: GEMINI_API_KEY or GOOGLE_API_KEY not set. AI Narrative could not be generated. Please review the raw metrics in the JSON payload.\n\n### 🚨 Critical Disparities\nManual review required.\n\n### 📉 Data Collection Flaws\nManual review required."

    try:
        client = genai.Client(api_key=api_key)
        
        prompt = f"""
        You are the core AI Insights engine of an Enterprise Bias Mitigation and Fairness Auditing SaaS.
        Analyze the following calculated statistical bias payload extracted from an uploaded user dataset:
        
        {json.dumps(metrics_payload, indent=2)}
        
        Generate a precise, professional, and clinical executive summary report.
        You must format your response using EXACTLY these markdown headers:
        
        ### 🔍 Executive Diagnosis
        Provide a concise, maximum 2-sentence macro evaluation assessing the dataset's global systemic health and overall parity baseline.
        
        ### 🚨 Critical Disparities
        Detail any specific protected attributes that generated a "FAIL" status under the 80% adverse impact rule. Explicitly state the statistical disparities and outcome gaps between groups. If all passed, summarize the variance findings cleanly.
        
        ### 📉 Data Collection Flaws
        Evaluate the data under the `missingness_analysis` section. Explicitly warn the user if a significant disparity was detected between rows where real values were provided versus where values were missing and dynamically imputed.
        
        Avoid generic prose, conversational introductory phrases, or surface-level fluff. Maintain a high-fidelity data scientist tone.
        """
        
        response = client.models.generate_content(
            model='gemini-1.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.1,  # Kept ultra-low for clinical accuracy and adherence to math
            )
        )
        
        return response.text
    except Exception as e:
        return f"### 🔍 Executive Diagnosis\nWarning: AI Narrative generation failed ({e}). Please review the raw metrics in the JSON payload.\n\n### 🚨 Critical Disparities\nManual review required.\n\n### 📉 Data Collection Flaws\nManual review required."


def create_comprehensive_audit_report(df: pd.DataFrame, target_col: str, protected_cols: list) -> tuple:
    """
    Main orchestrator function.
    Returns a tuple containing:
    1. A serialized JSON payload (for visual UI chart elements and frontend styling components)
    2. A structured Markdown Text Report string (generated by Gemini for direct layout injection)
    """
    # Run mathematical engine
    raw_metrics = generate_mathematical_metrics(df, target_col, protected_cols)
    
    # Run LLM reporting layer
    markdown_narrative = generate_ai_executive_summary(raw_metrics)
    
    return raw_metrics, markdown_narrative

# ==========================================
# Example Component Testing Pipeline Execution:
# ==========================================
if __name__ == "__main__":
    # Simulating a post-processed DataFrame from your dataProcessor.py
    np.random.seed(42)
    sample_size = 1000
    
    mock_data = {
        "Gender": np.random.choice(["Male", "Female", "Unknown"], size=sample_size, p=[0.45, 0.45, 0.10]),
        "Race": np.random.choice(["Majority", "Minority"], size=sample_size, p=[0.75, 0.25]),
        "Gender_was_missing": np.random.choice([0, 1], size=sample_size, p=[0.90, 0.10]),
        # Injecting intentional bias into the outcome variable
        "Loan_Approved": np.random.choice([0, 1], size=sample_size, p=[0.65, 0.35])
    }
    
    df_test = pd.DataFrame(mock_data)
    # Artificially tilt the success rate to create clear bias for verification
    df_test.loc[df_test['Gender'] == 'Female', 'Loan_Approved'] = np.random.choice([0, 1], size=len(df_test[df_test['Gender'] == 'Female']), p=[0.85, 0.15])
    df_test.loc[df_test['Gender_was_missing'] == 1, 'Loan_Approved'] = np.random.choice([0, 1], size=len(df_test[df_test['Gender_was_missing'] == 1]), p=[0.90, 0.10])

    # Execute the pipeline
    target = "Loan_Approved"
    protected = ["Gender", "Race"]
    
    print("Executing local audit simulation matrix...\n")
    json_payload, ai_text = create_comprehensive_audit_report(df_test, target, protected)
    
    print("--- 1. CALCULATED JSON METRICS PAYLOAD (FOR FRONTEND CHARTS) ---")
    print(json.dumps(json_payload, indent=2))
    print("\n--- 2. GEMINI GENERATED NARRATIVE AUDIT REPORT (FOR FRONTEND UI TEXT) ---")
    print(ai_text)