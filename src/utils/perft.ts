import { applyMove, boardNotation, computeBoardState, undoMove } from "./board";
import { Board, Move, PieceType } from "../core/models";
import { generateAllLegalMoves } from "./moves";

const promotionFen: Record<string, string> = { queen: "q", rook: "r", bishop: "b", knight: "n" };

const moveToUci = (piece: PieceType, move: Move) => {
  const from = boardNotation[piece.position.row][piece.position.column];
  const to = boardNotation[move.row][move.column];

  return `${from}${to}${move.promotion ? promotionFen[move.promotion] : ""}`;
};

const perft = (board: Board, depth: number): number => {
  if (depth === 0) return 1;

  const moves = generateAllLegalMoves(board);
  if (depth === 1) return moves.length;

  let nodes = 0;
  for (const { piece, move } of moves) {
    const undo = applyMove(board, piece, move);
    computeBoardState(board, false);

    nodes += perft(board, depth - 1);

    undoMove(board, undo);
  }

  return nodes;
};

const perftDivide = (board: Board, depth: number) => {
  const counts: Record<string, number> = {};

  for (const { piece, move } of generateAllLegalMoves(board)) {
    const undo = applyMove(board, piece, move);
    computeBoardState(board, false);

    counts[moveToUci(piece, move)] = perft(board, depth - 1);

    undoMove(board, undo);
  }

  return counts;
};

export { perft, perftDivide, moveToUci };
