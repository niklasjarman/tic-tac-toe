import createClient from 'openapi-fetch'
import type { components, paths } from './schema'

export type GameState = components['schemas']['GameStateResponse']
export type Player = components['schemas']['Player']
export type BoardStatus = components['schemas']['BoardStatus']
export type Cell = Player | null

export const apiClient = createClient<paths>({
  baseUrl: window.location.origin,
  // Resolve fetch per request rather than capturing it at import, so request mocks
  // installed after this module loads (MSW in tests) still intercept calls.
  fetch: (request) => globalThis.fetch(request),
})
