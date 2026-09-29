from typing import Any

import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.anyio

GAMES = "/api/v1/games"
MOVES = "/api/v1/games/moves"


def state(
    boards: dict[int, str] | None = None,
    current_player: str = "x",
    active_board: int | None = None,
) -> dict[str, Any]:
    """Builds the request-side state from 9-character board patterns ("." is empty)."""
    patterns = boards or {}
    return {
        "boards": [[None if c == "." else c for c in patterns.get(i, "." * 9)] for i in range(9)],
        "current_player": current_player,
        "active_board": active_board,
    }


def move(board_index: int, cell_index: int, **state_kwargs: Any) -> dict[str, Any]:
    return {"state": state(**state_kwargs), "board_index": board_index, "cell_index": cell_index}


async def test_new_game_returns_a_fresh_state_with_derived_fields(client: AsyncClient) -> None:
    response = await client.post(GAMES)
    assert response.status_code == 200
    assert response.json() == {
        "boards": [[None] * 9 for _ in range(9)],
        "current_player": "x",
        "active_board": None,
        "board_statuses": ["in_progress"] * 9,
        "winner": None,
        "legal_boards": [0, 1, 2, 3, 4, 5, 6, 7, 8],
    }


async def test_legal_move_returns_the_updated_state(client: AsyncClient) -> None:
    response = await client.post(MOVES, json=move(4, 4))
    assert response.status_code == 200
    body = response.json()
    assert body["boards"][4][4] == "x"
    assert body["current_player"] == "o"
    assert body["active_board"] == 4
    assert body["legal_boards"] == [4]
    assert body["winner"] is None


async def test_move_onto_an_occupied_cell_is_rejected_with_409(client: AsyncClient) -> None:
    response = await client.post(
        MOVES, json=move(4, 4, boards={4: "....x...."}, current_player="o", active_board=4)
    )
    assert response.status_code == 409
    body = response.json()
    assert set(body) == {"code", "detail"}
    assert body["code"] == "cell_occupied"


async def test_move_outside_the_forced_board_is_rejected_with_409(client: AsyncClient) -> None:
    response = await client.post(
        MOVES, json=move(1, 0, boards={4: "x........"}, current_player="o", active_board=0)
    )
    assert response.status_code == 409
    assert response.json()["code"] == "wrong_board"


async def test_derived_fields_are_computed_from_cells_not_trusted(client: AsyncClient) -> None:
    # The client never sends board statuses or a winner; the server works them out.
    response = await client.post(MOVES, json=move(3, 2, boards={3: "xx.oo...."}, active_board=3))
    assert response.status_code == 200
    assert response.json()["board_statuses"][3] == "x"


async def test_same_request_twice_gives_the_same_result(client: AsyncClient) -> None:
    # A stateful server would see the first move and reject the second as occupied.
    first = await client.post(MOVES, json=move(4, 4))
    second = await client.post(MOVES, json=move(4, 4))
    assert first.status_code == second.status_code == 200
    assert first.json() == second.json()


async def test_cell_index_out_of_range_is_rejected_with_422(client: AsyncClient) -> None:
    response = await client.post(MOVES, json=move(0, 9))
    assert response.status_code == 422
    body = response.json()
    assert set(body) == {"code", "detail"}
    assert body["code"] == "validation_error"
    assert "cell_index" in body["detail"]


async def test_state_with_the_wrong_number_of_boards_is_rejected_with_422(
    client: AsyncClient,
) -> None:
    payload = move(0, 0)
    payload["state"]["boards"] = payload["state"]["boards"][:8]
    response = await client.post(MOVES, json=payload)
    assert response.status_code == 422
    assert response.json()["code"] == "validation_error"


async def test_unexpected_fields_in_the_state_are_rejected_with_422(client: AsyncClient) -> None:
    payload = move(0, 0)
    payload["state"]["winner"] = "x"
    response = await client.post(MOVES, json=payload)
    assert response.status_code == 422


async def test_unknown_route_uses_the_error_envelope(client: AsyncClient) -> None:
    response = await client.get("/api/v1/nope")
    assert response.status_code == 404
    assert response.json() == {"code": "not_found", "detail": "Not Found"}


async def test_wrong_method_uses_the_error_envelope(client: AsyncClient) -> None:
    response = await client.get(GAMES)
    assert response.status_code == 405
    assert response.json()["code"] == "method_not_allowed"
