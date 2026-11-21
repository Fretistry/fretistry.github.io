import type { Letter, Pitch, SpelledNote } from "./types";

/**
 * Note-naming systems used around the world:
 * - "letters": C D E F G A B (English, Dutch, international chord charts)
 * - "german":  C D E F G A H, where B means B♭ (Germany, Austria, Scandinavia)
 * - "solfege": Do Re Mi Fa Sol La Si (France, Spain, Italy, Latin America)
 */
export type NoteNaming = "letters" | "german" | "solfege";

export type NoteFormatter = (note: SpelledNote) => string;

export interface NoteNameOptions {
  /** French writes "Ré"; Spanish and Italian write "Re". */
  accentedRe?: boolean;
}

const SOLFEGE: Readonly<Record<Letter, string>> = { C: "Do", D: "Re", E: "Mi", F: "Fa", G: "Sol", A: "La", B: "Si" };

function accidentals(accidental: number): string {
  if (accidental === 0) return "";
  return (accidental > 0 ? "♯" : "♭").repeat(Math.abs(accidental));
}

/** Name of a natural (letter) note in a naming system: B → "B", "H" or "Si". */
export function letterName(letter: Letter, naming: NoteNaming, options: NoteNameOptions = {}): string {
  if (naming === "german" && letter === "B") return "H";
  if (naming === "solfege") return letter === "D" && options.accentedRe ? "Ré" : SOLFEGE[letter];
  return letter;
}

/** Formats a spelled note in a naming system, e.g. B♭ → "B♭", "B" (German) or "Si♭". */
export function formatNoteIn(note: SpelledNote, naming: NoteNaming, options: NoteNameOptions = {}): string {
  if (naming === "german" && note.letter === "B") {
    // German: B natural is H, B♭ is simply B.
    if (note.accidental === -1) return "B";
    return `H${accidentals(note.accidental)}`;
  }
  return letterName(note.letter, naming, options) + accidentals(note.accidental);
}

export function formatPitchIn(pitch: Pitch, naming: NoteNaming, options: NoteNameOptions = {}): string {
  return `${formatNoteIn(pitch.note, naming, options)}${pitch.octave}`;
}
