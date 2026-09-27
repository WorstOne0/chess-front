# Chess

> Chess in the browser at [chess.kuuhaku.dev](https://chess.kuuhaku.dev): against Stockfish running on
> the player's own machine, or against a friend in a private room.

One of two repositories:

| Repository | Role |
|---|---|
| **chess_web** (this one) | The site — board, bot, room screens |
| [chess-backend](https://github.com/WorstOne0/chess-backend) | Rooms server — Express + WebSocket, in memory |

---

## Features

- **Bot in the browser** — Stockfish 19 lite (WASM) in a Web Worker, so there is no engine API to call
  and no rate limit. Easy, Medium and Hard set its skill level and depth; it never answers in under
  800 ms.
- **Rooms** — create one, share it by link, QR code or 6-letter code, pick a side. The server keeps the
  clocks; draw offers, resign and rematch (colours swap) go through it, and a reload takes the same seat
  back.
- **Board** — drag or click, premoves, right click to mark a square and right drag for arrows, legal
  moves and the last move highlighted, a promotion picker, history to step back through, captured
  pieces with the material difference.
- **Results play on the kings** — a circle fills the square with the icon, then clears to a badge — and
  the result card follows.
- **Settings** — Charcoal and Blue themes, Studio and Immersive layouts, four boards, five piece sets,
  coordinates and sound, all remembered.
- Time controls from 1+1 to 15+10.

---

## Tech stack

Next.js 16 (App Router, Turbopack, standalone output) · React 19 · TypeScript · Tailwind CSS 4 ·
Zustand · next-themes · dnd-kit · use-sound · qrcode · Stockfish 19 (WASM)

---

## Getting started

Requires Node 20.9+ and pnpm.

```bash
pnpm install
pnpm dev                 # http://localhost:5000
```

Rooms also need [chess-backend](https://github.com/WorstOne0/chess-backend) running on `:5001`; the rest
of the site works without it.

`/game?fen=<FEN>` starts a computer game from any position, the quickest way to test an ending — a
promotion, for example: `/game?fen=2r1k3/1P6/8/8/8/8/5PPP/6K1 w - - 0 1`.

### Environment

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_ROOMS_URL` | chess-backend base url (defaults to `http://localhost:5001`) |

It is **inlined at build time**. The Dockerfile passes `https://chess-api.kuuhaku.dev` as a build arg,
so changing it needs a rebuild, not a restart.

---

## Engine

Move generation is legal-only, following [Peter Ellis Jones' article](https://peterellisjones.com/posts/generating-legal-chess-moves-efficiently/):
king danger squares with the king lifted off the board, capture/push masks for check evasions, and pin rays
resolved before generating. It lives in `src/utils/board.ts` (state, make/unmake) and `src/utils/moves.ts` (generation).

```bash
pnpm perft      # node counts against the standard positions, depth 4 by default
pnpm perft 5    # deeper
pnpm rules      # checkmate, stalemate, draws
```

`pnpm perft "<fen>" <depth>` prints a divide, which is how you find the move that diverges from a
reference engine.

Stockfish only picks the bot's reply. Its UCI answer is matched against our own legal moves, so a move
we consider illegal is dropped instead of played.

---

## Project structure

```
src/
  app/
    (home)/page.tsx       mode, difficulty, time control
    game/                 page.tsx picks the layout; _components/ holds the board and the panels
    room/create/          the server page creates the room and draws the QR code
    room/join/            by code, link or QR
  core/
    controllers/          zustand — game (bot or room, premoves, clocks, history), room, settings
    models/               types and option tables
  components/             shared UI — settings modal, segmented control, buttons
  hooks/                  use_room
  services/               stockfish (Web Worker), rooms (one WebSocket per tab)
  utils/                  board state, move generation, perft
  styles/                 tokens → theme → base, utilities
scripts/                  perft.ts, rules.ts
public/                   logo, pieces/<set>/, sound, stockfish
```

---

## Deploy

Docker, standalone output on port 5000:

```bash
docker compose up -d --build
```

The container joins the external `nginx-proxy` network as `chess`. On the VPS, Nginx Proxy Manager
forwards `chess.kuuhaku.dev` to `chess:5000` — a route set up by hand in its UI. The `VIRTUAL_*`
variables in `docker-compose.yml` are only read by jwilder/nginx-proxy.

---

## Known limitations

- Rooms trust the clients: the server checks whose turn it is, not whether the move is legal.
- Rooms live in the server's memory, so a backend restart ends the games in progress.
- Desktop only — drawn for 1440×900; below about 1200 px wide the side panels crowd the board.
- Against the computer the player is always White.

---

## Credits

- [Stockfish](https://stockfishchess.org), GPL-3.0, in the browser build from
  [stockfish.js](https://github.com/nmrugg/stockfish.js) — `public/stockfish/`.
- Piece sets from [lichess](https://github.com/lichess-org/lila/tree/master/public/piece): Modern
  (Staunty), Bold (Cardinal) and Minimal (Fresca) by sadsnake1, CC BY-NC-SA 4.0; Classic (cburnett) by
  Colin M.L. Burnett, GPLv2+. `docs/piece_sets.html` lists the other lichess sets with their licences.
