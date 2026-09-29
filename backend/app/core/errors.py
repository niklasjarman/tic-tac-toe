from enum import StrEnum


class MoveRefusal(StrEnum):
    INVALID_STATE = "invalid_state"
    GAME_OVER = "game_over"
    BOARD_CLOSED = "board_closed"
    WRONG_BOARD = "wrong_board"
    CELL_OCCUPIED = "cell_occupied"


class IllegalMoveError(Exception):
    """A move the rules refuse. Carries a machine-readable code and a human sentence."""

    def __init__(self, code: MoveRefusal, detail: str) -> None:
        super().__init__(detail)
        self.code = code
        self.detail = detail
