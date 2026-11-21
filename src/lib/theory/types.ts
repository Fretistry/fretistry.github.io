/**
 * Core music-theory types.
 *
 * The theory engine (everything in `src/lib/theory`) is deliberately free of
 * React or browser code so it can be tested in isolation and reused by any
 * future feature (quizzes, audio, chord tools, ...).
 */

/** The seven natural note letters, in musical order starting from C. */
export type Letter = "C" | "D" | "E" | "F" | "G" | "A" | "B";

/**
 * A note *name* as a musician would write it: a letter plus an accidental.
 * `accidental` counts semitones: -2 = double flat, -1 = flat, 0 = natural,
 * 1 = sharp, 2 = double sharp.
 *
 * Two spelled notes can sound identical (C♯ and D♭) yet be different names —
 * correct spelling is what makes scale explanations musically accurate.
 */
export interface SpelledNote {
  letter: Letter;
  accidental: number;
}

/** A concrete pitch: a spelled note in a specific octave (scientific pitch notation, middle C = C4). */
export interface Pitch {
  note: SpelledNote;
  octave: number;
}

/** Pitch class: 0 = C, 1 = C♯/D♭, ... 11 = B. */
export type PitchClass = number;

export type IntervalQuality =
  | "perfect"
  | "major"
  | "minor"
  | "augmented"
  | "diminished"
  | "doubly-augmented"
  | "doubly-diminished";

/** An interval measured upward from a root, reduced to within one octave. */
export interface Interval {
  /** Semitones above the root (0–11). */
  semitones: number;
  /** Generic interval number: 1 = unison/root, 2 = second, ... 7 = seventh. */
  degree: number;
  quality: IntervalQuality;
  /** Compact label using ASCII accidentals, e.g. "1", "b3", "#4". */
  short: string;
  /** Compact label using music glyphs, e.g. "1", "♭3", "♯4". */
  label: string;
  /** Full name, e.g. "Root", "Minor 3rd", "Augmented 4th". */
  name: string;
}

export type ScaleCategory = "major" | "minor" | "blues" | "jazz" | "world";

/**
 * A scale is defined purely by data. To add a new scale, add one of these
 * objects to `src/lib/data/scales.ts` — the fretboard, spelling and all
 * explanations are derived from it automatically.
 */
export interface ScaleDefinition {
  /** Stable identifier used in state and URLs, e.g. "natural-minor". */
  id: string;
  /** Display name, e.g. "Natural Minor". */
  name: string;
  /** Optional longer display name, e.g. "Natural Minor (Aeolian)". */
  fullName?: string;
  /** Name used when this scale appears as a mode of the major scale, e.g. "Aeolian". */
  modeName?: string;
  category: ScaleCategory;
  /** Semitones above the root for every scale note, ascending, starting with 0. */
  intervals: readonly number[];
  /**
   * Generic degree (letter step, 1–7) for every note in `intervals`. This is
   * what lets the engine spell notes correctly: semitone 6 with degree 5 is a
   * ♭5 (G♭ in C), with degree 4 it is a ♯4 (F♯ in C).
   */
  degrees: readonly number[];
  /** One-sentence description of the sound / mood. */
  character: string;
  /** Where you typically hear this scale. */
  usage: string;
}

/** A guitar tuning, stored as real pitches from the lowest-pitched string to the highest. */
export interface Tuning {
  id: string;
  name: string;
  strings: readonly Pitch[];
}
