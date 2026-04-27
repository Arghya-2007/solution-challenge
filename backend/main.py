from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.httpsredirect import HTTPSRedirectMiddleware
import uvicorn
import os
import logging
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler

from src.routes import audit_routes, base_routes
from src.middlewares.security import (
    PayloadSizeLimitMiddleware, 
    SecurityHeadersMiddleware, 
    APIKeyMiddleware
)
from src.middlewares.limiter import limiter

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def _env_list(name: str, default: str) -> list[str]:
    value = os.getenv(name, default)
    return [item.strip() for item in value.split(",") if item.strip()]

# Configuration
MAX_REQUEST_SIZE_BYTES = int(os.getenv("MAX_REQUEST_SIZE_BYTES", str(10 * 1024 * 1024)))
API_KEY = os.getenv("API_KEY")
ALLOWED_HOSTS = _env_list("ALLOWED_HOSTS", "*")
ALLOWED_ORIGINS = _env_list("ALLOWED_ORIGINS", "*")
ENFORCE_HTTPS = os.getenv("ENFORCE_HTTPS", "false").lower() == "true"

PUBLIC_PATH_PREFIXES = [
    "/health",
    "/docs",
    "/openapi.json",
    "/redoc",
    "/favicon.ico",
]

app = FastAPI(title="Bias + SHAP Audit Engine (Expanded)")

# Rate Limiter setup
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# --- Middleware Setup ---

# 1. Trusted Host Middleware
app.add_middleware(TrustedHostMiddleware, allowed_hosts=ALLOWED_HOSTS)

# 2. CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. HTTPS Redirect (Conditional)
if ENFORCE_HTTPS:
    app.add_middleware(HTTPSRedirectMiddleware)

# 4. Security Headers Middleware
app.add_middleware(SecurityHeadersMiddleware, enforce_https=ENFORCE_HTTPS)

# 5. Payload Size Limit Middleware
app.add_middleware(PayloadSizeLimitMiddleware, max_size=MAX_REQUEST_SIZE_BYTES)

# 6. API Key Middleware
app.add_middleware(APIKeyMiddleware, api_key=API_KEY, public_paths=PUBLIC_PATH_PREFIXES)

# --- Routes ---
app.include_router(base_routes.router)
app.include_router(audit_routes.router)

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
