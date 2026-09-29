import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { GameState } from './api/client'
import { fetchNewGame, submitMove } from './api/game'
import { Board } from './components/Board'
import { NewGameButton } from './components/NewGameButton'
import { StatusBar } from './components/StatusBar'

const GAME_QUERY_KEY = ['game'] as const
const SERVER_ERROR_MESSAGE = "Couldn't reach the game server. Please try again."

function App() {
  const queryClient = useQueryClient()
  const game = useQuery({
    queryKey: GAME_QUERY_KEY,
    queryFn: fetchNewGame,
    // The game lives only in this cache; refetching on its own would silently reset it.
    staleTime: Infinity,
    retry: false,
  })
  const move = useMutation({
    mutationFn: submitMove,
    onSuccess: (next) => {
      if (next) queryClient.setQueryData<GameState>(GAME_QUERY_KEY, next)
    },
  })

  function handleNewGame() {
    move.reset()
    void game.refetch()
  }

  if (game.data === undefined) {
    return (
      <Page>
        {game.isError ? (
          <div role="alert" className="flex flex-col items-center gap-3 text-slate-700">
            <p>{SERVER_ERROR_MESSAGE}</p>
            <button
              type="button"
              onClick={() => void game.refetch()}
              className="rounded-md bg-slate-800 px-6 py-2 font-semibold text-white transition-colors hover:bg-slate-700"
            >
              Retry
            </button>
          </div>
        ) : (
          <p role="status" className="text-slate-500">
            Loading game…
          </p>
        )}
      </Page>
    )
  }

  const state = game.data
  const requestFailed = move.isError || game.isError

  return (
    <Page>
      <StatusBar state={state} />
      {requestFailed && (
        <p
          role="alert"
          className="w-full max-w-2xl rounded-md bg-red-100 p-3 text-center text-red-800"
        >
          {SERVER_ERROR_MESSAGE}
        </p>
      )}
      <Board
        state={state}
        locked={move.isPending}
        onCellClick={(boardIndex, cellIndex) => move.mutate({ state, boardIndex, cellIndex })}
      />
      <NewGameButton onClick={handleNewGame} />
    </Page>
  )
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center gap-4 bg-slate-100 p-4 sm:p-8">
      <h1 className="text-2xl font-bold text-slate-800">Ultimate Tic-Tac-Toe</h1>
      {children}
    </div>
  )
}

export default App
