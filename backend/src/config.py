import os
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")

TARGET_KEYWORDS = [
    "label", "target", "output", "price", "score", "class", "result"
]

SENSITIVE_KEYWORDS = [
    "gender", "sex", "race", "ethnicity", "religion", "caste",
    "nationality", "age", "zipcode", "postcode", "pin_code",
    "location", "district"
]

PROXY_RISK_KEYWORDS = [
    "salary", "wage", "income", "pay", "compensation"
]

CONTEXT_RULES = {
    "healthcare": {"gender": "allowed", "age": "allowed"},
    "finance": {"zipcode": "high_risk", "race": "high_risk", "gender": "high_risk"},
    "hr": {"age": "high_risk", "gender": "high_risk", "race": "high_risk"}
}

GSPREAD_CREDENTIALS = "credentials.json"
