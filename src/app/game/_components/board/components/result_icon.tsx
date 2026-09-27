// Icons
import { MdOutlineFlag, MdOutlineTimer } from "react-icons/md";

// Material has no crown, so the winner's is drawn here at the same weight as the other icons.
const Crown = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[62%] w-[62%]">
    <path d="M2.5 7.5 7 11.2 12 4l5 7.2 4.5-3.7-1.9 10.5H4.4L2.5 7.5ZM4.6 19.5h14.8V21H4.6v-1.5Z" fill="currentColor" />
  </svg>
);

// What a side's result shows, on its king's badge and on the result card: a crown, ½, or how the game was lost.
export default function ResultIcon({ outcome, reason }: { outcome: string; reason: string }) {
  if (outcome === "win") return <Crown />;
  if (outcome === "draw") return <span>½</span>;
  if (reason === "resignation") return <MdOutlineFlag size="62%" />;
  if (reason === "timeout") return <MdOutlineTimer size="62%" />;

  return <span>#</span>;
}
