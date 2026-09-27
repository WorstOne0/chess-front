/* eslint-disable @typescript-eslint/no-explicit-any */

export type Board = {
  board: PieceType[][];
  fen: string;

  currentPlayerTurn: string;
  castlingRights: string;
  enPassantTarget: string;
  halfMoveClock: number;
  fullMoveNumber: number;

  attackedSquares: Record<string, Position>;
  checkedSquares: Record<string, Position>;
  captureMask: Record<string, Position>;
  pushMask: Record<string, Position>;
  pinnedSquares: Record<string, Position[]>;
};

export type Position = {
  row: number;
  column: number;
};

export type PieceType = {
  type: string;
  color: string | null;

  position: Position;

  settings: any;
  notation: string;
  fen: string | null;
};

export type Move = Position & {
  promotion?: string;
  enPassant?: boolean;
  castle?: "K" | "Q";
};

export type SelectedPiece = {
  piece: PieceType;

  validMoves: Move[];
};

export type UndoRecord = {
  squares: { row: number; column: number; piece: PieceType }[];

  currentPlayerTurn: string;
  castlingRights: string;
  enPassantTarget: string;
  halfMoveClock: number;
  fullMoveNumber: number;

  attackedSquares: Record<string, Position>;
  checkedSquares: Record<string, Position>;
  captureMask: Record<string, Position>;
  pushMask: Record<string, Position>;
  pinnedSquares: Record<string, Position[]>;
};

export type GameResult = {
  over: boolean;
  reason: string;
  winner: string | null;
};

export type MoveRecord = {
  notation: string;
  from: Position;
  to: Position;
  fen: string;
};

export const RESULT_REASONS: Record<string, string> = {
  checkmate: "by checkmate",
  resignation: "by resignation",
  timeout: "on time",
  agreement: "by agreement",
  stalemate: "by stalemate",
  "threefold repetition": "by repetition",
  "fifty move rule": "by the fifty-move rule",
  "insufficient material": "by insufficient material",
};

export const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

const PIECE_VALUES: Record<string, number> = { pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9 };

// Points `color` has on the board; the gap between both sides is the +N shown beside the captures.
export const materialOf = (board: Board, color: string) =>
  board.board.flat().reduce((total, piece) => total + (piece.color === color ? (PIECE_VALUES[piece.type] ?? 0) : 0), 0);

export const outcomeOf = (result: GameResult, color: string | null) => (!result.winner ? "draw" : result.winner === color ? "win" : "loss");

export type Arrow = { from: Position; to: Position };

export const isSameSquare = (a: Position, b: Position) => a.row === b.row && a.column === b.column;
