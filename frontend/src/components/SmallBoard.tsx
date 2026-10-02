import type { BoardStatus, Cell as CellValue } from '../api/client'
import { Cell } from './Cell'

interface SmallBoardProps {
  cells: CellValue[]
  status: BoardStatus
  boardIndex: number
  isLegal: boolean
  locked: boolean
  onCellClick: (cellIndex: number) => void
}

const ROW_LABELS = ['top', 'middle', 'bottom']
const COL_LABELS = ['left', 'center', 'right']
const RESULT_LABELS: Record<BoardStatus, string> = {
  in_progress: '',
  x: ', won by X',
  o: ', won by O',
  draw: ', drawn',
}

export function SmallBoard({
  cells,
  status,
  boardIndex,
  isLegal,
  locked,
  onCellClick,
}: SmallBoardProps) {
  const isClosed = status !== 'in_progress'

  return (
    <div
      role="group"
      aria-label={`Small board ${boardIndex + 1}${RESULT_LABELS[status]}${isLegal ? ', your move' : ''}`}
      className={`relative grid grid-cols-3 gap-1 rounded-md p-1 transition-opacity ${
        isLegal ? 'bg-board-active ring-2 ring-player-x' : 'bg-slate-200'
      } ${isClosed && !isLegal ? 'opacity-60' : ''}`}
    >
      {cells.map((value, cellIndex) => (
        <Cell
          key={cellIndex}
          value={value}
          disabled={locked || !isLegal}
          onClick={() => onCellClick(cellIndex)}
          label={`Board ${boardIndex + 1}, ${ROW_LABELS[Math.floor(cellIndex / 3)]} ${COL_LABELS[cellIndex % 3]} cell`}
        />
      ))}

      {/* Overlays are visual only; the group's accessible name already states the result. */}
      {status === 'x' && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center text-6xl font-bold text-player-x"
        >
          X
        </span>
      )}
      {status === 'o' && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center text-6xl font-bold text-player-o"
        >
          O
        </span>
      )}
      {status === 'draw' && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-400/70 text-2xl font-bold text-white"
        >
          Draw
        </span>
      )}
    </div>
  )
}
