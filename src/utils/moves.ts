import { boardNotation, emptySquare, generateCheckedSquares, positionFromNotation } from "./board";
import { Board, Move, PieceType } from "../core/models";

const promotionTypes = ["queen", "rook", "bishop", "knight"];

const diagonalDirections = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
];

const straightDirections = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

const inBounds = (row: number, column: number) => row >= 0 && row <= 7 && column >= 0 && column <= 7;

// A non-king move is legal when it stays on the pin ray and answers the check, if there is one
const canMoveTo = (fullBoard: Board, piece: PieceType, row: number, column: number) => {
  const pinRay = fullBoard.pinnedSquares[boardNotation[piece.position.row][piece.position.column]];
  if (pinRay && !pinRay.some((square) => square.row === row && square.column === column)) return false;

  if (Object.keys(fullBoard.checkedSquares).length === 0) return true;

  const notation = boardNotation[row][column];
  return notation in fullBoard.captureMask || notation in fullBoard.pushMask;
};

// Both pawns leave the rank at once, so only replaying the position catches the discovered check
const isEnPassantSafe = (fullBoard: Board, piece: PieceType, target: Move) => {
  const { board } = fullBoard;
  const from = piece.position;

  const savedFrom = board[from.row][from.column];
  const savedTarget = board[target.row][target.column];
  const savedCaptured = board[from.row][target.column];

  board[target.row][target.column] = { ...piece, position: { row: target.row, column: target.column } };
  board[from.row][from.column] = emptySquare(from.row, from.column);
  board[from.row][target.column] = emptySquare(from.row, target.column);

  const isInCheck = Object.keys(generateCheckedSquares(fullBoard)).length > 0;

  board[from.row][from.column] = savedFrom;
  board[from.row][target.column] = savedCaptured;
  board[target.row][target.column] = savedTarget;

  return !isInCheck;
};

const pawnMoves = (fullBoard: Board, piece: PieceType) => {
  const { board } = fullBoard;
  const { row, column } = piece.position;

  const direction = piece.color === "white" ? -1 : 1;
  const startRow = piece.color === "white" ? 6 : 1;
  const promotionRow = piece.color === "white" ? 0 : 7;
  const opponentColor = piece.color === "white" ? "black" : "white";
  const forwardRow = row + direction;

  const moves: Move[] = [];
  const addMove = (move: Move) => {
    if (!canMoveTo(fullBoard, piece, move.row, move.column)) return;
    if (move.row !== promotionRow) {
      moves.push(move);
      return;
    }

    for (const promotion of promotionTypes) moves.push({ ...move, promotion });
  };

  if (inBounds(forwardRow, column) && board[forwardRow][column].type === "empty") {
    addMove({ row: forwardRow, column });

    const doubleRow = row + direction * 2;
    if (row === startRow && board[doubleRow][column].type === "empty") addMove({ row: doubleRow, column });
  }

  for (const captureColumn of [column - 1, column + 1]) {
    if (!inBounds(forwardRow, captureColumn)) continue;
    if (board[forwardRow][captureColumn].color === opponentColor) addMove({ row: forwardRow, column: captureColumn });
  }

  if (!fullBoard.enPassantTarget) return moves;

  const target = positionFromNotation(fullBoard.enPassantTarget);
  if (target.row !== forwardRow || Math.abs(target.column - column) !== 1) return moves;

  const capturedPawn = board[row][target.column];
  if (capturedPawn.type !== "pawn" || capturedPawn.color !== opponentColor) return moves;

  // The captured pawn and the landing square differ, so the two masks have to be tested apart
  if (Object.keys(fullBoard.checkedSquares).length > 0) {
    const capturesChecker = boardNotation[row][target.column] in fullBoard.captureMask;
    const blocksCheck = boardNotation[target.row][target.column] in fullBoard.pushMask;
    if (!capturesChecker && !blocksCheck) return moves;
  }

  if (isEnPassantSafe(fullBoard, piece, target)) moves.push({ ...target, enPassant: true });

  return moves;
};

const steppingMoves = (fullBoard: Board, piece: PieceType, steps: number[][], attacksOnly: boolean) => {
  const { board } = fullBoard;
  const moves: Move[] = [];

  for (const [stepRow, stepColumn] of steps) {
    const row = piece.position.row + stepRow;
    const column = piece.position.column + stepColumn;
    if (!inBounds(row, column)) continue;

    if (attacksOnly) {
      moves.push({ row, column });
      continue;
    }

    if (board[row][column].color === piece.color) continue;
    if (canMoveTo(fullBoard, piece, row, column)) moves.push({ row, column });
  }

  return moves;
};

const slidingMoves = (fullBoard: Board, piece: PieceType, directions: number[][], attacksOnly: boolean) => {
  const { board } = fullBoard;
  const moves: Move[] = [];

  for (const [stepRow, stepColumn] of directions) {
    let row = piece.position.row + stepRow;
    let column = piece.position.column + stepColumn;

    while (inBounds(row, column)) {
      const target = board[row][column];

      if (attacksOnly) {
        // Defended own pieces count as attacked, so push the square before stopping on it
        moves.push({ row, column });
        if (target.type !== "empty") break;
      } else {
        if (target.color === piece.color) break;
        if (canMoveTo(fullBoard, piece, row, column)) moves.push({ row, column });
        if (target.type !== "empty") break;
      }

      row += stepRow;
      column += stepColumn;
    }
  }

  return moves;
};

const knightMoves = (fullBoard: Board, piece: PieceType, attacksOnly: boolean) => {
  const steps = [
    [2, 1],
    [1, 2],
    [-1, 2],
    [-2, 1],
    [-2, -1],
    [-1, -2],
    [1, -2],
    [2, -1],
  ];

  return steppingMoves(fullBoard, piece, steps, attacksOnly);
};

const bishopMoves = (fullBoard: Board, piece: PieceType, attacksOnly: boolean) =>
  slidingMoves(fullBoard, piece, diagonalDirections, attacksOnly);

const rookMoves = (fullBoard: Board, piece: PieceType, attacksOnly: boolean) =>
  slidingMoves(fullBoard, piece, straightDirections, attacksOnly);

const queenMoves = (fullBoard: Board, piece: PieceType, attacksOnly: boolean) =>
  slidingMoves(fullBoard, piece, [...diagonalDirections, ...straightDirections], attacksOnly);

const castlingMoves = (fullBoard: Board, piece: PieceType) => {
  const { board, attackedSquares, castlingRights } = fullBoard;
  if (Object.keys(fullBoard.checkedSquares).length > 0) return [];

  const row = piece.color === "white" ? 7 : 0;
  if (piece.position.row !== row || piece.position.column !== 4) return [];

  const isEmpty = (column: number) => board[row][column].type === "empty";
  const isSafe = (column: number) => !(boardNotation[row][column] in attackedSquares);
  const hasRook = (column: number) => board[row][column].type === "rook" && board[row][column].color === piece.color;

  const moves: Move[] = [];
  const kingSide = piece.color === "white" ? "K" : "k";
  const queenSide = piece.color === "white" ? "Q" : "q";

  if (castlingRights.includes(kingSide) && hasRook(7) && isEmpty(5) && isEmpty(6) && isSafe(5) && isSafe(6)) {
    moves.push({ row, column: 6, castle: "K" });
  }

  if (castlingRights.includes(queenSide) && hasRook(0) && isEmpty(1) && isEmpty(2) && isEmpty(3) && isSafe(2) && isSafe(3)) {
    moves.push({ row, column: 2, castle: "Q" });
  }

  return moves;
};

const kingMoves = (fullBoard: Board, piece: PieceType, attacksOnly: boolean) => {
  const steps = [...straightDirections, ...diagonalDirections];
  if (attacksOnly) return steppingMoves(fullBoard, piece, steps, true);

  const { board, attackedSquares } = fullBoard;
  const moves: Move[] = [];

  for (const [stepRow, stepColumn] of steps) {
    const row = piece.position.row + stepRow;
    const column = piece.position.column + stepColumn;

    if (!inBounds(row, column)) continue;
    if (board[row][column].color === piece.color) continue;
    if (boardNotation[row][column] in attackedSquares) continue;

    moves.push({ row, column });
  }

  return [...moves, ...castlingMoves(fullBoard, piece)];
};

const calculateLegalMoves = (board: Board, piece: PieceType, attacksOnly: boolean = false): Move[] => {
  // Double check => only the king can get out of it
  if (!attacksOnly && piece.type !== "king" && Object.keys(board.checkedSquares).length > 1) return [];

  if (piece.type === "pawn") return attacksOnly ? [] : pawnMoves(board, piece);
  if (piece.type === "knight") return knightMoves(board, piece, attacksOnly);
  if (piece.type === "bishop") return bishopMoves(board, piece, attacksOnly);
  if (piece.type === "rook") return rookMoves(board, piece, attacksOnly);
  if (piece.type === "queen") return queenMoves(board, piece, attacksOnly);
  if (piece.type === "king") return kingMoves(board, piece, attacksOnly);

  return [];
};

const generateAllLegalMoves = (board: Board) => {
  const legalMoves: { piece: PieceType; move: Move }[] = [];

  for (const row of board.board) {
    for (const piece of row) {
      if (piece.type === "empty" || piece.color !== board.currentPlayerTurn) continue;

      for (const move of calculateLegalMoves(board, piece)) legalMoves.push({ piece, move });
    }
  }

  return legalMoves;
};

export { calculateLegalMoves, generateAllLegalMoves };
