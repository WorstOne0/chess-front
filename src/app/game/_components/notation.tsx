/* eslint-disable @next/next/no-img-element */
"use client";

// Controllers
import { useSettingsController } from "@/core/controllers";
// Models
import { pieceSrc } from "@/core/models";

const TYPES: Record<string, string> = { K: "king", Q: "queen", R: "rook", B: "bishop", N: "knight" };

// A piece move shows its figurine instead of the letter: Nf3 reads as a knight and f3.
export default function Notation({ text }: { text: string }) {
  const pieceSet = useSettingsController((state) => state.settings.pieceSet);

  const type = TYPES[text[0]];
  if (!type) return <span>{text}</span>;

  return (
    <span className="inline-flex items-center gap-[0.2rem]">
      <img src={pieceSrc(pieceSet, "white", type)} alt={type} className="h-[2.2rem] w-[2.2rem]" />
      {text.slice(1)}
    </span>
  );
}
