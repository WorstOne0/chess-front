# chess_web

Chess against a Stockfish bot or a friend in a room, served at chess.kuuhaku.dev. Next.js 16 (App
Router, Turbopack), React 19, Tailwind 4, Zustand, dnd-kit. Move generation is our own; Stockfish only
picks the bot's reply, and rooms run on `../chess_backend` (its own CLAUDE.md has the protocol).

General code style and architecture live in `../../code_style/` (`next.md`); this file is only what
is specific to this app. The look is not design.md's: it follows the "Chess app – neumorphic UI"
canvas (https://claude.ai/artifact/GoNQvvLrZcnuHqMRjR5ott) — soft dual shadows instead of hairlines,
charcoal and blue themes, primary `#0e3fa3`, lavender `#a78bfa` for small details.

## Working agreements

**Do not commit unless I ask.** Leave changes in the working tree so I can review the diff.

- Do not add dependencies without saying so first.
- Verify in a browser (`pnpm dev`, port 5000) at 1440×900, in both themes and both layouts, with the
  console open. Rooms need the backend too (the `chess-backend` launch config, port 5001) and two tabs.
- `/game?fen=…` starts a computer game from any position, e.g. a promotion:
  `/game?fen=2r1k3/1P6/8/8/8/8/5PPP/6K1 w - - 0 1`.
- After touching `src/utils/`, run `pnpm perft` and `pnpm rules`.

## Layout

```
src/
  app/
    layout.tsx  providers.tsx      server layout (metadata, Nunito); ThemeProvider inside <body>; settings rehydrate after mount
    (home)/page.tsx                mode, difficulty and time control; Start game calls newGame, then goes to /game
    game/
      page.tsx  layout.tsx         the page picks studio_layout (B) or immersive_layout (C); the layout only holds the title
      _components/                 studio_layout, immersive_layout,
                                   board/ (index + square, piece, arrows, promotion, game_over, result_mark),
                                   clock, captured, notation, move_list, move_strip, history_controls,
                                   game_actions, view_controls
      _hooks/                      use_move_sounds
    room/create/                   the server page makes the room (code, link, QR), _components/create_room_view waits on it
    room/join/                     page.tsx + a title-only layout.tsx; both screens move on to /game?room=CODE
  core/
    controllers/                   game_controller (the game, the bot or the room, premoves, drawings, clocks, history),
                                   room_controller (the server's last snapshot), settings_controller (localStorage)
    models/                        chess (Board, MoveRecord, RESULT_REASONS, materialOf), room (RoomState), settings
                                   (THEMES, LAYOUTS, BOARD_THEMES, PIECE_SETS, DIFFICULTIES, TIME_CONTROLS, pieceSrc)
  components/                      back_link, chip, icon_button, logo_tile, segmented, settings_modal
  hooks/                           use_room — joins a room and feeds room_controller
  services/                        stockfish (the bot, in a Web Worker), rooms (the one socket per tab)
  utils/                           board (FEN, make/unmake, notation, result), moves (generation), perft
  styles/                          index.css → tokens (palette + roles), theme (@theme), base, utilities
scripts/                           perft.ts, rules.ts — compiled by tsconfig.perft.json into .perft/
docs/piece_sets.html               every lichess piece set with its licence, for picking more
public/                            logo/, pieces/<set>/wK.svg … bP.svg, sound/, stockfish/
```

## Rules that matter here

- Charcoal is `:root` and the default theme; `.blue` re-points the roles. next-themes puts the class on
  `<html>` and saves it; the rest of the settings (layout, board, pieces, toggles, difficulty, time
  control) are `settings_controller`. Layout B (studio) is the default. The settings modal previews
  live and Cancel restores what was there when it opened.
- On blue the roles flip: `action` and `tile` are near-black. Style only with the roles (`bg-action`,
  `bg-tile`, `shadow-raise`, `shadow-inset`, …), never a hex, or one of the two themes breaks.
- **The board keeps the app's original look; the canvas only restyled what is around it.** Rounded
  squares, light ones glowing and dark ones sunk (`shadow-square-glow` / `shadow-square-sunk`), Neo
  pieces by default, blue frames and dots for moves, a red frame for captures, the yellow last move.
  The old inline dark-square shadow had a stray `;` and only rendered through the server HTML, so it is
  easy to "fix" away by mistake.
- The result plays on the kings first (a circle fills the square with the icon, then clears to the
  badge); the modal over the board waits for it (`animate-result-in`). The computer never answers in
  under `BOT_DELAY` (800 ms).
- On the opponent's turn a pick is a premove, played the moment the reply lands if still legal
  (promotions become queens). A selection or a drag survives the reply, and the move is worked out
  again on the board as it is then. Right click marks a square, right drag draws an arrow, and a right
  click with a premove set cancels it; the player's next move clears the drawings.
- A room game follows the server: `syncRoom` replays whatever moves the room has that the board does
  not, and takes the server's clocks and result. The player's own moves go out through `sendRoom`,
  which queues while the socket reconnects. `NEXT_PUBLIC_ROOMS_URL` points at chess_backend (default
  `http://localhost:5001`) and is inlined at build time; the Dockerfile's `ARG` sets the production one.
- Board colours live in tokens.css under `[data-board]`; a new board goes there and in `BOARD_THEMES`.
- A piece set is 12 SVGs in `public/pieces/<key>/` (wK … bP) plus a row in `PIECE_SETS`. Staunty,
  Cardinal and Fresca are CC BY-NC-SA 4.0 — non-commercial only, credited in the settings modal. `neo`
  looks traced from chess.com's set and has no licence.
- `src/utils` and `src/core/models` import each other by relative path only: `pnpm perft` builds them
  with plain `tsc` to CommonJS, where the `@/` alias does not exist.
- `board.board[row][column]` has row 0 = rank 8 and column 0 = file a.
- Stockfish 19 lite, single-threaded, runs in the player's browser from `public/stockfish/`, so no
  COOP/COEP headers are needed. The `.js` and `.wasm` must share a basename (the worker finds its wasm
  by swapping the extension). `bestMove` runs one search at a time: the worker has a single `onmessage`.
- The engine answers in UCI (`e7e5`, `e7e8q`); `getMoveFromStockfish` maps that onto our own legal
  moves, so a reply we consider illegal is dropped instead of played.
- Docker ships the standalone output (`node server.js`, port 5000). The VPS runs Nginx Proxy Manager,
  set up by hand (chess.kuuhaku.dev → `chess:5000`); the `VIRTUAL_*` variables in docker-compose.yml
  do nothing there. `../../pedro_luis_imoveis/INFRASTRUCTURE.md` has the server.

## Known gaps

- Rooms trust the clients: the backend checks turn order only, not chess.
- Desktop only: drawn for 1440×900; below about 1200 px wide the side panels crowd the board.
- The player is always White against the computer.
