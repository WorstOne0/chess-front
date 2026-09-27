// Next
import { create } from "zustand";
// Models
import {
  DIFFICULTIES,
  START_FEN,
  TIME_CONTROLS,
  isSameSquare,
  type Arrow,
  type Board,
  type Difficulty,
  type GameResult,
  type Move,
  type MoveRecord,
  type PieceType,
  type Position,
  type RoomState,
  type SelectedPiece,
  type TimeControl,
} from "@/core/models";
// Services
import { bestMove, sendRoom } from "@/services";
// Utils
import {
  buildBoard,
  cloneBoard,
  applyMove,
  computeBoardState,
  generateNotation,
  getGameResult,
  getMoveFromStockfish,
  calculateLegalMoves,
  moveToUci,
} from "@/utils";

type GameSetup = { difficulty: Difficulty; timeControl: TimeControl; fen?: string };

type GameController = {
  board: Board;
  // The player's colour; against the computer always white, in a room the one the server dealt
  player: string;
  mode: "computer" | "room";
  roomGame: number;
  difficulty: Difficulty;
  timeControl: TimeControl;
  isStarted: boolean;

  selectedPiece?: SelectedPiece;
  onlySelectedPiece: boolean;
  pendingPromotion?: { piece: PieceType; moves: Move[] };
  // A move picked on the opponent's turn, played the moment it is the player's turn if still legal
  premove?: Arrow;
  // Right-click drawings; the player's next move clears them
  arrows: Arrow[];
  marks: Position[];

  history: MoveRecord[];
  positionHistory: string[];
  gameResult: GameResult;
  capturedPieces: PieceType[];
  // The ply on screen while browsing the moves: -1 is the start position, null follows the game
  viewIndex: number | null;
  isFlipped: boolean;
  // Milliseconds left per colour; clockUpdatedAt is when the running clock was last charged, null before the first move
  clocks: Record<string, number>;
  clockUpdatedAt: number | null;

  newGame: (setup: GameSetup) => void;
  syncRoom: (room: RoomState) => void;
  selectPiece: (piece: PieceType) => void;
  clearSelection: () => void;
  makeMove: (position: Position) => void;
  choosePromotion: (promotion: string) => void;
  makeBotMove: () => Promise<void>;
  offerDraw: () => Promise<boolean>;
  resign: () => void;
  rematch: () => void;
  tick: () => void;
  viewMove: (index: number | null) => void;
  flipBoard: () => void;
  toggleArrow: (arrow: Arrow) => void;
  toggleMark: (position: Position) => void;
  clearPremove: () => void;
};

// The least time the computer takes to answer: a reply that lands instantly reads as a script, not an opponent
const BOT_DELAY = 800;

const opponentOf = (color: string) => (color === "white" ? "black" : "white");

// Castling rights and the en passant square are part of a repetition, the clocks are not
const repetitionKey = (board: Board) => board.fen.split(" ").slice(0, 4).join(" ");

// Where a piece could go were it its side's turn right now; the opponent's reply decides whether it still can
const premoveTargets = (board: Board, piece: PieceType) => {
  const turned = cloneBoard(board);
  turned.currentPlayerTurn = piece.color!;
  turned.enPassantTarget = "";
  computeBoardState(turned, false);

  return calculateLegalMoves(turned, piece);
};

const freshGame = ({ difficulty, timeControl, fen = START_FEN }: GameSetup) => {
  const board = buildBoard({ fen });
  const clock = TIME_CONTROLS[timeControl].minutes * 60_000;

  return {
    board,
    difficulty,
    timeControl,
    selectedPiece: undefined,
    onlySelectedPiece: false,
    pendingPromotion: undefined,
    premove: undefined,
    arrows: [],
    marks: [],
    history: [],
    positionHistory: [repetitionKey(board)],
    gameResult: { over: false, reason: "", winner: null },
    capturedPieces: [],
    viewIndex: null,
    clocks: { white: clock, black: clock },
    clockUpdatedAt: null,
  };
};

export const useGameController = create<GameController>((set, get) => {
  const commitMove = (piece: PieceType, move: Move) => {
    const { board, player, selectedPiece, history, positionHistory, capturedPieces, clocks, clockUpdatedAt, timeControl } = get();

    const notation = generateNotation(board, piece, move);
    const captured = move.enPassant ? board.board[piece.position.row][move.column] : board.board[move.row][move.column];

    const nextBoard = cloneBoard(board);
    applyMove(nextBoard, piece, move);
    computeBoardState(nextBoard);

    const nextHistory = [...positionHistory, repetitionKey(nextBoard)];
    const gameResult = getGameResult(nextBoard, nextHistory);
    const isCheck = Object.keys(nextBoard.checkedSquares).length > 0;

    // The mover pays for the time since the clock was last charged, then gets the increment
    const now = Date.now();
    const mover = board.currentPlayerTurn;
    const left = clocks[mover] - (clockUpdatedAt === null ? 0 : now - clockUpdatedAt) + TIME_CONTROLS[timeControl].increment * 1000;

    // A piece picked (or being dragged) during the opponent's move stays picked, its moves now real ones
    const picked = mover !== player && selectedPiece ? nextBoard.board[selectedPiece.piece.position.row][selectedPiece.piece.position.column] : undefined;

    set({
      board: nextBoard,
      selectedPiece: picked?.color === player && !gameResult.over ? { piece: picked, validMoves: calculateLegalMoves(nextBoard, picked) } : undefined,
      onlySelectedPiece: false,
      pendingPromotion: undefined,
      ...(mover === player && { arrows: [], marks: [] }),
      history: [
        ...history,
        {
          notation: `${notation}${gameResult.reason === "checkmate" ? "#" : isCheck ? "+" : ""}`,
          from: piece.position,
          to: { row: move.row, column: move.column },
          fen: nextBoard.fen,
        },
      ],
      positionHistory: nextHistory,
      capturedPieces: captured.type === "empty" ? capturedPieces : [...capturedPieces, captured],
      gameResult,
      viewIndex: null,
      clocks: { ...clocks, [mover]: Math.max(0, left) },
      clockUpdatedAt: now,
    });
  };

  // The player's own move: against the computer it asks for the reply, in a room it goes to the opponent
  const playerMoved = (piece: PieceType, move: Move) => {
    const uci = moveToUci(piece, move);
    commitMove(piece, move);

    const { mode, gameResult, makeBotMove } = get();
    if (mode === "room") return sendRoom({ type: "move", uci, ...(gameResult.over && { result: gameResult }) });

    makeBotMove();
  };

  const playPremove = () => {
    const { board, premove, player, gameResult } = get();

    if (!premove || gameResult.over || board.currentPlayerTurn !== player) return;
    set({ premove: undefined });

    const piece = board.board[premove.from.row][premove.from.column];
    if (piece.color !== player) return;

    // Premoves promote to a queen; there is no moment to ask
    const move = calculateLegalMoves(board, piece).find((legal) => isSameSquare(legal, premove.to) && (!legal.promotion || legal.promotion === "queen"));
    if (move) playerMoved(piece, move);
  };

  return {
    ...freshGame({ difficulty: "medium", timeControl: "3+0" }),
    player: "white",
    mode: "computer",
    roomGame: 0,
    isStarted: false,
    isFlipped: false,

    newGame: (setup) => set({ ...freshGame(setup), player: "white", mode: "computer", isStarted: true, isFlipped: false }),
    syncRoom: (room) => {
      if (!room.color || room.status === "waiting") return;

      // The room's first game, a rematch, or a reload: start from the room's own record
      const { mode, roomGame, difficulty } = get();
      if (mode !== "room" || roomGame !== room.game) {
        set({ ...freshGame({ difficulty, timeControl: room.timeControl }), mode: "room", roomGame: room.game, player: room.color, isStarted: true, isFlipped: room.color === "black" });
      }

      // Moves the room has and this board does not yet: the opponent's, or all of them after a reload
      for (const uci of room.moves.slice(get().history.length)) {
        const { selectedPiece, position } = getMoveFromStockfish(uci, get().board);
        if (!position) break;

        commitMove(selectedPiece.piece, position);
      }

      set({ clocks: room.clocks, clockUpdatedAt: room.isClockRunning ? Date.now() : null });
      if (room.result && !get().gameResult.over) set({ gameResult: room.result, selectedPiece: undefined, premove: undefined });

      playPremove();
    },
    selectPiece: (piece: PieceType) => {
      const { board, selectedPiece, player, gameResult, pendingPromotion, viewIndex } = get();

      if (gameResult.over || pendingPromotion) return;
      // Touching the board while browsing the moves goes back to the game
      if (viewIndex !== null) return set({ viewIndex: null });

      // Anything you cannot move clears the selection, otherwise a drop on it would move the old piece there
      if (piece.type === "empty" || piece.color !== player) return set({ selectedPiece: undefined, onlySelectedPiece: false });

      if (selectedPiece?.piece != piece) set({ onlySelectedPiece: false });

      const validMoves = board.currentPlayerTurn === player ? calculateLegalMoves(board, piece) : premoveTargets(board, piece);
      return set({ selectedPiece: { piece, validMoves } });
    },
    clearSelection: () => set({ selectedPiece: undefined, onlySelectedPiece: false }),
    makeMove: (position: Position) => {
      const { board, player, selectedPiece, onlySelectedPiece, pendingPromotion } = get();

      if (!selectedPiece || !position || pendingPromotion) return;

      if (isSameSquare(selectedPiece.piece.position, position)) {
        if (!onlySelectedPiece) return set({ onlySelectedPiece: true });
        return set({ selectedPiece: undefined });
      }

      // The opponent's turn: remember it, to be played when the reply lands
      if (board.currentPlayerTurn !== player) {
        const isTarget = selectedPiece.validMoves.some((move) => isSameSquare(move, position));
        return set({ selectedPiece: undefined, onlySelectedPiece: false, ...(isTarget && { premove: { from: selectedPiece.piece.position, to: position } }) });
      }

      // Worked out on the board as it is now: a drag can start on the opponent's turn and end on yours
      const piece = board.board[selectedPiece.piece.position.row][selectedPiece.piece.position.column];
      if (piece.color !== player) return set({ selectedPiece: undefined });

      const moves = calculateLegalMoves(board, piece).filter((move) => isSameSquare(move, position));
      if (moves.length === 0) return;

      // A promotion square carries one move per piece the pawn can become
      if (moves[0].promotion) return set({ pendingPromotion: { piece, moves } });

      playerMoved(piece, moves[0]);
    },
    choosePromotion: (promotion: string) => {
      const { pendingPromotion } = get();

      const move = pendingPromotion?.moves.find((m) => m.promotion === promotion);
      if (!pendingPromotion || !move) return;

      playerMoved(pendingPromotion.piece, move);
    },
    // Nothing awaits this, so an engine failure has to stay inside it rather than reject
    makeBotMove: async () => {
      const { board, gameResult, difficulty } = get();

      if (gameResult.over) return;

      const [result] = await Promise.all([
        bestMove(board.fen, DIFFICULTIES[difficulty]).catch(() => undefined),
        new Promise((resolve) => setTimeout(resolve, BOT_DELAY)),
      ]);
      // The game can move on while the engine thinks: a new game, a resignation, the flag falling
      const current = get();
      if (!result || current.board !== board || current.gameResult.over) return;

      const { selectedPiece, position } = getMoveFromStockfish(result.move, board);
      if (!position) return;

      commitMove(selectedPiece.piece, position);
      playPremove();
    },
    offerDraw: async () => {
      const { board, gameResult, player, mode } = get();

      if (gameResult.over) return false;
      // In a room the offer goes to the opponent, whose answer comes back with the room
      if (mode === "room") {
        sendRoom({ type: "draw" });
        return false;
      }

      const result = await bestMove(board.fen, DIFFICULTIES.hard).catch(() => undefined);
      const current = get();
      if (!result || current.board !== board || current.gameResult.over) return false;

      // The score is for the side to move; the computer takes the draw unless it stands better
      const computerScore = board.currentPlayerTurn === player ? -result.score : result.score;
      if (computerScore > 50) return false;

      set({ gameResult: { over: true, reason: "agreement", winner: null }, selectedPiece: undefined, pendingPromotion: undefined, premove: undefined });
      return true;
    },
    resign: () => {
      const { gameResult, player, mode } = get();

      if (gameResult.over) return;
      if (mode === "room") sendRoom({ type: "resign" });

      set({ gameResult: { over: true, reason: "resignation", winner: opponentOf(player) }, selectedPiece: undefined, pendingPromotion: undefined, premove: undefined });
    },
    // In a room both players have to ask; the server then deals the new game
    rematch: () => {
      const { mode, difficulty, timeControl, newGame } = get();

      if (mode === "room") return sendRoom({ type: "rematch" });
      newGame({ difficulty, timeControl });
    },
    tick: () => {
      const { board, clocks, clockUpdatedAt, gameResult } = get();

      if (gameResult.over || clockUpdatedAt === null) return;

      const now = Date.now();
      const side = board.currentPlayerTurn;
      const left = Math.max(0, clocks[side] - (now - clockUpdatedAt));

      set({
        clocks: { ...clocks, [side]: left },
        clockUpdatedAt: now,
        ...(left === 0 && { gameResult: { over: true, reason: "timeout", winner: opponentOf(side) }, selectedPiece: undefined, pendingPromotion: undefined, premove: undefined }),
      });
    },
    viewMove: (index: number | null) => {
      const { history } = get();

      // Stepping past the last move is the game itself
      set({ viewIndex: index === null || index >= history.length - 1 ? null : Math.max(-1, index), selectedPiece: undefined });
    },
    flipBoard: () => set((state) => ({ isFlipped: !state.isFlipped })),
    toggleArrow: (arrow: Arrow) => {
      const { arrows } = get();

      const isDrawn = arrows.some((drawn) => isSameSquare(drawn.from, arrow.from) && isSameSquare(drawn.to, arrow.to));
      set({ arrows: isDrawn ? arrows.filter((drawn) => !isSameSquare(drawn.from, arrow.from) || !isSameSquare(drawn.to, arrow.to)) : [...arrows, arrow] });
    },
    toggleMark: (position: Position) => {
      const { marks } = get();

      set({ marks: marks.some((mark) => isSameSquare(mark, position)) ? marks.filter((mark) => !isSameSquare(mark, position)) : [...marks, position] });
    },
    clearPremove: () => set({ premove: undefined }),
  };
});
