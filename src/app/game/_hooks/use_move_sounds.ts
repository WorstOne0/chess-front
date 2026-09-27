"use client";

// Next
import { useEffect } from "react";
import useSound from "use-sound";
// Controllers
import { useGameController, useSettingsController } from "@/core/controllers";

// First match wins, so a checking capture sounds as a check and a capturing promotion as a promotion.
const SOUNDS = [
  { pattern: /[+#]$/, sound: "check" },
  { pattern: /=/, sound: "promote" },
  { pattern: /^O-O/, sound: "castle" },
  { pattern: /x/, sound: "capture" },
];

// One sound per move added to the game, the computer's included; browsing the history stays silent.
export const useMoveSounds = () => {
  const [playMove] = useSound("/sound/move-self.mp3");
  const [playCapture] = useSound("/sound/capture.mp3");
  const [playCheck] = useSound("/sound/move-check.mp3");
  const [playPromote] = useSound("/sound/promote.mp3");
  const [playCastle] = useSound("/sound/castle.mp3");

  useEffect(() => {
    const players: Record<string, () => void> = { move: playMove, capture: playCapture, check: playCheck, promote: playPromote, castle: playCastle };

    return useGameController.subscribe((state, previous) => {
      const move = state.history.at(-1);
      if (!move || state.history.length <= previous.history.length || !useSettingsController.getState().settings.isSoundOn) return;

      players[SOUNDS.find(({ pattern }) => pattern.test(move.notation))?.sound ?? "move"]();
    });
  }, [playMove, playCapture, playCheck, playPromote, playCastle]);
};
