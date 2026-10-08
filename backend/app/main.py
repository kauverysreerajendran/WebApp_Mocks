from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1 import admin, auth, catalog, orders, tailor
from app.core.config import get_settings


def _readable_validation_message(exc: RequestValidationError) -> str:
    """First validation error as a sentence the UI can show directly."""
    first = exc.errors()[0] if exc.errors() else {}
    msg = str(first.get("msg", "Invalid request")).removeprefix("Value error, ")
    loc = [str(p) for p in first.get("loc", []) if p not in ("body", "query", "path")]
    return f"{loc[-1]}: {msg}" if loc and not msg[0].isupper() else msg


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_name, version="1.0.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(RequestValidationError)
    async def validation_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
        return JSONResponse(
            status_code=422,
            content={
                "detail": _readable_validation_message(exc),
                "errors": [{"loc": e.get("loc"), "msg": e.get("msg")} for e in exc.errors()],
            },
        )

    api_prefix = "/api/v1"
    for module in (auth, catalog, orders, tailor, admin):
        app.include_router(module.router, prefix=api_prefix)

    @app.get("/health", tags=["meta"])
    def health() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()
