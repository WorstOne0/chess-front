"use client";

// Next
import { useEffect, useRef } from "react";
// Controllers
import { useGameController } from "@/core/controllers";
// Components
import Notation from "./notation";

// The immersive layout's moves: one chip per full move along the bottom, the chip on screen raised.
export default function MoveStrip() {
  const history = useGameController((state) => state.history);
  const viewIndex = useGameController((state) => state.viewIndex);
  const viewMove = useGameController((state) => state.viewMove);
  const stripRef = useRef<HTMLDivElement>(null);

  const currentRow = Math.floor((viewIndex ?? history.length - 1) / 2);
  const rows = Array.from({ length: Math.ceil(history.length / 2) }, (_, row) => history.slice(row * 2, row * 2 + 2));

  useEffect(() => {
    stripRef.current?.scrollTo({ left: stripRef.current.scrollWidth });
  }, [history.length]);

  return (
    <div ref={stripRef} className="h-[6.4rem] min-w-0 flex-1 p-[0.8rem] flex items-center gap-[0.8rem] rounded-[1.8rem] bg-background shadow-inset overflow-x-auto scrollbar-thin">
      {history.length === 0 && <span className="px-[1.2rem] text-[1.4rem] text-faint">White to move</span>}

      {rows.map((moves, row) => (
        <div
          key={row}
          className={`h-[4.8rem] shrink-0 px-[1.4rem] flex items-center gap-[0.8rem] rounded-[1.2rem] ${row === currentRow ? "bg-action text-on-action shadow-action" : ""}`}
        >
          <span className={`text-[1.2rem] font-bold ${row === currentRow ? "opacity-70" : "text-meta"}`}>{row + 1}.</span>
          {moves.map((move, index) => (
            <button key={index} type="button" onClick={() => viewMove(row * 2 + index)} className="text-[1.5rem] font-extrabold">
              <Notation text={move.notation} />
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
