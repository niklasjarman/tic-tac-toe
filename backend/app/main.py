from fastapi import APIRouter, FastAPI

health_router = APIRouter(tags=["health"])


@health_router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


def create_app() -> FastAPI:
    app = FastAPI(title="Ultimate Tic-Tac-Toe API", version="1.0.0")
    app.include_router(health_router, prefix="/api/v1")
    return app


app = create_app()
