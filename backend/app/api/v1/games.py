from fastapi import APIRouter

from app.schemas.game import ErrorResponse, GameStateResponse, MoveRequest
from app.services.game_engine import apply_move, new_game

router = APIRouter(prefix="/games", tags=["games"])


@router.post("")
def create_game() -> GameStateResponse:
    return GameStateResponse.from_domain(new_game())


@router.post(
    "/moves",
    responses={
        409: {"model": ErrorResponse, "description": "The rules refused the move."},
        422: {"model": ErrorResponse, "description": "The request failed validation."},
    },
)
def make_move(move: MoveRequest) -> GameStateResponse:
    game = apply_move(move.state.to_domain(), move.board_index, move.cell_index)
    return GameStateResponse.from_domain(game)
