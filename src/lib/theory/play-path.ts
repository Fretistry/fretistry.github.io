import { mod12 } from "./notes";
import type { PositionNote, ScalePosition } from "./positions";

/**
 * Which notes on the neck "Play scale" plays, and in what order — so the
 * player can follow along with their fingers: one shape, from its lowest
 * note to its highest and back down, exactly where it sits on the neck.
 */

export interface PlayPathStep {
  stringIndex: number;
  fret: number;
  midi: number;
  /** Index of the scale note (0 = root), for highlighting the note chips. */
  scaleIndex: number;
}

/**
 * The shape to play: of all the given positions' copies on the neck, the one
 * that lies completely within the visible frets and is nearest the nut.
 * Null when none fits.
 */
export function choosePlayShape(candidates: readonly ScalePosition[], firstFret: number, lastFret: number): PositionNote[] | null {
  let best: PositionNote[] | null = null;
  let bestStart = Infinity;
  for (const position of candidates) {
    for (const occurrence of position.occurrences) {
      if (occurrence.length === 0) continue;
      const frets = occurrence.map((n) => n.fret);
      const start = Math.min(...frets);
      if (start < firstFret || Math.max(...frets) > lastFret) continue;
      if (start < bestStart) {
        best = occurrence;
        bestStart = start;
      }
    }
  }
  return best;
}

/** Up through the shape (lowest pitch first) and back down, playing the top note once. */
export function shapePath(notes: readonly PositionNote[], rootPitchClass: number, intervals: readonly number[]): PlayPathStep[] {
  const up = [...notes]
    .sort((a, b) => a.midi - b.midi)
    .map((n) => ({ ...n, scaleIndex: Math.max(0, intervals.indexOf(mod12(n.midi - rootPitchClass))) }));
  return [...up, ...up.slice(0, -1).reverse()];
}
