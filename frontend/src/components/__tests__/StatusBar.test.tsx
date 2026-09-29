import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { gameState } from '../../test/fixtures'
import { StatusBar } from '../StatusBar'

describe('StatusBar', () => {
  it("shows X's turn at the start of a new game", () => {
    render(<StatusBar state={gameState()} />)
    expect(screen.getByRole('status')).toHaveTextContent("X's turn")
  })

  it("shows O's turn after O becomes the current player", () => {
    render(<StatusBar state={gameState({ current_player: 'o' })} />)
    expect(screen.getByRole('status')).toHaveTextContent("O's turn")
  })

  it('shows a win message when X has won', () => {
    render(<StatusBar state={gameState({ winner: 'x' })} />)
    expect(screen.getByRole('status')).toHaveTextContent('X wins!')
  })

  it('shows a win message when O has won', () => {
    render(<StatusBar state={gameState({ winner: 'o' })} />)
    expect(screen.getByRole('status')).toHaveTextContent('O wins!')
  })

  it('shows a draw message when the game ends in a draw', () => {
    render(<StatusBar state={gameState({ winner: 'draw' })} />)
    expect(screen.getByRole('status')).toHaveTextContent("It's a draw!")
  })
})
