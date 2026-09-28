import type { GameState } from '../game/types'
import { SmallBoard } from './SmallBoard'

interface BoardProps {
  state: GameState
  legalBoards: number[]
  onCellClick: (boardIndex: number, cellIndex: number) => void
}

export function Board({ state, legalBoards, onCellClick }: BoardProps) {
  return (
    <div className="grid w-full max-w-2xl grid-cols-3 gap-2 rounded-lg bg-slate-300 p-2">
      {state.boards.map((board, boardIndex) => (
        <SmallBoard
          key={boardIndex}
          board={board}
          boardIndex={boardIndex}
          isLegal={legalBoards.includes(boardIndex)}
          onCellClick={(cellIndex) => onCellClick(boardIndex, cellIndex)}
        />
      ))}
    </div>
  )
}
