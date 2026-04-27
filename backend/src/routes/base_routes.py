from fastapi import APIRouter
from fastapi.responses import RedirectResponse

router = APIRouter()

@router.get("/")
async def root():
    return RedirectResponse(url="/docs")

@router.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return {}
