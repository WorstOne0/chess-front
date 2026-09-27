"use client";

// Controllers
import { useGameController } from "@/core/controllers";
// Components
import { IconButton } from "@/components";
// Icons
import { MdOutlineChevronLeft, MdOutlineChevronRight, MdOutlineFirstPage, MdOutlineLastPage } from "react-icons/md";

// `wide` fills the studio moves card; `square` is the immersive bottom row.
export default function HistoryControls({ variant }: { variant: "wide" | "square" }) {
  const historyLength = useGameController((state) => state.history.length);
  const viewIndex = useGameController((state) => state.viewIndex);
  const viewMove = useGameController((state) => state.viewMove);

  const current = viewIndex ?? historyLength - 1;
  const size = variant === "wide" ? "wide" : "md";

  return (
    <div className={`flex gap-[1rem] ${variant === "wide" ? "w-full" : ""}`}>
      <IconButton Icon={MdOutlineFirstPage} label="First move" onClick={() => viewMove(-1)} size={size} isDisabled={current < 0} />
      <IconButton Icon={MdOutlineChevronLeft} label="Previous move" onClick={() => viewMove(current - 1)} size={size} isDisabled={current < 0} />
      <IconButton Icon={MdOutlineChevronRight} label="Next move" onClick={() => viewMove(current + 1)} size={size} isDisabled={viewIndex === null} />
      <IconButton Icon={MdOutlineLastPage} label="Last move" onClick={() => viewMove(null)} size={size} isDisabled={viewIndex === null} />
    </div>
  );
}
