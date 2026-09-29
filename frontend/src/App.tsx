import { useState } from 'react'
import { Board } from './components/Board'
import { NewGameButton } from './components/NewGameButton'
import { StatusBar } from './components/StatusBar'
import { applyMove, createInitialState, getLegalBoards } from './game/gameEngine'

function App() {
  const [state, setState] = useState(createInitialState)

  function handleCellClick(boardIndex: number, cellIndex: number) {
    setState((current) => applyMove(current, boardIndex, cellIndex))
  }

  function handleNewGame() {
    setState(createInitialState())
  }

  return (
    <div className="flex min-h-screen flex-col items-center gap-4 bg-slate-100 p-4 sm:p-8">
      <h1 className="text-2xl font-bold text-slate-800">Ultimate Tic-Tac-Toe</h1>
      <StatusBar state={state} />
      <Board state={state} legalBoards={getLegalBoards(state)} onCellClick={handleCellClick} />
      <NewGameButton onClick={handleNewGame} />
    </div>
  )
}

export default App
