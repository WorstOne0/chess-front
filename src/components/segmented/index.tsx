// A pressed track holding the options; the chosen one is a raised action pill. No `value` selects none.
export default function Segmented<T extends string>({
  options,
  value,
  onChange,
  tone = "surface",
  isFill = true,
}: {
  options: { value: T; label: string }[];
  value?: T;
  onChange: (value: T) => void;
  tone?: "surface" | "background";
  isFill?: boolean;
}) {
  return (
    <div className={`p-[0.8rem] flex gap-[0.8rem] rounded-[1.8rem] shadow-inset ${tone === "surface" ? "bg-surface" : "bg-background"}`}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
          className={`h-[4.4rem] rounded-[1.2rem] text-[1.5rem] font-bold ${isFill ? "min-w-0 flex-1" : "w-[10.4rem]"} ${option.value === value ? "bg-action text-on-action shadow-action" : "text-meta hover:text-title"}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
