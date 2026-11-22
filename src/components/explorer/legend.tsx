"use client";

import { useI18n } from "@/components/i18n/i18n-provider";
import { cn } from "@/lib/utils";

interface LegendProps {
  showOutside: boolean;
  /** A chord is highlighted: amber/teal now mean chord root / chord tone. */
  chordSymbol?: string | null;
  /** While a chord is highlighted: the scale's root, which keeps an amber ring. */
  scaleRoot?: string | null;
  /** The shown CAGED shapes / positions, each with its colour. */
  shapes?: readonly { label: string; color: string }[];
  /** A note is selected (white ring). */
  showSelected?: boolean;
  className?: string;
}

function Swatch({ className }: { className: string }) {
  return <span className={cn("inline-block size-3.5 shrink-0 rounded-full", className)} />;
}

/** Colour key for the fretboard markers — only lists what is on the neck right now. */
export function Legend({ showOutside, chordSymbol, scaleRoot, shapes = [], showSelected, className }: LegendProps) {
  const t = useI18n().ui.legend;
  const showPosition = shapes.length > 0;
  return (
    <ul className={cn("flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground", className)} aria-label={t.legend}>
      <li className="flex items-center gap-1.5">
        <Swatch className="bg-note-root shadow-[0_0_8px] shadow-note-root/70" />
        {chordSymbol ? t.rootOf(chordSymbol) : t.root}
      </li>
      <li className="flex items-center gap-1.5">
        <Swatch className="bg-note-scale" />
        {chordSymbol ? t.chordTone : t.scaleNote}
      </li>
      {chordSymbol && scaleRoot && (
        <li className="flex items-center gap-1.5">
          <span className="grid size-3.5 shrink-0 place-items-center rounded-full ring-[1.5px] ring-note-root">
            <span className="size-1.5 rounded-full bg-note-root/60" />
          </span>
          {t.scaleRoot(scaleRoot)}
        </li>
      )}
      {(chordSymbol || showPosition) && (
        <li className="flex items-center gap-1.5">
          <Swatch className="size-2 bg-note-scale/40" />
          {chordSymbol ? t.otherDimmed : t.outsidePosition}
        </li>
      )}
      {shapes.map((shape) => (
        <li key={shape.label} className="flex items-center gap-1.5">
          {/* the shape's colour on a piece of "wood", like on the neck */}
          <span className="relative inline-block h-3 w-5 overflow-hidden rounded-full bg-[#3b2a1f]">
            <span
              className="absolute inset-0 rounded-full"
              style={{ backgroundColor: `${shape.color}73`, boxShadow: `inset 0 0 0 1px ${shape.color}cc` }}
            />
          </span>
          {shape.label}
        </li>
      ))}
      {showOutside && !chordSymbol && (
        <li className="flex items-center gap-1.5">
          <Swatch className="size-3 border border-note-outside/80 bg-transparent" />
          {t.notInScale}
        </li>
      )}
      {showSelected && (
        <li className="flex items-center gap-1.5">
          <Swatch className="border-2 border-foreground/80 bg-transparent" />
          {t.selected}
        </li>
      )}
    </ul>
  );
}
