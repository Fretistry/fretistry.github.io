import {
  NATURAL_PITCH_CLASS,
  letterAt,
  letterIndex,
  mod12,
  mod7,
  ordinal,
  pitchClassOf,
  signedSemitoneDiff,
} from "./notes";
import type { Interval, IntervalQuality, SpelledNote } from "./types";

/**
 * Semitones of each degree in the major scale. Every interval is described
 * relative to this reference: a 3rd that is one semitone smaller than the
 * major 3rd is a minor 3rd (♭3), a 4th one semitone larger is augmented (♯4).
 */
export const MAJOR_SCALE_SEMITONES: readonly number[] = [0, 2, 4, 5, 7, 9, 11];

/** Unisons, 4ths and 5ths are "perfect" intervals; the others are major/minor. */
const PERFECT_DEGREES = new Set([1, 4, 5]);

const QUALITY_WORD: Record<IntervalQuality, string> = {
  perfect: "Perfect",
  major: "Major",
  minor: "Minor",
  augmented: "Augmented",
  diminished: "Diminished",
  "doubly-augmented": "Doubly augmented",
  "doubly-diminished": "Doubly diminished",
};

function qualityFor(degree: number, diff: number): IntervalQuality {
  if (PERFECT_DEGREES.has(degree)) {
    if (diff === 0) return "perfect";
    if (diff === 1) return "augmented";
    if (diff === -1) return "diminished";
    if (diff >= 2) return "doubly-augmented";
    return "doubly-diminished";
  }
  if (diff === 0) return "major";
  if (diff === -1) return "minor";
  if (diff === -2) return "diminished";
  if (diff === 1) return "augmented";
  if (diff >= 2) return "doubly-augmented";
  return "doubly-diminished";
}

function intervalName(degree: number, quality: IntervalQuality): string {
  if (degree === 1) return quality === "perfect" ? "Root" : `${QUALITY_WORD[quality]} unison`;
  return `${QUALITY_WORD[quality]} ${ordinal(degree)}`;
}

/**
 * Describes the interval that is `semitones` above the root and spelled on
 * generic `degree` (1–7). Example: (3, 3) → minor 3rd "b3"; (6, 4) → augmented
 * 4th "#4"; (6, 5) → diminished 5th "b5".
 */
export function intervalFromDegree(semitones: number, degree: number): Interval {
  const simpleDegree = mod7(degree - 1) + 1;
  const semis = mod12(semitones);
  const diff = signedSemitoneDiff(semis - MAJOR_SCALE_SEMITONES[simpleDegree - 1]);
  const quality = qualityFor(simpleDegree, diff);
  const prefixAscii = diff > 0 ? "#".repeat(diff) : "b".repeat(-diff);
  const prefixGlyph = diff > 0 ? "♯".repeat(diff) : "♭".repeat(-diff);
  return {
    semitones: semis,
    degree: simpleDegree,
    quality,
    short: `${prefixAscii}${simpleDegree}`,
    label: `${prefixGlyph}${simpleDegree}`,
    name: intervalName(simpleDegree, quality),
  };
}

/** The interval from `root` up to `target`, derived from both letters and pitches. */
export function intervalBetween(root: SpelledNote, target: SpelledNote): Interval {
  const degree = mod7(letterIndex(target.letter) - letterIndex(root.letter)) + 1;
  const semitones = mod12(pitchClassOf(target) - pitchClassOf(root));
  return intervalFromDegree(semitones, degree);
}

/**
 * Spells the note that is `semitones` above `root` using the letter `degree - 1`
 * steps above the root's letter. E.g. (E♭, 5, 4) → A♭ (not G♯).
 */
export function spellInterval(root: SpelledNote, semitones: number, degree: number): SpelledNote {
  const letter = letterAt(root.letter, degree - 1);
  const target = mod12(pitchClassOf(root) + semitones);
  const accidental = signedSemitoneDiff(target - NATURAL_PITCH_CLASS[letter]);
  return { letter, accidental };
}

/** True for the tritone (augmented 4th / diminished 5th). */
export function isTritone(interval: Interval): boolean {
  return interval.semitones === 6;
}

/** Display label for an interval in a scale context: the root shows as "R" (or the language's equivalent). */
export function intervalDisplayLabel(interval: Interval, rootLabel = "R"): string {
  return interval.semitones === 0 && interval.degree === 1 ? rootLabel : interval.label;
}

/** Human-friendly step name for a gap between neighbouring scale notes. */
export function stepName(semitones: number): { symbol: string; name: string } {
  switch (semitones) {
    case 1:
      return { symbol: "H", name: "half step" };
    case 2:
      return { symbol: "W", name: "whole step" };
    case 3:
      return { symbol: "W+H", name: "step and a half" };
    case 4:
      return { symbol: "2W", name: "two whole steps" };
    default:
      return { symbol: `${semitones}H`, name: `${semitones} half steps` };
  }
}
