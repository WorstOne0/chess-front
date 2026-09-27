/* eslint-disable @next/next/no-img-element */
"use client";

// Next
import { useDraggable } from "@dnd-kit/core";
// Controllers
import { useGameController, useSettingsController } from "@/core/controllers";
// Models
import { pieceSrc, type PieceType } from "@/core/models";

export default function Piece({ piece }: { piece: PieceType }) {
  const pieceSet = useSettingsController((state) => state.settings.pieceSet);
  const isPlayable = useGameController((state) => state.viewIndex === null && !state.gameResult.over);
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `piece_${piece.position.row}_${piece.position.column}`,
    data: { piece },
    disabled: !isPlayable,
  });

  if (piece.type === "empty") return null;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      // Above every other square's marks and coordinates while it travels
      style={transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 50 } : undefined}
      className="relative z-10 h-full w-full flex items-center justify-center"
    >
      <img
        src={pieceSrc(pieceSet, piece.color, piece.type)}
        alt={`${piece.color} ${piece.type}`}
        draggable={false}
        className="h-[90%] w-[90%]"
      />
    </div>
  );
}
