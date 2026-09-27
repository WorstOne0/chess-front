"use client";

// Next
import { useEffect, useRef } from "react";
// Controllers
import { useGameController } from "@/core/controllers";
// Components
import Notation from "./notation";

// The studio layout's moves card: one row per full move, the row on screen raised.
export default function MoveList() {
  const history = useGameController((state) => state.history);
  const viewIndex = useGameController((state) => state.viewIndex);
  const viewMove = useGameController((state) => state.viewMove);
  const listRef = useRef<HTMLDivElement>(null);

  const currentRow = Math.floor((viewIndex ?? history.length - 1) / 2);
  const rows = Array.from({ length: Math.ceil(history.length / 2) }, (_, row) => history.slice(row * 2, row * 2 + 2));

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [history.length]);

  return (
    <div className="min-h-0 flex-1 flex flex-col gap-[1.6rem]">
      <div className="px-[0.4rem] flex items-baseline justify-between">
        <span className="text-[1.8rem] font-extrabold">Moves</span>
        <span className="text-[1.3rem] text-meta">{history.length} moves</span>
      </div>

      <div ref={listRef} className="min-h-0 flex-1 p-[1rem] flex flex-col gap-[0.2rem] rounded-[1.8rem] bg-background shadow-inset overflow-y-auto scrollbar-thin">
        {history.length === 0 && <span className="m-auto text-[1.4rem] text-faint">White to move</span>}

        {rows.map((moves, row) => (
          <div
            key={row}
            className={`h-[3.8rem] shrink-0 px-[1.2rem] grid grid-cols-[4rem_1fr_1fr] items-center rounded-[1rem] ${row === currentRow ? "bg-action text-on-action shadow-action" : ""}`}
          >
            <span className={`text-[1.3rem] font-bold ${row === currentRow ? "opacity-70" : "text-faint"}`}>{row + 1}.</span>
            {moves.map((move, index) => (
              <button key={index} type="button" onClick={() => viewMove(row * 2 + index)} className="justify-self-start text-[1.6rem] font-bold">
                <Notation text={move.notation} />
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
