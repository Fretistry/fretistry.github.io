import { midiOf, mod12, pitchClassOf } from "./notes";
import { thirdQuality, type SpelledScale } from "./scales";
import type { Tuning } from "./types";

/**
 * Scale positions ("box shapes"): playable patterns that cover the scale in
 * one hand position. Everything is computed from the tuning, so the patterns
 * are correct in Drop D, open tunings and custom tunings too.
 *
 * - "boxes": 5 positions per octave. Pentatonic scales give the classic 5
 *   pentatonic boxes (2 notes per string). 7-note scales fill those boxes with
 *   the missing notes, which produces the familiar CAGED scale shapes.
 * - "3nps": three notes per string, one pattern starting on each scale degree.
 */

export type PositionSystem = "boxes" | "3nps";

export interface PositionNote {
  stringIndex: number;
  fret: number;
  midi: number;
}

export interface ScalePosition {
  system: PositionSystem;
  /** 0-based position number. */
  index: number;
  /** CAGED shape letter (only for standard-type tunings). */
  cagedShape: string | null;
  /** Which scale note the pattern starts on (on the lowest string). */
  startSemitones: number;
  /** Every occurrence of the pattern that fits on the neck (it repeats every 12 frets). */
  occurrences: PositionNote[][];
}

const MAJOR_PENTATONIC = [0, 2, 4, 7, 9];
const MINOR_PENTATONIC = [0, 3, 5, 7, 10];
/** The CAGED letter of each box as computed (box 1 starts on the root on the 6th string = E shape). */
const CAGED_ORDER = ["E", "D", "C", "A", "G"];
/** The order guitarists learn and name the shapes in. */
export const CAGED_SEQUENCE = ["C", "A", "G", "E", "D"] as const;
const MAX_STRETCH = 2;

export function positionSystemsFor(spelled: SpelledScale): PositionSystem[] {
  return spelled.notes.length >= 6 ? ["boxes", "3nps"] : ["boxes"];
}

/**
 * How many extra low strings sit below six strings tuned in the standard
 * pattern (4ths with a major 3rd between G and B): 0 for E, E♭, D or C
 * standard, 1 for a 7-string guitar with a low B or A. Null when the top six
 * strings are not in that pattern (Drop D, open tunings…).
 */
export function extraLowStrings(tuning: Tuning): number | null {
  const count = tuning.strings.length;
  if (count < 6) return null;
  const midis = tuning.strings.slice(count - 6).map(midiOf);
  const gaps = midis.slice(1).map((m, i) => m - midis[i]);
  return gaps.join(",") === "5,5,5,4,5" ? count - 6 : null;
}

/** True for a six-string guitar in the standard pattern (E standard, D standard, E♭ standard…). */
export function isStandardShape(tuning: Tuning): boolean {
  return extraLowStrings(tuning) === 0;
}

/** The ascending run of scale pitches starting at `startMidi`. */
function* scalePitchesFrom(startMidi: number, rootPc: number, intervals: ReadonlySet<number>) {
  for (let m = startMidi; m < startMidi + 120; m++) {
    if (intervals.has(mod12(m - rootPc))) yield m;
  }
}

/**
 * Lays out consecutive scale pitches across the strings, `perString` notes on
 * each string, lowest string first. Pitches that are too low for the next
 * string stay on the previous one, so unusual tunings still work.
 */
function notesPerString(
  openMidis: readonly number[],
  startMidi: number,
  rootPc: number,
  intervals: readonly number[],
  perString: number,
): PositionNote[] {
  const pitches = scalePitchesFrom(startMidi, rootPc, new Set(intervals));
  const notes: PositionNote[] = [];
  let pending = pitches.next().value as number;
  openMidis.forEach((open, stringIndex) => {
    // Notes below this string's open pitch must stay on the previous string.
    while (pending < open && stringIndex > 0) {
      notes.push({ stringIndex: stringIndex - 1, fret: pending - openMidis[stringIndex - 1], midi: pending });
      pending = pitches.next().value as number;
    }
    for (let k = 0; k < perString; k++) {
      notes.push({ stringIndex, fret: pending - open, midi: pending });
      pending = pitches.next().value as number;
    }
  });
  return notes;
}

/** Lowest pitch on the low string (fret ≥ 0) whose pitch class is `pc`. */
function lowestOnString(openMidi: number, pc: number): number {
  return openMidi + mod12(pc - openMidi);
}

/**
 * Where a box starts on the lowest string. On guitars with extra low strings
 * (7-string), the box is first placed on the standard six strings — so box 1
 * is the same "E shape" a 6-string player knows — and then extended
 * downwards by two notes per extra string.
 */
function boxStart(openMidis: readonly number[], extra: number, rootPc: number, pc: number, anchor: readonly number[]): number {
  if (extra === 0) return lowestOnString(openMidis[0], pc);
  let midi = lowestOnString(openMidis[extra], pc);
  for (let found = 0; found < 2 * extra; ) {
    midi--;
    if (anchor.includes(mod12(midi - rootPc))) found++;
  }
  while (midi < openMidis[0]) midi += 12;
  return midi;
}

/** Adds the scale notes that a pentatonic "anchor" box is missing, each on the string where it is easiest to reach. */
function fillBox(
  anchors: PositionNote[],
  openMidis: readonly number[],
  rootPc: number,
  scaleIntervals: readonly number[],
): PositionNote[] {
  const inScale = (m: number) => scaleIntervals.includes(mod12(m - rootPc));
  const stringCount = openMidis.length;
  const windows = openMidis.map((_, s) => {
    const frets = anchors.filter((a) => a.stringIndex === s).map((a) => a.fret);
    return frets.length ? { lo: Math.min(...frets), hi: Math.max(...frets) } : null;
  });

  const kept = anchors.filter((a) => inScale(a.midi));
  const taken = new Set(kept.map((a) => a.midi));
  const minP = Math.min(...anchors.map((a) => a.midi));
  const maxP = Math.max(...anchors.map((a) => a.midi));
  const result = [...kept];

  const place = (midi: number) => {
    let best: { s: number; fret: number; outside: number } | null = null;
    for (let s = 0; s < stringCount; s++) {
      const w = windows[s];
      if (!w) continue;
      const fret = midi - openMidis[s];
      if (fret < 0) continue;
      const outside = fret < w.lo ? w.lo - fret : fret > w.hi ? fret - w.hi : 0;
      if (outside > MAX_STRETCH) continue;
      if (!best || outside < best.outside) best = { s, fret, outside };
    }
    if (best) {
      result.push({ stringIndex: best.s, fret: best.fret, midi });
      taken.add(midi);
    }
  };

  for (let m = minP; m <= maxP; m++) {
    if (inScale(m) && !taken.has(m)) place(m);
  }

  // A note just below the box on the lowest string, or just above it on the highest.
  const low = windows[0];
  if (low) {
    const m = openMidis[0] + low.lo - 1;
    if (low.lo - 1 >= 0 && m < minP && inScale(m)) result.push({ stringIndex: 0, fret: low.lo - 1, midi: m });
  }
  const high = windows[stringCount - 1];
  if (high) {
    const m = openMidis[stringCount - 1] + high.hi + 1;
    if (m > maxP && inScale(m)) result.push({ stringIndex: stringCount - 1, fret: high.hi + 1, midi: m });
  }

  return result.sort((a, b) => a.midi - b.midi);
}

/** Repeats a pattern every 12 frets and keeps the copies that (mostly) fit on the neck. */
function occurrencesOnNeck(base: PositionNote[], fretCount: number): PositionNote[][] {
  const result: PositionNote[][] = [];
  for (const shift of [0, 12, 24]) {
    const moved = base.map((n) => ({ ...n, fret: n.fret + shift, midi: n.midi + shift }));
    const fitting = moved.filter((n) => n.fret >= 0 && n.fret <= fretCount);
    if (fitting.length >= Math.ceil(moved.length * 0.75)) result.push(fitting);
  }
  return result;
}

/** Computes all positions of a scale in one system. */
export function scalePositions(
  spelled: SpelledScale,
  tuning: Tuning,
  system: PositionSystem,
  fretCount = 24,
): ScalePosition[] {
  const openMidis = tuning.strings.map(midiOf);
  const rootPc = pitchClassOf(spelled.root);
  const intervals = spelled.scale.intervals;
  const extra = extraLowStrings(tuning);

  if (system === "3nps") {
    return intervals.map((startSemitones, index) => {
      const start = lowestOnString(openMidis[0], mod12(rootPc + startSemitones));
      const base = notesPerString(openMidis, start, rootPc, intervals, 3);
      return { system, index, cagedShape: null, startSemitones, occurrences: occurrencesOnNeck(base, fretCount) };
    });
  }

  const anchor = thirdQuality(spelled.scale) === "major" ? MAJOR_PENTATONIC : MINOR_PENTATONIC;
  const isAnchorItself = intervals.length === anchor.length && intervals.every((v, i) => v === anchor[i]);
  const boxes: ScalePosition[] = anchor.map((startSemitones, index) => {
    const start = boxStart(openMidis, extra ?? 0, rootPc, mod12(rootPc + startSemitones), anchor);
    const anchors = notesPerString(openMidis, start, rootPc, anchor, 2);
    const base = isAnchorItself ? anchors : fillBox(anchors, openMidis, rootPc, intervals);
    return {
      system,
      index,
      cagedShape: extra !== null ? CAGED_ORDER[index] : null,
      startSemitones,
      occurrences: occurrencesOnNeck(base, fretCount),
    };
  });
  if (extra === null) return boxes;
  // CAGED tunings: present the shapes as guitarists know them — C, A, G, E, D.
  return CAGED_SEQUENCE.map((letter, index) => ({ ...boxes.find((b) => b.cagedShape === letter)!, index }));
}

/** True when the box shapes carry CAGED names (standard-type tunings, including 7-string). */
export function hasCagedShapes(tuning: Tuning): boolean {
  return extraLowStrings(tuning) !== null;
}

/**
 * The position that sits nearest a fret (any of its occurrences, so also the copy 12 frets
 * higher), for "stay in this area" when changing key. Ties go to the lower one.
 */
export function nearestPosition(positions: readonly ScalePosition[], fret: number): number | null {
  let best: { index: number; distance: number; start: number } | null = null;
  for (const p of positions) {
    for (const occurrence of p.occurrences) {
      if (occurrence.length === 0) continue;
      const start = Math.min(...occurrence.map((n) => n.fret));
      const distance = Math.abs(start - fret);
      if (!best || distance < best.distance || (distance === best.distance && start < best.start)) best = { index: p.index, distance, start };
    }
  }
  return best?.index ?? null;
}

/** Lowest fret used by the first occurrence — handy for labels like "5th fret". */
export function positionStartFret(position: ScalePosition): number | null {
  const first = position.occurrences[0];
  return first && first.length ? Math.min(...first.map((n) => n.fret)) : null;
}
