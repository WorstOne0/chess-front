"use client";

// Controllers
import { useGameController, useSettingsController } from "@/core/controllers";
// Components
import { IconButton } from "@/components";
// Icons
import { MdOutlineCached, MdOutlineSettings, MdOutlineVolumeOff, MdOutlineVolumeUp } from "react-icons/md";

// Settings, flip and sound: a column in the studio rail, a row in the immersive top bar.
export default function ViewControls({ direction, onOpenSettings }: { direction: "row" | "column"; onOpenSettings: () => void }) {
  const flipBoard = useGameController((state) => state.flipBoard);
  const isSoundOn = useSettingsController((state) => state.settings.isSoundOn);
  const setSettings = useSettingsController((state) => state.setSettings);

  const size = direction === "column" ? "lg" : "md";

  return (
    <div className={`flex ${direction === "column" ? "flex-col gap-[1.6rem]" : "gap-[1.4rem]"}`}>
      <IconButton Icon={MdOutlineSettings} label="Settings" onClick={onOpenSettings} size={size} />
      <IconButton Icon={MdOutlineCached} label="Flip board" onClick={flipBoard} size={size} />
      <IconButton
        Icon={isSoundOn ? MdOutlineVolumeUp : MdOutlineVolumeOff}
        label={isSoundOn ? "Mute sounds" : "Turn sounds on"}
        onClick={() => setSettings({ isSoundOn: !isSoundOn })}
        size={size}
      />
    </div>
  );
}
