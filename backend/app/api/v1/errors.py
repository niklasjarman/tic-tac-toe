from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.errors import IllegalMoveError

HTTP_ERROR_CODES = {
    status.HTTP_404_NOT_FOUND: "not_found",
    status.HTTP_405_METHOD_NOT_ALLOWED: "method_not_allowed",
}


def error_body(code: str, detail: str) -> dict[str, str]:
    return {"code": code, "detail": detail}


def register_exception_handlers(app: FastAPI) -> None:
    """Every error leaves the API in the same {code, detail} envelope."""

    @app.exception_handler(IllegalMoveError)
    async def illegal_move(_: Request, exc: IllegalMoveError) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT, content=error_body(exc.code, exc.detail)
        )

    @app.exception_handler(RequestValidationError)
    async def validation_failed(_: Request, exc: RequestValidationError) -> JSONResponse:
        problems = "; ".join(
            f"{'.'.join(str(part) for part in error['loc'])}: {error['msg']}"
            for error in exc.errors()
        )
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            content=error_body("validation_error", f"Invalid request: {problems}"),
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_error(_: Request, exc: StarletteHTTPException) -> JSONResponse:
        code = HTTP_ERROR_CODES.get(exc.status_code, "http_error")
        return JSONResponse(status_code=exc.status_code, content=error_body(code, str(exc.detail)))
