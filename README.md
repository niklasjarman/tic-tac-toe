# Ultimate Tic-Tac-Toe

A local, two-player, hot-seat web app for Ultimate Tic-Tac-Toe. Two players
share one browser tab and take turns clicking. No accounts, no online play, no
AI opponent.

The game rules live in a **stateless FastAPI backend**. The React frontend
holds the current game state, sends it with each move, and renders whatever the
backend returns. The backend stores nothing between requests: no sessions, no
database, and no game state in memory.

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

## API

Base path: `/api/v1`. Interactive docs are at http://localhost:8000/docs when
the backend runs locally.

| Method | Path          | Body                                           | Returns                           |
| ------ | ------------- | ---------------------------------------------- | --------------------------------- |
| POST   | `/games`       | none                                           | `200` a fresh game state          |
| POST   | `/games/moves` | `{ state, board_index, cell_index }`           | `200` the next game state         |
| GET    | `/health`      | none                                           | `200 {"status": "ok"}`            |

The **request** `state` carries only what can't be recomputed:

```json
{
  "boards": [[null, "x", null, null, null, null, null, null, null], "...9 boards of 9 cells"],
  "current_player": "o",
  "active_board": 1
}
```

Board and cell indexes run 0–8, row-major (0 = top-left, 8 = bottom-right).
`active_board` is the board the current player was sent to, or `null` for a
free choice.

The **response** repeats those fields and adds values the backend derives from
the cells on every request: `board_statuses` (`in_progress`, `x`, `o`, `draw`
for each board), `winner` (`x`, `o`, `draw`, or `null`), and `legal_boards`.

Errors always use the same shape, `{ "code": "...", "detail": "..." }`:

- `409`: the rules refuse the move. Codes: `cell_occupied`, `wrong_board`,
  `board_closed`, `game_over`, `invalid_state` (the marks on the board don't
  match whose turn it is).
- `422`: the request is malformed (for example, an index outside 0–8).

## Project structure

```
backend/
  app/
    core/errors.py          IllegalMoveError and its refusal codes
    services/grid.py        evaluate_grid(): the one 3x3 winner/draw check,
                            used for all 9 small boards and the big board
    services/game_engine.py New game, legal boards, move validation
    services/game_types.py  Player, BoardStatus, and the Game value type
    schemas/game.py         Pydantic request/response models
    api/v1/                 Routes and the {code, detail} error handlers
    main.py
  tests/test_services/      Game-rule tests
  tests/test_api/           Endpoint tests (httpx + ASGITransport)
frontend/
  src/api/                  Typed client; schema.d.ts is generated from the API
  src/components/           Board, SmallBoard, Cell, StatusBar, NewGameButton
  src/App.tsx               Loads/updates game state through TanStack Query
  src/test/                 MSW handlers and fixtures for tests
  e2e/                      Playwright smoke test (runs against the real backend)
infra/docker/               Dockerfiles and the nginx config
docker-compose.yml
DECISIONS.md                Choices that had a real alternative, and why
```

## Run with Docker (simplest)

Requires Docker Desktop.

```bash
docker compose up --build
```

Open http://localhost:8080. nginx serves the frontend and forwards `/api` to
the backend container. Stop with `Ctrl+C`, then `docker compose down`.

## Run locally for development

Requires [uv](https://docs.astral.sh/uv/), Node 24 (LTS), and pnpm via Corepack.

Backend, in one terminal:

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

Frontend, in a second terminal:

```bash
cd frontend
corepack enable
pnpm install
pnpm dev
```

Open http://localhost:5173. The Vite dev server forwards `/api` to the backend
on port 8000.

## Test

Backend:

```bash
cd backend
uv run pytest --cov=app --cov-report=term-missing:skip-covered --cov-fail-under=80
uv run ruff check . && uv run ruff format --check .
uv run mypy
```

Frontend:

```bash
cd frontend
pnpm test:cov        # unit + component tests with coverage (API mocked with MSW)
pnpm lint            # ESLint
pnpm format:check    # Prettier
pnpm build           # typecheck + production build
pnpm e2e             # Playwright; starts the backend and frontend itself
```

`pnpm e2e` needs the Playwright browser installed once (`pnpm exec playwright
install chromium`). If the backend and frontend dev servers are already running,
Playwright reuses them.

After changing the API, regenerate the frontend types with the backend running:

```bash
cd frontend
pnpm gen:api
```
