"use client";

// Next
import { use, useEffect, useState } from "react";
import Link from "next/link";
// Controllers
import { useGameController, useRoomController, useSettingsController } from "@/core/controllers";
// Hooks
import { useRoom } from "@/hooks";
import { useMoveSounds } from "./_hooks/use_move_sounds";
// Components
import { SettingsModal } from "@/components";
import ImmersiveLayout from "./_components/immersive_layout";
import StudioLayout from "./_components/studio_layout";

// ?room=CODE plays that room; ?fen=… starts a computer game from a position, handy for testing an ending.
export default function GamePage({ searchParams }: { searchParams: Promise<{ fen?: string; room?: string }> }) {
  const query = use(searchParams);
  const startFen = query.fen;
  const roomCode = query.room?.toUpperCase();

  const layout = useSettingsController((state) => state.settings.layout);
  const isHydrated = useSettingsController((state) => state.isHydrated);
  const mode = useGameController((state) => state.mode);
  const newGame = useGameController((state) => state.newGame);
  const syncRoom = useGameController((state) => state.syncRoom);
  const tick = useGameController((state) => state.tick);
  const room = useRoomController((state) => state.room);
  const roomError = useRoomController((state) => state.error);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useMoveSounds();
  useRoom(roomCode ?? null);

  // A room game follows the server's snapshot, the opponent's moves included
  useEffect(() => {
    if (roomCode && room?.code === roomCode) syncRoom(room);
  }, [roomCode, room, syncRoom]);

  // A computer game started from home carries on; opening /game directly (a reload, ?fen=) starts one from the saved setup
  useEffect(() => {
    if (!isHydrated || roomCode) return;

    const { isStarted, mode } = useGameController.getState();
    if (isStarted && mode === "computer" && !startFen) return;

    const { difficulty, timeControl } = useSettingsController.getState().settings;
    newGame({ difficulty, timeControl, fen: startFen });
  }, [isHydrated, newGame, roomCode, startFen]);

  useEffect(() => {
    const interval = setInterval(tick, 100);

    return () => clearInterval(interval);
  }, [tick]);

  // The saved layout is only known once the settings rehydrate, a frame after mount
  if (!isHydrated) return null;

  if (roomCode && mode !== "room") {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-[2rem] bg-background">
        <span className="text-[1.8rem] font-bold text-meta">{roomError ?? `Joining room ${roomCode}…`}</span>
        {roomError && (
          <Link href="/" className="h-[4.8rem] px-[2.2rem] flex items-center rounded-[1.4rem] bg-surface shadow-raise text-[1.5rem] font-extrabold active:shadow-inset">
            Back home
          </Link>
        )}
      </div>
    );
  }

  const openSettings = () => setIsSettingsOpen(true);

  return (
    <>
      {layout === "immersive" ? <ImmersiveLayout onOpenSettings={openSettings} /> : <StudioLayout onOpenSettings={openSettings} />}
      {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}
    </>
  );
}
