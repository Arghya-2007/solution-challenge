from __future__ import annotations

import pandas as pd
from fairlearn.metrics import demographic_parity_difference

from .processor import detect_target, rule_check


METRIC_THRESHOLD = 0.1
MEDIUM_THRESHOLD = 0.1
CRITICAL_THRESHOLD = 0.2

POSITIVE_HINTS = {
    "1",
    "true",
    "yes",
    "y",
    "approved",
    "accept",
    "accepted",
    "hired",
    "admitted",
    "pass",
    "positive",
}


def _to_binary_outcome(series: pd.Series) -> tuple[pd.Series, str]:
    cleaned = series.fillna(0)

    if pd.api.types.is_numeric_dtype(cleaned):
        numeric = pd.to_numeric(cleaned, errors="coerce").fillna(0)
        unique_values = set(numeric.dropna().unique().tolist())
        if unique_values.issubset({0, 1}):
            return numeric.astype(int), "1"

        threshold = numeric.median()
        return (numeric >= threshold).astype(int), f">= {round(float(threshold), 4)}"

    text = cleaned.astype(str).str.strip().str.lower()
    unique_text = set(text.unique().tolist())
    if len(unique_text) == 2:
        positives = [value for value in unique_text if value in POSITIVE_HINTS]
        positive_label = positives[0] if positives else sorted(unique_text)[-1]
        return (text == positive_label).astype(int), positive_label

    # Multi-class outcomes are reduced to one-vs-rest using positive hints when possible.
    positives = [value for value in unique_text if value in POSITIVE_HINTS]
    positive_label = positives[0] if positives else sorted(unique_text)[-1]
    return (text == positive_label).astype(int), positive_label


def _compute_severity(max_dpd: float) -> str:
    if max_dpd >= CRITICAL_THRESHOLD:
        return "critical"
    if max_dpd >= MEDIUM_THRESHOLD:
        return "medium"
    return "low"


def calculate_fairness_metrics(df: pd.DataFrame) -> dict:
    target_col = detect_target(df)

    sensitive_cols = []
    for col in df.columns:
        if col == target_col:
            continue
        profile = {"top_values": []}
        if rule_check(col, profile)["flag"]:
            sensitive_cols.append(col)

    if not sensitive_cols:
        return {
            "severity": "low",
            "metrics": [],
            "raw_counts": {
                "target_column": target_col,
                "positive_label": None,
                "by_sensitive_feature": {},
            },
        }

    y_binary, positive_label = _to_binary_outcome(df[target_col])

    metric_cards: list[dict] = []
    by_sensitive_feature: dict[str, dict] = {}

    for sens_col in sensitive_cols:
        groups = {}
        group_rates = []
        for group_value, group_df in df.groupby(sens_col, dropna=False):
            group_index = group_df.index
            total_in_group = int(len(group_df))
            positive_outcomes = int(y_binary.loc[group_index].sum())
            rate = round((positive_outcomes / total_in_group) * 100, 1) if total_in_group else 0.0
            group_label = str(group_value)
            groups[group_label] = {
                "total_in_group": total_in_group,
                "positive_outcomes": positive_outcomes,
                "positive_rate": rate,
            }
            group_rates.append((group_label, rate))

        by_sensitive_feature[sens_col] = groups

        try:
            dpd = float(demographic_parity_difference(y_binary, y_binary, sensitive_features=df[sens_col]))
        except Exception:
            dpd = 0.0

        affected_group = "N/A"
        if group_rates:
            affected_group = min(group_rates, key=lambda item: item[1])[0]

        metric_cards.append(
            {
                "name": f"Demographic Parity Difference ({sens_col})",
                "feature": sens_col,
                "value": round(abs(dpd), 4),
                "threshold": METRIC_THRESHOLD,
                "pass": abs(dpd) <= METRIC_THRESHOLD,
                "affected_group": affected_group,
            }
        )

    max_dpd = max((metric["value"] for metric in metric_cards), default=0.0)

    return {
        "severity": _compute_severity(max_dpd),
        "metrics": metric_cards,
        "raw_counts": {
            "target_column": target_col,
            "positive_label": positive_label,
            "by_sensitive_feature": by_sensitive_feature,
        },
    }
