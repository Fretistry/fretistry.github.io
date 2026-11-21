import { intervalBetween } from "./intervals";
import { englishTheory, type TheoryLanguage } from "./language";
import { mod12, pitchClassOf } from "./notes";
import { symmetryPeriod } from "./relationships";
import { spellScale, thirdQuality, usesEachLetterOnce, type SpelledScale } from "./scales";
import type { Interval, ScaleDefinition, SpelledNote } from "./types";

/**
 * Chords in the key: built by stacking every other note of the scale
 * ("stacking thirds"). Chord spellings come straight from the scale, so they
 * are always correct (e.g. B♭ major's IV chord is E♭, never D♯).
 */

export type ChordSize = "triad" | "seventh";

export interface ChordType {
  id: string;
  /** Semitones above the chord root. */
  intervals: readonly number[];
  /** Suffix in chord symbols, e.g. "m7" → "Dm7". */
  symbol: string;
  name: string;
  /** Roman numerals are upper-case for major/augmented, lower-case for minor/diminished chords. */
  upperCase: boolean;
  numeralSuffix: string;
}

export const CHORD_TYPES: readonly ChordType[] = [
  { id: "maj", intervals: [0, 4, 7], symbol: "", name: "major", upperCase: true, numeralSuffix: "" },
  { id: "min", intervals: [0, 3, 7], symbol: "m", name: "minor", upperCase: false, numeralSuffix: "" },
  { id: "dim", intervals: [0, 3, 6], symbol: "dim", name: "diminished", upperCase: false, numeralSuffix: "°" },
  { id: "aug", intervals: [0, 4, 8], symbol: "aug", name: "augmented", upperCase: true, numeralSuffix: "+" },
  { id: "maj7", intervals: [0, 4, 7, 11], symbol: "maj7", name: "major 7th", upperCase: true, numeralSuffix: "maj7" },
  { id: "7", intervals: [0, 4, 7, 10], symbol: "7", name: "dominant 7th", upperCase: true, numeralSuffix: "7" },
  { id: "m7", intervals: [0, 3, 7, 10], symbol: "m7", name: "minor 7th", upperCase: false, numeralSuffix: "7" },
  { id: "m7b5", intervals: [0, 3, 6, 10], symbol: "m7♭5", name: "half-diminished 7th", upperCase: false, numeralSuffix: "ø7" },
  { id: "dim7", intervals: [0, 3, 6, 9], symbol: "dim7", name: "diminished 7th", upperCase: false, numeralSuffix: "°7" },
  { id: "mMaj7", intervals: [0, 3, 7, 11], symbol: "m(maj7)", name: "minor-major 7th", upperCase: false, numeralSuffix: "(maj7)" },
  { id: "augMaj7", intervals: [0, 4, 8, 11], symbol: "maj7♯5", name: "augmented major 7th", upperCase: true, numeralSuffix: "+maj7" },
  { id: "aug7", intervals: [0, 4, 8, 10], symbol: "7♯5", name: "augmented 7th", upperCase: true, numeralSuffix: "+7" },
  // Less common shapes that appear in exotic scales (Hungarian minor, double harmonic):
  { id: "majb5", intervals: [0, 4, 6], symbol: "(♭5)", name: "major flat-five", upperCase: true, numeralSuffix: "(♭5)" },
  { id: "7b5", intervals: [0, 4, 6, 10], symbol: "7♭5", name: "dominant 7th flat-five", upperCase: true, numeralSuffix: "7(♭5)" },
  { id: "m6", intervals: [0, 3, 7, 9], symbol: "m6", name: "minor 6th", upperCase: false, numeralSuffix: "6" },
  { id: "sus2b5", intervals: [0, 2, 6], symbol: "sus2(♭5)", name: "suspended 2nd flat-five", upperCase: true, numeralSuffix: "sus2(♭5)" },
  { id: "6sus2b5", intervals: [0, 2, 6, 9], symbol: "6sus2(♭5)", name: "6th suspended 2nd flat-five", upperCase: true, numeralSuffix: "6sus2(♭5)" },
];

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII"];

export interface ChordTone {
  note: SpelledNote;
  /** Interval above the chord's own root (R, 3, 5, 7...). */
  interval: Interval;
  /** Position of this note in the scale the chords were built from. */
  scaleIndex: number;
}

export interface ScaleChord {
  /** Position of the chord root in the source scale (0-based). */
  degreeIndex: number;
  root: SpelledNote;
  tones: ChordTone[];
  type: ChordType | null;
  /** "Dm7" */
  symbol: string;
  /** "ii7", "♭VII", "vii°" */
  numeral: string;
  /** "D minor 7th" */
  name: string;
}

export interface ChordSet {
  chords: ScaleChord[];
  /** The scale the chords were built from (the parent scale for pentatonic/blues scales). */
  source: SpelledScale;
  basis: "scale" | "parent" | "symmetric";
  /** Whether 7th chords can be built (not for the whole-tone scale). */
  seventhsAvailable: boolean;
  /** Plain-language note about how these chords were derived. */
  note: string;
}

export function identifyChord(semitones: readonly number[]): ChordType | null {
  const sorted = [...new Set(semitones.map(mod12))].sort((a, b) => a - b);
  return CHORD_TYPES.find((t) => t.intervals.length === sorted.length && t.intervals.every((v, i) => v === sorted[i])) ?? null;
}

function numeralFor(rootInterval: Interval, type: ChordType | null): string {
  const accidental = rootInterval.label.replace(/\d+$/, "");
  const roman = ROMAN[rootInterval.degree - 1];
  if (!type) return accidental + roman;
  return accidental + (type.upperCase ? roman : roman.toLowerCase()) + type.numeralSuffix;
}

function buildChords(source: SpelledScale, size: ChordSize, step: number[], lang: TheoryLanguage): ScaleChord[] {
  const notes = source.notes;
  const n = notes.length;
  return notes.map((rootNote, degreeIndex) => {
    const indices = (size === "triad" ? step.slice(0, 3) : step).map((offset) => (degreeIndex + offset) % n);
    const root = rootNote.note;
    const tones = indices.map((i) => ({
      note: notes[i].note,
      interval: intervalBetween(root, notes[i].note),
      scaleIndex: i,
    }));
    const type = identifyChord(tones.map((t) => mod12(pitchClassOf(t.note) - pitchClassOf(root))));
    const rootName = lang.note(root);
    const symbol = rootName + (type ? type.symbol : "");
    return {
      degreeIndex,
      root,
      tones,
      type,
      symbol,
      numeral: numeralFor(rootNote.interval, type),
      name: lang.chordName(rootName, type ? lang.chordTypeName(type.id, type.name) : "?"),
    };
  });
}

/**
 * The chords that belong to a scale.
 * - 7-note scales: stack thirds (every other scale note).
 * - Symmetric scales (whole tone, diminished): stack every other note too —
 *   this gives augmented / diminished chords.
 * - Pentatonic and blues scales are too sparse to build chords from, so the
 *   chords of their 7-note parent scale (major or natural minor) are used.
 */
export function scaleChords(
  spelled: SpelledScale,
  size: ChordSize,
  registry: readonly ScaleDefinition[],
  lang: TheoryLanguage = englishTheory,
): ChordSet {
  const scale = spelled.scale;
  const scaleTitle = lang.title(lang.note(spelled.root), lang.scaleName(scale));
  const basis = (b: ChordSet["basis"], parentName = "") =>
    lang.chordBasis({ basis: b, noteCount: scale.intervals.length, parentName, scaleTitle, wholeTone: scale.intervals.length === 6 });

  if (usesEachLetterOnce(scale)) {
    return {
      chords: buildChords(spelled, size, [0, 2, 4, 6], lang),
      source: spelled,
      basis: "scale",
      seventhsAvailable: true,
      note: basis("scale"),
    };
  }

  const period = symmetryPeriod(scale.intervals);
  if (period && (scale.intervals.length === 6 || scale.intervals.length === 8)) {
    const seventhsAvailable = scale.intervals.length === 8;
    const effectiveSize = seventhsAvailable ? size : "triad";
    return {
      chords: buildChords(spelled, effectiveSize, [0, 2, 4, 6], lang),
      source: spelled,
      basis: "symmetric",
      seventhsAvailable,
      note: basis("symmetric"),
    };
  }

  const parentId = thirdQuality(scale) === "major" ? "major" : "natural-minor";
  const parentDef = registry.find((s) => s.id === parentId);
  if (!parentDef) throw new Error(`Parent scale "${parentId}" missing from registry`);
  const parent = spellScale(spelled.root, parentDef);
  return {
    chords: buildChords(parent, size, [0, 2, 4, 6], lang),
    source: parent,
    basis: "parent",
    seventhsAvailable: true,
    note: basis("parent", lang.title(lang.note(parent.root), lang.scaleName(parentDef))),
  };
}

/** One-line explanation of how a chord is stacked, e.g. "G → B (major 3rd) → D (minor 3rd)". */
export function describeChordStack(chord: ScaleChord, lang: TheoryLanguage = englishTheory): string {
  const parts = [lang.note(chord.tones[0].note)];
  for (let i = 1; i < chord.tones.length; i++) {
    const gap = mod12(pitchClassOf(chord.tones[i].note) - pitchClassOf(chord.tones[i - 1].note));
    parts.push(`${lang.note(chord.tones[i].note)} (${lang.chordGap(gap)})`);
  }
  return parts.join(" → ");
}
