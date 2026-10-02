# Decisions

Choices that had a real alternative, what was chosen, and why.

## Stateless backend, no database

**Chosen:** the client holds the game state and sends it with every move; the
backend stores nothing.
**Alternative:** the tech stack's SQLAlchemy + Alembic + SQLite persistence
layer (with `models/`, `repositories/`, a data volume, and a `db` service in
Compose).
**Why:** the assignment requires a stateless backend. With nothing stored,
there are no models or repositories, no `created_at` timestamps, no soft
deletes, and no database service in Docker Compose.

## The backend recomputes derived values and checks the turn

**Chosen:** the request carries only `boards`, `current_player`, and
`active_board`. Board statuses, the winner, and legal boards are recomputed
from the cells on every request. A state whose X/O counts don't match
`current_player` is refused (`409 invalid_state`). Unknown fields in the
state are rejected (`422`).
**Alternative:** accept statuses and the winner from the client.
**Why:** the backend is the source of truth for the rules. Trusting
client-supplied derived values would let a modified request skip a turn or
play into a closed board.

## A forced board that is already closed means a free choice

**Chosen:** if the received `active_board` points at a closed board, the
player may choose any open board, and a move into a closed board is refused
(`board_closed`) no matter what `active_board` says.
**Alternative:** reject the whole state as invalid.
**Why:** it's the game's own rule ("sent to a closed board: play anywhere
open"), so applying it is consistent rather than lenient.

## Illegal moves return 409, not 400

**Chosen:** `409` with `{code, detail}`.
**Alternative:** `400`, which the assignment suggested.
**Why:** the tech stack says a business-rule refusal is always `409`, and
never `400` or `422`. `422` is kept for malformed requests.

## Endpoint paths

**Chosen:** `POST /api/v1/games` and `POST /api/v1/games/moves`, both
returning `200`.
**Alternative:** `/api/new-game` and `/api/move`, as the assignment
suggested; or `201` for the new game.
**Why:** the tech stack requires `/api/v1/` and plural nouns. `201` requires
a `Location` header pointing at a stored resource, and nothing is stored.

## One generic 3x3 evaluator

**Chosen:** `evaluate_grid()` takes 9 values. A line of three `x` or three
`o` wins; any other non-empty value fills a square without forming a line; a
full grid with no line is a draw. Small boards pass their cells. The big
board passes the small boards' statuses, with open boards as empty.
**Alternative:** separate checks for small boards and the big board.
**Why:** the assignment asks for one function reused for all 10 boards.
Treating a drawn small board as a filled square that belongs to nobody is
exactly its role on the big board.

## No React Router

**Chosen:** a single screen, no router.
**Alternative:** React Router, which the tech stack lists.
**Why:** there is only one page, so there is nothing to route between.

## TanStack Query holds the game state

**Chosen:** the game state lives in the TanStack Query cache under one key.
The new-game request is the query; moves are mutations that write their
response into that cache. The query never refetches on its own
(`staleTime: Infinity`, no retries) because a refetch would reset the game.
**Alternative:** `useState` plus manual fetch calls.
**Why:** the tech stack requires TanStack Query for server state and forbids
fetch-and-setState in `useEffect`.

## Illegal moves are silent; failed requests show a message

**Chosen:** a `409` leaves the board unchanged with no message. Network
failures and `5xx` responses show "Couldn't reach the game server" with a
retry. Cells are disabled while a move is in flight.
**Alternative:** show the `409` detail to the player.
**Why:** the assignment says an illegal move should do nothing. Disabling
cells during a request stops a fast double-click from sending two moves built
from the same state.

## Unexpected server errors hide their details

**Chosen:** any unhandled exception returns `500 {"code": "internal_error",
"detail": "Something went wrong on the server."}`. The exception still
reaches the server log.
**Alternative:** include the exception message in `detail`.
**Why:** every error must use the `{code, detail}` envelope, and internal
messages can leak implementation details to the client.

## Board results are announced in the board's accessible name

**Chosen:** a closed board's name states its result (`Small board 1, won by
X`, `Small board 1, drawn`), and the large overlay mark is `aria-hidden`.
**Alternative:** leave the overlay as readable text inside the board.
**Why:** a screen reader then hears the result once, clearly, instead of a
stray "X" among nine cell buttons. It also lets tests find boards by role and
name, as the spec requires.

## Same-origin API calls through a proxy

**Chosen:** the Vite dev server (in development) and nginx (in Docker)
forward `/api` to the backend, so the browser only ever talks to one origin.
**Alternative:** CORS middleware on the backend.
**Why:** no CORS configuration to get wrong, and the frontend needs no
per-environment API URL.

## No `.env.example` files

**Chosen:** none.
**Alternative:** the committed `.env.example` per app that the tech stack
asks for.
**Why:** neither app reads any environment variables. The API location is
handled by the proxy described above.

## Dependency versions pinned against the tech stack

- **TypeScript 5.9**, pinned down from the 6.0 that the Vite template
  installed. The stack specifies 5.x, and `openapi-typescript` only supports
  TypeScript 5.
- **MSW 2**, pinned down from the MSW 3 that `latest` installed. The stack
  specifies v2, and Vitest's mocker requires v2.
- **Vitest 4**, pinned down from the 5 that the template installed, to match
  the stack. Vitest 4.1 supports Vite 8.
- **pnpm 12.6.0**, pinned through `packageManager` so Corepack uses the same
  version inside Docker as on a developer machine.

## Frontend moved into `frontend/`

**Chosen:** the tech stack's `backend/` + `frontend/` layout.
**Alternative:** keep the frontend at the repository root, as in the
frontend-only version.
**Why:** with a backend added, the split layout is what the tech stack
defines. The frontend-only version is preserved on the `frontend-only`
branch.
