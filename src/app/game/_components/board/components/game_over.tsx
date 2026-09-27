"use client";

// Next
import { useState } from "react";
import Link from "next/link";
// Controllers
import { useGameController, useRoomController } from "@/core/controllers";
// Models
import { DIFFICULTIES, RESULT_REASONS, TIME_CONTROLS, outcomeOf, type GameResult } from "@/core/models";
// Services
import { leaveRoom } from "@/services";
// Components
import ResultIcon from "./result_icon";
// Icons
import { MdOutlineClose, MdOutlineGroup, MdOutlineHome, MdOutlineMemory, MdOutlinePerson, MdOutlineReplay } from "react-icons/md";
import type { IconType } from "react-icons";

const OUTCOMES: Record<string, { title: string; score: string; fill: string; halo: string }> = {
  win: { title: "You won", score: "1 – 0", fill: "bg-win", halo: "ring-win/25" },
  loss: { title: "You lost", score: "0 – 1", fill: "bg-loss", halo: "ring-loss/25" },
  draw: { title: "Draw", score: "½ – ½", fill: "bg-draw", halo: "ring-draw/25" },
};

const BUTTON = "h-[5.2rem] min-w-0 flex-1 flex items-center justify-center gap-[1rem] rounded-[1.6rem] text-[1.6rem] font-extrabold active:shadow-inset disabled:opacity-60";

// Over the board, but it waits until the kings have shown the result and their badges popped in.
export default function GameOver() {
  const gameResult = useGameController((state) => state.gameResult);
  const player = useGameController((state) => state.player);
  const mode = useGameController((state) => state.mode);
  const difficulty = useGameController((state) => state.difficulty);
  const timeControl = useGameController((state) => state.timeControl);
  const moveCount = useGameController((state) => state.history.length);
  const rematch = useGameController((state) => state.rematch);
  const rematchAsks = useRoomController((state) => state.room?.rematch);

  // Closing hides this result only; the next game's result is a new object and shows again
  const [dismissed, setDismissed] = useState<GameResult | null>(null);

  if (!gameResult.over || dismissed === gameResult) return null;

  const outcome = outcomeOf(gameResult, player);
  const opponent = player === "white" ? "black" : "white";
  const { minutes, increment } = TIME_CONTROLS[timeControl];
  const hasAsked = mode === "room" && !!rematchAsks?.includes(player);
  const isAsked = mode === "room" && !!rematchAsks?.includes(opponent);

  const buildPlayer = (Icon: IconType, name: string, caption: string, isWinner: boolean) => (
    <div className="min-w-0 flex-1 flex flex-col items-center gap-[0.8rem]">
      <span className={`h-[5.2rem] w-[5.2rem] flex items-center justify-center rounded-[1.6rem] bg-tile shadow-tile ${isWinner ? "ring-[0.25rem] ring-win" : ""}`}>
        <Icon size={24} />
      </span>
      <div className="flex flex-col items-center">
        <span className="text-[1.5rem] font-extrabold">{name}</span>
        <span className="text-[1.2rem] text-meta">{caption}</span>
      </div>
    </div>
  );

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-overlay animate-result-in">
      <div
        role="status"
        className="relative w-[38rem] max-w-[calc(100%-3.2rem)] px-[3.2rem] pt-[3.6rem] pb-[3.2rem] flex flex-col items-center gap-[2.4rem] rounded-card bg-surface shadow-frame animate-result-card"
      >
        <button
          type="button"
          aria-label="Close"
          onClick={() => setDismissed(gameResult)}
          className="absolute top-[1.4rem] right-[1.4rem] h-[3.6rem] w-[3.6rem] flex items-center justify-center rounded-[1.2rem] text-meta hover:text-title"
        >
          <MdOutlineClose size={18} />
        </button>

        <span
          className={`h-[7.2rem] w-[7.2rem] flex items-center justify-center rounded-full ring-[1.2rem] text-white text-[3rem] leading-none font-extrabold ${OUTCOMES[outcome].fill} ${OUTCOMES[outcome].halo}`}
        >
          <ResultIcon outcome={outcome} reason={gameResult.reason} />
        </span>

        <div className="flex flex-col items-center gap-[0.4rem] text-center">
          <span className="text-[3.2rem] leading-tight font-extrabold">{OUTCOMES[outcome].title}</span>
          <span className="text-[1.5rem] text-meta">{RESULT_REASONS[gameResult.reason]}</span>
        </div>

        <div className="w-full px-[1.6rem] py-[1.6rem] flex items-center gap-[1.2rem] rounded-[1.8rem] bg-surface shadow-inset">
          {buildPlayer(MdOutlinePerson, "You", player === "white" ? "White" : "Black", outcome === "win")}
          <span className="shrink-0 text-[2.6rem] font-extrabold tabular-nums">{OUTCOMES[outcome].score}</span>
          {mode === "room"
            ? buildPlayer(MdOutlineGroup, "Friend", opponent === "white" ? "White" : "Black", outcome === "loss")
            : buildPlayer(MdOutlineMemory, "Computer", DIFFICULTIES[difficulty].label, outcome === "loss")}
        </div>

        <span className="-mt-[0.8rem] text-[1.3rem] text-meta">
          {moveCount} {moveCount === 1 ? "move" : "moves"} · {minutes} min +{increment}
        </span>

        <div className="w-full flex gap-[1.2rem]">
          <button type="button" onClick={rematch} disabled={hasAsked} className={`${BUTTON} bg-action text-on-action shadow-action`}>
            <MdOutlineReplay size={18} />
            {hasAsked ? "Waiting…" : isAsked ? "Accept rematch" : "Rematch"}
          </button>
          <Link href="/" onClick={() => mode === "room" && leaveRoom()} className={`${BUTTON} bg-surface shadow-raise`}>
            <MdOutlineHome size={18} />
            New game
          </Link>
        </div>
      </div>
    </div>
  );
}
