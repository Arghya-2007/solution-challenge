"""
run_mitigation.py  v2.0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BUGS FIXED vs v1.0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[CRITICAL] Report always showed before == after metrics
  Root cause A — wrong column for "after":
    generate_report() passed target_col for both df_before and df_after.
    The engine NEVER overwrites target_col — it appends 'mitigated_<target>'.
    So df_after[target_col] was still the original biased label.
    Fix: derive mitigated_col = f"mitigated_{target_col}" and pass it
    as the prediction column when computing after-mitigation metrics.

  Root cause B — y_pred=y_true in demographic_parity_difference:
    calculate_group_metrics() passed the same series for both y_true and y_pred.
    Fix: function now accepts separate pred_col so y_pred = df[pred_col].

[HIGH] KeyError crash on mismatched group bins between before/after
  Root cause: pd.qcut() was called independently on df_before and df_after.
    Different datasets → different quartile boundaries → different group labels
    → rates_after[group] raises KeyError for groups that exist in before but
    not in after.
  Fix: _bin_sensitive_col() computes bins from df_before and reuses those
    exact bin edges for df_after via pd.cut(bins=computed_bins).
    Both series now share identical group labels.

[HIGH] status_tracker set to "mitigationComplete" even on engine exception
  Root cause: status update was outside the try/except block.
  Fix: try/except/finally — "mitigationFailed" on exception,
    "mitigationComplete" only in finally when succeeded=True.

[MEDIUM] sys.exit() in validation bypassed status_tracker cleanup
  Root cause: early sys.exit(1) calls in validation left status stuck.
  Fix: validation raises ValueError; main() wraps everything in
    try/finally to guarantee status_tracker always gets a terminal state.

[LOW] ensure_numeric_target_paired mutated in-place despite deceptive signature
  Root cause: function implied it returned new objects but mutated inputs.
  Fix: function now does its own .copy() internally, making the contract
    explicit and safe regardless of whether the caller copies first.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""

import json
import os
import sys
import traceback

import pandas as pd
from fairlearn.metrics import demographic_parity_difference

import src.status as status_tracker
from src.debiasingEngine import run_debiasing_engine


# ── BIN HELPER ─────────────────────────────────────────────────────────────────
def _bin_sensitive_col(
        before_series: pd.Series,
        after_series: pd.Series,
) -> tuple[pd.Series, pd.Series]:
    """
    Bins a continuous sensitive column consistently across before/after datasets.

    FIX v2.0: pd.qcut was called independently on each dataframe, producing
    different quartile boundaries and therefore different group labels.
    This caused KeyError when the before-group index was used to look up
    rates in the after-series.

    Now: bins are computed once from before_series; after_series is cut with
    the same bin edges via pd.cut(bins=...). Both series share identical labels.
    """
    if not (pd.api.types.is_numeric_dtype(before_series) and before_series.nunique() > 10):
        # Categorical or low-cardinality: no binning needed, cast to str for consistency
        return before_series.astype(str), after_series.astype(str)

    # Compute quartile bins from the BEFORE distribution (reference)
    _, bin_edges = pd.qcut(before_series, q=4, duplicates="drop", retbins=True)

    # Extend edges slightly so pd.cut includes boundary values exactly
    bin_edges[0]  -= 1e-9
    bin_edges[-1] += 1e-9

    before_binned = pd.cut(before_series, bins=bin_edges, duplicates="drop").astype(str)
    after_binned  = pd.cut(after_series,  bins=bin_edges, duplicates="drop").astype(str)

    return before_binned, after_binned


# ── METRIC CALCULATOR ──────────────────────────────────────────────────────────
def calculate_group_metrics(
        df: pd.DataFrame,
        label_col: str,       # the ground-truth / observed column
        pred_col: str,        # the prediction column (may equal label_col for "before")
        sensitive_series: pd.Series,
) -> tuple[pd.Series, float]:
    """
    Calculates per-group selection rates and demographic parity difference.

    FIX v2.0: y_pred was set to y_true (same column for both args), making
    the disparity metric meaningless for the "after" dataset. Now y_true and
    y_pred are passed as separate arguments.

    Parameters
    ----------
    df              : DataFrame containing label_col and pred_col
    label_col       : ground-truth binary column (y_true)
    pred_col        : prediction binary column (y_pred) — differs after mitigation
    sensitive_series: already-binned sensitive attribute series (aligned index)
    """
    rates = df.groupby(sensitive_series)[pred_col].mean()

    disparity = demographic_parity_difference(
        y_true            = df[label_col],
        y_pred            = df[pred_col],   # FIX: was y_true — now correct pred col
        sensitive_features = sensitive_series,
    )
    return rates, float(disparity)


# ── TARGET ENCODER ─────────────────────────────────────────────────────────────
def ensure_numeric_target(df: pd.DataFrame, target_col: str) -> pd.DataFrame:
    """
    Returns a copy of df with target_col binarised to 0/1 if needed.

    FIX v2.0: previous version mutated the caller's dataframe in-place despite
    taking the object by reference. Now does its own .copy() so the caller's
    original is never modified regardless of whether they copied first.
    """
    df = df.copy()   # FIX: always copy internally — safe regardless of caller

    if df[target_col].dtype == object or df[target_col].nunique() > 2:
        unique_vals  = df[target_col].dropna().unique()
        pos_keywords = ["graduat", "approv", "yes", "1", "pass",
                        "success", "true", "accept", "positive"]
        positive_val = next(
            (v for v in unique_vals if any(kw in str(v).lower() for kw in pos_keywords)),
            df[target_col].mode()[0],
        )
        df[target_col] = (df[target_col] == positive_val).astype(int)

    return df


# ── REPORT GENERATOR ───────────────────────────────────────────────────────────
def generate_report(
        df_before: pd.DataFrame,
        df_after: pd.DataFrame,
        target_col: str,
        mitigated_col: str,        # FIX v2.0: explicit mitigated column name
        protected_cols: list[str],
        base_file_path: str,
) -> str:
    """
    Generates a JSON report comparing bias metrics before and after mitigation.

    FIX v2.0 — key changes:
      • Uses mitigated_col (e.g. 'mitigated_hiring_decision_hired') for all
        "after" metric calculations instead of target_col.
      • Consistent binning via _bin_sensitive_col() prevents KeyError crashes.
      • Overall bias_rate_after now reflects the mitigated prediction, not the
        original label.
    """
    # FIX: encode target inside function — safe copies, no side effects
    df_before = ensure_numeric_target(df_before, target_col)
    df_after  = ensure_numeric_target(df_after,  target_col)

    report_data = {
        "dataset_name": os.path.basename(base_file_path),
        "target_col":   target_col,
        "summary":      [],
        "group_rates":  {},
        "overall": {
            # FIX: after rate uses mitigated_col, not target_col
            "bias_rate_before": round(float(df_before[target_col].mean()), 4),
            "bias_rate_after":  round(float(df_after[mitigated_col].mean()), 4),
            "total_rows":          len(df_before),
            "attributes_improved": 0,
            "attributes_total":    len(protected_cols),
        },
    }

    attributes_improved = 0

    for col in protected_cols:
        # FIX: compute shared bins from before-distribution; reuse for after
        before_sens, after_sens = _bin_sensitive_col(
            df_before[col], df_after[col]
        )

        rates_before, disp_before = calculate_group_metrics(
            df_before, target_col, target_col, before_sens   # before: pred == label
        )
        rates_after, disp_after = calculate_group_metrics(
            df_after, target_col, mitigated_col, after_sens   # FIX: pred = mitigated_col
        )

        improvement = disp_before - disp_after
        is_improved = improvement > 0
        if is_improved:
            attributes_improved += 1

        report_data["summary"].append({
            "attribute":   col,
            "before":      round(float(disp_before), 4),
            "after":       round(float(disp_after),  4),
            "improvement": round(float(improvement), 4),
            "improved":    bool(is_improved),
        })

        # Per-group rates — FIX: safe .get() lookup to avoid KeyError
        all_groups = sorted(
            set(rates_before.index.tolist()) | set(rates_after.index.tolist())
        )
        group_data = []
        for group in all_groups:
            group_data.append({
                "group":  str(group),
                "before": round(float(rates_before.get(group, float("nan"))), 4),
                "after":  round(float(rates_after.get(group,  float("nan"))), 4),
            })

        report_data["group_rates"][col] = group_data

    report_data["overall"]["attributes_improved"] = attributes_improved

    report_path = f"{base_file_path}_mitigation_results.json"
    with open(report_path, "w") as f:
        json.dump(report_data, f, indent=4)

    return report_path


# ── MAIN ───────────────────────────────────────────────────────────────────────
def main():
    """
    FIX v2.0:
      - Validation errors raise ValueError instead of calling sys.exit() directly,
        so the finally block always runs and status_tracker gets a terminal state.
      - try/except/finally guarantees "mitigationFailed" on any exception and
        "mitigationComplete" only on genuine success.
    """
    succeeded = False

    try:
        # ── ARG PARSING ────────────────────────────────────────────────────
        if len(sys.argv) < 2:
            raise ValueError(
                "Usage: python run_mitigation.py <base_file_path>\n"
                "Example: python run_mitigation.py data/biased_hr_data"
            )

        base_file_path = sys.argv[1]
        if base_file_path.endswith((".csv", ".json", ".md")):
            base_file_path = os.path.splitext(base_file_path)[0]

        clean_csv_path  = f"{base_file_path}_clean.csv"
        config_json_path = f"{base_file_path}_config.json"

        # ── VALIDATION ─────────────────────────────────────────────────────
        if not os.path.exists(clean_csv_path):
            raise ValueError(f"Clean dataset not found at: {clean_csv_path}")
        if not os.path.exists(config_json_path):
            raise ValueError(f"Configuration JSON not found at: {config_json_path}")

        # ── LOAD CONFIG ────────────────────────────────────────────────────
        try:
            with open(config_json_path, "r") as f:
                config = json.load(f)
        except Exception as e:
            raise ValueError(f"Error loading config: {e}") from e

        target_col     = config.get("target_col")
        protected_cols = config.get("protected_cols", [])
        has_set_index  = config.get("has_set_index", False)

        if not target_col or not protected_cols:
            raise ValueError(
                "Invalid configuration: 'target_col' and 'protected_cols' are required."
            )

        # ── LOAD DATA ──────────────────────────────────────────────────────
        try:
            df = pd.read_csv(
                clean_csv_path,
                index_col=0 if has_set_index else None,
            )
        except Exception as e:
            raise ValueError(f"Error loading data: {e}") from e

        print("--- Mitigation Started ---")
        print(f"Target:            {target_col}")
        print(f"Protected columns: {protected_cols}")
        print(f"Rows loaded:       {len(df)}")

        # ── MITIGATION ─────────────────────────────────────────────────────
        status_tracker.status = "mitigatingAll"
        print("\n🚀 Mitigating bias across all protected attributes...")

        result        = run_debiasing_engine(
            df             = df,
            target_col     = target_col,
            sensitive_cols = protected_cols,
        )
        mitigated_df  = result["mitigated_dataframe"]
        # FIX: derive mitigated column name from engine contract
        mitigated_col = result["prediction_column"]   # = f"mitigated_{target_col}"

        output_path = f"{base_file_path}_debiased.csv"
        mitigated_df.to_csv(output_path, index=has_set_index)
        print(f"✅ Debiased dataset saved: {output_path}")

        # ── REPORT ─────────────────────────────────────────────────────────
        print("\n📊 Generating comparison report...")
        report_path = generate_report(
            df_before      = df,
            df_after       = mitigated_df,
            target_col     = target_col,
            mitigated_col  = mitigated_col,   # FIX: explicit mitigated col
            protected_cols = protected_cols,
            base_file_path = base_file_path,
        )
        print(f"✅ Report saved: {report_path}")

        succeeded = True   # only set True if we reach here without exception

    except ValueError as e:
        # Validation / config errors — no stack trace needed
        print(f"❌ Error: {e}")

    except Exception as e:
        # Engine or report errors — full stack trace for debugging
        print(f"❌ Mitigation failed: {e}")
        traceback.print_exc()

    finally:
        # FIX: status always gets a terminal state, even on sys.exit or exception
        if succeeded:
            status_tracker.status = "mitigationComplete"
            print("\n--- Mitigation Task Finished Successfully ---")
        else:
            status_tracker.status = "mitigationFailed"   # FIX: was always "Complete"
            print("\n--- Mitigation Task Finished With Errors ---")


if __name__ == "__main__":
    main()