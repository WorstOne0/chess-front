"use client";

import useSound from "use-sound";
import { useDroppable } from "@dnd-kit/core";
//
import { useGameState } from "@/store";
//
import { PieceType } from "@/utils/chess_types";
import Piece from "../piece";

export default function Cell({ row, column, piece }: Readonly<{ row: number; column: number; piece: PieceType }>) {
  const { setNodeRef } = useDroppable({ id: `cell_${row}_${column}`, data: { position: { row, column } } });
  const { board, selectedPiece, selectPiece, clearSelection, makeMove } = useGameState((state) => state);

  const [moveSelfAudio] = useSound("/sound/move-self.mp3");
  const [captureAudio] = useSound("/sound/capture.mp3");
  const [moveCheckAudio] = useSound("/sound/move-check.mp3");
  const [promoteAudio] = useSound("/sound/promote.mp3");
  const [castleAudio] = useSound("/sound/castle.mp3");

  const rows = ["1", "2", "3", "4", "5", "6", "7", "8"];
  const columns = ["a", "b", "c", "d", "e", "f", "g", "h"];

  const cellStyle = () => {
    return {
      backgroundColor: (row + column + 1) % 2 === 0 ? "#b58863" : "#f0d9b5",
      boxShadow:
        (row + column + 1) % 2 === 0
          ? "inset 10px 10px 20px #826247, inset -10px -10px 20px #e8ae7f;"
          : "0px 0px 10px #826247, -0px -0px 10px #e8ae7f",
    };
  };

  const isSelectedPiece = selectedPiece && selectedPiece.piece.position.row === row && selectedPiece.piece.position.column === column;

  const handleClick = () => {
    const isTarget = selectedPiece?.validMoves.some((move) => move.row === row && move.column === column);

    if (isSelectedPiece) return clearSelection();
    if (!isTarget) return selectPiece(piece);

    const { sound } = makeMove({ row, column });
    if (!sound) return;

    if (sound == "move-self.mp3") moveSelfAudio();
    if (sound == "capture.mp3") captureAudio();
    if (sound == "move-check.mp3") moveCheckAudio();
    if (sound == "promote.mp3") promoteAudio();
    if (sound == "castle.mp3") castleAudio();
  };
  const isValidMove = () => {
    if (!selectedPiece) return false;

    const move = selectedPiece.validMoves.find((move) => move.row === row && move.column === column);
    if (!move) return false;

    const pieceOnPosition = board.board[row][column];
    if (pieceOnPosition.type !== "empty") return false;

    return true;
  };
  const isCapture = () => {
    if (!selectedPiece) return false;

    const move = selectedPiece.validMoves.find((move) => move.row === row && move.column === column);
    if (!move) return false;

    const pieceOnPosition = board.board[row][column];
    if (pieceOnPosition.type === "empty") return false;

    return true;
  };

  return (
    <div
      ref={setNodeRef}
      className="h-full w-full flex justify-center items-center relative rounded-[0.8rem]"
      style={cellStyle()}
      onClick={handleClick}
    >
      <Piece piece={piece} />

      {column === 0 && (
        <div className="absolute top-[0rem] left-[0.5rem]">
          <span className={`font-bold ${(row + column + 1) % 2 === 0 ? "text-white" : "text-black"}`}>{rows.reverse()[row]}</span>
        </div>
      )}

      {row === 7 && (
        <div className="absolute bottom-[-0.2rem] right-[0.5rem]">
          <span className={`font-bold text-[2rem]  ${(row + column + 1) % 2 === 0 ? "text-white" : "text-black"}`}>{columns[column]}</span>
        </div>
      )}

      {isValidMove() && (
        <div className="h-[92%] w-[92%] flex justify-center items-center absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] border-4 border-blue-900 rounded-[0.8rem]">
          <div className="h-[30%] w-[30%] bg-blue-900 opacity-[0.6] rounded-full shadow-xl/20"></div>
        </div>
      )}

      {isCapture() && (
        <div className="h-[92%] w-[92%] absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] border-4 border-red-900 rounded-[0.8rem]"></div>
      )}

      {isSelectedPiece && (
        <div className="h-[92%] w-[92%] absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] border-4 border-blue-900 rounded-[0.8rem]"></div>
      )}
    </div>
  );
}
