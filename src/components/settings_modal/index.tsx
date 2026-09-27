/* eslint-disable @next/next/no-img-element */
"use client";

// Next
import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
// Controllers
import { useSettingsController } from "@/core/controllers";
// Models
import { BOARD_THEMES, LAYOUTS, PIECE_SETS, THEMES, pieceSrc, type BoardTheme, type Layout, type PieceSet, type Theme } from "@/core/models";
// Components
import IconButton from "../icon_button";
import Segmented from "../segmented";
// Icons
import { MdOutlineCheck, MdOutlineClose } from "react-icons/md";

const THEME_OPTIONS = (Object.keys(THEMES) as Theme[]).map((value) => ({ value, label: THEMES[value].label }));
const LAYOUT_OPTIONS = (Object.keys(LAYOUTS) as Layout[]).map((value) => ({ value, label: LAYOUTS[value].label }));
const PREVIEW_PIECES = [
  { color: "white", type: "king" },
  { color: "black", type: "queen" },
  { color: "white", type: "knight" },
];

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const settings = useSettingsController((state) => state.settings);
  const setSettings = useSettingsController((state) => state.setSettings);
  const { resolvedTheme, setTheme } = useTheme();

  // Every pick previews live; Cancel puts back what was there when the modal opened
  const [initial] = useState(() => ({ settings, theme: resolvedTheme }));
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();

    return () => dialog?.close();
  }, []);

  const cancel = () => {
    setSettings(initial.settings);
    setTheme(initial.theme ?? "charcoal");
    onClose();
  };

  const buildTile = ({ key, label, isSelected, onClick, preview }: { key: string; label: string; isSelected: boolean; onClick: () => void; preview: React.ReactNode }) => (
    <button
      key={key}
      type="button"
      aria-pressed={isSelected}
      onClick={onClick}
      className={`px-[1.2rem] pt-[1.4rem] pb-[1.2rem] flex flex-col items-center gap-[1rem] rounded-[1.8rem] bg-surface ${isSelected ? "shadow-raise ring-[0.25rem] ring-accent" : "shadow-inset"}`}
    >
      {preview}
      <span className="text-[1.4rem] font-extrabold">{label}</span>
    </button>
  );

  const buildToggle = (key: "showCoordinates" | "highlightLastMove" | "isSoundOn", label: string) => (
    <button
      type="button"
      aria-pressed={settings[key]}
      onClick={() => setSettings({ [key]: !settings[key] })}
      className="h-[6rem] px-[1.6rem] flex items-center justify-between gap-[1.2rem] rounded-[1.6rem] bg-surface shadow-inset text-[1.5rem] font-bold text-left"
    >
      {label}
      <span className={`h-[2.6rem] w-[4.6rem] shrink-0 p-[0.3rem] flex rounded-full shadow-inset ${settings[key] ? "justify-end bg-accent" : "justify-start bg-black/30"}`}>
        <span className="h-[2rem] w-[2rem] rounded-full bg-title shadow-[0_0.2rem_0.4rem_rgb(0_0_0/0.4)]" />
      </span>
    </button>
  );

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="settings-title"
      onCancel={(event) => {
        // Esc is Cancel too, so the preview is put back rather than kept
        event.preventDefault();
        cancel();
      }}
      className="m-auto w-[80rem] max-w-[calc(100vw-4rem)] max-h-[calc(100vh-4rem)] px-[3.6rem] py-[3.2rem] open:flex flex-col gap-[2.6rem] rounded-[2.8rem] bg-surface text-title shadow-frame backdrop:bg-overlay overflow-y-auto scrollbar-thin"
    >
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-[0.2rem]">
          <h1 id="settings-title" className="text-[2.6rem] font-extrabold">
            Settings
          </h1>
          <span className="text-[1.4rem] text-meta">Changes preview as you pick them</span>
        </div>
        <IconButton Icon={MdOutlineClose} label="Close" onClick={cancel} size="sm" />
      </div>

      <div className="grid grid-cols-2 gap-[1.6rem]">
        <div className="flex flex-col gap-[1.2rem]">
          <span className="label">Theme</span>
          <Segmented options={THEME_OPTIONS} value={resolvedTheme as Theme} onChange={setTheme} />
        </div>
        <div className="flex flex-col gap-[1.2rem]">
          <span className="label">Layout</span>
          <Segmented options={LAYOUT_OPTIONS} value={settings.layout} onChange={(layout) => setSettings({ layout })} />
        </div>
      </div>

      <div className="flex flex-col gap-[1.2rem]">
        <span className="label">Board theme</span>
        <div className="grid grid-cols-4 gap-[1.6rem]">
          {(Object.keys(BOARD_THEMES) as BoardTheme[]).map((boardTheme) =>
            buildTile({
              key: boardTheme,
              label: BOARD_THEMES[boardTheme].label,
              isSelected: settings.boardTheme === boardTheme,
              onClick: () => setSettings({ boardTheme }),
              preview: (
                <span data-board={boardTheme} className="h-[6.4rem] w-[6.4rem] grid grid-cols-2 rounded-[1rem] overflow-hidden shadow-[0_0.2rem_0.6rem_rgb(0_0_0/0.35)]">
                  <span className="bg-square-light" />
                  <span className="bg-square-dark" />
                  <span className="bg-square-dark" />
                  <span className="bg-square-light" />
                </span>
              ),
            })
          )}
        </div>
      </div>

      <div className="flex flex-col gap-[1.2rem]">
        <span className="label">Piece style</span>
        <div className="grid grid-cols-5 gap-[1.6rem]">
          {(Object.keys(PIECE_SETS) as PieceSet[]).map((pieceSet) =>
            buildTile({
              key: pieceSet,
              label: PIECE_SETS[pieceSet].label,
              isSelected: settings.pieceSet === pieceSet,
              onClick: () => setSettings({ pieceSet }),
              preview: (
                <span data-board={settings.boardTheme} className="h-[5.6rem] w-full flex items-center justify-center rounded-[1rem] bg-square-dark">
                  {PREVIEW_PIECES.map((piece) => (
                    <img key={`${piece.color}_${piece.type}`} src={pieceSrc(pieceSet, piece.color, piece.type)} alt="" className="h-[4rem] w-[4rem]" />
                  ))}
                </span>
              ),
            })
          )}
        </div>
        <span className="text-[1.2rem] text-faint">Modern, Bold and Minimal by sadsnake1 (CC BY-NC-SA 4.0) · Classic by Colin M.L. Burnett (GPLv2+)</span>
      </div>

      <div className="grid grid-cols-3 gap-[1.6rem]">
        {buildToggle("showCoordinates", "Coordinates")}
        {buildToggle("highlightLastMove", "Last move highlight")}
        {buildToggle("isSoundOn", "Sounds")}
      </div>

      <div className="pt-[0.6rem] flex justify-end gap-[1.4rem]">
        <button type="button" onClick={cancel} className="h-[5.2rem] px-[2.6rem] rounded-[1.6rem] bg-surface shadow-raise text-[1.6rem] font-extrabold active:shadow-inset">
          Cancel
        </button>
        <button
          type="button"
          onClick={onClose}
          className="h-[5.2rem] px-[3rem] flex items-center gap-[1rem] rounded-[1.6rem] bg-action text-on-action shadow-action text-[1.6rem] font-extrabold active:shadow-inset"
        >
          <MdOutlineCheck size={18} />
          Save
        </button>
      </div>
    </dialog>
  );
}
