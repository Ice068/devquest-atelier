from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.config import get_settings
from app.core.limiter import limiter
from app.routers import ai, auth, users

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        version="2.0.0",
        docs_url="/docs" if settings.enable_docs else None,
        redoc_url="/redoc" if settings.enable_docs else None,
        openapi_url="/openapi.json" if settings.enable_docs else None,
    )

    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins_list,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type"],
    )

    @app.middleware("http")
    async def add_security_headers(request: Request, call_next) -> Response:
        response: Response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self'; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com data:; "
            "img-src 'self' data: https:; "
            "frame-src 'self' blob: data:; "
            "connect-src 'self' http://127.0.0.1:8000 http://localhost:8000;"
        )
        if settings.is_production:
            response.headers["Strict-Transport-Security"] = (
                "max-age=63072000; includeSubDomains; preload"
            )
        return response

    @app.get("/api/health", tags=["Health"])
    def health_check() -> dict[str, str]:
        return {
            "status": "ok",
            "app": settings.app_name,
            "storage": settings.storage_backend,
            "ai_mode": "gemini+solo-ast" if settings.gemini_api_key else "solo-ast-local",
        }

    app.include_router(auth.router)
    app.include_router(users.router)
    app.include_router(ai.router)

    static_dir = FRONTEND_DIR / "static"
    if static_dir.exists():
        app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

    @app.get("/favicon.ico", include_in_schema=False)
    def serve_favicon() -> Response:
        svg = (
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">'
            '<rect x="4" y="4" width="56" height="56" rx="12" fill="#ff4d2a" '
            'stroke="#161513" stroke-width="4"/>'
            '<text x="32" y="40" text-anchor="middle" font-family="monospace" '
            'font-weight="800" font-size="24" fill="#ffffff">&lt;/&gt;</text>'
            "</svg>"
        )
        return Response(content=svg, media_type="image/svg+xml")

    @app.get("/", include_in_schema=False)
    def serve_frontend():
        index_file = FRONTEND_DIR / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))
        return JSONResponse({"status": "ok", "app": settings.app_name})

    return app


app = create_app()
