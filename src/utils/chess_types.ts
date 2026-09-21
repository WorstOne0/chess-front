/* eslint-disable @typescript-eslint/no-explicit-any */

export type Board = {
  board: PieceType[][];
  fen: string;
  //
  currentPlayerTurn: string;
  castlingRights: string;
  enPassantTarget: string;
  halfMoveClock: number;
  fullMoveNumber: number;
  //
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
  //
  position: Position;
  //
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
  //
  validMoves: Move[];
};

export type UndoRecord = {
  squares: { row: number; column: number; piece: PieceType }[];
  //
  currentPlayerTurn: string;
  castlingRights: string;
  enPassantTarget: string;
  halfMoveClock: number;
  fullMoveNumber: number;
  //
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
