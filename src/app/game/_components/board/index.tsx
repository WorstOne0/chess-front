"use client";

// Next
import { useMemo, useRef, useState } from "react";
import { DndContext, DragEndEvent, DragStartEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { snapCenterToCursor } from "@dnd-kit/modifiers";
// Controllers
import { useGameController, useSettingsController } from "@/core/controllers";
// Models
import { START_FEN, isSameSquare, type Arrow, type Position } from "@/core/models";
// Utils
import { buildBoard } from "@/utils";
// Components
import Arrows from "./components/arrows";
import GameOver from "./components/game_over";
import Promotion from "./components/promotion";
import Square from "./components/square";

const FILES = "abcdefgh";
const INDEXES = [0, 1, 2, 3, 4, 5, 6, 7];

// `size` is the CSS length of one side; each layout works it out from the viewport.
export default function Board({ size }: { size: string }) {
  const board = useGameController((state) => state.board);
  const history = useGameController((state) => state.history);
  const viewIndex = useGameController((state) => state.viewIndex);
  const isFlipped = useGameController((state) => state.isFlipped);
  const premove = useGameController((state) => state.premove);
  const arrows = useGameController((state) => state.arrows);
  const marks = useGameController((state) => state.marks);
  const selectPiece = useGameController((state) => state.selectPiece);
  const makeMove = useGameController((state) => state.makeMove);
  const toggleArrow = useGameController((state) => state.toggleArrow);
  const toggleMark = useGameController((state) => state.toggleMark);
  const clearPremove = useGameController((state) => state.clearPremove);
  const boardTheme = useSettingsController((state) => state.settings.boardTheme);
  const showCoordinates = useSettingsController((state) => state.settings.showCoordinates);
  const highlightLastMove = useSettingsController((state) => state.settings.highlightLastMove);

  const gridRef = useRef<HTMLDivElement>(null);
  // The arrow being drawn with the right button, from where it was pressed to where the pointer is
  const [drawing, setDrawing] = useState<Arrow | null>(null);

  // Without a distance the sensor drags on pointerdown, so a plain click fires drag start, drag end and click
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), useSensor(KeyboardSensor));

  // Browsing the moves shows a past position; moves only ever happen on the live board
  const shownBoard = useMemo(() => {
    if (viewIndex === null) return board;
    return buildBoard({ fen: viewIndex === -1 ? START_FEN : history[viewIndex].fen });
  }, [board, history, viewIndex]);

  const lastMove = highlightLastMove ? (viewIndex === null ? history.at(-1) : history[viewIndex]) : undefined;
  const order = isFlipped ? [...INDEXES].reverse() : INDEXES;
  const shownArrows = drawing && !isSameSquare(drawing.from, drawing.to) ? [...arrows, drawing] : arrows;

  const isOn = (arrow: Arrow | undefined, square: Position) => !!arrow && (isSameSquare(arrow.from, square) || isSameSquare(arrow.to, square));

  // The square under the pointer, in board coordinates whichever way the board is turned
  const squareAt = (event: React.PointerEvent) => {
    const rect = gridRef.current!.getBoundingClientRect();
    const column = Math.floor(((event.clientX - rect.left) / rect.width) * 8);
    const row = Math.floor(((event.clientY - rect.top) / rect.height) * 8);
    if (column < 0 || column > 7 || row < 0 || row > 7) return null;

    return isFlipped ? { row: 7 - row, column: 7 - column } : { row, column };
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const square = event.button === 2 ? squareAt(event) : null;
    if (!square) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    setDrawing({ from: square, to: square });
  };

  const onPointerMove = (event: React.PointerEvent) => {
    const square = drawing ? squareAt(event) : null;
    if (drawing && square && !isSameSquare(square, drawing.to)) setDrawing({ ...drawing, to: square });
  };

  // A right click cancels a premove first, like chess.com; otherwise it marks a square or draws the arrow
  const onPointerUp = (event: React.PointerEvent) => {
    if (event.button !== 2 || !drawing) return;
    setDrawing(null);

    if (premove) return clearPremove();
    if (isSameSquare(drawing.from, drawing.to)) return toggleMark(drawing.from);

    toggleArrow(drawing);
  };

  return (
    <DndContext
      id="chess-board"
      sensors={sensors}
      modifiers={[snapCenterToCursor]}
      onDragStart={(event: DragStartEvent) => selectPiece(event.active.data.current?.piece)}
      onDragEnd={(event: DragEndEvent) => makeMove(event.over?.data.current?.position)}
    >
      <div className="shrink-0 p-[1.4rem] rounded-[2.2rem] bg-surface shadow-frame">
        <div
          ref={gridRef}
          data-board={boardTheme}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onContextMenu={(event) => event.preventDefault()}
          className="relative grid grid-cols-8 grid-rows-8 rounded-[0.8rem] overflow-hidden bg-board-edge shadow-xl/20 select-none"
          style={{ width: size, height: size }}
        >
          {order.map((row, shownRow) =>
            order.map((column, shownColumn) => {
              const square = { row, column };

              return (
                <Square
                  key={`${row}_${column}`}
                  row={row}
                  column={column}
                  piece={shownBoard.board[row][column]}
                  rank={showCoordinates && shownColumn === 0 ? 8 - row : undefined}
                  file={showCoordinates && shownRow === 7 ? FILES[column] : undefined}
                  isLastMove={isOn(lastMove, square)}
                  isPremove={isOn(premove, square)}
                  isMarked={marks.some((mark) => isSameSquare(mark, square))}
                />
              );
            })
          )}

          <Arrows arrows={shownArrows} isFlipped={isFlipped} />
          <Promotion />
          <GameOver />
        </div>
      </div>
    </DndContext>
  );
}
