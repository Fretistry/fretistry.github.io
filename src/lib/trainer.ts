import type { FretboardNote } from "@/lib/theory";

/**
 * Fretboard trainer ("find every G"): pure helpers. The quiz area is the
 * visible fret range — narrowed to the chosen CAGED shapes / boxes when any
 * are shown — so you can practise one shape at a time.
 */

/** Is this spot part of the quiz? `area` = the chosen shapes' spots (null = the whole visible range). */
export function inTrainerArea(note: Pick<FretboardNote, "key" | "fret">, firstFret: number, lastFret: number, area: ReadonlySet<string> | null): boolean {
  return note.fret >= firstFret && note.fret <= lastFret && (!area || area.has(note.key));
}

/** Every spot in the quiz area where the asked note lives. */
export function trainerTargets(
  board: readonly (readonly FretboardNote[])[],
  pitchClass: number,
  firstFret: number,
  lastFret: number,
  area: ReadonlySet<string> | null,
): Set<string> {
  const keys = new Set<string>();
  for (const row of board) {
    for (const note of row) {
      if (note.pitchClass === pitchClass && inTrainerArea(note, firstFret, lastFret, area)) keys.add(note.key);
    }
  }
  return keys;
}

/**
 * Which of the scale's notes to ask for in a round. Random-looking but
 * repeatable (the same scale and round give the same note), and never the
 * same note twice in a row.
 */
export function pickTarget(pitchClasses: readonly number[], context: string, round: number, avoid: number | null): number {
  const n = pitchClasses.length;
  if (n <= 1) return 0;
  let hash = 2166136261;
  for (const ch of `${context}#${round}`) {
    hash ^= ch.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  hash >>>= 0;
  let index = hash % n;
  if (pitchClasses[index] === avoid) index = (index + 1 + ((hash >>> 8) % (n - 1))) % n;
  return index;
}
