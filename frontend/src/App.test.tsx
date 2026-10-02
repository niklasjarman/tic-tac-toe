import { focusManager } from '@tanstack/react-query'
import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import App from './App'
import { gameState, withMark } from './test/fixtures'
import {
  MOVES_URL,
  NEW_GAME_URL,
  moveReturns,
  networkFailure,
  newGameReturns,
  serverError,
} from './test/handlers'
import { renderWithQueryClient } from './test/render'
import { server } from './test/server'

function cell(boardNumber: number, description: string) {
  return screen.getByRole('button', { name: `Board ${boardNumber}, ${description} cell` })
}

const SERVER_ERROR = "Couldn't reach the game server. Please try again."

/** The backend's answer after X opens the game at the given board and cell. */
function stateAfterXPlays(boardIndex: number, cellIndex: number) {
  return gameState({
    boards: withMark(gameState(), boardIndex, cellIndex, 'x'),
    current_player: 'o',
    active_board: cellIndex,
    legal_boards: [cellIndex],
  })
}

async function renderLoadedApp() {
  renderWithQueryClient(<App />)
  expect(await screen.findByText("X's turn")).toBeInTheDocument()
}

describe('App', () => {
  it('shows a loading state, then a board where every small board is playable', async () => {
    renderWithQueryClient(<App />)
    expect(screen.getByText('Loading game…')).toBeInTheDocument()
    expect(await screen.findByText("X's turn")).toBeInTheDocument()
    for (let boardNumber = 1; boardNumber <= 9; boardNumber++) {
      expect(cell(boardNumber, 'top left')).toBeEnabled()
    }
  })

  it('shows an error with a working retry when the game cannot be loaded', async () => {
    server.use(networkFailure(NEW_GAME_URL))
    const user = userEvent.setup()
    renderWithQueryClient(<App />)

    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't reach the game server.")

    server.resetHandlers()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByText("X's turn")).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('sends the move to the backend and renders the state it returns', async () => {
    const fresh = gameState()
    const afterMove = gameState({
      boards: withMark(fresh, 4, 4, 'x'),
      current_player: 'o',
      active_board: 4,
      legal_boards: [4],
    })
    let sentBody: unknown
    server.use(
      http.post(MOVES_URL, async ({ request }) => {
        sentBody = await request.json()
        return HttpResponse.json(afterMove)
      }),
    )
    const user = userEvent.setup()
    await renderLoadedApp()

    await user.click(cell(5, 'middle center'))

    expect(await screen.findByText("O's turn")).toBeInTheDocument()
    expect(cell(5, 'middle center')).toHaveTextContent('X')
    expect(cell(5, 'middle center')).toBeDisabled()
    expect(cell(5, 'top left')).toBeEnabled()
    expect(cell(1, 'top left')).toBeDisabled()
    expect(sentBody).toEqual({
      state: { boards: fresh.boards, current_player: 'x', active_board: null },
      board_index: 4,
      cell_index: 4,
    })
  })

  it('does nothing when the backend refuses a move as illegal', async () => {
    let requests = 0
    server.use(
      http.post(MOVES_URL, () => {
        requests += 1
        return HttpResponse.json(
          { code: 'wrong_board', detail: 'You must play in the small board you were sent to.' },
          { status: 409 },
        )
      }),
    )
    const user = userEvent.setup()
    await renderLoadedApp()

    await user.click(cell(1, 'top left'))

    await waitFor(() => expect(requests).toBe(1))
    await waitFor(() => expect(cell(1, 'top left')).toBeEnabled())
    expect(cell(1, 'top left')).toHaveTextContent('')
    expect(screen.getByRole('status')).toHaveTextContent("X's turn")
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows a message instead of breaking when a move request fails', async () => {
    server.use(networkFailure(MOVES_URL))
    const user = userEvent.setup()
    await renderLoadedApp()

    await user.click(cell(1, 'top left'))

    expect(await screen.findByRole('alert')).toHaveTextContent(SERVER_ERROR)
    expect(screen.getByRole('status')).toHaveTextContent("X's turn")
    expect(cell(1, 'top left')).toBeEnabled()
  })

  it('shows the result when the backend reports a win, and New Game resets the board', async () => {
    const fresh = gameState()
    server.use(
      moveReturns(
        gameState({
          boards: withMark(fresh, 0, 0, 'x'),
          current_player: 'o',
          board_statuses: [
            'x',
            'x',
            'x',
            'in_progress',
            'in_progress',
            'in_progress',
            'in_progress',
            'in_progress',
            'in_progress',
          ],
          winner: 'x',
          legal_boards: [],
        }),
      ),
    )
    const user = userEvent.setup()
    await renderLoadedApp()

    await user.click(cell(4, 'top left'))

    expect(await screen.findByText('X wins!')).toBeInTheDocument()
    expect(cell(4, 'top left')).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'New Game' }))
    expect(await screen.findByText("X's turn")).toBeInTheDocument()
    expect(cell(4, 'top left')).toBeEnabled()
  })

  it('shows a message when the backend answers a move with a server error', async () => {
    server.use(serverError(MOVES_URL))
    const user = userEvent.setup()
    await renderLoadedApp()

    await user.click(cell(1, 'top left'))

    expect(await screen.findByRole('alert')).toHaveTextContent(SERVER_ERROR)
    expect(cell(1, 'top left')).toHaveTextContent('')
  })

  it('locks the board while a move is being sent, so a double-click sends one move', async () => {
    let requests = 0
    let releaseResponse = () => {}
    const responseGate = new Promise<void>((resolve) => {
      releaseResponse = resolve
    })
    server.use(
      http.post(MOVES_URL, async () => {
        requests += 1
        await responseGate
        return HttpResponse.json(stateAfterXPlays(4, 4))
      }),
    )
    const user = userEvent.setup()
    await renderLoadedApp()

    await user.click(cell(5, 'middle center'))
    await waitFor(() => expect(cell(5, 'top left')).toBeDisabled())
    await user.click(cell(5, 'top left'))
    expect(requests).toBe(1)

    releaseResponse()
    expect(await screen.findByText("O's turn")).toBeInTheDocument()
    expect(requests).toBe(1)
  })

  it('keeps the game when the player switches tabs and comes back', async () => {
    let newGameRequests = 0
    server.use(
      http.post(NEW_GAME_URL, () => {
        newGameRequests += 1
        return HttpResponse.json(gameState())
      }),
      moveReturns(stateAfterXPlays(4, 4)),
    )
    const user = userEvent.setup()
    await renderLoadedApp()
    await user.click(cell(5, 'middle center'))
    expect(await screen.findByText("O's turn")).toBeInTheDocument()

    try {
      act(() => {
        focusManager.setFocused(false)
        focusManager.setFocused(true)
      })
      // Give a refetch, if one were triggered, time to land.
      await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
    } finally {
      focusManager.setFocused(undefined)
    }

    expect(newGameRequests).toBe(1)
    expect(cell(5, 'middle center')).toHaveTextContent('X')
    expect(screen.getByRole('status')).toHaveTextContent("O's turn")
  })

  it('clears a failed-move message when starting a new game', async () => {
    server.use(networkFailure(MOVES_URL))
    const user = userEvent.setup()
    await renderLoadedApp()
    await user.click(cell(1, 'top left'))
    expect(await screen.findByRole('alert')).toHaveTextContent(SERVER_ERROR)

    await user.click(screen.getByRole('button', { name: 'New Game' }))

    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
    expect(screen.getByRole('status')).toHaveTextContent("X's turn")
  })

  it('can be played with the keyboard alone', async () => {
    let sentBody: unknown
    server.use(
      http.post(MOVES_URL, async ({ request }) => {
        sentBody = await request.json()
        return HttpResponse.json(stateAfterXPlays(0, 0))
      }),
    )
    const user = userEvent.setup()
    await renderLoadedApp()

    await user.tab()
    expect(cell(1, 'top left')).toHaveFocus()
    await user.keyboard('{Enter}')

    expect(await screen.findByText("O's turn")).toBeInTheDocument()
    expect(sentBody).toMatchObject({ board_index: 0, cell_index: 0 })
  })

  it('keeps the board and shows a message when starting a new game fails', async () => {
    const user = userEvent.setup()
    await renderLoadedApp()
    server.use(serverError(NEW_GAME_URL))

    await user.click(screen.getByRole('button', { name: 'New Game' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(SERVER_ERROR)
    expect(screen.getByRole('status')).toHaveTextContent("X's turn")

    server.use(newGameReturns())
    await user.click(screen.getByRole('button', { name: 'New Game' }))
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
  })
})
