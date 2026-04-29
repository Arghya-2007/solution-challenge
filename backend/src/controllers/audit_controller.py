import logging
from fastapi import UploadFile, File, HTTPException, Body, Request
from fastapi.responses import StreamingResponse
from ..services import audit_service
from ..services.audit_service import MODEL_MAP

logger = logging.getLogger(__name__)

async def upload_dataset(file: UploadFile = None, sheet_url: str = None):
    try:
        file_name = file.filename if file else None
        file_content = await file.read() if file else None

        result = await audit_service.upload_dataset(
            file_name=file_name,
            file_content=file_content,
            sheet_url=sheet_url
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Failed to process dataset")
        raise HTTPException(status_code=500, detail=str(e))

async def analyze_dataset():
    try:
        return await audit_service.analyze_dataset()
    except FileNotFoundError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Failed to analyze dataset")
        raise HTTPException(status_code=500, detail=str(e))

async def get_summary(payload: dict):
    metrics = payload.get("metrics")
    language = str(payload.get("language", "en")).lower()

    try:
        return audit_service.get_summary(metrics, language)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        logger.exception("Failed to generate summary")
        raise HTTPException(status_code=500, detail="Internal server error")

async def export_report():
    try:
        pdf_buffer = audit_service.export_report()
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=bias_audit_report.pdf"}
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        logger.exception("Failed to export audit report")
        raise HTTPException(status_code=500, detail="Internal server error")

async def get_recommendation():
    try:
        return audit_service.get_recommendation()
    except FileNotFoundError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        logger.exception("Failed to generate recommendations")
        raise HTTPException(status_code=500, detail="Internal server error")

async def fix_bias(payload: dict):
    model_name = payload.get("model_name")
    try:
        return await audit_service.fix_bias(model_name)
    except (ValueError, FileNotFoundError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Failed to fix bias")
        raise HTTPException(status_code=500, detail=str(e))

async def download_fixed_dataset():
    try:
        file_path = audit_service.get_fixed_dataset_path()

        def iterfile():
            with open(file_path, mode="rb") as f:
                yield from f

        return StreamingResponse(
            iterfile(),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=fixed_dataset.csv"}
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        logger.exception("Failed to download fixed dataset")
        raise HTTPException(status_code=500, detail="Internal server error")