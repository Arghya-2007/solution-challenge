from fastapi import APIRouter, UploadFile, File, Body, Request
from ..controllers import audit_controller
from ..middlewares.limiter import limiter

router = APIRouter()

@router.get("/health")
@limiter.limit("20/minute")
async def health(request: Request):
    return {"status": "ok", "message": "Bias Audit Engine is running"}

@router.post("/upload")
@limiter.limit("10/minute")
async def upload(
    request: Request,
    file: UploadFile = File(None), 
    sheet_url: str = Body(None, embed=True)
):
    return await audit_controller.upload_dataset(file, sheet_url)

@router.post("/analyze")
@limiter.limit("5/minute")
async def analyze(request: Request):
    return await audit_controller.analyze_dataset()

@router.post("/summary")
@limiter.limit("10/minute")
async def summary(request: Request, payload: dict = Body(...)):
    return await audit_controller.get_summary(payload)

@router.get("/export")
@limiter.limit("5/minute")
async def export(request: Request):
    return await audit_controller.export_report()

@router.post("/audit")
@limiter.limit("5/minute")
async def audit(request: Request, file: UploadFile = File(...)):
    await audit_controller.upload_dataset(file=file)
    return await audit_controller.analyze_dataset()

@router.get("/recommendation")
@limiter.limit("5/minute")
async def recommendation(request: Request):
    return await audit_controller.get_recommendation()

@router.post("/fix")
@limiter.limit("5/minute")
async def fix(request: Request, payload: dict = Body(...)):
    return await audit_controller.fix_bias(payload)

@router.get("/download")
@limiter.limit("5/minute")
async def download(request: Request):
    return await audit_controller.download_fixed_dataset()
