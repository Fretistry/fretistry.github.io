import { intervalBetween } from "./intervals";
import { defaultSpelling, midiOf, mod12, pitchClassOf, pitchFromMidi } from "./notes";
import type { SpelledScale } from "./scales";
import type { Interval, PitchClass, SpelledNote, Tuning } from "./types";

export const DEFAULT_FRET_COUNT = 24;

/** A physical spot on the fretboard and the pitch it produces. */
export interface FretPosition {
  /** 0 = lowest-pitched string (low E in standard tuning). */
  stringIndex: number;
  /** Guitarist's string number: 1 = highest-pitched (thin) string. */
  stringNumber: number;
  /** 0 = open string. */
  fret: number;
  midi: number;
  pitchClass: PitchClass;
}

/** A fretboard position annotated with its meaning in the selected scale. */
export interface FretboardNote extends FretPosition {
  /** Stable identifier, e.g. "0:5" for the low string, 5th fret. */
  key: string;
  /** Spelled name in the context of the selected scale/key. */
  note: SpelledNote;
  /** Octave of the written note (scientific pitch notation). */
  octave: number;
  inScale: boolean;
  isRoot: boolean;
  /** 0-based position within the scale, or null for notes outside the scale. */
  scaleIndex: number | null;
  /** Interval from the scale root up to this note. */
  interval: Interval;
}

export function positionKey(stringIndex: number, fret: number): string {
  return `${stringIndex}:${fret}`;
}

/**
 * Calculates the pitch at every string/fret: each fret raises the open
 * string's pitch by exactly one semitone. Returns `[stringIndex][fret]`.
 */
export function buildFretboard(tuning: Tuning, fretCount = DEFAULT_FRET_COUNT): FretPosition[][] {
  const stringCount = tuning.strings.length;
  return tuning.strings.map((openPitch, stringIndex) => {
    const openMidi = midiOf(openPitch);
    return Array.from({ length: fretCount + 1 }, (_, fret) => {
      const midi = openMidi + fret;
      return {
        stringIndex,
        stringNumber: stringCount - stringIndex,
        fret,
        midi,
        pitchClass: mod12(midi),
      };
    });
  });
}

/** Adds scale information (spelling, interval, root/scale membership) to every position. */
export function annotateFretboard(positions: FretPosition[][], spelled: SpelledScale): FretboardNote[][] {
  const byPitchClass = new Map(spelled.notes.map((n) => [pitchClassOf(n.note), n]));
  return positions.map((row) =>
    row.map((pos) => {
      const scaleNote = byPitchClass.get(pos.pitchClass);
      const note = scaleNote ? scaleNote.note : defaultSpelling(pos.pitchClass, spelled.prefersFlats);
      const pitch = pitchFromMidi(pos.midi, note);
      return {
        ...pos,
        key: positionKey(pos.stringIndex, pos.fret),
        note,
        octave: pitch.octave,
        inScale: Boolean(scaleNote),
        isRoot: scaleNote?.index === 0,
        scaleIndex: scaleNote ? scaleNote.index : null,
        interval: scaleNote ? scaleNote.interval : intervalBetween(spelled.root, note),
      };
    }),
  );
}

/** Convenience: build and annotate in one step. */
export function buildScaleFretboard(
  tuning: Tuning,
  spelled: SpelledScale,
  fretCount = DEFAULT_FRET_COUNT,
): FretboardNote[][] {
  return annotateFretboard(buildFretboard(tuning, fretCount), spelled);
}
