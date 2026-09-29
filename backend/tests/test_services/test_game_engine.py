import pytest

from app.core.errors import IllegalMoveError, MoveRefusal
from app.services.game_engine import (
    apply_move,
    board_statuses,
    game_result,
    legal_boards,
    new_game,
)
from app.services.game_types import BoardStatus, Cell, Game, Player

# Small boards as 9-character strings, row-major; "." is an empty cell.
X_WON = "xxxoo...."  # 3 x, 2 o
DRAWN_A = "xoxxoooxx"  # full, no line: 5 x, 4 o
DRAWN_B = "oxooxxxoo"  # full, no line: 4 x, 5 o
TWO_O = "oo......."  # used only to balance mark counts so the turn is consistent


def grid(pattern: str) -> tuple[Cell, ...]:
    return tuple(None if c == "." else Player(c) for c in pattern)


def make_game(
    boards: dict[int, str] | None = None,
    current_player: Player = Player.X,
    active_board: int | None = None,
) -> Game:
    patterns = boards or {}
    return Game(
        boards=tuple(grid(patterns.get(i, "." * 9)) for i in range(9)),
        current_player=current_player,
        active_board=active_board,
    )


def refusal_code(game: Game, board_index: int, cell_index: int) -> MoveRefusal:
    with pytest.raises(IllegalMoveError) as excinfo:
        apply_move(game, board_index, cell_index)
    return excinfo.value.code


class TestNewGame:
    def test_starts_with_x_to_move_all_boards_open_and_no_forced_board(self) -> None:
        game = new_game()
        assert game.current_player is Player.X
        assert game.active_board is None
        assert all(status is BoardStatus.IN_PROGRESS for status in board_statuses(game))
        assert legal_boards(game) == (0, 1, 2, 3, 4, 5, 6, 7, 8)


class TestLegalAndIllegalMoves:
    def test_legal_move_places_the_mark_and_switches_player(self) -> None:
        game = apply_move(new_game(), 4, 0)
        assert game.boards[4][0] is Player.X
        assert game.current_player is Player.O

    def test_move_onto_an_occupied_cell_is_refused(self) -> None:
        # Center cell of the center board sends the next player back into board 4.
        game = apply_move(new_game(), 4, 4)
        assert game.active_board == 4
        assert refusal_code(game, 4, 4) is MoveRefusal.CELL_OCCUPIED

    def test_move_outside_the_forced_board_is_refused(self) -> None:
        game = apply_move(new_game(), 4, 0)  # sends O to board 0
        assert game.active_board == 0
        assert refusal_code(game, 1, 0) is MoveRefusal.WRONG_BOARD

    def test_any_move_after_the_game_is_over_is_refused(self) -> None:
        finished = make_game({0: X_WON, 1: X_WON, 2: X_WON, 4: TWO_O}, current_player=Player.O)
        assert refusal_code(finished, 5, 0) is MoveRefusal.GAME_OVER
        assert legal_boards(finished) == ()

    def test_move_into_a_closed_board_is_refused_even_with_empty_cells(self) -> None:
        game = make_game({5: X_WON}, current_player=Player.O)
        assert refusal_code(game, 5, 5) is MoveRefusal.BOARD_CLOSED

    def test_state_whose_turn_does_not_match_the_marks_is_refused(self) -> None:
        game = make_game(current_player=Player.O)  # empty board, so it must be X's turn
        assert refusal_code(game, 4, 4) is MoveRefusal.INVALID_STATE

    def test_state_with_impossible_mark_counts_is_refused(self) -> None:
        game = make_game({0: "xx......."}, current_player=Player.O)  # X two ahead of O
        assert refusal_code(game, 4, 4) is MoveRefusal.INVALID_STATE


class TestBeingSentToASpecificBoard:
    def test_played_cell_position_forces_the_next_board(self) -> None:
        game = apply_move(new_game(), 0, 5)
        assert game.active_board == 5
        assert legal_boards(game) == (5,)

    def test_self_referential_move_that_closes_its_board_grants_a_free_choice(self) -> None:
        # Cell 0 of board 0 would send O back to board 0, but this move also wins board 0.
        game = make_game({0: ".xxoo...."}, active_board=0)
        after = apply_move(game, 0, 0)
        assert board_statuses(after)[0] is BoardStatus.X
        assert after.active_board is None
        assert 0 not in legal_boards(after)


class TestBeingSentToAClosedBoard:
    def test_sent_to_a_won_board_grants_a_free_choice(self) -> None:
        game = make_game({5: X_WON}, current_player=Player.O, active_board=2)
        after = apply_move(game, 2, 5)  # cell 5 targets board 5, already won
        assert after.active_board is None
        assert legal_boards(after) == (0, 1, 2, 3, 4, 6, 7, 8)

    def test_sent_to_a_drawn_board_grants_a_free_choice(self) -> None:
        game = make_game({5: DRAWN_A}, current_player=Player.O, active_board=2)
        after = apply_move(game, 2, 5)
        assert after.active_board is None
        assert 5 not in legal_boards(after)

    def test_forced_board_that_is_already_closed_is_treated_as_a_free_choice(self) -> None:
        game = make_game({5: X_WON}, current_player=Player.O, active_board=5)
        assert legal_boards(game) == (0, 1, 2, 3, 4, 6, 7, 8)


class TestSmallBoardOutcomes:
    def test_completing_a_line_wins_the_small_board(self) -> None:
        game = make_game({3: "xx.oo...."}, active_board=3)
        after = apply_move(game, 3, 2)
        assert board_statuses(after)[3] is BoardStatus.X
        assert after.boards[3] == grid("xxxoo....")

    def test_filling_a_board_with_no_line_draws_it(self) -> None:
        game = make_game({6: "xoxxooox."}, active_board=6)
        after = apply_move(game, 6, 8)
        assert board_statuses(after)[6] is BoardStatus.DRAW
        assert all(cell is not None for cell in after.boards[6])


class TestOverallOutcomes:
    def test_three_small_boards_in_a_row_wins_the_game(self) -> None:
        # Boards 0 and 1 already won by X; board 2 is one move from X's top row.
        game = make_game({0: X_WON, 1: X_WON, 2: "xx.oo....", 4: TWO_O}, active_board=2)
        after = apply_move(game, 2, 2)
        assert board_statuses(after)[2] is BoardStatus.X
        assert game_result(board_statuses(after)) is BoardStatus.X
        assert after.active_board is None

    def test_every_board_closed_with_no_line_is_an_overall_draw(self) -> None:
        boards = {i: DRAWN_A if i % 2 == 0 else DRAWN_B for i in range(8)}
        boards[8] = "xoxxooox."
        game = make_game(boards, active_board=8)
        after = apply_move(game, 8, 8)
        assert board_statuses(after)[8] is BoardStatus.DRAW
        assert game_result(board_statuses(after)) is BoardStatus.DRAW
        assert legal_boards(after) == ()

    def test_game_continues_while_boards_remain_open_and_no_line_exists(self) -> None:
        after = apply_move(new_game(), 4, 4)
        assert game_result(board_statuses(after)) is BoardStatus.IN_PROGRESS


class TestLegalBoards:
    def test_free_choice_excludes_closed_boards(self) -> None:
        game = make_game({0: X_WON, 1: DRAWN_A, 4: TWO_O})
        legal = legal_boards(game)
        assert 0 not in legal
        assert 1 not in legal
        assert 2 in legal
