"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Button } from "@/components/ui/button";
import type { PositionChoice } from "@/lib/share";
import { positionStartFret, type PositionSystem, type ScalePosition } from "@/lib/theory";
import { cn } from "@/lib/utils";
import { ToolbarGroup } from "./display-toolbar";
import { SegmentedControl } from "./segmented-control";

interface PositionPickerProps {
  system: PositionChoice;
  available: PositionSystem[];
  positions: ScalePosition[];
  index: number;
  onChange: (patch: { positionSystem?: PositionChoice; positionIndex?: number }) => void;
}

/** Choose between the whole neck, the 5 box positions, or the 3-notes-per-string patterns. */
export function PositionPicker({ system, available, positions, index, onChange }: PositionPickerProps) {
  const t = useI18n().ui.positions;
  const count = positions.length;
  const current = positions[index];
  const startFret = current ? positionStartFret(current) : null;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
      <ToolbarGroup label={t.shapes}>
        <SegmentedControl
          ariaLabel={t.shapes}
          value={system}
          onChange={(positionSystem) => onChange({ positionSystem })}
          options={[
            { value: "all", label: t.wholeNeck, title: t.wholeNeckTitle },
            { value: "boxes", label: t.positions, title: t.positionsTitle },
            ...(available.includes("3nps") ? [{ value: "3nps" as const, label: t.threePerString, title: t.threePerStringTitle }] : []),
          ]}
        />
      </ToolbarGroup>

      {system !== "all" && count > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <Button variant="ghost" size="icon-sm" aria-label={t.previous} onClick={() => onChange({ positionIndex: (index - 1 + count) % count })}>
            <ChevronLeft />
          </Button>
          <div role="radiogroup" aria-label={t.position} className="flex flex-wrap gap-1">
            {positions.map((p) => {
              const active = p.index === index;
              return (
                <button
                  key={p.index}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-label={t.positionAria(p.index + 1, p.cagedShape)}
                  onClick={() => onChange({ positionIndex: p.index })}
                  className={cn(
                    "flex h-8 min-w-8 items-center justify-center gap-1 rounded-lg px-2 text-sm font-semibold tabular-nums ring-1 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    active ? "bg-foreground text-background ring-foreground" : "bg-card text-foreground/80 ring-border hover:bg-accent",
                  )}
                >
                  {p.index + 1}
                  {p.cagedShape && (
                    <span className={cn("text-[10px] font-medium", active ? "text-background/70" : "text-muted-foreground")}>
                      {p.cagedShape}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <Button variant="ghost" size="icon-sm" aria-label={t.next} onClick={() => onChange({ positionIndex: (index + 1) % count })}>
            <ChevronRight />
          </Button>
          {current && (
            <span className="text-xs text-muted-foreground">
              {current.cagedShape ? `${t.shape(current.cagedShape)} · ` : ""}
              {startFret === 0 ? t.openPosition : startFret !== null ? t.fromFret(startFret) : ""}
              {current.occurrences.length > 1 ? ` ${t.repeats}` : ""}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
