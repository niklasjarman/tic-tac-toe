import pytest

from app.services.game_types import BoardStatus
from app.services.grid import evaluate_grid

EMPTY: list[str | None] = [None] * 9


def test_empty_grid_is_in_progress() -> None:
    assert evaluate_grid(EMPTY) is BoardStatus.IN_PROGRESS


def test_partially_filled_grid_with_no_line_is_in_progress() -> None:
    assert evaluate_grid(["x", None, None, None, "o", None, None, None, None]) is (
        BoardStatus.IN_PROGRESS
    )


ALL_LINES = [
    pytest.param((0, 1, 2), id="top-row"),
    pytest.param((3, 4, 5), id="middle-row"),
    pytest.param((6, 7, 8), id="bottom-row"),
    pytest.param((0, 3, 6), id="left-column"),
    pytest.param((1, 4, 7), id="center-column"),
    pytest.param((2, 5, 8), id="right-column"),
    pytest.param((0, 4, 8), id="diagonal"),
    pytest.param((2, 4, 6), id="anti-diagonal"),
]


@pytest.mark.parametrize("line", ALL_LINES)
@pytest.mark.parametrize("player", ["x", "o"])
def test_every_line_wins_for_either_player(line: tuple[int, int, int], player: str) -> None:
    cells: list[str | None] = [player if i in line else None for i in range(9)]
    assert evaluate_grid(cells) is BoardStatus(player)


def test_a_line_with_mixed_marks_does_not_win() -> None:
    assert evaluate_grid(["x", "x", "o", None, None, None, None, None, None]) is (
        BoardStatus.IN_PROGRESS
    )


def test_full_grid_with_no_line_is_a_draw() -> None:
    assert evaluate_grid(["x", "o", "x", "x", "o", "o", "o", "x", "x"]) is BoardStatus.DRAW


def test_win_on_the_last_empty_square_is_a_win_not_a_draw() -> None:
    assert evaluate_grid(["x", "x", "x", "o", "o", "x", "o", "x", "o"]) is BoardStatus.X


def test_big_board_drawn_squares_fill_but_never_form_a_line() -> None:
    # Three drawn small boards in a row must not count as a line for anyone.
    big: list[str | None] = ["draw", "draw", "draw", None, None, None, None, None, None]
    assert evaluate_grid(big) is BoardStatus.IN_PROGRESS


def test_big_board_is_a_draw_once_every_square_is_closed_without_a_line() -> None:
    big: list[str | None] = ["x", "o", "x", "draw", "draw", "o", "o", "x", "draw"]
    assert evaluate_grid(big) is BoardStatus.DRAW


def test_rejects_a_grid_that_is_not_nine_cells() -> None:
    with pytest.raises(ValueError, match="9 cells"):
        evaluate_grid([None] * 8)
