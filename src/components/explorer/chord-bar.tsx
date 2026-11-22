"use client";

import { Play, X } from "lucide-react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Button } from "@/components/ui/button";
import { describeChordStack, type ChordSet, type ChordSize, type ScaleChord } from "@/lib/theory";
import { cn } from "@/lib/utils";
import { ToolbarGroup } from "./display-toolbar";
import { InfoTip } from "./info-tip";
import { SegmentedControl } from "./segmented-control";

interface ChordBarProps {
  chordSet: ChordSet;
  size: ChordSize;
  selected: ScaleChord | null;
  soundEnabled: boolean;
  onSizeChange: (size: ChordSize) => void;
  onSelect: (degree: number | null) => void;
  onPlay: (chord: ScaleChord) => void;
}

/** The chords that belong to the scale. Picking one highlights its notes on the fretboard. */
export function ChordBar({ chordSet, size, selected, soundEnabled, onSizeChange, onSelect, onPlay }: ChordBarProps) {
  const { ui, note, theory } = useI18n();
  const t = ui.chords;
  const effectiveSize = chordSet.seventhsAvailable ? size : "triad";
  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <ToolbarGroup
          label={t.chords}
          // What triads, 7ths and the numerals are — plus, for pentatonic/blues, where the chords come from
          info={<InfoTip label={t.info} paragraphs={chordSet.basis !== "scale" ? [ui.info.chords, chordSet.note] : [ui.info.chords]} />}
        >
          <SegmentedControl
            ariaLabel={t.size}
            value={effectiveSize}
            onChange={onSizeChange}
            options={[
              { value: "triad", label: t.triads, title: t.triadsTitle },
              ...(chordSet.seventhsAvailable ? [{ value: "seventh" as const, label: t.sevenths, title: t.seventhsTitle }] : []),
            ]}
          />
        </ToolbarGroup>
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={t.inKey}>
          {chordSet.chords.map((chord) => {
            const active = selected?.degreeIndex === chord.degreeIndex;
            return (
              <button
                key={chord.degreeIndex}
                type="button"
                role="radio"
                aria-checked={active}
                aria-label={`${chord.numeral}: ${chord.name}`}
                title={`${chord.name} — ${chord.tones.map((tone) => note(tone.note)).join(" ")}`}
                onClick={() => {
                  onSelect(active ? null : chord.degreeIndex);
                  if (!active && soundEnabled) onPlay(chord);
                }}
                className={cn(
                  "flex min-w-14 flex-col items-center rounded-lg px-2.5 py-1 ring-1 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  // Selected = neutral "pressed" look; amber stays reserved for root notes.
                  active ? "bg-foreground text-background ring-foreground" : "bg-card ring-border hover:bg-accent",
                )}
              >
                <span className={cn("font-mono text-[10px] leading-tight", active ? "text-background/70" : "text-muted-foreground")}>
                  {chord.numeral}
                </span>
                <span className="text-sm leading-tight font-semibold whitespace-nowrap">{chord.symbol}</span>
              </button>
            );
          })}
        </div>
      </div>

      {selected && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span className="font-semibold">{selected.symbol}</span>
          <span className="text-muted-foreground">
            {selected.name} · <span className="font-mono">{selected.numeral}</span> ·{" "}
            <span className="font-mono">{selected.tones.map((tone) => note(tone.note)).join(" ")}</span>
          </span>
          <InfoTip label={t.info} paragraphs={[`${t.stacked} ${describeChordStack(selected, theory)}. ${t.highlighted}`]} />
          <Button variant="ghost" size="xs" onClick={() => onPlay(selected)} disabled={!soundEnabled}>
            <Play className="fill-current" /> {t.play}
          </Button>
          <Button variant="ghost" size="xs" onClick={() => onSelect(null)} aria-label={t.clearAria}>
            <X /> {t.clear}
          </Button>
        </div>
      )}
    </div>
  );
}
