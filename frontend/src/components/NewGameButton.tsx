export function NewGameButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md bg-slate-800 px-6 py-2 font-semibold text-white transition-colors hover:bg-slate-700"
    >
      New Game
    </button>
  )
}
