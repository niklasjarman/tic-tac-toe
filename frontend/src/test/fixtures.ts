import type { GameState, Player } from '../api/client'

/** A server response for a fresh game, with optional overrides for specific scenarios. */
export function gameState(overrides: Partial<GameState> = {}): GameState {
  return {
    boards: Array.from({ length: 9 }, () => Array(9).fill(null)),
    current_player: 'x',
    active_board: null,
    board_statuses: Array(9).fill('in_progress'),
    winner: null,
    legal_boards: [0, 1, 2, 3, 4, 5, 6, 7, 8],
    ...overrides,
  }
}

export function withMark(
  state: GameState,
  boardIndex: number,
  cellIndex: number,
  player: Player,
): GameState['boards'] {
  return state.boards.map((cells, b) =>
    b === boardIndex ? cells.map((cell, c) => (c === cellIndex ? player : cell)) : cells,
  )
}
