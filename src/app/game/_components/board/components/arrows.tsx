// Models
import type { Arrow, Position } from "@/core/models";

const SHAFT = 0.18;
const HEAD_LENGTH = 0.42;
const HEAD_WIDTH = 0.46;

// Right-click arrows drawn over the board, one square per unit; a knight's jump bends along its long leg first.
export default function Arrows({ arrows, isFlipped }: { arrows: Arrow[]; isFlipped: boolean }) {
  const center = (position: Position) => ({
    x: (isFlipped ? 7 - position.column : position.column) + 0.5,
    y: (isFlipped ? 7 - position.row : position.row) + 0.5,
  });

  const buildArrow = (arrow: Arrow) => {
    const start = center(arrow.from);
    const end = center(arrow.to);
    const across = Math.abs(end.x - start.x);
    const down = Math.abs(end.y - start.y);
    const isKnight = (across === 1 && down === 2) || (across === 2 && down === 1);
    const corner = isKnight ? (down === 2 ? { x: start.x, y: end.y } : { x: end.x, y: start.y }) : undefined;

    // The head points along the last leg, and the shaft stops where the head begins
    const legStart = corner ?? start;
    const length = Math.hypot(end.x - legStart.x, end.y - legStart.y);
    const unit = { x: (end.x - legStart.x) / length, y: (end.y - legStart.y) / length };
    const neck = { x: end.x - unit.x * HEAD_LENGTH, y: end.y - unit.y * HEAD_LENGTH };
    const side = { x: -unit.y * (HEAD_WIDTH / 2), y: unit.x * (HEAD_WIDTH / 2) };

    const shaft = [start, ...(corner ? [corner] : []), neck].map((point) => `${point.x},${point.y}`).join(" ");
    const head = `${neck.x + side.x},${neck.y + side.y} ${end.x},${end.y} ${neck.x - side.x},${neck.y - side.y}`;

    return (
      <g key={`${arrow.from.row}${arrow.from.column}${arrow.to.row}${arrow.to.column}`} opacity={0.8}>
        <polyline points={shaft} fill="none" strokeWidth={SHAFT} strokeLinejoin="round" className="stroke-arrow" />
        <polygon points={head} className="fill-arrow" />
      </g>
    );
  };

  return (
    <svg viewBox="0 0 8 8" aria-hidden="true" className="pointer-events-none absolute inset-0 z-30 h-full w-full">
      {arrows.map(buildArrow)}
    </svg>
  );
}
