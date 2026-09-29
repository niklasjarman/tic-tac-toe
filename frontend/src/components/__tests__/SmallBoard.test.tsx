import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Cell } from '../../api/client'
import { SmallBoard } from '../SmallBoard'

const EMPTY: Cell[] = Array(9).fill(null)

describe('SmallBoard', () => {
  it('marks the board as the player’s move in its accessible name when legal', () => {
    render(
      <SmallBoard
        cells={EMPTY}
        status="in_progress"
        boardIndex={0}
        isLegal={true}
        locked={false}
        onCellClick={vi.fn()}
      />,
    )
    expect(screen.getByRole('group', { name: 'Small board 1, your move' })).toBeInTheDocument()
  })

  it('disables every cell of a legal board while a move is being sent', () => {
    render(
      <SmallBoard
        cells={EMPTY}
        status="in_progress"
        boardIndex={0}
        isLegal={true}
        locked={true}
        onCellClick={vi.fn()}
      />,
    )
    for (const button of screen.getAllByRole('button')) {
      expect(button).toBeDisabled()
    }
  })

  it('shows a Draw overlay and disables every cell once the board is full with no winner', () => {
    render(
      <SmallBoard
        cells={['x', 'o', 'x', 'x', 'o', 'o', 'o', 'x', 'x']}
        status="draw"
        boardIndex={0}
        isLegal={false}
        locked={false}
        onCellClick={vi.fn()}
      />,
    )
    expect(screen.getByText('Draw')).toBeInTheDocument()
    for (const button of screen.getAllByRole('button')) {
      expect(button).toBeDisabled()
    }
  })

  it('shows a large mark overlay once a player wins the board', () => {
    render(
      <SmallBoard
        cells={['x', 'x', 'x', null, null, null, null, null, null]}
        status="x"
        boardIndex={0}
        isLegal={false}
        locked={false}
        onCellClick={vi.fn()}
      />,
    )
    expect(screen.getByText('X', { selector: 'span.text-6xl' })).toBeInTheDocument()
  })

  it('shows an O overlay when O wins the board', () => {
    render(
      <SmallBoard
        cells={['o', 'o', 'o', null, null, null, null, null, null]}
        status="o"
        boardIndex={0}
        isLegal={false}
        locked={false}
        onCellClick={vi.fn()}
      />,
    )
    expect(screen.getByText('O', { selector: 'span.text-6xl' })).toBeInTheDocument()
  })
})
