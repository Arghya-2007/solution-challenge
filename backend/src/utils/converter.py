import pandas as pd
from io import BytesIO, StringIO
import gspread
import os
from ..config import GSPREAD_CREDENTIALS

def convert_to_dataframe(content: bytes, extension: str) -> pd.DataFrame:
    try:
        if extension == ".csv":
            return pd.read_csv(BytesIO(content))
        elif extension == ".tsv":
            return pd.read_csv(BytesIO(content), sep="\t")
        elif extension in {".xlsx", ".xls"}:
            return pd.read_excel(BytesIO(content))
        else:
            raise ValueError(f"Unsupported extension: {extension}")
    except Exception as e:
        raise ValueError(f"Error converting file: {str(e)}")

def load_google_sheet(url: str) -> pd.DataFrame:
    try:
        if not os.path.exists(GSPREAD_CREDENTIALS):
            raise FileNotFoundError(f"Credentials file not found at {GSPREAD_CREDENTIALS}. Follow GSPREAD_SETUP.md to create it.")
        
        gc = gspread.service_account(filename=GSPREAD_CREDENTIALS)
        sh = gc.open_by_url(url)
        worksheet = sh.get_worksheet(0)
        data = worksheet.get_all_records()
        return pd.DataFrame(data)
    except Exception as e:
        raise ValueError(f"Error loading Google Sheet: {str(e)}")
