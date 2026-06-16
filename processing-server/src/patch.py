import re

file_path = r'E:\SC-v2\processing-server\src\debiasingEngine.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

new_calib = '''# ── AIR-DRIVEN THRESHOLD CALIBRATION ──────────────────────────────────────────
def calibrate_thresholds(
        oof_probs: np.ndarray,
        df_s: pd.DataFrame,
        sensitive_cols: list,
        target_pos_rate: float,
) -> tuple:
    """
    Returns:
       final_preds (np.ndarray)
       global_thresh (float)
       thresholds_dict (dict)
       penalty (float)
    """
    global_thresh = _group_threshold(oof_probs, target_pos_rate)
    global_preds = (oof_probs >= global_thresh).astype(int)
    
    print(f"  Global threshold: {global_thresh:.4f}  "
          f"(target_pos_rate={target_pos_rate:.3f})")

    thresholds_dict = {}
    
    for col in sensitive_cols:
        col_data = df_s[col].values
        groups = np.unique(col_data)
        
        rates = {g: global_preds[col_data == g].mean() for g in groups if (col_data == g).sum() > 0}
        if not rates:
            continue
            
        ref_rate = max(rates.values())
        
        for g, rate in rates.items():
            air = rate / ref_rate if ref_rate > 0 else 1.0
            if air < AIR_TARGET:
                needed_rate = min(ref_rate * AIR_BUFFER, 0.95)
                mask = col_data == g
                grp_thresh = _group_threshold(oof_probs[mask], needed_rate)
                thresholds_dict[(col, g)] = grp_thresh
            else:
                thresholds_dict[(col, g)] = global_thresh

    def get_t_ind(penalty):
        t_ind = np.full(len(oof_probs), global_thresh, dtype=np.float64)
        for col in sensitive_cols:
            col_data = df_s[col].values
            for g in np.unique(col_data):
                if (col, g) in thresholds_dict:
                    mask = (col_data == g)
                    t_ind[mask] = np.minimum(t_ind[mask], thresholds_dict[(col, g)])
        return t_ind + penalty

    penalty = 0.0
    t_ind = get_t_ind(penalty)
    current_rate = (oof_probs >= t_ind).mean()
    
    if current_rate > TARGET_RATE_CEIL:
        print(f"  ⚠ Hire rate {current_rate:.3f} exceeds ceiling "
              f"{TARGET_RATE_CEIL:.3f} after calibration — finding penalty via bisection.")
        lo, hi = 0.0, 1.0
        best_penalty = 0.0
        for _ in range(RATE_CAP_BISECTION_STEPS):
            mid = (lo + hi) / 2.0
            candidate_t_ind = get_t_ind(mid)
            candidate_rate = (oof_probs >= candidate_t_ind).mean()
            if candidate_rate > TARGET_RATE_CEIL:
                lo = mid
            else:
                hi = mid
                best_penalty = mid
        penalty = best_penalty
        t_ind = get_t_ind(penalty)
        final_rate = (oof_probs >= t_ind).mean()
        print(f"  ✓ Re-targeted via bisection (penalty={penalty:.4f}): hire_rate now {final_rate:.3f}")

    final_preds = (oof_probs >= t_ind).astype(int)
    still_failing = []
    for col in sensitive_cols:
        col_data = df_s[col].values
        groups   = np.unique(col_data)
        rates    = {g: final_preds[col_data == g].mean() for g in groups}
        ref      = max(rates.values()) if rates else 1.0
        for g, rate in rates.items():
            if ref > 0 and rate / ref < AIR_TARGET:
                still_failing.append((col, g, rate / ref))
                
    if still_failing:
        print(f"  ⚠⚠ CONFLICT: TARGET_RATE_CEIL={TARGET_RATE_CEIL:.2f} and "
              f"AIR_TARGET={AIR_TARGET:.2f} are not jointly satisfiable on "
              f"this dataset. {len(still_failing)} group(s) still fail "
              f"AIR after the rate cap was applied:")
        for col, g, air in still_failing:
            print(f"      {col} / {g}: AIR={air:.3f}")
        print(f"  This is a genuine fairness/utility tradeoff in the "
              f"data, not a calibration bug — raising TARGET_RATE_CEIL "
              f"is the only way to close this gap, and doing so will "
              f"raise the overall hire rate accordingly.")

    return final_preds, global_thresh, thresholds_dict, penalty
'''

pattern = re.compile(r'# ── ITERATIVE AIR-DRIVEN THRESHOLD CALIBRATION ────────────────────────────────.*?return \(oof_probs >= t_ind\)\.astype\(int\)\n', re.DOTALL)
content = pattern.sub(new_calib, content)

wrapper_code = '''
# ── PRODUCTION ARTIFACT WRAPPER ───────────────────────────────────────────────
class FairRandomForest:
    def __init__(self, base_model, preprocessor, thresholds_dict, global_thresh, penalty, sensitive_cols):
        self.base_model = base_model
        self.preprocessor = preprocessor
        self.thresholds_dict = thresholds_dict
        self.global_thresh = global_thresh
        self.penalty = penalty
        self.sensitive_cols = sensitive_cols

    def predict_proba(self, X_raw):
        X_proc = self.preprocessor.transform(X_raw).astype(np.float32)
        return self.base_model.predict_proba(X_proc)

    def predict(self, X_raw):
        probs = self.predict_proba(X_raw)[:, 1]
        t_ind = np.full(len(probs), self.global_thresh, dtype=np.float64)
        
        for col in self.sensitive_cols:
            if col in X_raw.columns:
                col_data = X_raw[col].values
                for g in np.unique(col_data):
                    if (col, g) in self.thresholds_dict:
                        mask = (col_data == g)
                        t_ind[mask] = np.minimum(t_ind[mask], self.thresholds_dict[(col, g)])
                        
        t_ind += self.penalty
        return (probs >= t_ind).astype(int)

'''
content = content.replace('# ── MAIN ENGINE ────────────────────────────────────────────────────────────────', wrapper_code + '# ── MAIN ENGINE ────────────────────────────────────────────────────────────────')

target_usage = """    print("── Iterative AIR-Driven Calibration ───────────────────────────")
    t = _Timer("Threshold calibration")
    mitigated_preds = calibrate_thresholds(
        oof_probs, df_s, sensitive_cols, target_pos_rate
    )
    t.done()"""
new_usage = """    print("── AIR-Driven Threshold Calibration ───────────────────────────")
    t = _Timer("Threshold calibration")
    mitigated_preds, global_thresh, thresholds_dict, penalty = calibrate_thresholds(
        oof_probs, df_s, sensitive_cols, target_pos_rate
    )
    t.done()"""
content = content.replace(target_usage, new_usage)

target_final = """    print_feature_importance(final_model, preprocessor,
                             numeric_features, categorical_features)

    # ── 15. BUILD OUTPUT DATAFRAME ────────────────────────────────────────
    output_df           = df.copy()
    output_df[pred_col] = mitigated_preds

    total_elapsed = time.perf_counter() - engine_timer
    passing       = sum(1 for v in post_report.values() if v["pass"])
    mit_rate      = mitigated_preds.mean()

    print("\\n── Summary ────────────────────────────────────────────────────")
    print(f"  Original hire rate:       {pos_rate:.3f}  ({y.sum()} hired)")
    print(f"  Calibration target rate:  {target_pos_rate:.3f}")
    print(f"  Mitigated hire rate:      {mit_rate:.3f}  "
          f"({mitigated_preds.sum()} hired)")
    if mit_rate > TARGET_RATE_CEIL + 0.05:
        print(f"  ⚠ Hire rate {mit_rate:.3f} is above ceiling {TARGET_RATE_CEIL} "
              f"— this should not happen with the v3.4 rate cap; investigate.")
    print(f"  Intersectional groups passing AIR≥0.80:  {passing}/{len(post_report)}")
    print(f"  Total wall-clock time:    {total_elapsed:.1f}s")
    print("=" * 65)

    return {
        "mitigated_dataframe":      output_df,
        "prediction_column":        pred_col,
        "model_object":             final_model,
        "preprocessor":             preprocessor,"""

new_final = """    print_feature_importance(final_model, preprocessor,
                             numeric_features, categorical_features)

    fair_model = FairRandomForest(
        base_model=final_model,
        preprocessor=preprocessor,
        thresholds_dict=thresholds_dict,
        global_thresh=global_thresh,
        penalty=penalty,
        sensitive_cols=sensitive_cols
    )

    # ── 15. BUILD OUTPUT DATAFRAME ────────────────────────────────────────
    output_df           = df.copy()
    output_df[pred_col] = mitigated_preds

    total_elapsed = time.perf_counter() - engine_timer
    passing       = sum(1 for v in post_report.values() if v["pass"])
    mit_rate      = mitigated_preds.mean()

    print("\\n── Summary ────────────────────────────────────────────────────")
    print(f"  Original hire rate:       {pos_rate:.3f}  ({y.sum()} hired)")
    print(f"  Calibration target rate:  {target_pos_rate:.3f}")
    print(f"  Mitigated hire rate:      {mit_rate:.3f}  "
          f"({mitigated_preds.sum()} hired)")
    if mit_rate > TARGET_RATE_CEIL + 0.05:
        print(f"  ⚠ Hire rate {mit_rate:.3f} is above ceiling {TARGET_RATE_CEIL} "
              f"— this should not happen with the v3.4 rate cap; investigate.")
    print(f"  Intersectional groups passing AIR≥0.80:  {passing}/{len(post_report)}")
    print(f"  Total wall-clock time:    {total_elapsed:.1f}s")
    print("=" * 65)

    return {
        "mitigated_dataframe":      output_df,
        "prediction_column":        pred_col,
        "model_object":             fair_model,
        "preprocessor":             preprocessor,"""
        
content = content.replace(target_final, new_final)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Patch applied successfully.")
