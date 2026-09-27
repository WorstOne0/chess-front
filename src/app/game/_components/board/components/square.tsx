"use client";

// Next
import { useDroppable } from "@dnd-kit/core";
// Controllers
import { useGameController } from "@/core/controllers";
// Models
import type { PieceType } from "@/core/models";
// Components
import Piece from "./piece";
import ResultMark from "./result_mark";

// The frame the selected piece, a free target and a capture get; drawn over the piece like the coordinates.
const MARK = "absolute top-1/2 left-1/2 z-20 h-[92%] w-[92%] -translate-x-1/2 -translate-y-1/2 border-4 rounded-[0.8rem]";

export default function Square({
  row,
  column,
  piece,
  rank,
  file,
  isLastMove,
  isPremove,
  isMarked,
}: {
  row: number;
  column: number;
  piece: PieceType;
  rank?: number;
  file?: string;
  isLastMove: boolean;
  isPremove: boolean;
  isMarked: boolean;
}) {
  const { setNodeRef } = useDroppable({ id: `square_${row}_${column}`, data: { position: { row, column } } });
  const selectedPiece = useGameController((state) => state.selectedPiece);
  const selectPiece = useGameController((state) => state.selectPiece);
  const clearSelection = useGameController((state) => state.clearSelection);
  const makeMove = useGameController((state) => state.makeMove);

  const isLight = (row + column) % 2 === 0;
  const isSelected = selectedPiece?.piece.position.row === row && selectedPiece.piece.position.column === column;
  const isTarget = !!selectedPiece?.validMoves.some((move) => move.row === row && move.column === column);
  const coordinateColor = isLight ? "text-black" : "text-white";

  const onClick = () => {
    if (isSelected) return clearSelection();
    if (!isTarget) return selectPiece(piece);

    makeMove({ row, column });
  };

  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      className={`relative flex items-center justify-center rounded-[0.8rem] ${isLight ? "bg-square-light shadow-square-glow" : "bg-square-dark shadow-square-sunk"}`}
    >
      {isLastMove && <span className="absolute inset-0 rounded-[0.8rem] bg-last-move" />}
      {isPremove && <span className="absolute inset-0 rounded-[0.8rem] bg-premove" />}
      {isMarked && <span className="absolute inset-0 rounded-[0.8rem] bg-marked" />}
      {piece.type === "king" && <ResultMark color={piece.color} />}

      <Piece piece={piece} />

      {rank && <span className={`absolute top-0 left-[0.5rem] z-20 text-[1.8rem] font-bold ${coordinateColor}`}>{rank}</span>}
      {file && <span className={`absolute bottom-[-0.2rem] right-[0.5rem] z-20 text-[2rem] font-bold ${coordinateColor}`}>{file}</span>}

      {isTarget && piece.type === "empty" && (
        <span className={`${MARK} flex items-center justify-center border-move-mark`}>
          <span className="h-[30%] w-[30%] rounded-full bg-move-mark opacity-60 shadow-xl/20" />
        </span>
      )}
      {isTarget && piece.type !== "empty" && <span className={`${MARK} border-capture-mark`} />}
      {isSelected && <span className={`${MARK} border-move-mark`} />}
    </div>
  );
}
