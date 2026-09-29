from collections.abc import Sequence

from app.services.game_types import BoardStatus

WINNING_LINES: tuple[tuple[int, int, int], ...] = (
    (0, 1, 2),
    (3, 4, 5),
    (6, 7, 8),
    (0, 3, 6),
    (1, 4, 7),
    (2, 5, 8),
    (0, 4, 8),
    (2, 4, 6),
)


def evaluate_grid(cells: Sequence[str | None]) -> BoardStatus:
    """Evaluates any 3x3 grid, row-major: a small board's cells, or the big board.

    A line of three "x" or three "o" wins. Any other non-None value (a drawn small
    board on the big grid) fills a square without counting toward a line. With no
    winner, a grid with no None left is a draw.
    """
    if len(cells) != 9:
        raise ValueError(f"A 3x3 grid needs 9 cells, got {len(cells)}")
    for a, b, c in WINNING_LINES:
        mark = cells[a]
        if mark in ("x", "o") and mark == cells[b] == cells[c]:
            return BoardStatus(mark)
    if all(cell is not None for cell in cells):
        return BoardStatus.DRAW
    return BoardStatus.IN_PROGRESS
