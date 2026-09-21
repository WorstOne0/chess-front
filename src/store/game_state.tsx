"use client";

import { create } from "zustand";
import axiosInstance from "@/services/axios";
//
import { Board, GameResult, Move, PieceType, Position, SelectedPiece } from "@/utils/chess_types";
import {
  buildBoard,
  cloneBoard,
  applyMove,
  computeBoardState,
  generateNotation,
  getGameResult,
  getMoveFromStockfish,
} from "@/utils/board";
import { calculateLegalMoves } from "@/utils/moves";

type GameStateStore = {
  board: Board;
  player: string;
  isSinglePlayer: boolean;
  //
  selectedPiece?: SelectedPiece;
  onlySelectdPiece: boolean;
  pendingPromotion?: { piece: PieceType; moves: Move[] };
  //
  previousMoves: string[];
  positionHistory: string[];
  gameResult: GameResult;
  evaluation: number;
  capturedPieces: PieceType[];
  //
  selectPiece: (piece: PieceType) => void;
  clearSelection: () => void;
  makeMove: (position: Position) => { sound: string };
  choosePromotion: (promotion: string) => { sound: string };
  makeBotMove: () => Promise<{ sound: string }>;
};

const startingBoard = buildBoard({ fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" });

// Castling rights and the en passant square are part of a repetition, the clocks are not
const repetitionKey = (board: Board) => board.fen.split(" ").slice(0, 4).join(" ");

const useGameState = create<GameStateStore>((set) => {
  const commitMove = (piece: PieceType, move: Move) => {
    const { board, previousMoves, positionHistory, capturedPieces } = useGameState.getState();

    const notation = generateNotation(board, piece, move);
    const captured = move.enPassant ? board.board[piece.position.row][move.column] : board.board[move.row][move.column];

    const nextBoard = cloneBoard(board);
    applyMove(nextBoard, piece, move);
    computeBoardState(nextBoard);

    const nextHistory = [...positionHistory, repetitionKey(nextBoard)];
    const gameResult = getGameResult(nextBoard, nextHistory);
    const isCheck = Object.keys(nextBoard.checkedSquares).length > 0;

    set({
      board: nextBoard,
      selectedPiece: undefined,
      onlySelectdPiece: false,
      pendingPromotion: undefined,
      previousMoves: [...previousMoves, `${notation}${gameResult.reason === "checkmate" ? "#" : isCheck ? "+" : ""}`],
      positionHistory: nextHistory,
      capturedPieces: captured.type === "empty" ? capturedPieces : [...capturedPieces, captured],
      gameResult,
    });

    let sound = "move-self.mp3";
    if (notation.includes("x")) sound = "capture.mp3";
    if (move.castle) sound = "castle.mp3";
    if (move.promotion) sound = "promote.mp3";
    if (isCheck) sound = "move-check.mp3";

    return { sound };
  };

  return {
    board: startingBoard,
    player: "white",
    isSinglePlayer: true,
    //
    selectedPiece: undefined,
    onlySelectdPiece: false,
    pendingPromotion: undefined,
    //
    previousMoves: [],
    positionHistory: [repetitionKey(startingBoard)],
    gameResult: { over: false, reason: "", winner: null },
    evaluation: 0,
    capturedPieces: [],
    //
    selectPiece: (piece: PieceType) => {
      const { board, selectedPiece, player, isSinglePlayer, gameResult, pendingPromotion } = useGameState.getState();

      if (gameResult.over || pendingPromotion) return;

      // Anything you cannot move clears the selection, otherwise a drop on it would move the old piece there
      const isOwnPiece = piece.type !== "empty" && piece.color === board.currentPlayerTurn;
      if (!isOwnPiece || (isSinglePlayer && piece.color !== player)) return set({ selectedPiece: undefined, onlySelectdPiece: false });

      if (selectedPiece?.piece != piece) set({ onlySelectdPiece: false });

      return set({ selectedPiece: { piece, validMoves: calculateLegalMoves(board, piece) } });
    },
    clearSelection: () => set({ selectedPiece: undefined, onlySelectdPiece: false }),
    makeMove: (position: Position) => {
      const { selectedPiece, onlySelectdPiece, isSinglePlayer, pendingPromotion, makeBotMove } = useGameState.getState();

      if (!selectedPiece || !position || pendingPromotion) return { sound: "" };

      if (selectedPiece.piece.position.row === position.row && selectedPiece.piece.position.column === position.column) {
        if (!onlySelectdPiece) set({ onlySelectdPiece: true });
        else set({ selectedPiece: undefined });

        return { sound: "" };
      }

      const moves = selectedPiece.validMoves.filter((move) => move.row === position.row && move.column === position.column);
      if (moves.length === 0) return { sound: "" };

      // A promotion square carries one move per piece the pawn can become
      if (moves[0].promotion) {
        set({ pendingPromotion: { piece: selectedPiece.piece, moves } });
        return { sound: "" };
      }

      const result = commitMove(selectedPiece.piece, moves[0]);
      if (isSinglePlayer) makeBotMove();

      return result;
    },
    choosePromotion: (promotion: string) => {
      const { pendingPromotion, isSinglePlayer, makeBotMove } = useGameState.getState();

      const move = pendingPromotion?.moves.find((m) => m.promotion === promotion);
      if (!pendingPromotion || !move) return { sound: "" };

      const result = commitMove(pendingPromotion.piece, move);
      if (isSinglePlayer) makeBotMove();

      return result;
    },
    // Nothing awaits this, so a failed request has to stay inside it rather than reject
    makeBotMove: async () => {
      const { board } = useGameState.getState();

      try {
        const response = await axiosInstance.get(`https://stockfish.online/api/s/v2.php?fen=${board.fen}&depth=12`);
        const { evaluation, continuation } = response.data;
        if (!continuation) return { sound: "" };

        const { selectedPiece, position } = getMoveFromStockfish(continuation.split(" ")[0], board);
        if (!position) return { sound: "" };

        set({ evaluation });

        return commitMove(selectedPiece.piece, position);
      } catch {
        return { sound: "" };
      }
    },
  };
});

export default useGameState;
