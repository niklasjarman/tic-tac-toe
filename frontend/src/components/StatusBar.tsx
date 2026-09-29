import type { GameState } from '../api/client'

function describeStatus(state: GameState): string {
  if (state.winner === 'draw') return "It's a draw!"
  if (state.winner === 'x') return 'X wins!'
  if (state.winner === 'o') return 'O wins!'
  return `${state.current_player.toUpperCase()}'s turn`
}

export function StatusBar({ state }: { state: GameState }) {
  const isGameOver = state.winner !== null

  return (
    <div
      role="status"
      aria-live="polite"
      className={`w-full max-w-2xl rounded-md p-4 text-center text-xl font-semibold ${
        isGameOver ? 'bg-slate-800 text-white' : 'bg-white text-slate-800'
      }`}
    >
      {describeStatus(state)}
    </div>
  )
}
