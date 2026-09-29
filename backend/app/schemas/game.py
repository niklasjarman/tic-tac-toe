from enum import StrEnum
from typing import Annotated, Self

from pydantic import BaseModel, ConfigDict, Field

from app.services.game_engine import board_statuses, game_result, legal_boards
from app.services.game_types import BoardStatus, Game, Player

BoardIndex = Annotated[int, Field(ge=0, le=8)]
SmallBoardCells = Annotated[list[Player | None], Field(min_length=9, max_length=9)]


class Winner(StrEnum):
    X = "x"
    O = "o"  # noqa: E741
    DRAW = "draw"


class GameState(BaseModel):
    """The state the client holds and sends back: only what cannot be recomputed."""

    model_config = ConfigDict(extra="forbid")

    boards: Annotated[list[SmallBoardCells], Field(min_length=9, max_length=9)]
    current_player: Player
    active_board: BoardIndex | None

    def to_domain(self) -> Game:
        return Game(
            boards=tuple(tuple(board) for board in self.boards),
            current_player=self.current_player,
            active_board=self.active_board,
        )


class MoveRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    state: GameState
    board_index: BoardIndex
    cell_index: BoardIndex


class GameStateResponse(BaseModel):
    """The client-held state plus values derived from it on every request."""

    boards: list[list[Player | None]]
    current_player: Player
    active_board: int | None
    board_statuses: list[BoardStatus]
    winner: Winner | None
    legal_boards: list[int]

    @classmethod
    def from_domain(cls, game: Game) -> Self:
        statuses = board_statuses(game)
        result = game_result(statuses)
        return cls(
            boards=[list(board) for board in game.boards],
            current_player=game.current_player,
            active_board=game.active_board,
            board_statuses=list(statuses),
            winner=None if result is BoardStatus.IN_PROGRESS else Winner(result.value),
            legal_boards=list(legal_boards(game)),
        )


class ErrorResponse(BaseModel):
    code: str
    detail: str
