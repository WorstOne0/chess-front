"use client";

// Next
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
// Controllers
import { useGameController, useSettingsController } from "@/core/controllers";
// Models
import { DIFFICULTIES, TIME_CONTROLS, type Difficulty, type TimeControl } from "@/core/models";
// Services
import { leaveRoom } from "@/services";
// Components
import { IconButton, LogoTile, Segmented, SettingsModal } from "@/components";
// Icons
import { MdOutlineAdd, MdOutlineGroup, MdOutlineMemory, MdOutlinePlayArrow, MdOutlineQrCode2, MdOutlineSchedule, MdOutlineSettings } from "react-icons/md";
import type { IconType } from "react-icons";

const DIFFICULTY_OPTIONS = (Object.keys(DIFFICULTIES) as Difficulty[]).map((value) => ({ value, label: DIFFICULTIES[value].label }));
const TIME_OPTIONS = (Object.keys(TIME_CONTROLS) as TimeControl[]).map((value) => ({ value, label: value.replace("+", " +") }));

const CARD = "h-[37.2rem] w-[48rem] p-[3.2rem] flex flex-col gap-[1.8rem] rounded-[2.8rem] bg-surface shadow-raise-lg";
const BUTTON = "h-[5.6rem] flex items-center justify-center gap-[1rem] rounded-[1.8rem] text-[1.7rem] font-extrabold active:shadow-inset";

export default function HomePage() {
  const router = useRouter();
  const difficulty = useSettingsController((state) => state.settings.difficulty);
  const timeControl = useSettingsController((state) => state.settings.timeControl);
  const isHydrated = useSettingsController((state) => state.isHydrated);
  const setSettings = useSettingsController((state) => state.setSettings);
  const newGame = useGameController((state) => state.newGame);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Home is outside every room, so whatever room this tab was in, it leaves
  useEffect(() => leaveRoom(), []);

  const startGame = () => {
    newGame({ difficulty, timeControl });
    router.push("/game");
  };

  const buildModeHeader = (Icon: IconType, title: string, subtitle: string) => (
    <div className="flex items-center gap-[1.6rem]">
      <div className="h-[5.6rem] w-[5.6rem] shrink-0 flex items-center justify-center rounded-[1.8rem] bg-surface shadow-inset">
        <Icon size={26} />
      </div>
      <div className="flex flex-col gap-[0.2rem]">
        <span className="text-[2.4rem] font-extrabold">{title}</span>
        <span className="text-[1.5rem] text-meta">{subtitle}</span>
      </div>
    </div>
  );

  return (
    <div className="h-full w-full px-[6.4rem] pt-[4rem] pb-[3.6rem] flex flex-col bg-background">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[1.4rem]">
          <LogoTile />
          <span className="text-[2.2rem] font-extrabold">Chess</span>
        </div>
        <IconButton Icon={MdOutlineSettings} label="Settings" onClick={() => setIsSettingsOpen(true)} size="lg" />
      </div>

      <div className="mt-[5.2rem] flex flex-col items-center gap-[0.8rem]">
        <h1 className="text-[4.4rem] font-extrabold tracking-[-0.05rem]">Play chess</h1>
        <p className="text-[1.8rem] text-meta">Pick a mode to start</p>
      </div>

      <div className="mt-[4rem] flex justify-center gap-[4.8rem]">
        <div className={CARD}>
          {buildModeHeader(MdOutlineMemory, "Single", "Play against the computer")}
          <div className="mt-[0.6rem] flex flex-col gap-[1rem]">
            <span className="label">Difficulty</span>
            {/* Nothing is picked until the saved choice is read, or Medium would flash first */}
            <Segmented options={DIFFICULTY_OPTIONS} value={isHydrated ? difficulty : undefined} onChange={(difficulty) => setSettings({ difficulty })} />
          </div>
          <button type="button" onClick={startGame} className={`mt-auto ${BUTTON} bg-action text-on-action shadow-action`}>
            <MdOutlinePlayArrow size={22} />
            Start game
          </button>
        </div>

        <div className={CARD}>
          {buildModeHeader(MdOutlineGroup, "Multiplayer", "Invite a friend to a private room")}
          <p className="mt-[0.6rem] text-[1.5rem] leading-[1.5] text-soft">Share the room by link, QR code or a 6-letter code. Your friend joins from any device.</p>
          <div className="mt-auto flex flex-col gap-[1.4rem]">
            <Link href={`/room/create?time=${encodeURIComponent(timeControl)}`} className={`${BUTTON} bg-action text-on-action shadow-action`}>
              <MdOutlineAdd size={20} />
              Create room
            </Link>
            <Link href="/room/join" className={`${BUTTON} bg-surface shadow-raise`}>
              <MdOutlineQrCode2 size={20} />
              Join with code
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-[4rem] flex flex-col items-center gap-[1.2rem]">
        <span className="label flex items-center gap-[0.8rem]">
          <MdOutlineSchedule size={16} />
          Time control
        </span>
        <Segmented options={TIME_OPTIONS} value={isHydrated ? timeControl : undefined} onChange={(timeControl) => setSettings({ timeControl })} tone="background" isFill={false} />
      </div>

      {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}
    </div>
  );
}
