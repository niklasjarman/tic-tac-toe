# Ultimate Tic-Tac-Toe

A local, two-player, hot-seat web app for Ultimate Tic-Tac-Toe. No accounts, no
networking, no AI opponent — two players share one browser tab and take turns
clicking.

## Rules

The board is a 3x3 grid of small boards, each an ordinary 3x3 tic-tac-toe grid
(81 cells total).

- X moves first and may play in any empty cell of any small board.
- The cell a player picks within its small board determines which small board
  the opponent must play in next. Example: playing the top-right cell of any
  small board sends the opponent to the top-right small board.
- A small board is won by getting three in a row inside it. Once won, it is
  closed (shown as a large X or O) and no more moves can be made in it. A
  small board that fills up with no winner is a draw and is also closed.
- If a player is sent to a small board that's already won or full, they may
  play in any open cell on any open small board instead.
- The overall game is won by claiming three small boards in a row on the big
  3x3 grid. If every small board is closed and nobody has done that, the game
  is a draw.

## Project structure

```
src/
  game/            Pure game logic: state, move legality, win/draw detection.
                    No DOM or React dependencies — testable in isolation.
    types.ts        GameState, SmallBoard, and related types.
    smallBoard.ts    Win/draw detection for a single 3x3 grid.
    gameEngine.ts    State creation, move legality, the "sent to a closed
                      board" free-move rule, and overall win/draw detection.
    __tests__/       Unit tests for the above.
  components/      UI, built on top of the game module.
    Cell.tsx, SmallBoard.tsx, Board.tsx   The board hierarchy.
    StatusBar.tsx, NewGameButton.tsx       Turn/result display and reset.
    __tests__/       Component tests (Testing Library).
  App.tsx           Wires game state (useState) to the components.
  App.test.tsx       Integration tests driving the UI through user events.
e2e/
  happy-path.spec.ts   Playwright smoke test for the primary flow.
```

## Install

Requires Node 24 (LTS) and pnpm via Corepack.

```bash
corepack enable
pnpm install
```

## Run

```bash
pnpm dev
```

Opens the app at http://localhost:5173.

## Test

```bash
pnpm test          # unit + component tests (Vitest)
pnpm test:cov       # same, with coverage report
pnpm e2e            # Playwright end-to-end smoke test
```

Other checks:

```bash
pnpm lint           # ESLint
pnpm format:check   # Prettier
pnpm build           # typecheck (tsc) + production build
```
