import json
import pandas as pd
from rapidfuzz import fuzz
from google import genai
from google.genai import types
from ..config import (
    API_KEY, TARGET_KEYWORDS, SENSITIVE_KEYWORDS,
    PROXY_RISK_KEYWORDS, CONTEXT_RULES
)
from tenacity import retry, wait_exponential, stop_after_attempt

def _get_client():
    if not API_KEY:
        raise ValueError("GEMINI_API_KEY is not set.")
    return genai.Client(api_key=API_KEY)

def profile_columns(df: pd.DataFrame) -> dict:
    profiles = {}
    for col in df.columns:
        series = df[col]
        profiles[col] = {
            "dtype": str(series.dtype),
            "null_ratio": float(series.isnull().mean()),
            "unique_ratio": float(series.nunique() / len(df)) if len(df) else 0,
            "is_numeric": pd.api.types.is_numeric_dtype(series),
            "top_values": list(series.value_counts().head(5).index.astype(str)),
            "mean": float(series.mean()) if pd.api.types.is_numeric_dtype(series) else None
        }
    return profiles

def detect_target(df: pd.DataFrame) -> str:
    for col in df.columns:
        if any(k in col.lower() for k in TARGET_KEYWORDS):
            return col
    for col in df.columns:
        if df[col].nunique() <= 2:
            return col
    return df.columns[-1]

def rule_check(col_name: str, profile: dict) -> dict:
    col_lower = col_name.lower()
    if col_lower in SENSITIVE_KEYWORDS:
        return {
            "flag": True,
            "type": "direct_sensitive",
            "matched": col_lower,
            "reason": f"Direct sensitive attribute: {col_lower}"
        }
    for s in SENSITIVE_KEYWORDS:
        if fuzz.ratio(s, col_lower) > 90:
            return {
                "flag": True,
                "type": "direct_sensitive",
                "matched": s,
                "reason": f"Strong similarity to sensitive attribute: {s}"
            }
    for p in PROXY_RISK_KEYWORDS:
        if p in col_lower:
            return {
                "flag": True,
                "type": "proxy_risk",
                "matched": p,
                "reason": f"Proxy variable for socio-economic status: {p}"
            }
    vals = [v.lower() for v in profile["top_values"]]
    if any(v in ["male", "female", "m", "f"] for v in vals):
        return {
            "flag": True,
            "type": "direct_sensitive",
            "matched": "gender_inferred",
            "reason": "Detected gender-like categorical encoding"
        }
    return {"flag": False, "type": "none"}

@retry(wait=wait_exponential(multiplier=2, min=4, max=15), stop=stop_after_attempt(3))
def llm_audit(profiles: dict, rules: dict) -> dict:
    payload = {
        col: {
            **profiles[col],
            "rule": rules[col]
        }
        for col in profiles
    }
    prompt = f"""
You are a FAIRNESS + SHAP-AWARE bias auditing system.

Analyze dataset features for:
- direct bias
- proxy bias
- contextual bias

Also simulate expected SHAP behavior:
- direction (+/-)
- strength (low/medium/high)

DATA:
{json.dumps(payload, indent=2)}

CONTEXT RULES:
{json.dumps(CONTEXT_RULES, indent=2)}

Return ONLY JSON:
{{
  "use_case": "domain",
  "columns": {{
    "col": {{
      "risk_level": "low|medium|high",
      "bias_type": "direct|proxy|contextual|none",
      "explanation": "1 sentence"
    }}
  }}
}}
"""
    client = _get_client()
    response = client.models.generate_content(
        model="gemini-2.5-flash-8b",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.0
        )
    )
    return json.loads(response.text)

@retry(wait=wait_exponential(multiplier=2, min=4, max=15), stop=stop_after_attempt(3))
def get_recommendations(audit_results: dict, fairness_metrics: dict) -> dict:
    prompt = f"""
You are an expert AI Fairness Consultant.
Based on the following bias audit results and fairness metrics, recommend specific technical and process-oriented methods to minimize bias while maximizing model accuracy.

AUDIT RESULTS:
{json.dumps(audit_results, indent=2)}

FAIRNESS METRICS:
{json.dumps(fairness_metrics, indent=2)}

Provide recommendations across:
1. Pre-processing (data-level)
2. In-processing (algorithmic-level)
3. Post-processing (output-level)
4. Monitoring & Governance

Return ONLY JSON:
{{
  "summary": "Overall strategy summary",
  "recommendations": [
    {{
      "category": "Pre-processing|In-processing|Post-processing|Monitoring",
      "method": "Method Name",
      "description": "Detailed description of how to implement this",
      "impact_on_bias": "High|Medium|Low",
      "impact_on_accuracy": "High|Medium|Low"
    }}
  ]
}}
"""
    client = _get_client()
    response = client.models.generate_content(
        model="gemini-2.5-flash-8b",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.2
        )
    )
    return json.loads(response.text)
