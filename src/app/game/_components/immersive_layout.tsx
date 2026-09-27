"use client";

// Controllers
import { useGameController, useRoomController } from "@/core/controllers";
// Models
import { DIFFICULTIES, TIME_CONTROLS } from "@/core/models";
// Components
import { Chip, LogoTile } from "@/components";
import Board from "./board";
import Captured from "./captured";
import Clock from "./clock";
import GameActions from "./game_actions";
import HistoryControls from "./history_controls";
import MoveStrip from "./move_strip";
import ViewControls from "./view_controls";
// Icons
import { MdOutlineGroup, MdOutlineMemory, MdOutlinePerson, MdOutlineSchedule } from "react-icons/md";

// Height left after the padding, the top bar, the bottom row, their gaps and the frame; width after both player cards.
const BOARD_SIZE = "min(57.6rem, calc(100vh - 24.4rem), calc(100vw - 78.8rem))";

// Layout C: a top bar, the board between two player cards, and the moves as a strip along the bottom.
export default function ImmersiveLayout({ onOpenSettings }: { onOpenSettings: () => void }) {
  const player = useGameController((state) => state.player);
  const difficulty = useGameController((state) => state.difficulty);
  const timeControl = useGameController((state) => state.timeControl);
  const isFlipped = useGameController((state) => state.isFlipped);
  const mode = useGameController((state) => state.mode);
  const roomCode = useRoomController((state) => state.room?.code);
  const isOpponentOffline = useRoomController((state) => state.room?.isOpponentConnected === false);

  const isRoom = mode === "room";
  const bottomColor = isFlipped ? "black" : "white";
  const topColor = bottomColor === "white" ? "black" : "white";
  const { minutes, increment } = TIME_CONTROLS[timeControl];

  const buildPlayerCard = (color: string) => {
    const isOpponent = color !== player;

    return (
      <div className="w-[28rem] shrink-0 p-[2.4rem] flex flex-col gap-[1.8rem] rounded-card bg-surface shadow-raise-lg">
        <div className="flex items-center gap-[1.4rem]">
          <div className="h-[5.6rem] w-[5.6rem] flex items-center justify-center rounded-[1.8rem] bg-tile shadow-tile">
            {isOpponent && !isRoom ? <MdOutlineMemory size={24} /> : <MdOutlinePerson size={24} />}
          </div>
          <div className="flex flex-col gap-[0.2rem]">
            <span className="text-[1.8rem] font-extrabold">{isOpponent ? (isRoom ? "Friend" : "Computer") : isRoom ? "You" : "Player"}</span>
            <span className="text-[1.4rem] text-meta">
              {color === "white" ? "White" : "Black"}
              {isOpponent && !isRoom && ` · ${DIFFICULTIES[difficulty].label}`}
              {isOpponent && isRoom && isOpponentOffline && " · offline"}
            </span>
          </div>
        </div>
        <Clock color={color} variant="card" />
        <div className="px-[0.4rem] flex items-center justify-between">
          <span className="label">Captured</span>
          <Captured by={color} />
        </div>
      </div>
    );
  };

  return (
    <div className="h-full w-full px-[5.6rem] py-[2.8rem] flex flex-col gap-[2.4rem] bg-background">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[1.4rem]">
          <LogoTile />
          {isRoom ? (
            <Chip Icon={MdOutlineGroup} label={`Room · ${roomCode}`} />
          ) : (
            <Chip Icon={MdOutlineMemory} label={`Single · ${DIFFICULTIES[difficulty].label}`} />
          )}
          <Chip Icon={MdOutlineSchedule} label={`${minutes} min +${increment}`} />
        </div>
        <ViewControls direction="row" onOpenSettings={onOpenSettings} />
      </div>

      <div className="min-h-0 flex-1 flex items-center justify-center gap-[4.4rem]">
        {buildPlayerCard(topColor)}
        <Board size={BOARD_SIZE} />
        {buildPlayerCard(bottomColor)}
      </div>

      <div className="flex items-center gap-[1.4rem]">
        <MoveStrip />
        <HistoryControls variant="square" />
        <span className="mx-[0.4rem] h-[3.6rem] w-px bg-line" />
        <GameActions variant="fixed" />
      </div>
    </div>
  );
}
