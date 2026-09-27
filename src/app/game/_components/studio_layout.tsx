"use client";

// Controllers
import { useGameController, useRoomController } from "@/core/controllers";
// Models
import { DIFFICULTIES } from "@/core/models";
// Components
import { LogoTile } from "@/components";
import Board from "./board";
import Captured from "./captured";
import Clock from "./clock";
import GameActions from "./game_actions";
import HistoryControls from "./history_controls";
import MoveList from "./move_list";
import ViewControls from "./view_controls";
// Icons
import { MdOutlineGroup, MdOutlineMemory, MdOutlinePerson, MdOutlineSchedule } from "react-icons/md";
import type { IconType } from "react-icons";

// Height left after the padding, both player bars, their gaps and the frame; width after the rail and the moves card.
const BOARD_SIZE = "min(60.8rem, calc(100vh - 24rem), calc(100vw - 61.6rem))";

// Layout B: a rail on the left, the board between the two player bars, the moves card on the right.
export default function StudioLayout({ onOpenSettings }: { onOpenSettings: () => void }) {
  const player = useGameController((state) => state.player);
  const difficulty = useGameController((state) => state.difficulty);
  const timeControl = useGameController((state) => state.timeControl);
  const isFlipped = useGameController((state) => state.isFlipped);
  const mode = useGameController((state) => state.mode);
  const isOpponentOffline = useRoomController((state) => state.room?.isOpponentConnected === false);

  const isRoom = mode === "room";
  const bottomColor = isFlipped ? "black" : "white";
  const topColor = bottomColor === "white" ? "black" : "white";

  const buildRailTile = (Icon: IconType, label: string) => (
    <div className="h-[5.6rem] w-[5.6rem] flex flex-col items-center justify-center gap-[0.3rem] rounded-[1.8rem] bg-surface shadow-raise">
      <Icon size={20} />
      <span className="text-[1rem] font-extrabold tracking-[0.05rem] text-meta">{label}</span>
    </div>
  );

  const buildPlayerBar = (color: string) => {
    const isOpponent = color !== player;
    const colorName = color === "white" ? "White" : "Black";
    const detail = isOpponent && !isRoom ? DIFFICULTIES[difficulty].label : isOpponent && isOpponentOffline ? `${colorName} · offline` : colorName;

    return (
      <div className="flex items-center justify-between" style={{ width: `calc(${BOARD_SIZE} + 2.8rem)` }}>
        <div className="flex items-center gap-[1.4rem]">
          <div className="h-[5.2rem] w-[5.2rem] flex items-center justify-center rounded-[1.6rem] bg-tile shadow-tile">
            {isOpponent && !isRoom ? <MdOutlineMemory size={22} /> : <MdOutlinePerson size={22} />}
          </div>
          <div className="flex flex-col gap-[0.2rem]">
            <span className="text-[1.7rem] font-extrabold">
              {isOpponent ? (isRoom ? "Friend" : "Computer") : isRoom ? "You" : "Player"}
              <span className="font-bold text-meta"> · {detail}</span>
            </span>
            <Captured by={color} />
          </div>
        </div>
        <Clock color={color} variant="bar" />
      </div>
    );
  };

  return (
    <div className="h-full w-full px-[4rem] py-[2.8rem] flex gap-[3.2rem] bg-background">
      <div className="w-[7.2rem] shrink-0 flex flex-col items-center gap-[1.6rem]">
        <LogoTile size="lg" />
        <span className="my-[0.6rem] h-px w-[3.2rem] bg-line" />
        {isRoom ? buildRailTile(MdOutlineGroup, "Room") : buildRailTile(MdOutlineMemory, "PC")}
        {buildRailTile(MdOutlineSchedule, timeControl)}
        <div className="mt-auto">
          <ViewControls direction="column" onOpenSettings={onOpenSettings} />
        </div>
      </div>

      <div className="min-w-0 flex-1 flex flex-col items-center justify-between">
        {buildPlayerBar(topColor)}
        <Board size={BOARD_SIZE} />
        {buildPlayerBar(bottomColor)}
      </div>

      <div className="w-[37.2rem] shrink-0 p-[2.4rem] flex flex-col gap-[1.6rem] rounded-card bg-surface shadow-raise-lg">
        <MoveList />
        <HistoryControls variant="wide" />
        <GameActions variant="wide" />
      </div>
    </div>
  );
}
