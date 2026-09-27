// Next
import type { IconType } from "react-icons";

const SIZES = {
  sm: "h-[4.4rem] w-[4.4rem] rounded-[1.4rem]",
  md: "h-[4.8rem] w-[4.8rem] rounded-[1.4rem]",
  lg: "h-[5.6rem] w-[5.6rem] rounded-[1.8rem]",
  wide: "h-[4.6rem] min-w-0 flex-1 rounded-[1.4rem]",
};

// Only an icon shows, so `label` becomes its accessible name and tooltip.
export default function IconButton({
  Icon,
  label,
  onClick,
  size = "md",
  isDisabled = false,
}: {
  Icon: IconType;
  label: string;
  onClick: () => void;
  size?: keyof typeof SIZES;
  isDisabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={isDisabled}
      className={`shrink-0 flex items-center justify-center bg-surface text-title shadow-raise active:shadow-inset disabled:opacity-40 disabled:active:shadow-raise ${SIZES[size]}`}
    >
      <Icon size={size === "lg" ? 22 : 20} />
    </button>
  );
}
