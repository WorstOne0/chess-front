// Next
import type { IconType } from "react-icons";

export default function Chip({ Icon, label }: { Icon: IconType; label: string }) {
  return (
    <div className="h-[4.8rem] shrink-0 px-[1.8rem] flex items-center gap-[1rem] rounded-[1.4rem] bg-tile shadow-tile text-[1.5rem] font-extrabold">
      <Icon size={18} />
      {label}
    </div>
  );
}
