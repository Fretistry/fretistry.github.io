"use client";

import { MousePointerClick, Volume2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { midiToFrequency } from "@/lib/audio/audio-engine";
import { useI18n } from "@/components/i18n/i18n-provider";
import { intervalDisplayLabel, type FretboardNote, type Tuning } from "@/lib/theory";
import { cn } from "@/lib/utils";

interface NoteInspectorProps {
  note: FretboardNote | null;
  rootLabel: string;
  tuning: Tuning;
  /** Other positions on the neck with exactly the same pitch. */
  samePitch: FretboardNote[];
  onSelectPosition: (note: FretboardNote) => void;
  onClear: () => void;
  /** Replays the selected note (only shown when sound is on). */
  onPlay?: () => void;
  /** When a chord is highlighted: the selected note's role in it. */
  chordRole?: { chord: string; interval: string } | null;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm font-medium">{children}</dd>
    </div>
  );
}

/** Details of the note the user clicked on the fretboard. */
export function NoteInspector({
  note,
  rootLabel,
  tuning,
  samePitch,
  onSelectPosition,
  onClear,
  onPlay,
  chordRole = null,
}: NoteInspectorProps) {
  const t = useI18n().ui.inspector;
  return (
    <Card className="gap-0 py-0" aria-live="polite">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 py-3!">
        <CardTitle className="text-sm font-semibold">{t.title}</CardTitle>
        {note && (
          <div className="flex items-center gap-1">
            {onPlay && (
              <Button variant="ghost" size="xs" onClick={onPlay} aria-label={t.playAria}>
                <Volume2 /> {t.play}
              </Button>
            )}
            <Button variant="ghost" size="icon-xs" onClick={onClear} aria-label={t.clear}>
              <X />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="px-4 py-4">
        {!note ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <div className="grid size-10 place-items-center rounded-full bg-muted">
              <MousePointerClick className="size-5 text-muted-foreground" />
            </div>
            <p className="max-w-[240px] text-sm text-muted-foreground">{t.empty}</p>
          </div>
        ) : (
          <InspectorDetails
            note={note}
            rootLabel={rootLabel}
            tuning={tuning}
            samePitch={samePitch}
            onSelectPosition={onSelectPosition}
            chordRole={chordRole}
          />
        )}
      </CardContent>
    </Card>
  );
}

function InspectorDetails({
  note,
  rootLabel,
  tuning,
  samePitch,
  onSelectPosition,
  chordRole,
}: Pick<NoteInspectorProps, "rootLabel" | "tuning" | "samePitch" | "onSelectPosition" | "chordRole"> & { note: FretboardNote }) {
  const { ui, note: formatNote, theory } = useI18n();
  const t = ui.inspector;
  const name = formatNote(note.note);
  const openString = tuning.strings[note.stringIndex];
  const role = note.isRoot ? t.root : note.inScale ? t.nthNote((note.scaleIndex ?? 0) + 1) : t.notInScale;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "grid size-16 shrink-0 place-items-center rounded-2xl font-bold",
            name.length > 3 ? "text-lg" : name.length > 2 ? "text-xl" : "text-2xl",
            note.isRoot
              ? "bg-note-root text-note-root-foreground shadow-[0_0_24px_-6px] shadow-note-root"
              : note.inScale
                ? "bg-note-scale text-note-scale-foreground"
                : "border border-note-outside/60 text-foreground",
          )}
        >
          {name}
        </div>
        <div className="min-w-0">
          <p className="text-xl font-semibold">
            {name}
            <sub className="ml-0.5 text-sm font-medium text-muted-foreground">{note.octave}</sub>
          </p>
          <Badge
            variant="secondary"
            className={cn(
              "mt-1",
              note.isRoot && "bg-note-root/20 text-note-root",
              !note.isRoot && note.inScale && "bg-note-scale/15 text-note-scale",
            )}
          >
            {role}
          </Badge>
        </div>
      </div>

      <dl className="divide-y divide-border/60">
        <Row label={t.string}>
          {note.stringNumber} <span className="text-muted-foreground">{t.stringName(formatNote(openString.note))}</span>
        </Row>
        <Row label={t.fret}>{note.fret === 0 ? t.openString : note.fret}</Row>
        <Row label={t.interval}>
          <span className="font-mono">{intervalDisplayLabel(note.interval, theory.rootLabel)}</span>
          <span className="text-muted-foreground"> · {theory.intervalName(note.interval)}</span>
        </Row>
        <Row label={t.distance}>
          {note.interval.semitones === 0 ? t.sameNote(rootLabel) : t.above(theory.halfSteps(note.interval.semitones), rootLabel)}
        </Row>
        {chordRole && (
          <Row label={t.inChord}>
            <span className="font-mono">{chordRole.interval}</span>
            <span className="text-muted-foreground"> {t.ofChord(chordRole.chord)}</span>
          </Row>
        )}
        <Row label={t.pitch}>
          {name}
          {note.octave} <span className="text-muted-foreground">· {midiToFrequency(note.midi).toFixed(1)} Hz</span>
        </Row>
      </dl>

      {samePitch.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">{t.samePitch}</p>
          <div className="flex flex-wrap gap-1.5">
            {samePitch.map((p) => (
              <Button key={p.key} variant="secondary" size="xs" onClick={() => onSelectPosition(p)}>
                {t.position(p.stringNumber, p.fret)}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
