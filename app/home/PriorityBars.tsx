import { PRIORITY_COLORS } from "@/lib/themes";

export function PriorityBars({ level }: { level: number }) {
  const safeLevel = Math.min(4, Math.max(1, level)) as 1 | 2 | 3 | 4;
  const color = PRIORITY_COLORS[safeLevel];

  return (
    <div className="flex h-4 w-[1.35rem] items-end justify-start gap-[2px]">
      {Array.from({ length: safeLevel }, (_, index) => (
        <span
          key={index}
          className="h-full w-[4px] shrink-0 rounded-[1px]"
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}
