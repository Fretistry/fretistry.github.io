"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { shapeColor } from "@/components/fretboard/shape-colors";
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
  /** Indices of the shown positions (several CAGED shapes / boxes at once; one for 3-per-string). */
  selected: number[];
  /** The tuning gives the 5 boxes CAGED names (standard-type tunings): label them "CAGED", C-A-G-E-D. */
  caged: boolean;
  onChange: (patch: { positionSystem?: PositionChoice; positionIndices?: number[] }) => void;
}

const pill =
  "flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-semibold tabular-nums ring-1 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

/**
 * Choose between the whole neck, the 5 CAGED shapes (or numbered boxes) — any
 * combination at once, each in its own colour — or the 3-notes-per-string
 * patterns (one at a time).
 */
export function PositionPicker({ system, available, positions, selected, caged, onChange }: PositionPickerProps) {
  const t = useI18n().ui.positions;
  const count = positions.length;
  const multi = system === "boxes";
  const allShown = multi && count > 0 && selected.length === count;
  const single = selected.length === 1 ? positions[selected[0]] : null;
  const startFret = single ? positionStartFret(single) : null;
  const step = (delta: number) => onChange({ positionIndices: [(selected[0] + delta + count) % count] });

  const toggle = (index: number) => {
    if (!multi) return onChange({ positionIndices: [index] });
    if (selected.includes(index)) {
      if (selected.length > 1) onChange({ positionIndices: selected.filter((i) => i !== index) });
    } else {
      onChange({ positionIndices: [...selected, index].sort((a, b) => a - b) });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
      <ToolbarGroup label={t.shapes}>
        <SegmentedControl
          ariaLabel={t.shapes}
          value={system}
          onChange={(positionSystem) => onChange({ positionSystem })}
          options={[
            { value: "all", label: t.wholeNeck, title: t.wholeNeckTitle },
            caged
              ? { value: "boxes" as const, label: t.caged, title: t.cagedTitle }
              : { value: "boxes" as const, label: t.positions, title: t.positionsTitle },
            ...(available.includes("3nps") ? [{ value: "3nps" as const, label: t.threePerString, title: t.threePerStringTitle }] : []),
          ]}
        />
      </ToolbarGroup>

      {system !== "all" && count > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {single && (
            <Button variant="ghost" size="icon-sm" aria-label={t.previous} onClick={() => step(-1)}>
              <ChevronLeft />
            </Button>
          )}
          <div role={multi ? "group" : "radiogroup"} aria-label={t.position} className="flex flex-wrap gap-1">
            {positions.map((p) => {
              const active = selected.includes(p.index);
              const name = p.cagedShape ? t.shape(p.cagedShape) : t.positionAria(p.index + 1, null);
              const color = shapeColor(p.index);
              return (
                <button
                  key={p.index}
                  type="button"
                  {...(multi ? { "aria-pressed": active } : { role: "radio", "aria-checked": active })}
                  aria-label={name}
                  title={name}
                  onClick={() => toggle(p.index)}
                  className={cn(
                    pill,
                    multi
                      ? active
                        ? "text-[#1a1310] ring-transparent"
                        : "bg-card text-foreground/80 ring-border hover:bg-accent"
                      : active
                        ? "bg-foreground text-background ring-foreground"
                        : "bg-card text-foreground/80 ring-border hover:bg-accent",
                  )}
                  // CAGED shapes / boxes: the button wears the shape's colour — filled when shown on the
                  // neck, otherwise a colour bar along the bottom
                  style={multi ? (active ? { backgroundColor: color } : { boxShadow: `inset 0 -3px 0 ${color}` }) : undefined}
                >
                  {/* CAGED shapes are known by their letter; other boxes are numbered */}
                  {p.cagedShape ?? p.index + 1}
                </button>
              );
            })}
            {multi && count > 1 && (
              <button
                type="button"
                aria-pressed={allShown}
                title={t.allTitle}
                onClick={() => onChange({ positionIndices: allShown ? [0] : positions.map((p) => p.index) })}
                className={cn(
                  pill,
                  "px-2.5 font-medium",
                  allShown ? "bg-foreground text-background ring-foreground" : "bg-card text-foreground/80 ring-border hover:bg-accent",
                )}
              >
                {t.all}
              </button>
            )}
          </div>
          {single && (
            <Button variant="ghost" size="icon-sm" aria-label={t.next} onClick={() => step(1)}>
              <ChevronRight />
            </Button>
          )}
          <span className="text-xs text-muted-foreground">
            {single
              ? `${single.cagedShape ? `${t.shape(single.cagedShape)} · ` : ""}${
                  startFret === 0 ? t.openPosition : startFret !== null ? t.fromFret(startFret) : ""
                }${single.occurrences.length > 1 ? ` ${t.repeats}` : ""}`
              : t.multiple(selected.length)}
          </span>
        </div>
      )}
    </div>
  );
}
