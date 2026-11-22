"use client";

import { Volume2, X } from "lucide-react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Button } from "@/components/ui/button";
import { intervalDisplayLabel, type FretboardNote } from "@/lib/theory";
import { cn } from "@/lib/utils";

/**
 * The essentials of the tapped note in one line under the neck (tablets and
 * computers). Phones show the tapped note on the neck itself only.
 */

interface NoteSummaryProps {
  note: FretboardNote;
  chordRole: { chord: string; interval: string } | null;
  onPlay?: () => void;
  onClear: () => void;
}

function useNoteFacts(note: FretboardNote, chordRole: NoteSummaryProps["chordRole"]) {
  const { ui, note: formatNote, theory } = useI18n();
  const t = ui.inspector;
  const name = formatNote(note.note);
  return {
    name,
    role: note.isRoot ? t.root : note.inScale ? t.nthNote((note.scaleIndex ?? 0) + 1) : t.notInScale,
    intervalLabel: intervalDisplayLabel(note.interval, theory.rootLabel),
    intervalName: theory.intervalName(note.interval),
    where: t.position(note.stringNumber, note.fret),
    chord: chordRole ? `${chordRole.interval} ${t.ofChord(chordRole.chord)}` : null,
  };
}

function NoteBadge({ note, name, className }: { note: FretboardNote; name: string; className?: string }) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-bold",
        note.isRoot
          ? "bg-note-root text-note-root-foreground"
          : note.inScale
            ? "bg-note-scale text-note-scale-foreground"
            : "border border-note-outside/70 text-foreground",
        className,
      )}
    >
      {name}
    </span>
  );
}

function SummaryButtons({ onPlay, onClear, size }: Pick<NoteSummaryProps, "onPlay" | "onClear"> & { size: "icon-sm" | "icon" }) {
  const t = useI18n().ui.inspector;
  return (
    <div className="flex shrink-0 items-center">
      {onPlay && (
        <Button variant="ghost" size={size} onClick={onPlay} aria-label={t.playAria} title={t.playAria}>
          <Volume2 />
        </Button>
      )}
      <Button variant="ghost" size={size} onClick={onClear} aria-label={t.clear} title={t.clear}>
        <X />
      </Button>
    </div>
  );
}

/** One line under the neck (tablets and computers). */
export function NoteStrip({ note, chordRole, onPlay, onClear }: NoteSummaryProps) {
  const facts = useNoteFacts(note, chordRole);
  return (
    <div
      className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 rounded-full bg-muted/60 py-1 pr-1 pl-1 text-sm ring-1 ring-border/60"
      aria-live="polite"
    >
      <NoteBadge note={note} name={facts.name} className={cn("size-7", facts.name.length > 2 ? "text-[10px]" : "text-xs")} />
      <span className="font-semibold">
        {facts.name}
        <sub className="ml-0.5 text-[10px] font-medium text-muted-foreground">{note.octave}</sub>
      </span>
      <span className="text-muted-foreground">{facts.role}</span>
      {/* (for the root itself the interval would just repeat "Root") */}
      {!note.isRoot && (
        <span>
          <span className="font-mono">{facts.intervalLabel}</span>
          <span className="text-muted-foreground"> · {facts.intervalName}</span>
        </span>
      )}
      {facts.chord && <span className="text-muted-foreground">{facts.chord}</span>}
      <span className="text-muted-foreground">{facts.where}</span>
      <SummaryButtons onPlay={onPlay} onClear={onClear} size="icon-sm" />
    </div>
  );
}
