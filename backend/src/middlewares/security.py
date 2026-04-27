from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from fastapi import Request
import os

class PayloadSizeLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_size: int):
        super().__init__(app)
        self.max_size = max_size

    async def dispatch(self, request: Request, call_next):
        if request.method != "OPTIONS":
            content_length = request.headers.get("content-length")
            if content_length:
                try:
                    if int(content_length) > self.max_size:
                        return JSONResponse(
                            status_code=413,
                            content={"detail": "Request payload too large"},
                        )
                except ValueError:
                    return JSONResponse(status_code=400, content={"detail": "Invalid Content-Length"})
        return await call_next(request)

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, enforce_https: bool = False):
        super().__init__(app)
        self.enforce_https = enforce_https

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        
        if self.enforce_https:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        return response

class APIKeyMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, api_key: str, public_paths: list[str]):
        super().__init__(app)
        self.api_key = api_key
        self.public_paths = public_paths

    def _is_public_path(self, path: str) -> bool:
        return path == "/" or any(path.startswith(prefix) for prefix in self.public_paths)

    async def dispatch(self, request: Request, call_next):
        if request.method != "OPTIONS" and self.api_key and not self._is_public_path(request.url.path):
            provided_api_key = request.headers.get("x-api-key")
            if not provided_api_key or provided_api_key != self.api_key:
                return JSONResponse(status_code=401, content={"detail": "Unauthorized"})
        return await call_next(request)
