import { describe, expect, it } from 'vitest'
import { checkWinner, deriveSmallBoardStatus } from '../smallBoard'
import type { CellValue } from '../types'

function cells(pattern: (CellValue | null)[]): CellValue[] {
  return pattern
}

describe('checkWinner', () => {
  it('returns null for an empty board', () => {
    expect(checkWinner(cells(new Array(9).fill(null)))).toBeNull()
  })

  it('detects a horizontal win', () => {
    expect(checkWinner(cells(['x', 'x', 'x', null, 'o', 'o', null, null, null]))).toBe('x')
  })

  it('detects a vertical win', () => {
    expect(checkWinner(cells(['o', null, null, 'o', 'x', null, 'o', 'x', null]))).toBe('o')
  })

  it('detects a diagonal win', () => {
    expect(checkWinner(cells(['x', 'o', null, 'o', 'x', null, null, null, 'x']))).toBe('x')
  })

  it('returns null when the board is full with no winner', () => {
    expect(checkWinner(cells(['x', 'o', 'x', 'x', 'o', 'o', 'o', 'x', 'x']))).toBeNull()
  })
})

describe('deriveSmallBoardStatus', () => {
  it('is in_progress when the board is empty', () => {
    expect(deriveSmallBoardStatus(cells(new Array(9).fill(null)))).toBe('in_progress')
  })

  it('is in_progress when partially filled with no winner', () => {
    expect(
      deriveSmallBoardStatus(cells(['x', null, null, null, 'o', null, null, null, null])),
    ).toBe('in_progress')
  })

  it('is the winner when three in a row are claimed', () => {
    expect(deriveSmallBoardStatus(cells(['x', 'x', 'x', null, null, null, null, null, null]))).toBe(
      'x',
    )
  })

  it('is draw when the board fills up with no winner', () => {
    expect(deriveSmallBoardStatus(cells(['x', 'o', 'x', 'x', 'o', 'o', 'o', 'x', 'x']))).toBe(
      'draw',
    )
  })
})
