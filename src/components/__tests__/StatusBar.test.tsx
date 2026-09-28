import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../game/gameEngine'
import type { GameState } from '../../game/types'
import { StatusBar } from '../StatusBar'

describe('StatusBar', () => {
  it("shows X's turn at the start of a new game", () => {
    render(<StatusBar state={createInitialState()} />)
    expect(screen.getByRole('status')).toHaveTextContent("X's turn")
  })

  it("shows O's turn after O becomes the current player", () => {
    const state: GameState = { ...createInitialState(), currentPlayer: 'o' }
    render(<StatusBar state={state} />)
    expect(screen.getByRole('status')).toHaveTextContent("O's turn")
  })

  it('shows a win message when X has won', () => {
    const state: GameState = { ...createInitialState(), winner: 'x' }
    render(<StatusBar state={state} />)
    expect(screen.getByRole('status')).toHaveTextContent('X wins!')
  })

  it('shows a win message when O has won', () => {
    const state: GameState = { ...createInitialState(), winner: 'o' }
    render(<StatusBar state={state} />)
    expect(screen.getByRole('status')).toHaveTextContent('O wins!')
  })

  it('shows a draw message when the game ends in a draw', () => {
    const state: GameState = { ...createInitialState(), winner: 'draw' }
    render(<StatusBar state={state} />)
    expect(screen.getByRole('status')).toHaveTextContent("It's a draw!")
  })
})
