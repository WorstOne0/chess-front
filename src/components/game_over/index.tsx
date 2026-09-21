"use client";

import { useGameState } from "@/store";

export default function GameOver() {
  const { gameResult } = useGameState((state) => state);

  if (!gameResult.over) return <></>;

  const title = gameResult.winner ? `${gameResult.winner === "white" ? "White" : "Black"} wins` : "Draw";

  return (
    <div className="absolute top-0 left-0 h-full w-full flex justify-center items-center bg-black/[0.5] rounded-[0.8rem] z-[50]">
      <div className="flex flex-col items-center bg-white rounded-[0.8rem] px-[4rem] py-[2.5rem] shadow-xl/20">
        <span className="text-[2.6rem] text-primary font-bold">{title}</span>
        <span className="text-[1.6rem] text-gray-500 capitalize">by {gameResult.reason}</span>
      </div>
    </div>
  );
}
