import type { RootName } from "@/lib/data/roots";
import { CAGED_SEQUENCE } from "@/lib/theory";

/**
 * "Start here": manageable first scales for someone new, each in one
 * recognisable shape instead of the whole neck. Shown until the player has
 * favourites of their own.
 */
export interface StartingPoint {
  rootName: RootName;
  scaleId: string;
  /** CAGED shape to show (in tunings without CAGED names, the whole neck is shown). */
  shape: (typeof CAGED_SEQUENCE)[number];
}

export const START_HERE: readonly StartingPoint[] = [
  { rootName: "A", scaleId: "minor-pentatonic", shape: "E" }, // "box 1" at the 5th fret — usually the very first scale
  { rootName: "E", scaleId: "minor-pentatonic", shape: "E" }, // the same box in open position
  { rootName: "C", scaleId: "major", shape: "C" }, // the major scale in open position
  { rootName: "A", scaleId: "blues", shape: "E" }, // box 1 plus the blue note
];

/** Index of a CAGED shape in the shape list (C, A, G, E, D). */
export function cagedIndex(shape: StartingPoint["shape"]): number {
  return CAGED_SEQUENCE.indexOf(shape);
}
