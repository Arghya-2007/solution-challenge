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
z = np.array([str(i%1116) for i in range(3500)])
df_s = {
    'gender': np.array([str(i%2) for i in range(3500)]),
    'age': np.array([str(i%3) for i in range(3500)])
}
sensitive_cols = ['gender', 'age']
target_pos_rate = 0.296

t_sum = np.zeros(len(oof_probs), dtype=np.float32)
t_count = np.zeros(len(oof_probs), dtype=np.float32)

for col in ["_z_"] + sensitive_cols:
    col_data = z if col == "_z_" else df_s[col]
    for grp in np.unique(col_data):
        mask = col_data == grp
        if not np.any(mask):
            continue
        thresh = _group_threshold(oof_probs[mask], target_pos_rate)
        t_sum[mask] += thresh
        t_count[mask] += 1

t_ind = t_sum / np.maximum(t_count, 1)

hire_rate = (oof_probs >= t_ind).mean()
print(f"Overall hire rate: {hire_rate:.3f}")
print(f"Mean t_ind: {t_ind.mean():.3f}")
print(f"Min t_ind: {t_ind.min():.3f}, Max t_ind: {t_ind.max():.3f}")
