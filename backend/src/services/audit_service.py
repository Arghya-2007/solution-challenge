import os
import json
import pandas as pd
import logging
import io
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from fairlearn.reductions import ExponentiatedGradient, DemographicParity
from fairlearn.metrics import demographic_parity_difference

from ..utils.input_handler import validate_file_extension, is_google_sheet_url
from ..utils.converter import convert_to_dataframe, load_google_sheet
from .processor import profile_columns, detect_target, rule_check, llm_audit, get_recommendations
from ..utils.output_handler import format_audit_response, generate_pdf_report
from .fairness_metrics import calculate_fairness_metrics, _to_binary_outcome

logger = logging.getLogger(__name__)

ACTIVE_DATASET_PATH = "datasets/active_dataset.csv"
LAST_AUDIT_PATH = "datasets/last_audit.json"
FIXED_DATASET_PATH = "datasets/fixed_dataset.csv"

MODEL_MAP = {
    "LogisticRegression": lambda: LogisticRegression(max_iter=1000),
    "RandomForestClassifier": RandomForestClassifier,
    "SVC": lambda: SVC(probability=True),
    "DecisionTreeClassifier": DecisionTreeClassifier
}

def _build_summary_payload(metrics: dict, language: str) -> dict:
    metrics_list = metrics.get("metrics") or []
    severity = (metrics.get("severity") or "low").lower()

    worst_metric = max(metrics_list, key=lambda item: float(item.get("value", 0)), default={})
    worst_group = worst_metric.get("affected_group") or "N/A"
    discrimination_factor = worst_metric.get("feature") or "N/A"

    if severity == "critical":
        fix_action_en = "Rebalance outcomes for affected groups and retrain with fairness constraints before deployment."
    elif severity == "medium":
        fix_action_en = "Add fairness checks in evaluation and monitor drift for affected groups each release cycle."
    else:
        fix_action_en = "Keep current controls in place and continue periodic fairness monitoring."

    summary_en = (
        f"Bias severity is {severity} based on fairness metric gaps across protected groups. "
        f"The largest observed disparity is linked to {discrimination_factor}, with {worst_group} most affected."
    )

    summary_hi = (
        f"निष्पक्षता विश्लेषण के अनुसार बायस की गंभीरता {severity} है। "
        f"सबसे बड़ा अंतर {discrimination_factor} से जुड़ा है, और {worst_group} समूह सबसे अधिक प्रभावित है।"
    )

    fix_action_hi = {
        "critical": "प्रभावित समूहों के लिए परिणाम संतुलित करें और डिप्लॉयमेंट से पहले fairness constraints के साथ मॉडल पुनः प्रशिक्षित करें।",
        "medium": "हर रिलीज़ में fairness checks जोड़ें और प्रभावित समूहों के लिए drift नियमित रूप से मॉनिटर करें।",
        "low": "मौजूदा नियंत्रण जारी रखें और समय-समय पर fairness मॉनिटरिंग करते रहें।",
    }.get(severity, "मौजूदा नियंत्रण जारी रखें और fairness मॉनिटरिंग करते रहें।")

    if language == "hi":
        return {
            "summary": summary_hi,
            "worst_affected_group": worst_group,
            "discrimination_factor": discrimination_factor,
            "fix_action": fix_action_hi,
        }

    return {
        "summary": summary_en,
        "worst_affected_group": worst_group,
        "discrimination_factor": discrimination_factor,
        "fix_action": fix_action_en,
    }

async def upload_dataset(file_name: str = None, file_content: bytes = None, sheet_url: str = None):
    df = None
    if file_content:
        extension = validate_file_extension(file_name)
        df = convert_to_dataframe(file_content, extension)
    elif sheet_url:
        if not is_google_sheet_url(sheet_url):
            raise ValueError("Invalid Google Sheet URL")
        df = load_google_sheet(sheet_url)
    else:
        raise ValueError("No file or Google Sheet URL provided")

    if df is not None:
        os.makedirs("datasets", exist_ok=True)
        df.to_csv(ACTIVE_DATASET_PATH, index=False)
        # Convert NaN to None for JSON compliance
        preview_df = df.head(5).replace({pd.NA: None, float('nan'): None})
        return {
            "columns": list(df.columns),
            "preview": preview_df.to_dict(orient="records")
        }
    raise Exception("Failed to process dataset")

async def analyze_dataset():
    if not os.path.exists(ACTIVE_DATASET_PATH):
        raise FileNotFoundError("No dataset uploaded. Use /upload first.")
    
    df = pd.read_csv(ACTIVE_DATASET_PATH)
    profiles = profile_columns(df)
    target = detect_target(df)
    
    profiles_to_audit = profiles.copy()
    profiles_to_audit.pop(target, None)

    rule_results = {
        col: rule_check(col, profiles_to_audit[col])
        for col in profiles_to_audit
    }

    llm_results = llm_audit(profiles_to_audit, rule_results)
    audit_response = format_audit_response(target, llm_results, profiles_to_audit, rule_results)
    fairness_metrics = calculate_fairness_metrics(df)
    
    final_results = {
        "bias_audit": audit_response,
        "fairness_metrics": fairness_metrics
    }
    
    with open(LAST_AUDIT_PATH, "w") as f:
        json.dump(final_results, f)
        
    return final_results

def get_summary(metrics: dict, language: str = "en"):
    if not isinstance(metrics, dict):
        raise ValueError("metrics payload is required")

    if language not in {"en", "hi"}:
        language = "en"

    return _build_summary_payload(metrics, language)

def export_report():
    if not os.path.exists(LAST_AUDIT_PATH):
        raise FileNotFoundError("No audit results found. Use /analyze first.")
    
    with open(LAST_AUDIT_PATH, "r") as f:
        audit_data = json.load(f)
    
    pdf_buffer = generate_pdf_report(audit_data["bias_audit"])
    return pdf_buffer

def get_recommendation():
    if not os.path.exists(LAST_AUDIT_PATH):
        raise FileNotFoundError("No audit results found. Use /analyze first.")
    
    with open(LAST_AUDIT_PATH, "r") as f:
        audit_data = json.load(f)
    
    recommendations = get_recommendations(
        audit_data.get("bias_audit", {}),
        audit_data.get("fairness_metrics", {})
    )
    return recommendations

async def fix_bias(model_name: str):
    logger.info(f"Starting bias fix for model: {model_name}")
    if not model_name or model_name not in MODEL_MAP:
        raise ValueError(f"Invalid or missing model_name. Supported: {list(MODEL_MAP.keys())}")
    
    if not os.path.exists(ACTIVE_DATASET_PATH):
        raise FileNotFoundError("No dataset uploaded. Use /upload first.")

    df = pd.read_csv(ACTIVE_DATASET_PATH)
    original_df = df.copy()
    
    # Handle missing values
    df = df.ffill().bfill().fillna(0)
    
    target = detect_target(df)
    logger.info(f"Detected target column: {target}")
    
    # Identify Protected vs Proxy columns
    protected_cols = []
    proxy_cols = []
    
    for col in df.columns:
        if col == target:
            continue
        profile = {"top_values": list(df[col].dropna().head(10).astype(str))}
        check = rule_check(col, profile)
        if check["flag"]:
            if check["type"] == "direct_sensitive":
                protected_cols.append(col)
            elif check["type"] == "proxy_risk":
                proxy_cols.append(col)
    
    # Fallback for protected columns only if none found
    if not protected_cols and os.path.exists(LAST_AUDIT_PATH):
        with open(LAST_AUDIT_PATH, "r") as f:
            audit_data = json.load(f)
            flagged = audit_data.get("bias_audit", {}).get("flagged_features", {})
            protected_cols = list(flagged.keys())
            logger.info(f"Loaded {len(protected_cols)} protected columns from last audit.")
    
    if not protected_cols and not proxy_cols:
        raise ValueError("No sensitive or proxy columns detected to fix bias. Audit the dataset first.")

    logger.info(f"Protected features (for constraints): {protected_cols}")
    logger.info(f"Proxy features (to be dropped): {proxy_cols}")

    # Data Preparation
    # Drop BOTH protected and proxy columns from features
    X = df.drop(columns=[target] + protected_cols + proxy_cols)
    y = df[target]
    
    # Basic Encoding
    X_encoded = pd.get_dummies(X, drop_first=True)
    y_binary, pos_label = _to_binary_outcome(y)
    y_binary = y_binary.astype(int)

    # Scaling
    scaler = StandardScaler()
    X_scaled = pd.DataFrame(
        scaler.fit_transform(X_encoded), 
        columns=X_encoded.columns, 
        index=X_encoded.index
    )

    # Split data
    if protected_cols:
        # For mitigation, Fairlearn often works best with a single sensitive feature.
        # We combine multiple protected columns into a composite group feature.
        if len(protected_cols) > 1:
            A_combined = df[protected_cols].astype(str).agg("-".join, axis=1)
        else:
            A_combined = df[protected_cols[0]]
            
        # Convert to object to avoid StringArray issues
        A_combined = A_combined.astype(object)
        
        # We also keep the individual ones in A_full for reporting if needed
        A_full = df[protected_cols].astype(object)

        X_train, X_test, y_train, y_test, A_train_comb, A_test_comb = train_test_split(
            X_scaled, y_binary, A_combined, test_size=0.2, random_state=42
        )
        
        # Split A_full as well to keep A_test available for reporting
        _, _, _, _, A_train_full, A_test_full = train_test_split(
            X_scaled, y_binary, A_full, test_size=0.2, random_state=42
        )
        
        primary_sens = protected_cols[0]
    else:
        # If only proxies found, we just do a blind model training
        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y_binary, test_size=0.2, random_state=42
        )
        A_train_comb, A_test_comb = None, None
        A_train_full, A_test_full = None, None

    # 1. Before Bias Mitigation (Blind model)
    base_model = MODEL_MAP[model_name]()
    base_model.fit(X_train, y_train)
    y_pred_before = base_model.predict(X_test)
    acc_before = accuracy_score(y_test, y_pred_before)
    
    dpd_before = 0.0
    if A_test_full is not None:
        dpd_before = demographic_parity_difference(y_test, y_pred_before, sensitive_features=A_test_full[primary_sens])

    # 2. After Bias Mitigation
    if A_train_comb is not None:
        logger.info("Running ExponentiatedGradient reduction on blind features...")
        mitigated_model = ExponentiatedGradient(
            MODEL_MAP[model_name](),
            constraints=DemographicParity(),
            eps=0.01
        )
        mitigated_model.fit(X_train, y_train, sensitive_features=A_train_comb)
        y_pred_after = mitigated_model.predict(X_test)
        acc_after = accuracy_score(y_test, y_pred_after)
        dpd_after = demographic_parity_difference(y_test, y_pred_after, sensitive_features=A_test_full[primary_sens])
        full_predictions = mitigated_model.predict(X_scaled)
    else:
        # Just use the blind model if no explicit protected attributes were found
        logger.info("No protected attributes found, returning blind model results.")
        mitigated_model = base_model
        y_pred_after = y_pred_before
        acc_after = acc_before
        dpd_after = dpd_before
        full_predictions = base_model.predict(X_scaled)

    # Generate "Fixed" Dataset
    fixed_df = original_df.copy()
    unique_originals = original_df[target].dropna().unique()
    if len(unique_originals) == 2:
        mapping = {1: pos_label}
        for val in unique_originals:
            if str(val).lower().strip() != str(pos_label).lower().strip():
                mapping[0] = val
                break
        fixed_df[target] = pd.Series(full_predictions, index=fixed_df.index).map(mapping)
    else:
        fixed_df[target] = full_predictions

    fixed_df.to_csv(FIXED_DATASET_PATH, index=False)
    logger.info("Bias mitigation complete. Fixed dataset saved.")

    return {
        "model_used": model_name,
        "protected_attributes_removed": protected_cols,
        "proxy_attributes_removed": proxy_cols,
        "target_column": target,
        "positive_label": str(pos_label),
        "before_mitigation": {
            "accuracy": round(float(acc_before), 4),
            "dpd_primary": round(float(dpd_before), 4) if A_test_full is not None else "N/A"
        },
        "after_mitigation": {
            "accuracy": round(float(acc_after), 4),
            "dpd_primary": round(float(dpd_after), 4) if A_test_full is not None else "N/A"
        },
        "improvement": {
            "accuracy_change": round(float(acc_after - acc_before), 4),
            "bias_reduction": round(float(dpd_before - dpd_after), 4) if A_test_full is not None else 0.0
        },
        "download_available": True
    }

def get_fixed_dataset_path():
    if not os.path.exists(FIXED_DATASET_PATH):
        raise FileNotFoundError("No fixed dataset found. Run /fix first.")
    return FIXED_DATASET_PATH
