from fastapi import FastAPI

from app.api.v1 import games, health
from app.api.v1.errors import register_exception_handlers


def create_app() -> FastAPI:
    app = FastAPI(title="Ultimate Tic-Tac-Toe API", version="1.0.0")
    app.include_router(health.router, prefix="/api/v1")
    app.include_router(games.router, prefix="/api/v1")
    register_exception_handlers(app)
    return app


app = create_app()
