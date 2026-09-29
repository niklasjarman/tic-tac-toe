export type Player = 'x' | 'o'

export type CellValue = Player | null

export type SmallBoardStatus = 'in_progress' | 'x' | 'o' | 'draw'

export interface SmallBoard {
  /** 9 cells, row-major (index 0 = top-left, index 8 = bottom-right). */
  cells: CellValue[]
  status: SmallBoardStatus
}

export interface GameState {
  /** 9 small boards, row-major over the big 3x3 grid. */
  boards: SmallBoard[]
  currentPlayer: Player
  /**
   * Index (0-8) of the small board the current player must play in.
   * null means the current player may play in any board that is still in_progress.
   */
  activeBoard: number | null
  winner: Player | 'draw' | null
}

export interface Move {
  boardIndex: number
  cellIndex: number
}
