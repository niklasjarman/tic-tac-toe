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


X_WON = "xxxoo...."
TWO_O = "oo......."  # balances mark counts so the turn is consistent

REFUSED_MOVES = [
    pytest.param(
        move(4, 4, boards={4: "....x...."}, current_player="o", active_board=4),
        "cell_occupied",
        id="cell_occupied",
    ),
    pytest.param(
        move(1, 0, boards={4: "x........"}, current_player="o", active_board=0),
        "wrong_board",
        id="wrong_board",
    ),
    pytest.param(
        move(5, 5, boards={5: X_WON}, current_player="o"),
        "board_closed",
        id="board_closed",
    ),
    pytest.param(
        move(5, 0, boards={0: X_WON, 1: X_WON, 2: X_WON, 4: TWO_O}, current_player="o"),
        "game_over",
        id="game_over",
    ),
    pytest.param(move(4, 4, current_player="o"), "invalid_state", id="invalid_state"),
]


@pytest.mark.parametrize(("payload", "code"), REFUSED_MOVES)
async def test_every_refused_move_returns_409_with_its_code(
    client: AsyncClient, payload: dict[str, Any], code: str
) -> None:
    response = await client.post(MOVES, json=payload)
    assert response.status_code == 409
    body = response.json()
    assert set(body) == {"code", "detail"}
    assert body["code"] == code


async def test_board_statuses_are_computed_from_cells_not_trusted(client: AsyncClient) -> None:
    # The client never sends board statuses; the server works them out from the cells.
    response = await client.post(MOVES, json=move(3, 2, boards={3: "xx.oo...."}, active_board=3))
    assert response.status_code == 200
    assert response.json()["board_statuses"][3] == "x"


async def test_winning_the_big_board_reports_the_winner(client: AsyncClient) -> None:
    payload = move(2, 2, boards={0: X_WON, 1: X_WON, 2: "xx.oo....", 4: TWO_O}, active_board=2)
    response = await client.post(MOVES, json=payload)
    assert response.status_code == 200
    body = response.json()
    assert body["winner"] == "x"
    assert body["active_board"] is None
    assert body["legal_boards"] == []


async def test_closing_every_board_without_a_line_reports_a_draw(client: AsyncClient) -> None:
    drawn = {i: "xoxxoooxx" if i % 2 == 0 else "oxooxxxoo" for i in range(8)}
    payload = move(8, 8, boards={**drawn, 8: "xoxxooox."}, active_board=8)
    response = await client.post(MOVES, json=payload)
    assert response.status_code == 200
    body = response.json()
    assert body["winner"] == "draw"
    assert body["board_statuses"] == ["draw"] * 9
    assert body["legal_boards"] == []


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


def malformed(change: str) -> dict[str, Any]:
    """A legal-looking move request broken in exactly one way."""
    payload = move(0, 0)
    match change:
        case "board_index_negative":
            payload["board_index"] = -1
        case "active_board_too_high":
            payload["state"]["active_board"] = 9
        case "active_board_negative":
            payload["state"]["active_board"] = -1
        case "unknown_player":
            payload["state"]["current_player"] = "z"
        case "unknown_cell_mark":
            payload["state"]["boards"][0][0] = "q"
        case "eight_boards":
            payload["state"]["boards"] = payload["state"]["boards"][:8]
        case "eight_cells":
            payload["state"]["boards"][3] = payload["state"]["boards"][3][:8]
        case "missing_cell_index":
            del payload["cell_index"]
        case "derived_field_sent":
            payload["state"]["winner"] = "x"
    return payload


@pytest.mark.parametrize(
    "change",
    [
        "board_index_negative",
        "active_board_too_high",
        "active_board_negative",
        "unknown_player",
        "unknown_cell_mark",
        "eight_boards",
        "eight_cells",
        "missing_cell_index",
        "derived_field_sent",
    ],
)
async def test_malformed_requests_are_rejected_with_422(client: AsyncClient, change: str) -> None:
    response = await client.post(MOVES, json=malformed(change))
    assert response.status_code == 422
    body = response.json()
    assert set(body) == {"code", "detail"}
    assert body["code"] == "validation_error"


async def test_api_schema_lists_exactly_the_error_statuses_each_endpoint_returns(
    client: AsyncClient,
) -> None:
    paths = (await client.get("/openapi.json")).json()["paths"]
    assert set(paths[GAMES]["post"]["responses"]) == {"200"}
    assert set(paths[MOVES]["post"]["responses"]) == {"200", "409", "422"}


async def test_unknown_route_uses_the_error_envelope(client: AsyncClient) -> None:
    response = await client.get("/api/v1/nope")
    assert response.status_code == 404
    assert response.json() == {"code": "not_found", "detail": "Not Found"}


async def test_wrong_method_uses_the_error_envelope(client: AsyncClient) -> None:
    response = await client.get(GAMES)
    assert response.status_code == 405
    assert response.json()["code"] == "method_not_allowed"
