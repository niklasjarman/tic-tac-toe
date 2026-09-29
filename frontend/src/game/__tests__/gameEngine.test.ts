import { describe, expect, it } from 'vitest'
import { applyMove, createInitialState, getLegalBoards, isLegalMove } from '../gameEngine'
import type { GameState, SmallBoard } from '../types'

/** Builds a GameState with the given board overrides, for testing scenarios that
 * would otherwise require long, hard-to-verify chains of organic play. */
function makeState(overrides: {
  boards?: Record<number, SmallBoard>
  currentPlayer?: GameState['currentPlayer']
  activeBoard?: number | null
  winner?: GameState['winner']
}): GameState {
  const base = createInitialState()
  const boards = base.boards.map((board, i) => overrides.boards?.[i] ?? board)
  return {
    boards,
    currentPlayer: overrides.currentPlayer ?? base.currentPlayer,
    activeBoard: overrides.activeBoard ?? null,
    winner: overrides.winner ?? null,
  }
}

describe('createInitialState', () => {
  it('starts with X to move, all boards open, and no forced board', () => {
    const state = createInitialState()
    expect(state.currentPlayer).toBe('x')
    expect(state.activeBoard).toBeNull()
    expect(state.winner).toBeNull()
    expect(state.boards).toHaveLength(9)
    expect(state.boards.every((b) => b.status === 'in_progress')).toBe(true)
  })
})

describe('legal and illegal moves', () => {
  it('allows a legal move on an open board and switches the current player', () => {
    const state = createInitialState()
    const next = applyMove(state, 4, 0)
    expect(next).not.toBe(state)
    expect(next.boards[4].cells[0]).toBe('x')
    expect(next.currentPlayer).toBe('o')
  })

  it('rejects a move onto an already-occupied cell as a no-op', () => {
    // Center cell (4) sends the next player back into board 4 itself.
    const state = applyMove(createInitialState(), 4, 4)
    expect(state.activeBoard).toBe(4)
    const next = applyMove(state, 4, 4)
    expect(next).toBe(state)
  })

  it('rejects a move in a board other than the one the player is forced into', () => {
    const state = applyMove(createInitialState(), 4, 0) // forces next player into board 0
    expect(state.activeBoard).toBe(0)
    const illegal = applyMove(state, 1, 0)
    expect(illegal).toBe(state)
  })

  it('rejects any move once the game has already ended', () => {
    const finished = makeState({ winner: 'x' })
    expect(isLegalMove(finished, 0, 0)).toBe(false)
    expect(applyMove(finished, 0, 0)).toBe(finished)
  })
})

describe('being sent to a specific board', () => {
  it('forces the next player into the board matching the played cell position', () => {
    const state = applyMove(createInitialState(), 0, 5)
    expect(state.activeBoard).toBe(5)
    expect(getLegalBoards(state)).toEqual([5])
  })

  it('grants a free choice when a self-referential move closes the very board it would send to', () => {
    // Playing cell 0 of board 0 is self-referential (cellIndex === boardIndex),
    // and this exact move also completes X's top row, closing board 0.
    // The next player must NOT be forced back into a board that just closed.
    const almostWon: SmallBoard = {
      cells: [null, 'x', 'x', 'o', 'o', null, null, null, null],
      status: 'in_progress',
    }
    const state = makeState({ boards: { 0: almostWon }, activeBoard: 0, currentPlayer: 'x' })
    const next = applyMove(state, 0, 0)
    expect(next.boards[0].status).toBe('x')
    expect(next.activeBoard).toBeNull()
    expect(getLegalBoards(next)).not.toContain(0)
  })
})

describe('being sent to a won or full board (free move)', () => {
  it('grants a free choice of any open board when sent to an already-won board', () => {
    const wonBoard: SmallBoard = {
      cells: ['x', 'x', 'x', null, null, null, null, null, null],
      status: 'x',
    }
    const state = makeState({ boards: { 5: wonBoard }, activeBoard: 2, currentPlayer: 'x' })
    const next = applyMove(state, 2, 5) // cell index 5 -> targets board 5, which is already won
    expect(next.activeBoard).toBeNull()
    expect(getLegalBoards(next).sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 6, 7, 8])
  })

  it('grants a free choice of any open board when sent to a drawn (full) board', () => {
    const drawnBoard: SmallBoard = {
      cells: ['x', 'o', 'x', 'x', 'o', 'o', 'o', 'x', 'x'],
      status: 'draw',
    }
    const state = makeState({ boards: { 5: drawnBoard }, activeBoard: 2, currentPlayer: 'x' })
    const next = applyMove(state, 2, 5)
    expect(next.activeBoard).toBeNull()
    expect(getLegalBoards(next)).not.toContain(5)
  })
})

describe('small board outcomes', () => {
  it('closes a small board with the winner’s mark once a line completes inside it', () => {
    const almostWon: SmallBoard = {
      cells: ['x', 'x', null, 'o', 'o', null, null, null, null],
      status: 'in_progress',
    }
    const state = makeState({ boards: { 3: almostWon }, activeBoard: 3, currentPlayer: 'x' })
    const next = applyMove(state, 3, 2) // completes top row x,x,x
    expect(next.boards[3].status).toBe('x')
    expect(next.boards[3].cells).toEqual(['x', 'x', 'x', 'o', 'o', null, null, null, null])
  })

  it('closes a small board as a draw when the last move fills it with no winner', () => {
    // x o x / x o o / o x _  -> playing the last cell 'x' produces no winner, board full.
    const almostFull: SmallBoard = {
      cells: ['x', 'o', 'x', 'x', 'o', 'o', 'o', 'x', null],
      status: 'in_progress',
    }
    const state = makeState({ boards: { 6: almostFull }, activeBoard: 6, currentPlayer: 'x' })
    const next = applyMove(state, 6, 8)
    expect(next.boards[6].status).toBe('draw')
    expect(next.boards[6].cells.every((c) => c !== null)).toBe(true)
  })
})

describe('overall game outcomes', () => {
  it('declares an overall winner once that player claims three small boards in a row', () => {
    const wonByX: SmallBoard = {
      cells: ['x', 'x', 'x', null, null, null, null, null, null],
      status: 'x',
    }
    const almostWon: SmallBoard = {
      cells: ['x', 'x', null, 'o', 'o', null, null, null, null],
      status: 'in_progress',
    }
    // Boards 0 and 1 already won by X; board 2 is one move from completing X's top meta-row.
    const state = makeState({
      boards: { 0: wonByX, 1: wonByX, 2: almostWon },
      activeBoard: 2,
      currentPlayer: 'x',
    })
    const next = applyMove(state, 2, 2)
    expect(next.boards[2].status).toBe('x')
    expect(next.winner).toBe('x')
  })

  it('declares an overall draw when every small board closes with no meta-line for either player', () => {
    const drawn: SmallBoard = { cells: new Array(9).fill('x'), status: 'draw' } // content unused; status drives the result
    const almostFull: SmallBoard = {
      cells: ['x', 'o', 'x', 'x', 'o', 'o', 'o', 'x', null],
      status: 'in_progress',
    }
    const boards: Record<number, SmallBoard> = {}
    for (let i = 0; i < 8; i++) boards[i] = drawn
    boards[8] = almostFull
    const state = makeState({ boards, activeBoard: 8, currentPlayer: 'x' })
    const next = applyMove(state, 8, 8)
    expect(next.boards[8].status).toBe('draw')
    expect(next.winner).toBe('draw')
  })

  it('leaves the game in progress while boards remain open and no meta-line exists', () => {
    const state = createInitialState()
    const next = applyMove(state, 4, 4)
    expect(next.winner).toBeNull()
  })
})

describe('getLegalBoards', () => {
  it('returns every open board when the player is free to choose', () => {
    const state = createInitialState()
    expect(getLegalBoards(state)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8])
  })

  it('returns an empty list once the game has ended', () => {
    const finished = makeState({ winner: 'draw' })
    expect(getLegalBoards(finished)).toEqual([])
  })

  it('excludes closed boards from the free-choice list', () => {
    const wonBoard: SmallBoard = {
      cells: ['x', 'x', 'x', null, null, null, null, null, null],
      status: 'x',
    }
    const drawnBoard: SmallBoard = {
      cells: ['x', 'o', 'x', 'x', 'o', 'o', 'o', 'x', 'x'],
      status: 'draw',
    }
    const state = makeState({ boards: { 0: wonBoard, 1: drawnBoard }, activeBoard: null })
    const legal = getLegalBoards(state)
    expect(legal).not.toContain(0)
    expect(legal).not.toContain(1)
    expect(legal).toContain(2)
  })
})
