"use client";

import { shapeColor } from "@/components/fretboard/shape-colors";
import { useI18n } from "@/components/i18n/i18n-provider";
import type { PositionChoice } from "@/lib/share";
import { pentatonicBox } from "@/lib/start-here";
import { positionStartFret, type PositionSystem, type ScalePosition } from "@/lib/theory";
import { cn } from "@/lib/utils";
import { ToolbarGroup, ToolbarSwitch } from "./display-toolbar";
import { InfoTip } from "./info-tip";
import { SELECTED, SegmentedControl } from "./segmented-control";

interface PositionPickerProps {
  system: PositionChoice;
  available: PositionSystem[];
  positions: ScalePosition[];
  /** Indices of the shown positions (any CAGED shapes / boxes, also none; one for 3-per-string). */
  selected: number[];
  /** The tuning gives the 5 boxes CAGED names (standard-type tunings): label them "CAGED", C-A-G-E-D. */
  caged: boolean;
  /** Minor pentatonic and blues shapes also get their usual box number ("E shape · box 1"). */
  scaleId: string;
  /** "Stay in this area when changing key" (offered while one shape is shown). */
  keepArea: boolean;
  onKeepAreaChange: (keepArea: boolean) => void;
  onChange: (patch: { positionSystem?: PositionChoice; positionIndices?: number[] }) => void;
}

const pill =
  "flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-semibold tabular-nums ring-1 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 pointer-coarse:h-9 pointer-coarse:min-w-9";

/**
 * Choose between the whole neck, the 5 CAGED shapes (or numbered boxes) —
 * switched on and off freely, each in its own colour — or the
 * 3-notes-per-string patterns (one at a time). The buttons always stay in
 * the same place; only their colour changes.
 */
export function PositionPicker({
  system,
  available,
  positions,
  selected,
  caged,
  scaleId,
  keepArea,
  onKeepAreaChange,
  onChange,
}: PositionPickerProps) {
  const { ui } = useI18n();
  const t = ui.positions;
  /** "E shape", or "E shape · box 1" for the minor pentatonic and blues. */
  const shapeName = (p: ScalePosition) => {
    if (!p.cagedShape) return t.positionAria(p.index + 1, null);
    const box = pentatonicBox(scaleId, p.cagedShape);
    return box ? `${t.shape(p.cagedShape)} · ${ui.startHere.box(box)}` : t.shape(p.cagedShape);
  };
  const shapesInfo = [caged ? ui.info.caged : ui.info.positions, ...(available.includes("3nps") ? [ui.info.threePerString] : [])];
  const count = positions.length;
  const multi = system === "boxes";
  const allShown = multi && count > 0 && selected.length === count;
  const single = selected.length === 1 ? positions[selected[0]] : null;
  const startFret = single ? positionStartFret(single) : null;

  const toggle = (index: number) => {
    if (!multi) return onChange({ positionIndices: [index] });
    onChange({
      positionIndices: selected.includes(index)
        ? selected.filter((i) => i !== index)
        : [...selected, index].sort((a, b) => a - b),
    });
  };

  const detail = single
    ? `${single.cagedShape ? `${shapeName(single)} · ` : ""}${
        startFret === 0 ? t.openPosition : startFret !== null ? t.fromFret(startFret) : ""
      }${single.occurrences.length > 1 ? ` ${t.repeats}` : ""}`
    : selected.length === 0
      ? t.noneShown
      : null; // several shapes: the coloured buttons already say it all
  // With one CAGED shape shown, say that more can be added (the buttons look like a single choice).
  const connectHint = multi && single && count > 1 ? t.connectHint : null;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
      <ToolbarGroup label={t.shapes} info={<InfoTip label={ui.info.shapesTitle} paragraphs={shapesInfo} />}>
        <SegmentedControl
          ariaLabel={t.shapes}
          value={system}
          // Switching to another kind of shape starts with its first shape (C, or pattern 1).
          onChange={(positionSystem) => onChange({ positionSystem, positionIndices: [0] })}
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
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <div role={multi ? "group" : "radiogroup"} aria-label={t.position} className="flex flex-wrap gap-1">
            {positions.map((p) => {
              const active = selected.includes(p.index);
              const name = shapeName(p);
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
                        ? SELECTED
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
              // Names what a click does: "All" switches every shape on; once they're all on it
              // reads "None" and switches them all off. Fixed width, so nothing shifts.
              <button
                type="button"
                title={allShown ? t.noneTitle : t.allTitle}
                onClick={() => onChange({ positionIndices: allShown ? [] : positions.map((p) => p.index) })}
                className={cn(pill, "ml-1 min-w-[4.5rem] bg-card px-2.5 font-medium text-foreground/80 ring-border hover:bg-accent")}
              >
                {allShown ? t.none : t.all}
              </button>
            )}
          </div>
          {detail && (
            <span className="text-xs text-muted-foreground">
              {detail}
              {connectHint && <span className="text-muted-foreground/80"> · {connectHint}</span>}
            </span>
          )}
          {/* practise one area through many keys: a new key shows the shape nearest these frets */}
          {single && (
            <ToolbarSwitch id="keep-area" label={t.keepArea} checked={keepArea} onCheckedChange={onKeepAreaChange} />
          )}
        </div>
      )}
    </div>
  );
}
