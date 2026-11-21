import { intervalFromDegree, spellInterval } from "./intervals";
import { enharmonicAlternative, formatNote, pitchClassOf } from "./notes";
import type { Interval, PitchClass, ScaleDefinition, SpelledNote } from "./types";

/** One note of a scale, spelled for a specific root. */
export interface ScaleNote {
  /** 0-based position in the scale (0 = root). */
  index: number;
  note: SpelledNote;
  /** Semitones above the root. */
  semitones: number;
  /** Generic degree (letter step) actually used to spell the note. */
  degree: number;
  interval: Interval;
}

/** Explains any spelling decision the engine made, so the UI can tell the user. */
export type SpellingNotice =
  | {
      /** The requested root would need double sharps/flats, so its enharmonic twin is used. */
      kind: "respelled-root";
      requestedRoot: SpelledNote;
      usedRoot: SpelledNote;
      /** Notes with double accidentals that the switch avoided. */
      avoided: SpelledNote[];
    }
  | {
      /** The scale is spelled correctly, but the enharmonic key is the more common way to write it. */
      kind: "enharmonic-tip";
      alternativeRoot: SpelledNote;
      currentAccidentals: number;
      alternativeAccidentals: number;
    }
  | {
      /** A single note was respelled with a neighbouring letter to avoid a double sharp/flat. */
      kind: "respelled-note";
      original: SpelledNote;
      used: SpelledNote;
      interval: Interval;
    };

export interface SpelledScale {
  scale: ScaleDefinition;
  /** The root the user asked for. */
  requestedRoot: SpelledNote;
  /** The root actually used for spelling (usually the same as requested). */
  root: SpelledNote;
  notes: ScaleNote[];
  /** Whether notes outside the scale should be named with flats (true) or sharps (false). */
  prefersFlats: boolean;
  notices: SpellingNotice[];
}

const MAJOR_INTERVALS = [0, 2, 4, 5, 7, 9, 11];
const NATURAL_MINOR_INTERVALS = [0, 2, 3, 5, 7, 8, 10];
const SEVEN = [1, 2, 3, 4, 5, 6, 7];

export function scaleDisplayName(scale: ScaleDefinition): string {
  return scale.fullName ?? scale.name;
}

/** "A Natural Minor (Aeolian)" */
export function spelledScaleTitle(spelled: SpelledScale): string {
  return `${formatNote(spelled.root)} ${scaleDisplayName(spelled.scale)}`;
}

/** 7-note scales whose degrees are exactly 1–7 must use every letter exactly once. */
export function usesEachLetterOnce(scale: Pick<ScaleDefinition, "degrees">): boolean {
  return scale.degrees.length === 7 && scale.degrees.every((d, i) => d === i + 1);
}

/** The quality of the scale's 3rd, which is what makes a scale sound major or minor. */
export function thirdQuality(scale: Pick<ScaleDefinition, "intervals" | "degrees">): "major" | "minor" | null {
  const thirds = scale.intervals.filter((_, i) => scale.degrees[i] === 3);
  // A scale with both (major blues) is major: its ♭3 is a passing "blue note".
  if (thirds.includes(4)) return "major";
  if (thirds.includes(3)) return "minor";
  return null;
}

/** Semitone gaps between neighbouring notes, including the gap back up to the octave. */
export function stepPattern(intervals: readonly number[]): number[] {
  return intervals.map((semis, i) => (i < intervals.length - 1 ? intervals[i + 1] : 12) - semis);
}

/** Spells a scale strictly from its degree definitions, without any corrections. */
export function spellScaleRaw(
  root: SpelledNote,
  scale: Pick<ScaleDefinition, "intervals" | "degrees">,
): ScaleNote[] {
  return scale.intervals.map((semitones, index) => {
    const degree = scale.degrees[index];
    return {
      index,
      note: spellInterval(root, semitones, degree),
      semitones,
      degree,
      interval: intervalFromDegree(semitones, degree),
    };
  });
}

function countDoubleAccidentals(notes: readonly ScaleNote[]): number {
  return notes.filter((n) => Math.abs(n.note.accidental) >= 2).length;
}

export function countAccidentals(notes: readonly ScaleNote[]): number {
  return notes.reduce((sum, n) => sum + Math.abs(n.note.accidental), 0);
}

function accidentalBalance(notes: readonly { note: SpelledNote }[]): number {
  return notes.reduce((sum, n) => sum + Math.sign(n.note.accidental), 0);
}

/**
 * Respells any double-sharp/double-flat note using the neighbouring letter.
 * Used for scales that don't need one-letter-per-degree (pentatonic, blues,
 * symmetric scales). The interval label is re-derived from the new spelling so
 * the label always matches the written note (e.g. E♭ blues → A natural is a ♯4).
 */
function respellDoubleAccidentals(
  root: SpelledNote,
  notes: ScaleNote[],
): { notes: ScaleNote[]; notices: SpellingNotice[] } {
  const notices: SpellingNotice[] = [];
  const result = notes.map((n) => {
    if (Math.abs(n.note.accidental) < 2) return n;
    const candidates = [n.degree - 1, n.degree + 1]
      .map((degree) => ({ degree, note: spellInterval(root, n.semitones, degree) }))
      .filter((c) => Math.abs(c.note.accidental) <= 1)
      .sort((a, b) => Math.abs(a.note.accidental) - Math.abs(b.note.accidental));
    const best = candidates[0];
    if (!best) return n;
    const interval = intervalFromDegree(n.semitones, best.degree);
    notices.push({ kind: "respelled-note", original: n.note, used: best.note, interval });
    return { ...n, note: best.note, degree: interval.degree, interval };
  });
  return { notes: result, notices };
}

function decidePrefersFlats(root: SpelledNote, scale: ScaleDefinition, notes: ScaleNote[]): boolean {
  const balance = accidentalBalance(notes);
  if (balance !== 0) return balance < 0;
  // Tie (e.g. A minor pentatonic, or D harmonic minor with B♭ and C♯):
  // follow the key signature of the related major / natural minor scale.
  const reference = thirdQuality(scale) === "minor" ? NATURAL_MINOR_INTERVALS : MAJOR_INTERVALS;
  const referenceBalance = accidentalBalance(spellScaleRaw(root, { intervals: reference, degrees: SEVEN }));
  if (referenceBalance !== 0) return referenceBalance < 0;
  return root.accidental < 0;
}

/**
 * Spells a scale for a root with correct musical spelling.
 *
 * 1. Every note is named from its scale degree: the 3rd degree always uses the
 *    letter two steps above the root, so E♭ major has A♭ (not G♯).
 * 2. 7-note scales that would need double sharps/flats (e.g. C♯ Lydian needs
 *    F𝄪) are respelled from the enharmonic root (D♭ Lydian) and a notice explains why.
 * 3. Other scales respell individual double-accidental notes instead.
 * 4. When an enharmonic key is notably simpler, a friendly tip is added.
 */
export function spellScale(requestedRoot: SpelledNote, scale: ScaleDefinition): SpelledScale {
  let root = requestedRoot;
  let notes = spellScaleRaw(requestedRoot, scale);
  const notices: SpellingNotice[] = [];

  if (usesEachLetterOnce(scale)) {
    const alternative = enharmonicAlternative(requestedRoot);
    if (alternative) {
      const altNotes = spellScaleRaw(alternative, scale);
      const doubles = countDoubleAccidentals(notes);
      const altDoubles = countDoubleAccidentals(altNotes);
      if (doubles > 0 && altDoubles < doubles) {
        notices.push({
          kind: "respelled-root",
          requestedRoot,
          usedRoot: alternative,
          avoided: notes.filter((n) => Math.abs(n.note.accidental) >= 2).map((n) => n.note),
        });
        root = alternative;
        notes = altNotes;
      } else if (altDoubles === 0 && countAccidentals(altNotes) + 2 <= countAccidentals(notes)) {
        notices.push({
          kind: "enharmonic-tip",
          alternativeRoot: alternative,
          currentAccidentals: countAccidentals(notes),
          alternativeAccidentals: countAccidentals(altNotes),
        });
      }
    }
  }

  // 7-note scales keep one letter per degree even if a double sharp/flat is
  // unavoidable (e.g. C♯ Hungarian minor needs F𝄪); other scales respell such notes.
  if (!usesEachLetterOnce(scale)) {
    const respelled = respellDoubleAccidentals(root, notes);
    notes = respelled.notes;
    notices.push(...respelled.notices);
  }

  return {
    scale,
    requestedRoot,
    root,
    notes,
    prefersFlats: decidePrefersFlats(root, scale, notes),
    notices,
  };
}

/** Finds the scale note with a given pitch class, if the pitch is in the scale. */
export function scaleNoteForPitchClass(spelled: SpelledScale, pc: PitchClass): ScaleNote | undefined {
  return spelled.notes.find((n) => pitchClassOf(n.note) === pc);
}

/** The set of pitch classes in a spelled scale. */
export function pitchClassSet(spelled: SpelledScale): Set<PitchClass> {
  return new Set(spelled.notes.map((n) => pitchClassOf(n.note)));
}
