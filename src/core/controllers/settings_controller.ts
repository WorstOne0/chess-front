// Next
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
// Models
import { TIME_CONTROLS, type BoardTheme, type Difficulty, type Layout, type PieceSet, type TimeControl } from "@/core/models";

type Settings = {
  layout: Layout;
  boardTheme: BoardTheme;
  pieceSet: PieceSet;
  showCoordinates: boolean;
  highlightLastMove: boolean;
  isSoundOn: boolean;
  difficulty: Difficulty;
  timeControl: TimeControl;
};

// The theme is not here: next-themes saves it.
type SettingsController = {
  settings: Settings;
  isHydrated: boolean;
  setSettings: (settings: Partial<Settings>) => void;
  setIsHydrated: (isHydrated: boolean) => void;
};

const DEFAULT_SETTINGS: Settings = {
  layout: "studio",
  boardTheme: "classic",
  pieceSet: "neo",
  showCoordinates: true,
  highlightLastMove: true,
  isSoundOn: true,
  difficulty: "medium",
  timeControl: "3+0",
};

export const useSettingsController = create<SettingsController>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      isHydrated: false,
      setSettings: (settings) => set((state) => ({ settings: { ...state.settings, ...settings } })),
      setIsHydrated: (isHydrated) => set({ isHydrated }),
    }),
    {
      name: "chess_settings",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ settings: state.settings }),
      // Saved values go over the defaults, so a setting added later still has one on an older save
      merge: (saved, current) => {
        const settings = { ...current.settings, ...(saved as { settings?: Partial<Settings> } | undefined)?.settings };

        // A time control that no longer exists (1+0 became 1+1) would break every TIME_CONTROLS lookup
        if (!(settings.timeControl in TIME_CONTROLS)) settings.timeControl = current.settings.timeControl;

        return { ...current, settings };
      },
      // Read in providers.tsx after mount: reading at import makes the first client render differ from the server's.
      skipHydration: true,
      onRehydrateStorage: () => (state) => state?.setIsHydrated(true),
    }
  )
);
