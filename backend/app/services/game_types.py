from dataclasses import dataclass
from enum import StrEnum


class Player(StrEnum):
    X = "x"
    O = "o"  # noqa: E741


class BoardStatus(StrEnum):
    IN_PROGRESS = "in_progress"
    X = "x"
    O = "o"  # noqa: E741
    DRAW = "draw"


Cell = Player | None


@dataclass(frozen=True)
class Game:
    """The only state that cannot be recomputed: cells, whose turn it is, and the forced board.

    Board statuses, the winner, and legal boards are always derived from this, never stored.
    """

    boards: tuple[tuple[Cell, ...], ...]
    current_player: Player
    active_board: int | None
