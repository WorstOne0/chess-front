/* eslint-disable @next/next/no-img-element */
"use client";

// Controllers
import { useGameController, useSettingsController } from "@/core/controllers";
// Models
import { materialOf, pieceSrc } from "@/core/models";

const ORDER = ["pawn", "knight", "bishop", "rook", "queen"];

// The pieces `by` has taken, cheapest first, and +N when `by` is ahead on material.
export default function Captured({ by }: { by: string }) {
  const capturedPieces = useGameController((state) => state.capturedPieces);
  // From the board rather than the captures, so a promotion counts too
  const advantage = useGameController((state) => materialOf(state.board, by) - materialOf(state.board, by === "white" ? "black" : "white"));
  const pieceSet = useSettingsController((state) => state.settings.pieceSet);

  const pieces = capturedPieces.filter((piece) => piece.color !== by).sort((a, b) => ORDER.indexOf(a.type) - ORDER.indexOf(b.type));

  return (
    <div className="h-[2rem] flex items-center">
      {pieces.map((piece, index) => (
        <img key={index} src={pieceSrc(pieceSet, piece.color, piece.type)} alt={piece.type} className="-mr-[0.4rem] h-[2rem] w-[2rem]" />
      ))}
      {advantage > 0 && <span className="ml-[0.9rem] text-[1.3rem] font-extrabold tabular-nums text-meta">+{advantage}</span>}
    </div>
  );
}
