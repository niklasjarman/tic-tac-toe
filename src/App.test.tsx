import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'

function getCell(boardNumber: number, description: string) {
  return screen.getByRole('button', { name: `Board ${boardNumber}, ${description} cell` })
}

describe('App', () => {
  it('shows a populated board with every small board playable at the start', () => {
    render(<App />)
    expect(screen.getByRole('status')).toHaveTextContent("X's turn")
    for (let boardNumber = 1; boardNumber <= 9; boardNumber++) {
      expect(getCell(boardNumber, 'top left')).toBeEnabled()
    }
  })

  it('places a mark, switches turns, and confines the next move to the forced board', async () => {
    const user = userEvent.setup()
    render(<App />)

    // X plays the center cell of board 5 (center), which forces O into board 5.
    await user.click(getCell(5, 'middle center'))
    expect(getCell(5, 'middle center')).toHaveTextContent('X')
    expect(screen.getByRole('status')).toHaveTextContent("O's turn")

    // Board 5 is now the only legal board; every other board's cells are disabled.
    expect(getCell(5, 'top left')).toBeEnabled()
    expect(getCell(1, 'top left')).toBeDisabled()
  })

  it('does nothing when clicking a cell outside the forced board', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(getCell(5, 'middle center')) // forces next player into board 5
    const before = screen.getByRole('status').textContent

    // Board 1 is disabled, so this click must be a no-op (no mark placed, no turn change).
    await user.click(getCell(1, 'top left'))
    expect(getCell(1, 'top left')).toHaveTextContent('')
    expect(screen.getByRole('status').textContent).toBe(before)
  })

  it('declares a winner and lets New Game reset the board', async () => {
    const user = userEvent.setup()
    render(<App />)

    // Same forced-move trace verified in gameEngine.test.ts: X wins small board 0,
    // which is not enough to win the whole game, but proves win detection reaches the UI.
    const moves: [number, string][] = [
      [1, 'top left'],
      [1, 'middle left'],
      [4, 'top center'],
      [2, 'top left'],
      [1, 'top center'],
      [2, 'top right'],
      [3, 'top right'],
      [3, 'top left'],
      [1, 'top right'],
    ]
    for (const [board, cell] of moves) {
      await user.click(getCell(board, cell))
    }

    expect(getCell(1, 'top left')).toBeDisabled()
    expect(getCell(1, 'top center')).toBeDisabled()
    expect(getCell(1, 'top right')).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'New Game' }))
    expect(screen.getByRole('status')).toHaveTextContent("X's turn")
    expect(getCell(1, 'top left')).toBeEnabled()
    expect(getCell(1, 'top left')).toHaveTextContent('')
  })
})
