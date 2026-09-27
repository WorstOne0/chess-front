"use client";

// Controllers
import { useGameController } from "@/core/controllers";
// Models
import { outcomeOf } from "@/core/models";
// Components
import ResultIcon from "./result_icon";

const COLORS: Record<string, { fill: string; text: string; label: string }> = {
  win: { fill: "bg-win", text: "text-win", label: "Winner" },
  loss: { fill: "bg-loss", text: "text-loss", label: "Lost" },
  draw: { fill: "bg-draw", text: "text-draw", label: "Draw" },
};

// Once the game ends, a circle grows from the middle of each king's square and shows the result's icon
// while full, then clears to the king with its badge. The circle covers the piece, so it sits above it.
export default function ResultMark({ color }: { color: string | null }) {
  const gameResult = useGameController((state) => state.gameResult);
  const isLive = useGameController((state) => state.viewIndex === null);

  if (!gameResult.over || !isLive) return null;

  const outcome = outcomeOf(gameResult, color);
  const { fill, text, label } = COLORS[outcome];

  return (
    <>
      <span className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center overflow-hidden rounded-[0.8rem]">
        <span className={`absolute top-1/2 left-1/2 h-[142%] w-[142%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-90 animate-result-circle ${fill}`} />
        <span className="relative h-[60%] w-[60%] flex items-center justify-center text-white text-[3.4rem] leading-none font-extrabold animate-result-icon">
          <ResultIcon outcome={outcome} reason={gameResult.reason} />
        </span>
      </span>
      <span
        aria-label={label}
        className={`absolute top-[5%] right-[5%] z-30 h-[38%] w-[38%] flex items-center justify-center rounded-full bg-white text-[1.7rem] leading-none font-extrabold shadow-[0_0.2rem_0.6rem_rgb(0_0_0/0.3)] animate-badge-pop ${text}`}
      >
        <ResultIcon outcome={outcome} reason={gameResult.reason} />
      </span>
    </>
  );
}
