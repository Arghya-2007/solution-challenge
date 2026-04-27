import os
from fastapi import HTTPException

SUPPORTED_EXTENSIONS = {".csv", ".tsv", ".xlsx", ".xls"}

def validate_file_extension(filename: str):
    _, ext = os.path.splitext(filename)
    if ext.lower() not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file format: {ext}. Supported formats: {', '.join(SUPPORTED_EXTENSIONS)}"
        )
    return ext.lower()

def is_google_sheet_url(url: str) -> bool:
    return "docs.google.com/spreadsheets" in url
