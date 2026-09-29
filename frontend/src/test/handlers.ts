import { http, HttpResponse } from 'msw'
import type { GameState } from '../api/client'
import { gameState } from './fixtures'

export const NEW_GAME_URL = '*/api/v1/games'
export const MOVES_URL = '*/api/v1/games/moves'

export const newGameReturns = (state: GameState = gameState()) =>
  http.post(NEW_GAME_URL, () => HttpResponse.json(state))

export const moveReturns = (state: GameState) =>
  http.post(MOVES_URL, () => HttpResponse.json(state))

export const moveRefused = () =>
  http.post(MOVES_URL, () =>
    HttpResponse.json(
      { code: 'cell_occupied', detail: 'That cell is already taken.' },
      { status: 409 },
    ),
  )

export const networkFailure = (url: string) => http.post(url, () => HttpResponse.error())

export const serverError = (url: string) =>
  http.post(url, () =>
    HttpResponse.json({ code: 'http_error', detail: 'Internal Server Error' }, { status: 500 }),
  )

// Defaults: new games succeed; moves are refused unless a test says otherwise.
export const handlers = [newGameReturns(), moveRefused()]
