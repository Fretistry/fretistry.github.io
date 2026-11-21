import { MAJOR_SCALE_SEMITONES } from "./intervals";
import { mod12 } from "./notes";
import {
  spellScale,
  spellScaleRaw,
  usesEachLetterOnce,
  type ScaleNote,
  type SpelledScale,
} from "./scales";
import type { ScaleDefinition, SpelledNote } from "./types";

/**
 * Relationship finders. Everything here is computed from interval data —
 * nothing is hard-coded per root note — so new scales automatically get
 * relationships too.
 */

const SEVEN = [1, 2, 3, 4, 5, 6, 7];
const FALLBACK_MODE_NAMES = ["Ionian", "Dorian", "Phrygian", "Lydian", "Mixolydian", "Aeolian", "Locrian"];

/** Pairs of scale ids that are "relatives" of each other: [major-type, minor-type]. */
export const RELATIVE_PAIRS: readonly (readonly [string, string])[] = [
  ["major", "natural-minor"],
  ["major-pentatonic", "minor-pentatonic"],
];

/** Re-measures a scale's intervals from its `start`-th note (a "mode" or "rotation"). */
export function rotateIntervals(intervals: readonly number[], start: number): number[] {
  const n = intervals.length;
  const base = intervals[start];
  return Array.from({ length: n }, (_, i) => mod12(intervals[(start + i) % n] - base));
}

export function sameIntervals(a: readonly number[], b: readonly number[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

export interface SameNotesMatch {
  /** Index of the note in the current scale that becomes the new root. */
  startIndex: number;
  root: SpelledNote;
  scale: ScaleDefinition;
}

/** Other registry scales that contain exactly the same notes, starting from another note. */
export function findSameNoteScales(spelled: SpelledScale, registry: readonly ScaleDefinition[]): SameNotesMatch[] {
  const matches: SameNotesMatch[] = [];
  const { intervals } = spelled.scale;
  for (let i = 1; i < intervals.length; i++) {
    const rotated = rotateIntervals(intervals, i);
    for (const def of registry) {
      if (def.id !== spelled.scale.id && sameIntervals(rotated, def.intervals)) {
        matches.push({ startIndex: i, root: spelled.notes[i].note, scale: def });
      }
    }
  }
  return matches;
}

export interface RelativeScale {
  /** "relative-minor" means the *other* scale is the relative minor of the current one. */
  kind: "relative-minor" | "relative-major";
  match: SameNotesMatch;
}

export function findRelative(spelled: SpelledScale, registry: readonly ScaleDefinition[]): RelativeScale | null {
  const pair = RELATIVE_PAIRS.find(([maj, min]) => maj === spelled.scale.id || min === spelled.scale.id);
  if (!pair) return null;
  const isMajorSide = pair[0] === spelled.scale.id;
  const otherId = isMajorSide ? pair[1] : pair[0];
  const match = findSameNoteScales(spelled, registry).find((m) => m.scale.id === otherId);
  if (!match) return null;
  return { kind: isMajorSide ? "relative-minor" : "relative-major", match };
}

/** The scale at the same root on the other side of a relative pair (C Major ↔ C Natural Minor). */
export function findParallelId(scaleId: string): string | null {
  const pair = RELATIVE_PAIRS.find(([maj, min]) => maj === scaleId || min === scaleId);
  if (!pair) return null;
  return pair[0] === scaleId ? pair[1] : pair[0];
}

export interface ModeFamilyRow {
  modeNumber: number;
  root: SpelledNote;
  name: string;
  /** Registry id of this mode, if the app knows it. */
  scaleId: string | null;
  isCurrent: boolean;
}

export interface ParentMajorInfo {
  parentRoot: SpelledNote;
  /** 1 = Ionian (the major scale itself), 2 = Dorian, ... 7 = Locrian. */
  modeNumber: number;
  modes: ModeFamilyRow[];
}

/** If the scale is a mode of the major scale, finds its parent major key and all sibling modes. */
export function findParentMajor(spelled: SpelledScale, registry: readonly ScaleDefinition[]): ParentMajorInfo | null {
  const { intervals } = spelled.scale;
  if (!usesEachLetterOnce(spelled.scale)) return null;
  for (let i = 0; i < 7; i++) {
    if (!sameIntervals(rotateIntervals(intervals, i), MAJOR_SCALE_SEMITONES)) continue;
    const parentRoot = spelled.notes[i].note;
    const modeNumber = ((7 - i) % 7) + 1;
    const parentNotes = spellScaleRaw(parentRoot, { intervals: MAJOR_SCALE_SEMITONES, degrees: SEVEN });
    const modes = parentNotes.map((pn, k): ModeFamilyRow => {
      const rotated = rotateIntervals(MAJOR_SCALE_SEMITONES, k);
      const def = registry.find((d) => sameIntervals(d.intervals, rotated));
      return {
        modeNumber: k + 1,
        root: pn.note,
        name: def?.modeName ?? def?.name ?? FALLBACK_MODE_NAMES[k],
        scaleId: def?.id ?? null,
        isCurrent: k === modeNumber - 1,
      };
    });
    return { parentRoot, modeNumber, modes };
  }
  return null;
}

/**
 * Seven-note scales other than the major scale whose modes are worth naming
 * (e.g. Phrygian Dominant = 5th mode of Harmonic Minor, Altered = 7th mode of
 * Melodic Minor, Hungarian Minor = 4th mode of Double Harmonic).
 */
export const MODE_PARENT_IDS: readonly string[] = ["harmonic-minor", "melodic-minor", "double-harmonic"];

export interface ParentScaleInfo {
  parentRoot: SpelledNote;
  parent: ScaleDefinition;
  /** Which note of the parent scale the current scale starts on (2–7). */
  modeNumber: number;
}

/**
 * If a seven-note scale is a mode of one of {@link MODE_PARENT_IDS} (and not
 * that scale itself), returns the parent scale and which mode it is.
 */
export function findParentScale(
  spelled: SpelledScale,
  registry: readonly ScaleDefinition[],
  parentIds: readonly string[] = MODE_PARENT_IDS,
): ParentScaleInfo | null {
  const { intervals } = spelled.scale;
  if (!usesEachLetterOnce(spelled.scale)) return null;
  for (const id of parentIds) {
    const parent = registry.find((d) => d.id === id);
    if (!parent || parent.id === spelled.scale.id) continue;
    for (let i = 1; i < 7; i++) {
      if (!sameIntervals(rotateIntervals(intervals, i), parent.intervals)) continue;
      return { parentRoot: spelled.notes[i].note, parent, modeNumber: ((7 - i) % 7) + 1 };
    }
  }
  return null;
}

export interface DegreeChange {
  index: number;
  from: ScaleNote;
  to: ScaleNote;
  direction: "raised" | "lowered";
}

/** Degree-by-degree differences between two 7-note scales on the same root (`to` relative to `from`). */
export function compareDegrees(from: readonly ScaleNote[], to: readonly ScaleNote[]): DegreeChange[] {
  if (from.length !== to.length) return [];
  const changes: DegreeChange[] = [];
  from.forEach((f, i) => {
    const t = to[i];
    if (f.semitones !== t.semitones) {
      changes.push({ index: i, from: f, to: t, direction: t.semitones > f.semitones ? "raised" : "lowered" });
    }
  });
  return changes;
}

export interface SubsetRelation {
  /** "contained-in": every note of the current scale is in `other`. "contains": the reverse. */
  kind: "contained-in" | "contains";
  other: SpelledScale;
  /** The notes the bigger scale has that the smaller one lacks. */
  difference: ScaleNote[];
}

/** Scales (on the same root) that are subsets or supersets of the current one. */
export function findSubsetRelations(spelled: SpelledScale, registry: readonly ScaleDefinition[]): SubsetRelation[] {
  const current = new Set(spelled.scale.intervals);
  const relations: SubsetRelation[] = [];
  for (const def of registry) {
    if (def.id === spelled.scale.id) continue;
    const other = new Set(def.intervals);
    if (other.size === current.size) continue;
    if (other.size > current.size && [...current].every((s) => other.has(s))) {
      const otherSpelled = spellScale(spelled.root, def);
      relations.push({
        kind: "contained-in",
        other: otherSpelled,
        difference: otherSpelled.notes.filter((n) => !current.has(n.semitones)),
      });
    } else if (other.size < current.size && [...other].every((s) => current.has(s))) {
      relations.push({
        kind: "contains",
        other: spellScale(spelled.root, def),
        difference: spelled.notes.filter((n) => !other.has(n.semitones)),
      });
    }
  }
  return relations.sort((a, b) => a.difference.length - b.difference.length);
}

/**
 * Smallest transposition (in semitones) that maps the scale onto itself, or
 * null if the scale is not symmetrical. Whole tone → 2, diminished → 3.
 */
export function symmetryPeriod(intervals: readonly number[]): number | null {
  const set = new Set(intervals);
  for (let k = 1; k < 12; k++) {
    if (intervals.every((s) => set.has(mod12(s + k)))) return k;
  }
  return null;
}

/** For a symmetrical scale, the roots that produce exactly the same notes. */
export function equivalentRoots(spelled: SpelledScale): SpelledNote[] {
  const period = symmetryPeriod(spelled.scale.intervals);
  if (!period) return [spelled.root];
  return spelled.notes.filter((n) => n.semitones % period === 0).map((n) => n.note);
}
