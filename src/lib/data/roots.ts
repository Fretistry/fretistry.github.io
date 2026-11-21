import { parseNote } from "@/lib/theory/notes";
import type { SpelledNote } from "@/lib/theory/types";

/** The 12 root notes offered in the root picker, spelled the way guitarists usually name them. */
export const ROOT_NAMES = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"] as const;

export type RootName = (typeof ROOT_NAMES)[number];

export const DEFAULT_ROOT: RootName = "C";

export function rootNote(name: RootName): SpelledNote {
  return parseNote(name);
}

export function isRootName(value: unknown): value is RootName {
  return typeof value === "string" && (ROOT_NAMES as readonly string[]).includes(value);
}
