"use client";

// Next
import { useState } from "react";
import Link from "next/link";
// Controllers
import { useGameController, useRoomController } from "@/core/controllers";
// Services
import { leaveRoom } from "@/services";
// Icons
import { MdOutlineContrast, MdOutlineFlag, MdOutlineHome, MdOutlineReplay } from "react-icons/md";

// Draw and Resign while playing, Rematch and Home once it is over. `wide` splits the moves card, `fixed` sits in the bottom row.
export default function GameActions({ variant }: { variant: "wide" | "fixed" }) {
  const isOver = useGameController((state) => state.gameResult.over);
  const mode = useGameController((state) => state.mode);
  const player = useGameController((state) => state.player);
  const offerDraw = useGameController((state) => state.offerDraw);
  const resign = useGameController((state) => state.resign);
  const rematch = useGameController((state) => state.rematch);
  const drawOffer = useRoomController((state) => state.room?.drawOffer ?? null);
  const rematchAsks = useRoomController((state) => state.room?.rematch);

  const [drawState, setDrawState] = useState<"idle" | "asking" | "declined">("idle");
  const [isConfirmingResign, setIsConfirmingResign] = useState(false);

  const button = `h-[5.2rem] ${variant === "wide" ? "min-w-0 flex-1" : "w-[12rem]"} flex items-center justify-center gap-[1rem] rounded-[1.6rem] text-[1.6rem] font-extrabold active:shadow-inset disabled:opacity-60`;
  const isRoom = mode === "room";
  const hasAskedRematch = isRoom && !!rematchAsks?.includes(player);

  // The computer answers at once; in a room the offer waits for the opponent, and their move declines it
  const onDraw = async () => {
    if (isRoom) return offerDraw();

    setDrawState("asking");
    if (await offerDraw()) return setDrawState("idle");

    setDrawState("declined");
    setTimeout(() => setDrawState("idle"), 2000);
  };

  const drawLabel = isRoom ? (drawOffer === player ? "Offered" : drawOffer ? "Accept draw" : "Draw") : drawState === "declined" ? "Declined" : "Draw";

  // The first click only arms it, so a stray click cannot end the game
  const onResign = () => {
    if (isConfirmingResign) {
      setIsConfirmingResign(false);
      return resign();
    }

    setIsConfirmingResign(true);
    setTimeout(() => setIsConfirmingResign(false), 3000);
  };

  if (isOver) {
    return (
      <div className="flex gap-[1.2rem]">
        <button type="button" onClick={rematch} disabled={hasAskedRematch} className={`${button} bg-action text-on-action shadow-action`}>
          <MdOutlineReplay size={18} />
          {hasAskedRematch ? "Waiting…" : "Rematch"}
        </button>
        <Link href="/" onClick={() => isRoom && leaveRoom()} className={`${button} bg-surface shadow-raise`}>
          <MdOutlineHome size={18} />
          Home
        </Link>
      </div>
    );
  }

  return (
    <div className="flex gap-[1.2rem]">
      <button
        type="button"
        onClick={onDraw}
        disabled={isRoom ? drawOffer === player : drawState !== "idle"}
        className={`${button} ${isRoom && drawOffer && drawOffer !== player ? "bg-action text-on-action shadow-action" : "bg-surface shadow-raise"}`}
      >
        <MdOutlineContrast size={18} />
        {drawLabel}
      </button>
      <button type="button" onClick={onResign} className={`${button} bg-action text-on-action shadow-action`}>
        <MdOutlineFlag size={18} />
        {isConfirmingResign ? "Confirm" : "Resign"}
      </button>
    </div>
  );
}
