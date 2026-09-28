import type { CellValue, Player, SmallBoardStatus } from './types'

const WINNING_LINES: readonly [number, number, number][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
]

/** Returns the winner of a 9-cell tic-tac-toe grid, or null if there isn't one yet. */
export function checkWinner(cells: readonly CellValue[]): Player | null {
  for (const [a, b, c] of WINNING_LINES) {
    const value = cells[a]
    if (value !== null && value === cells[b] && value === cells[c]) {
      return value
    }
  }
  return null
}

/** Derives a small board's status from its cells: a winner, a full-with-no-winner draw, or still in progress. */
export function deriveSmallBoardStatus(cells: readonly CellValue[]): SmallBoardStatus {
  const winner = checkWinner(cells)
  if (winner !== null) return winner
  if (cells.every((cell) => cell !== null)) return 'draw'
  return 'in_progress'
}
