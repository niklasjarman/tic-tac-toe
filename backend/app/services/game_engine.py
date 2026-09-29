from app.core.errors import IllegalMoveError, MoveRefusal
from app.services.game_types import BoardStatus, Cell, Game, Player
from app.services.grid import evaluate_grid

EMPTY_BOARD: tuple[Cell, ...] = (None,) * 9


def new_game() -> Game:
    return Game(boards=(EMPTY_BOARD,) * 9, current_player=Player.X, active_board=None)


def board_statuses(game: Game) -> tuple[BoardStatus, ...]:
    return tuple(evaluate_grid(board) for board in game.boards)


def game_result(statuses: tuple[BoardStatus, ...]) -> BoardStatus:
    """The big board is the same 3x3 evaluation, with open small boards as empty squares."""
    big_board = [None if status is BoardStatus.IN_PROGRESS else status for status in statuses]
    return evaluate_grid(big_board)


def legal_boards(game: Game) -> tuple[int, ...]:
    return _legal_boards(game, board_statuses(game))


def _legal_boards(game: Game, statuses: tuple[BoardStatus, ...]) -> tuple[int, ...]:
    if game_result(statuses) is not BoardStatus.IN_PROGRESS:
        return ()
    # Being sent to a closed board means a free choice, so a forced board only counts while open.
    if game.active_board is not None and statuses[game.active_board] is BoardStatus.IN_PROGRESS:
        return (game.active_board,)
    return tuple(i for i, status in enumerate(statuses) if status is BoardStatus.IN_PROGRESS)


def _player_to_move(game: Game) -> Player | None:
    """X moves first, so X is to move when counts are equal and O when X is one ahead."""
    marks = [cell for board in game.boards for cell in board]
    x_count, o_count = marks.count(Player.X), marks.count(Player.O)
    if x_count == o_count:
        return Player.X
    if x_count == o_count + 1:
        return Player.O
    return None


def apply_move(game: Game, board_index: int, cell_index: int) -> Game:
    """Validates a move against the rules and returns the resulting game, or raises."""
    if _player_to_move(game) is not game.current_player:
        raise IllegalMoveError(
            MoveRefusal.INVALID_STATE, "The marks on the board do not match whose turn it is."
        )

    statuses = board_statuses(game)
    if game_result(statuses) is not BoardStatus.IN_PROGRESS:
        raise IllegalMoveError(MoveRefusal.GAME_OVER, "The game is already over.")
    if statuses[board_index] is not BoardStatus.IN_PROGRESS:
        raise IllegalMoveError(MoveRefusal.BOARD_CLOSED, "That small board is already closed.")
    if board_index not in _legal_boards(game, statuses):
        raise IllegalMoveError(
            MoveRefusal.WRONG_BOARD, "You must play in the small board you were sent to."
        )
    if game.boards[board_index][cell_index] is not None:
        raise IllegalMoveError(MoveRefusal.CELL_OCCUPIED, "That cell is already taken.")

    played_board = tuple(
        game.current_player if i == cell_index else cell
        for i, cell in enumerate(game.boards[board_index])
    )
    boards = tuple(
        played_board if i == board_index else board for i, board in enumerate(game.boards)
    )
    next_statuses = tuple(evaluate_grid(board) for board in boards)

    # The cell's position within its small board picks the next board, unless that board is closed.
    next_active: int | None = None
    if (
        game_result(next_statuses) is BoardStatus.IN_PROGRESS
        and next_statuses[cell_index] is BoardStatus.IN_PROGRESS
    ):
        next_active = cell_index

    next_player = Player.O if game.current_player is Player.X else Player.X
    return Game(boards=boards, current_player=next_player, active_board=next_active)
