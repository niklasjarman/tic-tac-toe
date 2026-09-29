import { apiClient, type GameState } from './client'

export async function fetchNewGame(): Promise<GameState> {
  const { data, response } = await apiClient.POST('/api/v1/games')
  if (!data) throw new Error(`Starting a new game failed with status ${response.status}`)
  return data
}

export interface MoveVariables {
  state: GameState
  boardIndex: number
  cellIndex: number
}

/** Returns the next state, or null when the rules refuse the move (HTTP 409). */
export async function submitMove({
  state,
  boardIndex,
  cellIndex,
}: MoveVariables): Promise<GameState | null> {
  const { data, response } = await apiClient.POST('/api/v1/games/moves', {
    body: {
      // Send only the fields the backend cannot recompute; it derives the rest itself.
      state: {
        boards: state.boards,
        current_player: state.current_player,
        active_board: state.active_board,
      },
      board_index: boardIndex,
      cell_index: cellIndex,
    },
  })
  if (data) return data
  if (response.status === 409) return null
  throw new Error(`Move failed with status ${response.status}`)
}
