import { formatNote, intervalDisplayLabel, type FretboardNote, type Interval, type SpelledNote } from "@/lib/theory";
import type { LabelMode, Visibility } from "@/hooks/use-explorer-state";

/**
 * Pure logic deciding how each fretboard note is shown (visible? dimmed?
 * which colour? which label?). Kept separate from the drawing code so it can
 * be unit-tested and reused.
 */

export type MarkerVariant = "root" | "scale" | "outside";

export interface ChordDisplay {
  /** Pitch class of the chord's root. */
  rootPitchClass: number;
  /** Interval above the chord root for every chord tone, keyed by pitch class. */
  tones: ReadonlyMap<number, Interval>;
}

/** Language-dependent text used for labels and screen readers. */
export interface MarkerText {
  note: (note: SpelledNote) => string;
  rootLabel: string;
  intervalName: (interval: Interval) => string;
  where: (string: number, fret: number) => string;
  root: string;
  notInScale: string;
  chordRole: (intervalName: string) => string;
}

export const ENGLISH_MARKER_TEXT: MarkerText = {
  note: formatNote,
  rootLabel: "R",
  intervalName: (i) => i.name,
  where: (string, fret) => `string ${string}, ${fret === 0 ? "open" : `fret ${fret}`}`,
  root: "root",
  notInScale: "not in scale",
  chordRole: (name) => `chord ${name.toLowerCase()}`,
};

export interface MarkerOptions {
  /** Labels and screen-reader text in the current language (English by default). */
  text?: MarkerText;
  labelMode: LabelMode;
  visibility: Visibility;
  /** Highlight one chord's tones and dim everything else. */
  chord?: ChordDisplay | null;
  /** Keys of the notes in the selected scale position (null = whole neck). */
  positionKeys?: ReadonlySet<string> | null;
  selectedKey: string | null;
  /** Pitch class of the selected note: other notes with the same name get a subtle ring. */
  selectedPitchClass: number | null;
  /** Exact pitch of the selected note: the same pitch elsewhere on the neck gets a dashed ring. */
  selectedMidi?: number | null;
  /** The note sounding right now in "Play scale" (lit up on the neck). */
  playingKey?: string | null;
}

export interface MarkerModel {
  key: string;
  variant: MarkerVariant;
  visible: boolean;
  /** Shown as a small faint dot for context (outside the chosen position or chord). */
  dimmed: boolean;
  label: string | null;
  /**
   * selected = the tapped note; unison = exactly the same pitch elsewhere; related = same note
   * name in another octave; wrong = a wrong guess in the trainer.
   */
  emphasis: "selected" | "unison" | "related" | "wrong" | "none";
  /** While a chord is highlighted: this is the scale's own root, marked with a ring so the key stays visible. */
  home: boolean;
  /** Sounding right now in "Play scale". */
  playing: boolean;
  ariaLabel: string;
}

export function markerLabel(note: FretboardNote, labelMode: LabelMode, text: MarkerText = ENGLISH_MARKER_TEXT): string | null {
  switch (labelMode) {
    case "note":
      return text.note(note.note);
    case "interval":
      return intervalDisplayLabel(note.interval, text.rootLabel);
    case "degree":
      return note.scaleIndex === null ? null : String(note.scaleIndex + 1);
    case "none":
      return null;
  }
}

function chordLabel(note: FretboardNote, interval: Interval, labelMode: LabelMode, text: MarkerText): string | null {
  switch (labelMode) {
    case "note":
      return text.note(note.note);
    case "interval":
      return intervalDisplayLabel(interval, text.rootLabel);
    case "degree":
      return String(interval.degree);
    case "none":
      return null;
  }
}

function describe(note: FretboardNote, text: MarkerText, chordInterval?: Interval): string {
  const where = text.where(note.stringNumber, note.fret);
  const role = note.isRoot ? text.root : note.inScale ? text.intervalName(note.interval) : text.notInScale;
  const chord = chordInterval ? `, ${text.chordRole(text.intervalName(chordInterval))}` : "";
  return `${text.note(note.note)}${note.octave}, ${where}, ${role}${chord}`;
}

export function computeMarker(note: FretboardNote, options: MarkerOptions): MarkerModel {
  const text = options.text ?? ENGLISH_MARKER_TEXT;
  const isSelected = options.selectedKey === note.key;
  const inPosition = !options.positionKeys || options.positionKeys.has(note.key);
  let variant: MarkerVariant = note.isRoot ? "root" : note.inScale ? "scale" : "outside";
  let visible: boolean;
  let dimmed = false;
  let label: string | null;
  let chordInterval: Interval | undefined;

  if (options.chord) {
    chordInterval = options.chord.tones.get(note.pitchClass);
    const isChordRoot = note.pitchClass === options.chord.rootPitchClass;
    if (chordInterval) {
      variant = isChordRoot ? "root" : "scale";
      visible = options.visibility !== "roots" || isChordRoot;
      dimmed = visible && !inPosition;
      label = chordLabel(note, chordInterval, options.labelMode, text);
    } else {
      // Not part of the chord: keep the rest of the scale as faint context.
      visible = options.visibility === "all" || (options.visibility === "scale" && note.inScale);
      dimmed = true;
      label = null;
    }
  } else {
    visible =
      options.visibility === "all" ||
      (options.visibility === "scale" && note.inScale) ||
      (options.visibility === "roots" && note.isRoot);
    dimmed = visible && !inPosition;
    label = markerLabel(note, options.labelMode, text);
  }

  // The note sounding in "Play scale" always shows, fully — and so does exactly the same pitch as
  // the tapped note, also outside the chosen shape, so you see every place to play it.
  const playing = options.playingKey === note.key;
  const unison = !isSelected && visible && options.selectedMidi != null && note.midi === options.selectedMidi;
  if (playing || unison) {
    visible = true;
    dimmed = false;
    label ??= markerLabel(note, options.labelMode, text);
  }

  if (dimmed) label = null;

  const shown = visible && !dimmed;
  const emphasis = isSelected
    ? "selected"
    : unison
      ? "unison"
      : shown && options.selectedPitchClass === note.pitchClass
        ? "related"
        : "none";

  const home = Boolean(options.chord) && note.isRoot && visible;

  return { key: note.key, variant, visible, dimmed, label, emphasis, home, playing, ariaLabel: describe(note, text, chordInterval) };
}

export interface TrainerMarkerOptions {
  text?: MarkerText;
  /** The spot is part of the quiz (inside the chosen frets and shapes). */
  inArea: boolean;
  /** Already found in this round: shown with its name. */
  found: boolean;
  /** Just tapped by mistake: flashes red. */
  wrong: boolean;
}

/**
 * The neck in the fretboard trainer: every spot of the quiz area is an empty
 * circle to tap; found notes appear with their name, a wrong tap flashes red.
 * Screen readers hear only the position, never the answer.
 */
export function computeTrainerMarker(note: FretboardNote, options: TrainerMarkerOptions): MarkerModel {
  const text = options.text ?? ENGLISH_MARKER_TEXT;
  const found = options.inArea && options.found;
  return {
    key: note.key,
    variant: found ? (note.isRoot ? "root" : "scale") : "outside",
    visible: options.inArea,
    dimmed: false,
    label: found ? text.note(note.note) : null,
    emphasis: options.wrong ? "wrong" : "none",
    home: false,
    playing: false,
    ariaLabel: found ? describe(note, text) : text.where(note.stringNumber, note.fret),
  };
}
