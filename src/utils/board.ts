import { Board, GameResult, Move, PieceType, Position, UndoRecord } from "./chess_types";
import { calculateLegalMoves, generateAllLegalMoves } from "./moves";

const boardNotation = [
  ["a8", "b8", "c8", "d8", "e8", "f8", "g8", "h8"],
  ["a7", "b7", "c7", "d7", "e7", "f7", "g7", "h7"],
  ["a6", "b6", "c6", "d6", "e6", "f6", "g6", "h6"],
  ["a5", "b5", "c5", "d5", "e5", "f5", "g5", "h5"],
  ["a4", "b4", "c4", "d4", "e4", "f4", "g4", "h4"],
  ["a3", "b3", "c3", "d3", "e3", "f3", "g3", "h3"],
  ["a2", "b2", "c2", "d2", "e2", "f2", "g2", "h2"],
  ["a1", "b1", "c1", "d1", "e1", "f1", "g1", "h1"],
];

const typeByFen: Record<string, string> = { p: "pawn", n: "knight", b: "bishop", r: "rook", q: "queen", k: "king" };
const fenByType: Record<string, string> = { pawn: "p", knight: "n", bishop: "b", rook: "r", queen: "q", king: "k" };
const notationByType: Record<string, string> = { pawn: "", knight: "N", bishop: "B", rook: "R", queen: "Q", king: "K" };

// Corner square -> the castling right it carries, revoked when a rook leaves or is captured there
const castlingRightBySquare: Record<string, string> = { "7,7": "K", "7,0": "Q", "0,7": "k", "0,0": "q" };

const emptySquare = (row: number, column: number): PieceType => ({
  type: "empty",
  position: { row, column },
  color: null,
  settings: {},
  notation: "",
  fen: null,
});

const createPiece = (type: string, color: string, row: number, column: number): PieceType => ({
  type,
  position: { row, column },
  color,
  settings: {},
  notation: notationByType[type],
  fen: color === "white" ? fenByType[type].toUpperCase() : fenByType[type],
});

const findKing = (board: Board, color: string) => {
  for (const row of board.board) {
    for (const piece of row) {
      if (piece.type === "king" && piece.color === color) return piece;
    }
  }

  return undefined;
};

const squaresBetween = (from: Position, to: Position): Position[] => {
  const dr = to.row - from.row;
  const dc = to.column - from.column;
  if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return [];

  const stepRow = dr === 0 ? 0 : dr / Math.abs(dr);
  const stepCol = dc === 0 ? 0 : dc / Math.abs(dc);

  const result: Position[] = [];
  let r = from.row + stepRow;
  let c = from.column + stepCol;

  while (r !== to.row || c !== to.column) {
    result.push({ row: r, column: c });
    r += stepRow;
    c += stepCol;
  }

  return result;
};

const buildBoard = ({ fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" }: { fen?: string }) => {
  const [startPosition, currentPlayerTurn, castlingRights, enPassantTarget, halfMoveClock, fullMoveNumber] = fen.split(" ");

  const board: PieceType[][] = [];

  startPosition.split("/").forEach((rowFen, rowIndex) => {
    const row: PieceType[] = [];

    for (const symbol of rowFen) {
      const emptyCount = parseInt(symbol);

      if (emptyCount > 0) {
        for (let i = 0; i < emptyCount; i++) row.push(emptySquare(rowIndex, row.length));
        continue;
      }

      const color = symbol === symbol.toUpperCase() ? "white" : "black";
      row.push(createPiece(typeByFen[symbol.toLowerCase()], color, rowIndex, row.length));
    }

    board.push(row);
  });

  const newBoard: Board = {
    board,
    fen,
    //
    currentPlayerTurn: currentPlayerTurn === "b" ? "black" : "white",
    castlingRights: castlingRights === "-" ? "" : castlingRights,
    enPassantTarget: enPassantTarget === "-" ? "" : enPassantTarget,
    halfMoveClock: parseInt(halfMoveClock) || 0,
    fullMoveNumber: parseInt(fullMoveNumber) || 1,
    //
    attackedSquares: {},
    checkedSquares: {},
    captureMask: {},
    pushMask: {},
    pinnedSquares: {},
  };

  computeBoardState(newBoard);

  return newBoard;
};

const cloneBoard = (board: Board): Board => ({ ...board, board: board.board.map((row) => [...row]) });

const applyMove = (board: Board, piece: PieceType, move: Move): UndoRecord => {
  const undo: UndoRecord = {
    squares: [],
    //
    currentPlayerTurn: board.currentPlayerTurn,
    castlingRights: board.castlingRights,
    enPassantTarget: board.enPassantTarget,
    halfMoveClock: board.halfMoveClock,
    fullMoveNumber: board.fullMoveNumber,
    //
    attackedSquares: board.attackedSquares,
    checkedSquares: board.checkedSquares,
    captureMask: board.captureMask,
    pushMask: board.pushMask,
    pinnedSquares: board.pinnedSquares,
  };

  const from = piece.position;
  const write = (row: number, column: number, value: PieceType) => {
    undo.squares.push({ row, column, piece: board.board[row][column] });
    board.board[row][column] = value;
  };

  const isCapture = board.board[move.row][move.column].type !== "empty" || !!move.enPassant;

  if (move.castle) {
    const rookColumn = move.castle === "K" ? 7 : 0;
    const rookTarget = move.castle === "K" ? 5 : 3;
    const rook = board.board[from.row][rookColumn];

    write(from.row, rookTarget, { ...rook, position: { row: from.row, column: rookTarget } });
    write(from.row, rookColumn, emptySquare(from.row, rookColumn));
  }

  if (move.enPassant) write(from.row, move.column, emptySquare(from.row, move.column));

  write(move.row, move.column, createPiece(move.promotion ?? piece.type, piece.color!, move.row, move.column));
  write(from.row, from.column, emptySquare(from.row, from.column));

  let castlingRights = board.castlingRights;
  if (piece.type === "king") {
    castlingRights = piece.color === "white" ? castlingRights.replace(/[KQ]/g, "") : castlingRights.replace(/[kq]/g, "");
  }
  for (const square of [`${from.row},${from.column}`, `${move.row},${move.column}`]) {
    const right = castlingRightBySquare[square];
    if (right) castlingRights = castlingRights.replace(right, "");
  }

  board.castlingRights = castlingRights;
  board.enPassantTarget =
    piece.type === "pawn" && Math.abs(move.row - from.row) === 2 ? boardNotation[(move.row + from.row) / 2][from.column] : "";
  board.halfMoveClock = piece.type === "pawn" || isCapture ? 0 : board.halfMoveClock + 1;
  board.fullMoveNumber = board.currentPlayerTurn === "black" ? board.fullMoveNumber + 1 : board.fullMoveNumber;
  board.currentPlayerTurn = board.currentPlayerTurn === "white" ? "black" : "white";

  return undo;
};

const undoMove = (board: Board, undo: UndoRecord) => {
  for (let i = undo.squares.length - 1; i >= 0; i--) {
    const { row, column, piece } = undo.squares[i];
    board.board[row][column] = piece;
  }

  board.currentPlayerTurn = undo.currentPlayerTurn;
  board.castlingRights = undo.castlingRights;
  board.enPassantTarget = undo.enPassantTarget;
  board.halfMoveClock = undo.halfMoveClock;
  board.fullMoveNumber = undo.fullMoveNumber;
  board.attackedSquares = undo.attackedSquares;
  board.checkedSquares = undo.checkedSquares;
  board.captureMask = undo.captureMask;
  board.pushMask = undo.pushMask;
  board.pinnedSquares = undo.pinnedSquares;
};

const generateFen = (board: Board) => {
  let fen = "";

  for (const row of board.board) {
    let emptySpaces = 0;

    for (const piece of row) {
      if (piece.type === "empty") {
        emptySpaces++;
        continue;
      }

      if (emptySpaces > 0) {
        fen += emptySpaces;
        emptySpaces = 0;
      }

      fen += piece.fen;
    }

    if (emptySpaces > 0) fen += emptySpaces;
    if (row !== board.board[board.board.length - 1]) fen += "/";
  }

  fen += ` ${board.currentPlayerTurn === "white" ? "w" : "b"}`;
  fen += ` ${board.castlingRights.length > 0 ? board.castlingRights : "-"}`;
  fen += ` ${board.enPassantTarget.length > 0 ? board.enPassantTarget : "-"}`;
  fen += ` ${board.halfMoveClock}`;
  fen += ` ${board.fullMoveNumber}`;

  return fen;
};

const generateNotation = (board: Board, movedPiece: PieceType, move: Move) => {
  if (move.castle === "K") return "O-O";
  if (move.castle === "Q") return "O-O-O";

  const isCapture = board.board[move.row][move.column].type !== "empty" || !!move.enPassant;
  const square = boardNotation[movedPiece.position.row][movedPiece.position.column];
  let notation = movedPiece.notation;

  if (movedPiece.type === "pawn") {
    if (isCapture) notation += square[0];
  } else {
    const rivals: PieceType[] = [];
    for (const row of board.board) {
      for (const piece of row) {
        if (piece.type !== movedPiece.type || piece.color !== movedPiece.color) continue;
        if (piece.position.row === movedPiece.position.row && piece.position.column === movedPiece.position.column) continue;
        if (calculateLegalMoves(board, piece).some((m) => m.row === move.row && m.column === move.column)) rivals.push(piece);
      }
    }

    if (rivals.length > 0) {
      if (!rivals.some((piece) => piece.position.column === movedPiece.position.column)) notation += square[0];
      else if (!rivals.some((piece) => piece.position.row === movedPiece.position.row)) notation += square[1];
      else notation += square;
    }
  }

  if (isCapture) notation += "x";
  notation += boardNotation[move.row][move.column];
  if (move.promotion) notation += `=${notationByType[move.promotion]}`;

  return notation;
};

const generateAttackedSquares = (board: Board) => {
  const myKing = findKing(board, board.currentPlayerTurn);
  if (!myKing) return {};

  // Sliders have to see through the king, or it looks safe stepping back along the attack ray
  const kingSquare = myKing.position;
  board.board[kingSquare.row][kingSquare.column] = emptySquare(kingSquare.row, kingSquare.column);

  const attackedSquares: Record<string, Position> = {};
  const mark = (row: number, column: number) => {
    if (row < 0 || row > 7 || column < 0 || column > 7) return;
    attackedSquares[boardNotation[row][column]] = { row, column };
  };

  for (const row of board.board) {
    for (const piece of row) {
      if (piece.type === "empty") continue;
      if (piece.color === board.currentPlayerTurn) continue;

      if (piece.type === "pawn") {
        const direction = piece.color === "white" ? -1 : 1;
        mark(piece.position.row + direction, piece.position.column - 1);
        mark(piece.position.row + direction, piece.position.column + 1);
        continue;
      }

      for (const move of calculateLegalMoves(board, piece, true)) mark(move.row, move.column);
    }
  }

  board.board[kingSquare.row][kingSquare.column] = myKing;

  return attackedSquares;
};

const generateCheckedSquares = (board: Board) => {
  const myKing = findKing(board, board.currentPlayerTurn);
  if (!myKing) return {};

  const opponentColor = board.currentPlayerTurn === "white" ? "black" : "white";
  const checkedSquares: Record<string, Position> = {};

  // Enemy pawns move towards us, so they check from one step against their own direction
  const pawnRow = myKing.position.row + (board.currentPlayerTurn === "white" ? -1 : 1);
  if (pawnRow >= 0 && pawnRow <= 7) {
    for (const column of [myKing.position.column - 1, myKing.position.column + 1]) {
      if (column < 0 || column > 7) continue;

      const piece = board.board[pawnRow][column];
      if (piece.type === "pawn" && piece.color === opponentColor) checkedSquares[boardNotation[pawnRow][column]] = { row: pawnRow, column };
    }
  }

  // Everything else: leave the king square as that piece type and see what we land on
  const probe = { ...myKing, color: opponentColor };
  for (const pieceType of ["knight", "bishop", "rook", "queen"]) {
    for (const move of calculateLegalMoves(board, { ...probe, type: pieceType }, true)) {
      const piece = board.board[move.row][move.column];
      if (piece.type === pieceType && piece.color === opponentColor) checkedSquares[boardNotation[move.row][move.column]] = move;
    }
  }

  return checkedSquares;
};

const generateCaptureAndPushMask = (board: Board, checkedSquares: Record<string, Position>) => {
  const captureMask: Record<string, Position> = {};
  const pushMask: Record<string, Position> = {};

  if (Object.keys(checkedSquares).length !== 1) return { captureMask, pushMask };

  const checkerSquare = Object.values(checkedSquares)[0];
  Object.assign(captureMask, checkedSquares);

  const pieceGivingCheck = board.board[checkerSquare.row][checkerSquare.column];
  if (pieceGivingCheck.type === "pawn" || pieceGivingCheck.type === "knight") return { captureMask, pushMask };

  const myKing = findKing(board, board.currentPlayerTurn);
  if (!myKing) return { captureMask, pushMask };

  for (const square of squaresBetween(myKing.position, checkerSquare)) {
    pushMask[boardNotation[square.row][square.column]] = square;
  }

  return { captureMask, pushMask };
};

const generatePinnedSquares = (board: Board) => {
  const myKing = findKing(board, board.currentPlayerTurn);
  if (!myKing) return {};

  const opponentColor = board.currentPlayerTurn === "white" ? "black" : "white";
  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ];

  const pinnedSquares: Record<string, Position[]> = {};

  for (const [stepRow, stepColumn] of directions) {
    const isDiagonal = stepRow !== 0 && stepColumn !== 0;

    let row = myKing.position.row + stepRow;
    let column = myKing.position.column + stepColumn;
    let candidate: PieceType | undefined;

    while (row >= 0 && row <= 7 && column >= 0 && column <= 7) {
      const piece = board.board[row][column];

      if (piece.type !== "empty") {
        // The first blocker has to be ours and the piece behind it a slider running along this ray
        if (!candidate) {
          if (piece.color !== board.currentPlayerTurn) break;
          candidate = piece;
        } else {
          const slides = piece.type === "queen" || piece.type === (isDiagonal ? "bishop" : "rook");
          if (piece.color === opponentColor && slides) {
            const ray = squaresBetween(myKing.position, { row, column });
            ray.push({ row, column });
            pinnedSquares[boardNotation[candidate.position.row][candidate.position.column]] = ray;
          }

          break;
        }
      }

      row += stepRow;
      column += stepColumn;
    }
  }

  return pinnedSquares;
};

const computeBoardState = (board: Board, includeFen: boolean = true) => {
  board.pinnedSquares = generatePinnedSquares(board);
  board.attackedSquares = generateAttackedSquares(board);
  board.checkedSquares = generateCheckedSquares(board);

  const { captureMask, pushMask } = generateCaptureAndPushMask(board, board.checkedSquares);
  board.captureMask = captureMask;
  board.pushMask = pushMask;
  if (includeFen) board.fen = generateFen(board);

  return board;
};

const hasInsufficientMaterial = (board: Board) => {
  const minorPieces: PieceType[] = [];

  for (const row of board.board) {
    for (const piece of row) {
      if (piece.type === "empty" || piece.type === "king") continue;
      if (piece.type === "pawn" || piece.type === "rook" || piece.type === "queen") return false;

      minorPieces.push(piece);
    }
  }

  if (minorPieces.length <= 1) return true;
  if (minorPieces.length > 2 || minorPieces.some((piece) => piece.type === "knight")) return false;

  // Two lone bishops only draw when they share a square colour
  const [first, second] = minorPieces;
  return (first.position.row + first.position.column) % 2 === (second.position.row + second.position.column) % 2;
};

const getGameResult = (board: Board, positionHistory: string[] = []): GameResult => {
  const opponentColor = board.currentPlayerTurn === "white" ? "black" : "white";

  if (generateAllLegalMoves(board).length === 0) {
    if (Object.keys(board.checkedSquares).length > 0) return { over: true, reason: "checkmate", winner: opponentColor };
    return { over: true, reason: "stalemate", winner: null };
  }

  if (board.halfMoveClock >= 100) return { over: true, reason: "fifty move rule", winner: null };
  if (hasInsufficientMaterial(board)) return { over: true, reason: "insufficient material", winner: null };

  const currentPosition = board.fen.split(" ").slice(0, 4).join(" ");
  if (positionHistory.filter((position) => position === currentPosition).length >= 3) {
    return { over: true, reason: "threefold repetition", winner: null };
  }

  return { over: false, reason: "", winner: null };
};

const positionFromNotation = (notation: string): Position => ({
  row: 8 - parseInt(notation[1]),
  column: notation.charCodeAt(0) - 97,
});

const getMoveFromStockfish = (move: string, board: Board) => {
  const from = positionFromNotation(move.substring(0, 2));
  const to = positionFromNotation(move.substring(2, 4));

  const selectedPiece = board.board[from.row][from.column];
  const promotion = move.length > 4 ? typeByFen[move[4]] : undefined;

  const position = calculateLegalMoves(board, selectedPiece).find(
    (m) => m.row === to.row && m.column === to.column && (!promotion || m.promotion === promotion)
  );

  return { selectedPiece: { piece: selectedPiece }, position, oldRow: from.row, oldColumn: from.column };
};

export {
  buildBoard,
  cloneBoard,
  applyMove,
  undoMove,
  generateFen,
  generateNotation,
  generateAttackedSquares,
  generateCheckedSquares,
  generateCaptureAndPushMask,
  generatePinnedSquares,
  computeBoardState,
  getGameResult,
  getMoveFromStockfish,
  positionFromNotation,
  findKing,
  emptySquare,
  createPiece,
  squaresBetween,
  boardNotation,
};
