import type { IntervalRow, StepInfo } from "@/lib/theory";
import { cn } from "@/lib/utils";

interface StepPatternProps {
  rows: IntervalRow[];
  steps: StepInfo[];
  caption: string;
}

const STEP_STYLE: Record<number, string> = {
  // light mode: darker text, so "H", "W" and "W+H" are readable on white (4.5:1)
  1: "border-primary text-note-root-text",
  2: "border-note-scale/70 text-note-scale-text",
  3: "border-violet-400/80 text-violet-700 dark:text-violet-300",
  4: "border-rose-400/80 text-rose-700 dark:text-rose-300",
};

/**
 * Visualises a scale as 12 frets on a single string: which frets are used,
 * and the whole (W) / half (H) steps between them.
 */
export function StepPattern({ rows, steps, caption }: StepPatternProps) {
  const byPosition = new Map(rows.map((r) => [r.semitones, r]));
  const positions = Array.from({ length: 13 }, (_, i) => i);
  const grid = { gridTemplateColumns: "repeat(26, minmax(0, 1fr))" };

  return (
    <figure className="space-y-2">
      <div className="grid gap-y-0" style={grid}>
        {positions.map((pos) => {
          const row = pos === 12 ? rows[0] : byPosition.get(pos);
          const isRoot = row?.index === 0;
          return (
            <div key={pos} className="flex flex-col items-center gap-1 px-[1px]" style={{ gridColumn: `${pos * 2 + 1} / span 2` }}>
              <div
                className={cn(
                  "grid aspect-square w-full max-w-10 place-items-center overflow-hidden rounded-md text-[10px] font-semibold tracking-tighter sm:text-xs sm:tracking-normal",
                  row
                    ? isRoot
                      ? "bg-note-root text-note-root-foreground"
                      : "bg-note-scale text-note-scale-foreground"
                    : "bg-muted/60 text-muted-foreground/40",
                )}
              >
                {row ? row.note : "·"}
              </div>
              <span className="font-mono text-[10px] text-muted-foreground">{pos}</span>
            </div>
          );
        })}
      </div>
      <div className="grid" style={grid}>
        {steps.map((s, i) => (
          <div
            key={i}
            className="px-[3px]"
            style={{ gridColumn: `${s.start * 2 + 2} / span ${s.semitones * 2}`, gridRow: 1 }}
          >
            <div
              className={cn(
                "flex h-5 items-end justify-center rounded-b-md border-x-2 border-b-2 pb-0.5 text-[10px] leading-none font-bold sm:text-[11px]",
                STEP_STYLE[s.semitones] ?? "border-muted-foreground text-muted-foreground",
              )}
              title={`${s.from} → ${s.to}: ${s.name}`}
            >
              {s.symbol}
            </div>
          </div>
        ))}
      </div>
      <figcaption className="text-xs text-muted-foreground">{caption}</figcaption>
    </figure>
  );
}
