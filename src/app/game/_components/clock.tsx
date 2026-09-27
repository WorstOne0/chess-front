"use client";

// Controllers
import { useGameController } from "@/core/controllers";

const format = (milliseconds: number) => {
  const seconds = Math.ceil(milliseconds / 1000);
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
};

// `bar` sits beside the name in the studio layout, `card` fills the player card in the immersive one.
export default function Clock({ color, variant }: { color: string; variant: "bar" | "card" }) {
  const time = useGameController((state) => state.clocks[color]);
  const isToMove = useGameController((state) => !state.gameResult.over && state.board.currentPlayerTurn === color);

  if (variant === "bar") {
    return (
      <div
        className={`h-[5.4rem] w-[13.6rem] shrink-0 flex items-center justify-center gap-[0.8rem] rounded-[1.6rem] text-[2.2rem] font-extrabold tabular-nums ${isToMove ? "bg-action text-on-action shadow-action" : "bg-background text-meta shadow-inset"}`}
      >
        {isToMove && <span className="h-[0.8rem] w-[0.8rem] rounded-full bg-accent" />}
        {format(time)}
      </div>
    );
  }

  return (
    <div
      className={`h-[8.4rem] flex flex-col items-center justify-center gap-[0.4rem] rounded-[1.8rem] ${isToMove ? "bg-action text-on-action shadow-action" : "bg-surface text-meta shadow-inset"}`}
    >
      <span className="text-[3.6rem] leading-none font-extrabold tabular-nums">{format(time)}</span>
      <span className={`text-[1.1rem] font-extrabold tracking-[0.1rem] uppercase ${isToMove ? "text-accent-on-action" : "text-faint"}`}>{isToMove ? "To move" : "Waiting"}</span>
    </div>
  );
}
