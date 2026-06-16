import numpy as np

def _group_threshold(probs, target_rate):
    n = len(probs)
    if n == 0:
        return 0.5
    k = int(round(target_rate * n))
    k = max(0, min(n, k))
    if k == 0:
        return 1.0 + 1e-9
    if k >= n:
        return 0.0
    sorted_desc = np.sort(probs)[::-1]
    return float((sorted_desc[k - 1] + sorted_desc[k]) / 2.0)

oof_probs = np.random.rand(3500)
# Make group 1 have lower scores
gender = np.array([1 if i % 4 == 0 else 0 for i in range(3500)])
oof_probs[gender == 1] -= 0.3
oof_probs = np.clip(oof_probs, 0, 1)

df_s = {
    'gender': gender,
    'age': np.array([str(i%3) for i in range(3500)])
}
sensitive_cols = ['gender', 'age']
target_pos_rate = 0.296
AIR_BUFFER = 0.82
MAX_CALIB_ITER = 10

global_thresh = _group_threshold(oof_probs, target_pos_rate)
t_ind = np.full(len(oof_probs), global_thresh, dtype=np.float64)

for iteration in range(1, MAX_CALIB_ITER + 1):
    current_preds = (oof_probs >= t_ind).astype(int)
    any_fail      = False

    for col in sensitive_cols:
        col_data = df_s[col]
        groups   = np.unique(col_data)

        group_rates = {g: current_preds[col_data == g].mean()
                       for g in groups
                       if (col_data == g).sum() > 0}
        if not group_rates:
            continue
        ref_rate = max(group_rates.values())

        for grp, rate in group_rates.items():
            air = rate / ref_rate if ref_rate > 0 else 1.0
            if air < AIR_BUFFER:
                any_fail   = True
                mask       = col_data == grp
                needed_rate = min(ref_rate * AIR_BUFFER, 0.95)
                grp_thresh  = _group_threshold(oof_probs[mask], needed_rate)
                t_ind[mask] = np.minimum(t_ind[mask], grp_thresh)

    # Normalization step
    current_hire_rate = (oof_probs >= t_ind).mean()
    if current_hire_rate > target_pos_rate:
        diffs = oof_probs - t_ind
        delta = _group_threshold(diffs, target_pos_rate)
        t_ind += delta

    print(f"Iter {iteration}: hire_rate={(oof_probs >= t_ind).mean():.3f}, any_fail={any_fail}")
    if not any_fail:
        break

print(f"Final hire rate: {(oof_probs >= t_ind).mean():.3f}")
