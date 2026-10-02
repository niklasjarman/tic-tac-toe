import pytest
from httpx import ASGITransport, AsyncClient

from app.main import create_app

pytestmark = pytest.mark.anyio


async def test_unexpected_server_error_uses_the_error_envelope() -> None:
    app = create_app()

    @app.get("/api/v1/test-crash")
    def crash() -> None:
        raise RuntimeError("internal detail that must not reach the client")

    # Let the server turn the crash into a response instead of re-raising it in the test.
    transport = ASGITransport(app=app, raise_app_exceptions=False)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/test-crash")

    assert response.status_code == 500
    assert response.json() == {
        "code": "internal_error",
        "detail": "Something went wrong on the server.",
    }
