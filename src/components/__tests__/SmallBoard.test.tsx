import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { SmallBoard as SmallBoardModel } from '../../game/types'
import { SmallBoard } from '../SmallBoard'

describe('SmallBoard', () => {
  it('marks the board as the player’s move in its accessible name when legal', () => {
    const openBoard: SmallBoardModel = { cells: new Array(9).fill(null), status: 'in_progress' }
    render(<SmallBoard board={openBoard} boardIndex={0} isLegal={true} onCellClick={vi.fn()} />)
    expect(screen.getByRole('group', { name: 'Small board 1, your move' })).toBeInTheDocument()
  })

  it('shows a Draw overlay and disables every cell once the board is full with no winner', () => {
    const drawnBoard: SmallBoardModel = {
      cells: ['x', 'o', 'x', 'x', 'o', 'o', 'o', 'x', 'x'],
      status: 'draw',
    }
    render(<SmallBoard board={drawnBoard} boardIndex={0} isLegal={false} onCellClick={vi.fn()} />)
    expect(screen.getByText('Draw')).toBeInTheDocument()
    for (const button of screen.getAllByRole('button')) {
      expect(button).toBeDisabled()
    }
  })

  it('shows a large mark overlay once a player wins the board', () => {
    const wonBoard: SmallBoardModel = {
      cells: ['x', 'x', 'x', null, null, null, null, null, null],
      status: 'x',
    }
    render(<SmallBoard board={wonBoard} boardIndex={0} isLegal={false} onCellClick={vi.fn()} />)
    expect(screen.getByText('X', { selector: 'span.text-6xl' })).toBeInTheDocument()
  })

  it('shows an O overlay when O wins the board', () => {
    const wonBoard: SmallBoardModel = {
      cells: ['o', 'o', 'o', null, null, null, null, null, null],
      status: 'o',
    }
    render(<SmallBoard board={wonBoard} boardIndex={0} isLegal={false} onCellClick={vi.fn()} />)
    expect(screen.getByText('O', { selector: 'span.text-6xl' })).toBeInTheDocument()
  })
})
