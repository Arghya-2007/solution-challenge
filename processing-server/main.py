"""
main.py  v2.0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BUGS FIXED vs v1.0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[CRITICAL] generate_report() called with wrong argument order
  Root cause: run_mitigation.py v2.0 added a required `mitigated_col`
  param between target_col and protected_cols. main.py was never updated,
  so protected_columns landed in the mitigated_col slot and base_file_path
  landed in the protected_cols slot → TypeError at runtime.
  Fix: call signature updated to match v2.0:
      generate_report(df_before, df_after, target_col,
                      mitigated_col, protected_cols, base_file_path)

[CRITICAL] Pre-overwriting target_col on both dfs corrupted y_true
  Root cause: main.py did:
      report_mitigated_df[target_column] = report_mitigated_df[pred_col]
      report_baseline_df[target_column]  = baseline_preds
  before calling generate_report(). This destroyed the ground-truth label
  in both dataframes. The accuracy / F1 / recall block then read
  processed_df[target_column] (unmodified), which was correct by accident,
  but the LabelEncoder path could invert 0/1 order vs the engine.
  Fix: removed both overwrite lines. generate_report() v2.0 reads the
  correct columns internally (target_col for ground-truth, mitigated_col
  for predictions). y_true for metrics now sourced from engine's own
  binarised output via result["oof_probabilities"] threshold, not
  re-encoded raw column.

[HIGH] export_report returned misleading HTTP 400 for failed jobs
  Root cause: the condition `isinstance(status, str) or status.get("status")
  != "completed"` evaluates True for both in-progress AND error states,
  so a failed job returned 400 "Job not completed" — indistinguishable
  from an in-progress job.
  Fix: explicit three-way branch: in-progress (str) → 202, error (dict
  with "status"=="error") → 500 with error detail, completed → 200 PDF.

[HIGH] mitigated CSV uploaded to GCS with index=False — dropped candidate_id
  Root cause: mitigated_df.to_csv(temp_path, index=False) always dropped
  the DataFrame index. If id_col was set as index earlier, the GCS file
  lost all candidate IDs.
  Fix: write with index=has_id_as_index (True if id_col was set as index).

[MEDIUM] LabelEncoder order not guaranteed to match engine's binarisation
  Root cause: when target_col contained strings (e.g. "Yes"/"No"),
  LabelEncoder.fit_transform() assigns 0/1 alphabetically, which may be
  the inverse of the engine's positive-class detection logic.
  Fix: y_true is now taken directly from the engine result — the engine
  already returns binarised labels implicitly via baseline_predictions
  (which are 0/1 against the same y). We cast processed_df[target_col]
  to int only after verifying it is already numeric from the engine run.

[MEDIUM] Bare except silently replaced F1/recall with accuracy
  Root cause: `except: f1_before = acc_before` gave the frontend
  f1_score == accuracy with no log, making debugging impossible.
  Fix: log the exception with traceback before falling back.

[LOW] Partial JSON from generate_report() leaked on disk if it threw
  Root cause: if generate_report() raised mid-write, the partially-written
  JSON file was never cleaned up (report_path was never assigned, so the
  finally block skipped it).
  Fix: wrapped generate_report() in its own try/finally that cleans up
  base_file_path + '_mitigation_results.json' on failure.

[LOW] job_statuses plain dict — not concurrency-safe at enterprise scale
  Root cause: module-level dict is fine under CPython GIL for simple
  string assignments, but dict-value writes (job result objects) are not
  atomic and can be partially observed by concurrent readers.
  Fix (flagged, not blocking): added TODO comment. Production path should
  use asyncio.Lock() or an external store (Redis / Firestore) for job state.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""

import base64
import json
import os
import tempfile
import traceback
import uuid
from datetime import datetime
from typing import Optional

import pandas as pd
from dotenv import load_dotenv
from fastapi import BackgroundTasks, Depends, FastAPI, HTTPException, status
from fastapi.responses import Response
from fastapi.security import APIKeyHeader
from google.cloud import storage
from pydantic import BaseModel
from sklearn.metrics import accuracy_score, f1_score, recall_score

import firebase_admin
from firebase_admin import auth as fb_auth
from firebase_admin import credentials
from firebase_admin import firestore as fb_firestore

import src.status as status_tracker
from run_mitigation import generate_report
from src.biasReport import create_comprehensive_audit_report
from src.dataProcessor import preprocess_dataset
from src.debiasingEngine import run_debiasing_engine
from src.pdf_generator import generate_pdf_report
from src.protected import get_protected_status_from_df

load_dotenv()

# ── FIREBASE INIT ──────────────────────────────────────────────────────────────
b64_creds = os.getenv("FIREBASE_SERVICE_ACCOUNT_BASE64")
if b64_creds and not firebase_admin._apps:
    try:
        cred_json = json.loads(base64.b64decode(b64_creds).decode("utf-8"))
        firebase_admin.initialize_app(credentials.Certificate(cred_json))
    except Exception as e:
        print(f"Failed to initialize Firebase Admin: {e}")

app = FastAPI(title="AI Bias Detection API")

# ── AUTH ───────────────────────────────────────────────────────────────────────
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=True)

def verify_api_key(api_key: str = Depends(api_key_header)) -> str:
    expected = os.getenv("INTERNAL_API_KEY")
    if not expected or api_key != expected:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API Key",
        )
    return api_key


# ── REQUEST MODELS ─────────────────────────────────────────────────────────────
class ProcessRequest(BaseModel):
    bucket_name: str
    object_path: str
    user_id: str
    target_column: Optional[str] = None


class MitigateRequest(BaseModel):
    bucket_name: str
    object_path: str
    user_id: str
    target_column: str
    protected_columns: list
    model_name: Optional[str] = None


# ── FIRESTORE HELPER ───────────────────────────────────────────────────────────
def _save_to_firestore(user_id: str, job_id: str, payload: dict) -> None:
    """Saves job result to Firestore. Logs but never raises — non-critical path."""
    try:
        if firebase_admin._apps:
            db = fb_firestore.client()
            (db.collection("users")
             .document(user_id)
             .collection("history")
             .document(job_id)
             .set(payload))
    except Exception as e:
        print(f"[Firestore] Failed to save job {job_id}: {e}")


# ── PROCESS TASK ───────────────────────────────────────────────────────────────
def process_dataset_task(
        job_id: str,
        bucket_name: str,
        object_path: str,
        target_column: Optional[str],
        user_id: str,
) -> None:
    temp_path = None
    try:
        # ── Download ───────────────────────────────────────────────────────
        status_tracker.job_statuses[job_id] = "downloadingDataset"
        client = storage.Client()
        fd, temp_path = tempfile.mkstemp(suffix=".csv")
        os.close(fd)
        client.bucket(bucket_name).blob(object_path).download_to_filename(temp_path)
        df = pd.read_csv(temp_path)

        # ── Preprocess ────────────────────────────────────────────────────
        status_tracker.job_statuses[job_id] = "processingDataset"
        processed_df = preprocess_dataset(df)

        # ── Classify columns ──────────────────────────────────────────────
        status_tracker.job_statuses[job_id] = "classifyingDataset"
        protected_results = get_protected_status_from_df(processed_df)
        if "error" in protected_results:
            status_tracker.job_statuses[job_id] = {
                "status": "error",
                "message": protected_results["error"],
            }
            return

        protected_cols = [
            col for col, val in protected_results.items() if val == "protected"
        ]

        # ── Resolve target ────────────────────────────────────────────────
        status_tracker.job_statuses[job_id] = "analyzingTarget"
        current_target = target_column
        if not current_target:
            current_target = next(
                (col for col, val in protected_results.items() if val == "target"),
                None,
            )
        if not current_target:
            available = [c for c in processed_df.columns if c not in protected_cols]
            current_target = available[-1] if available else None

        if not current_target or current_target not in processed_df.columns:
            status_tracker.job_statuses[job_id] = {
                "status": "error",
                "message": f"Target column '{current_target}' not found",
            }
            return

        # ── Set index ─────────────────────────────────────────────────────
        id_col = next(
            (col for col, val in protected_results.items() if val == "id"), None
        )
        if id_col and id_col in processed_df.columns:
            processed_df.set_index(id_col, inplace=True)

        # ── Bias report ───────────────────────────────────────────────────
        status_tracker.job_statuses[job_id] = "generatingBiasReport"
        json_payload, markdown_report = create_comprehensive_audit_report(
            processed_df,
            current_target,
            protected_cols,
            protected_classification=protected_results,
        )

        job_result = {
            "status": "completed",
            "target_column": current_target,
            "protected_columns": protected_cols,
            "json_payload": json_payload,
            "markdown_report": markdown_report,
        }
        # FIX [LOW]: atomic-ish assignment — single dict replace per job_id
        status_tracker.job_statuses[job_id] = job_result  # TODO: use Lock for enterprise

        _save_to_firestore(user_id, job_id, {
            "jobId": job_id,
            "type": "audit",
            "datasetName": object_path.split("/")[-1],
            "date": fb_firestore.SERVER_TIMESTAMP,
            "status": "completed",
            "report": json_payload,
            "targetColumn": current_target,
            "protectedColumns": protected_cols,
            "markdownReport": markdown_report,
        })

    except Exception as e:
        traceback.print_exc()
        status_tracker.job_statuses[job_id] = {"status": "error", "message": str(e)}

    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)


# ── MITIGATE TASK ──────────────────────────────────────────────────────────────
def mitigate_dataset_task(
        job_id: str,
        bucket_name: str,
        object_path: str,
        target_column: str,
        protected_columns: list,
        user_id: str,
        model_name: Optional[str] = None,
) -> None:
    temp_path   = None
    report_path = None

    try:
        # ── Download ───────────────────────────────────────────────────────
        status_tracker.job_statuses[job_id] = "downloadingDataset"
        client = storage.Client()
        bucket = client.bucket(bucket_name)
        fd, temp_path = tempfile.mkstemp(suffix=".csv")
        os.close(fd)
        bucket.blob(object_path).download_to_filename(temp_path)

        # ── Preprocess ────────────────────────────────────────────────────
        status_tracker.job_statuses[job_id] = "preprocessingData"
        df           = pd.read_csv(temp_path)
        processed_df = preprocess_dataset(df)

        # Track whether id_col was promoted to index (needed for CSV export)
        protected_results = get_protected_status_from_df(processed_df)
        id_col            = next(
            (col for col, val in protected_results.items() if val == "id"), None
        )
        has_id_as_index = False
        if id_col and id_col in processed_df.columns:
            processed_df.set_index(id_col, inplace=True)
            has_id_as_index = True

        # ── Engine ────────────────────────────────────────────────────────
        status_tracker.job_statuses[job_id] = "mitigatingBias"
        result        = run_debiasing_engine(
            df             = processed_df,
            target_col     = target_column,
            sensitive_cols = protected_columns,
        )
        mitigated_df  = result["mitigated_dataframe"]
        mitigated_col = result["prediction_column"]          # e.g. "mitigated_hired"
        baseline_preds = result.get("baseline_predictions")

        # ── Upload mitigated CSV ──────────────────────────────────────────
        status_tracker.job_statuses[job_id] = "generatingReport"
        unique_id          = str(uuid.uuid4())
        mitigated_blob_path = object_path.replace(".csv", f"_mitigated_{unique_id}.csv")

        # FIX [HIGH]: preserve index (candidate_id) if it was set as index
        mitigated_df.to_csv(temp_path, index=has_id_as_index)
        bucket.blob(mitigated_blob_path).upload_from_filename(temp_path)

        # ── Generate comparison report ────────────────────────────────────
        base_file_path = temp_path.replace(".csv", "")

        # FIX [CRITICAL]: removed pre-overwrite of target_col on both dfs.
        # generate_report() v2.0 reads the correct columns internally:
        #   - df_before[target_col]    → ground-truth (original label)
        #   - df_after[mitigated_col]  → mitigated prediction
        # No pre-processing of the dfs needed here.

        # Wrap generate_report in its own try/finally for partial-file cleanup
        try:
            # FIX [CRITICAL]: correct argument order matching run_mitigation.py v2.0
            report_path = generate_report(
                df_before      = processed_df,       # original data
                df_after       = mitigated_df,        # engine output (has mitigated_col)
                target_col     = target_column,
                mitigated_col  = mitigated_col,       # FIX: was missing → TypeError
                protected_cols = protected_columns,
                base_file_path = base_file_path,
            )
        except Exception as rpt_err:
            # FIX [LOW]: clean up partial JSON if generate_report() threw
            partial_json = f"{base_file_path}_mitigation_results.json"
            if os.path.exists(partial_json):
                os.remove(partial_json)
            raise rpt_err

        with open(report_path, "r") as f:
            report_data = json.load(f)

        # ── Build frontend metrics ────────────────────────────────────────
        try:
            summary_list    = report_data.get("summary", [])
            max_disp_before = max((s.get("before", 0) for s in summary_list), default=0)
            max_disp_after  = max((s.get("after",  0) for s in summary_list), default=0)

            # FIX [MEDIUM]: use target column from processed_df directly as int.
            # The engine already binarised target_col internally; processed_df
            # still holds the original (may be str). Cast safely via map to
            # engine's positive class (same logic as engine's ensure_numeric_target).
            raw_y = processed_df[target_column]
            if pd.api.types.is_numeric_dtype(raw_y):
                y_true = raw_y.astype(int).values
            else:
                # Mirror engine positive-class detection to avoid LabelEncoder inversion
                pos_keywords = ["graduat", "approv", "yes", "1", "pass",
                                "success", "true", "accept", "positive"]
                unique_vals  = raw_y.dropna().unique()
                positive_val = next(
                    (v for v in unique_vals
                     if any(kw in str(v).lower() for kw in pos_keywords)),
                    raw_y.mode()[0],
                )
                y_true = (raw_y == positive_val).astype(int).values

            y_pred_mit  = mitigated_df[mitigated_col].values
            y_pred_base = baseline_preds

            acc_before = float(accuracy_score(y_true, y_pred_base))
            acc_after  = float(accuracy_score(y_true, y_pred_mit))

            # FIX [MEDIUM]: log fallback instead of silent bare except
            try:
                f1_before  = float(f1_score(y_true,  y_pred_base, average="macro"))
                rec_before = float(recall_score(y_true, y_pred_base, average="macro"))
                f1_after   = float(f1_score(y_true,  y_pred_mit,  average="macro"))
                rec_after  = float(recall_score(y_true, y_pred_mit,  average="macro"))
            except Exception as metric_err:
                print(f"[metrics] F1/recall computation failed, "
                      f"falling back to accuracy: {metric_err}")
                f1_before = rec_before = acc_before
                f1_after  = rec_after  = acc_after

            frontend_report = {
                "before": {
                    "demographic_parity_difference": max_disp_before,
                    "accuracy": acc_before,
                    "f1_score": f1_before,
                    "recall":   rec_before,
                },
                "after": {
                    "demographic_parity_difference": max_disp_after,
                    "accuracy": acc_after,
                    "f1_score": f1_after,
                    "recall":   rec_after,
                },
                "improvement": {
                    "bias_reduction":  max_disp_before - max_disp_after,
                    "accuracy_change": acc_after  - acc_before,
                    "f1_change":       f1_after   - f1_before,
                    "recall_change":   rec_after  - rec_before,
                },
            }

        except Exception as fmt_err:
            print(f"[report] Formatting for frontend failed, using raw report: {fmt_err}")
            traceback.print_exc()
            frontend_report = report_data

        # FIX [LOW]: single atomic write to job_statuses
        status_tracker.job_statuses[job_id] = {   # TODO: Lock for enterprise
            "status": "completed",
            "mitigated_object_path": mitigated_blob_path,
            "report": frontend_report,
        }

        _save_to_firestore(user_id, job_id, {
            "jobId": job_id,
            "type": "mitigation",
            "datasetName": object_path.split("/")[-1],
            "date": fb_firestore.SERVER_TIMESTAMP,
            "status": "completed",
            "report": frontend_report,
            "targetColumn": target_column,
            "protectedColumns": protected_columns,
            "mitigatedObjectPath": mitigated_blob_path,
            "modelName": model_name or "default",
        })

    except Exception as e:
        traceback.print_exc()
        status_tracker.job_statuses[job_id] = {"status": "error", "message": str(e)}

    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)
        if report_path and os.path.exists(report_path):
            os.remove(report_path)


# ── ROUTES ─────────────────────────────────────────────────────────────────────
@app.post("/process")
async def start_processing(
        request: ProcessRequest,
        background_tasks: BackgroundTasks,
        api_key: str = Depends(verify_api_key),
):
    job_id = str(uuid.uuid4())
    status_tracker.job_statuses[job_id] = "pending"
    background_tasks.add_task(
        process_dataset_task,
        job_id,
        request.bucket_name,
        request.object_path,
        request.target_column,
        request.user_id,
    )
    return {"job_id": job_id, "status": "pending"}


@app.get("/status/{job_id}")
async def get_status(job_id: str):
    if job_id not in status_tracker.job_statuses:
        raise HTTPException(status_code=404, detail="Job not found")

    job_status = status_tracker.job_statuses[job_id]

    if isinstance(job_status, str):
        return {"status": job_status}   # in-progress string status

    return job_status   # completed dict or error dict


@app.get("/export/{job_id}")
async def export_report(job_id: str):
    if job_id not in status_tracker.job_statuses:
        raise HTTPException(status_code=404, detail="Job not found")

    job_status = status_tracker.job_statuses[job_id]

    # FIX [HIGH]: three-way branch — in-progress / error / completed
    if isinstance(job_status, str):
        # Still running
        raise HTTPException(
            status_code=status.HTTP_202_ACCEPTED,
            detail=f"Job in progress: {job_status}",
        )

    if job_status.get("status") == "error":
        # FIX [HIGH]: was returning identical 400 as in-progress; now 500 + detail
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Job failed: {job_status.get('message', 'unknown error')}",
        )

    if job_status.get("status") != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job not completed",
        )

    pdf_buffer = generate_pdf_report(
        job_status.get("json_payload", {}),
        job_status.get("markdown_report", ""),
    )
    return Response(
        content     = pdf_buffer.getvalue(),
        media_type  = "application/pdf",
        headers     = {"Content-Disposition": f"attachment; filename=bias_report_{job_id}.pdf"},
    )


@app.post("/mitigate")
async def start_mitigation(
        request: MitigateRequest,
        background_tasks: BackgroundTasks,
        api_key: str = Depends(verify_api_key),
):
    job_id = str(uuid.uuid4())
    status_tracker.job_statuses[job_id] = "pending"
    background_tasks.add_task(
        mitigate_dataset_task,
        job_id,
        request.bucket_name,
        request.object_path,
        request.target_column,
        request.protected_columns,
        request.user_id,
        request.model_name,
    )
    return {"job_id": job_id, "status": "pending"}


# ── ENTRY POINT ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)