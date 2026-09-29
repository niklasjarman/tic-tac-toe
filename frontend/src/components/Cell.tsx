import type { Cell as CellValue } from '../api/client'

interface CellProps {
  value: CellValue
  disabled: boolean
  onClick: () => void
  label: string
}

export function Cell({ value, disabled, onClick, label }: CellProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || value !== null}
      aria-label={label}
      className="flex aspect-square items-center justify-center rounded-sm bg-white text-lg font-semibold text-slate-800 transition-colors enabled:hover:bg-board-active disabled:cursor-not-allowed"
    >
      {value === 'x' && <span className="text-player-x">X</span>}
      {value === 'o' && <span className="text-player-o">O</span>}
    </button>
  )
}
