/* eslint-disable @next/next/no-img-element */
"use client";

// Controllers
import { useGameController, useSettingsController } from "@/core/controllers";
// Models
import { pieceSrc } from "@/core/models";

const PROMOTIONS = ["queen", "rook", "bishop", "knight"];

export default function Promotion() {
  const pendingPromotion = useGameController((state) => state.pendingPromotion);
  const choosePromotion = useGameController((state) => state.choosePromotion);
  const pieceSet = useSettingsController((state) => state.settings.pieceSet);

  if (!pendingPromotion) return null;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-overlay">
      <div className="p-[2.4rem] flex flex-col items-center gap-[1.6rem] rounded-card bg-surface shadow-frame">
        <span className="label">Promote to</span>
        <div className="flex gap-[1.2rem]">
          {PROMOTIONS.map((type) => (
            <button
              key={type}
              type="button"
              aria-label={type}
              onClick={() => choosePromotion(type)}
              className="h-[8rem] w-[8rem] flex items-center justify-center rounded-[1.6rem] bg-surface shadow-raise active:shadow-inset"
            >
              <img src={pieceSrc(pieceSet, pendingPromotion.piece.color, type)} alt="" className="h-[80%] w-[80%]" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
