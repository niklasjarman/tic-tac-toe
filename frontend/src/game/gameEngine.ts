import { checkWinner, deriveSmallBoardStatus } from './smallBoard'
import type { CellValue, GameState, Player, SmallBoard } from './types'

function createEmptySmallBoard(): SmallBoard {
  return { cells: new Array<CellValue>(9).fill(null), status: 'in_progress' }
}

export function createInitialState(): GameState {
  return {
    boards: Array.from({ length: 9 }, createEmptySmallBoard),
    currentPlayer: 'x',
    activeBoard: null,
    winner: null,
  }
}

/** Boards a player may currently choose from: the forced board, or every open board if free to choose. */
export function getLegalBoards(state: GameState): number[] {
  if (state.winner !== null) return []
  if (state.activeBoard !== null) return [state.activeBoard]
  return state.boards
    .map((board, index) => (board.status === 'in_progress' ? index : -1))
    .filter((index) => index !== -1)
}

export function isLegalMove(state: GameState, boardIndex: number, cellIndex: number): boolean {
  if (state.winner !== null) return false
  if (!getLegalBoards(state).includes(boardIndex)) return false
  return state.boards[boardIndex].cells[cellIndex] === null
}

function otherPlayer(player: Player): Player {
  return player === 'x' ? 'o' : 'x'
}

/**
 * Applies a move and returns the resulting state. Illegal moves are no-ops:
 * the same state reference is returned so callers can detect "nothing happened" with `===`.
 */
export function applyMove(state: GameState, boardIndex: number, cellIndex: number): GameState {
  if (!isLegalMove(state, boardIndex, cellIndex)) return state

  const boards = state.boards.map((board, index) => {
    if (index !== boardIndex) return board
    const cells = board.cells.map((cell, i) => (i === cellIndex ? state.currentPlayer : cell))
    return { cells, status: deriveSmallBoardStatus(cells) }
  })

  const metaCells = boards.map((board): CellValue =>
    board.status === 'x' || board.status === 'o' ? board.status : null,
  )
  const metaWinner = checkWinner(metaCells)
  const boardsRemain = boards.some((board) => board.status === 'in_progress')

  const winner: GameState['winner'] = metaWinner ?? (boardsRemain ? null : 'draw')

  // The cell position within its small board determines which board comes next.
  const targetBoard = boards[cellIndex]
  const nextActiveBoard = targetBoard.status === 'in_progress' ? cellIndex : null

  return {
    boards,
    currentPlayer: otherPlayer(state.currentPlayer),
    activeBoard: winner === null ? nextActiveBoard : null,
    winner,
  }
}
