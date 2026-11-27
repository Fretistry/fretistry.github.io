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

/** Scales whose shapes most lessons number as "boxes" 1–5. */
const BOXED_SCALES = new Set(["minor-pentatonic", "blues"]);
const BOX_OF_SHAPE: Record<string, number> = { E: 1, D: 2, C: 3, A: 4, G: 5 };

/**
 * The usual box number of a minor pentatonic / blues shape: box 1 is the E shape
 * (root on the low E string, at the 5th fret in A), then D, C, A and G up the neck.
 * Null for other scales, which have no standard box numbers.
 */
export function pentatonicBox(scaleId: string, cagedShape: string | null | undefined): number | null {
  if (!cagedShape || !BOXED_SCALES.has(scaleId)) return null;
  return BOX_OF_SHAPE[cagedShape] ?? null;
}
