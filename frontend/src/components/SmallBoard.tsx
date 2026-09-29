import type { SmallBoard as SmallBoardModel } from '../game/types'
import { Cell } from './Cell'

interface SmallBoardProps {
  board: SmallBoardModel
  boardIndex: number
  isLegal: boolean
  onCellClick: (cellIndex: number) => void
}

const ROW_LABELS = ['top', 'middle', 'bottom']
const COL_LABELS = ['left', 'center', 'right']

export function SmallBoard({ board, boardIndex, isLegal, onCellClick }: SmallBoardProps) {
  const isClosed = board.status !== 'in_progress'

  return (
    <div
      role="group"
      aria-label={`Small board ${boardIndex + 1}${isLegal ? ', your move' : ''}`}
      className={`relative grid grid-cols-3 gap-1 rounded-md p-1 transition-opacity ${
        isLegal ? 'bg-board-active ring-2 ring-player-x' : 'bg-slate-200'
      } ${isClosed && !isLegal ? 'opacity-60' : ''}`}
    >
      {board.cells.map((value, cellIndex) => (
        <Cell
          key={cellIndex}
          value={value}
          disabled={!isLegal || isClosed}
          onClick={() => onCellClick(cellIndex)}
          label={`Board ${boardIndex + 1}, ${ROW_LABELS[Math.floor(cellIndex / 3)]} ${COL_LABELS[cellIndex % 3]} cell`}
        />
      ))}

      {board.status === 'x' && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-6xl font-bold text-player-x">
          X
        </span>
      )}
      {board.status === 'o' && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-6xl font-bold text-player-o">
          O
        </span>
      )}
      {board.status === 'draw' && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-400/70 text-2xl font-bold text-white">
          Draw
        </span>
      )}
    </div>
  )
}
