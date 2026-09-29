import type { GameState } from '../api/client'
import { SmallBoard } from './SmallBoard'

interface BoardProps {
  state: GameState
  locked: boolean
  onCellClick: (boardIndex: number, cellIndex: number) => void
}

export function Board({ state, locked, onCellClick }: BoardProps) {
  return (
    <div className="grid w-full max-w-2xl grid-cols-3 gap-2 rounded-lg bg-slate-300 p-2">
      {state.boards.map((cells, boardIndex) => (
        <SmallBoard
          key={boardIndex}
          cells={cells}
          status={state.board_statuses[boardIndex]}
          boardIndex={boardIndex}
          isLegal={state.legal_boards.includes(boardIndex)}
          locked={locked}
          onCellClick={(cellIndex) => onCellClick(boardIndex, cellIndex)}
        />
      ))}
    </div>
  )
}
