import type { Letter, Pitch, PitchClass, SpelledNote } from "./types";

/** Letters in musical order. */
export const LETTERS: readonly Letter[] = ["C", "D", "E", "F", "G", "A", "B"];

/** Pitch class of each natural (un-sharpened, un-flattened) letter. */
export const NATURAL_PITCH_CLASS: Readonly<Record<Letter, PitchClass>> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

/** Positive modulo 12 (JavaScript's % can return negative numbers). */
export function mod12(n: number): number {
  return ((n % 12) + 12) % 12;
}

/** Positive modulo 7, used for letter arithmetic. */
export function mod7(n: number): number {
  return ((n % 7) + 7) % 7;
}

/** Normalises a semitone difference into the range -6..+5. */
export function signedSemitoneDiff(n: number): number {
  return mod12(n + 6) - 6;
}

export function note(letter: Letter, accidental = 0): SpelledNote {
  return { letter, accidental };
}

export function letterIndex(letter: Letter): number {
  return LETTERS.indexOf(letter);
}

/** The letter `steps` letters above `start` (wrapping G → A → B → C ...). */
export function letterAt(start: Letter, steps: number): Letter {
  return LETTERS[mod7(letterIndex(start) + steps)];
}

export function pitchClassOf(n: SpelledNote): PitchClass {
  return mod12(NATURAL_PITCH_CLASS[n.letter] + n.accidental);
}

export function sameSpelling(a: SpelledNote, b: SpelledNote): boolean {
  return a.letter === b.letter && a.accidental === b.accidental;
}

/** True if the two notes sound the same, regardless of spelling (C♯ and D♭). */
export function isEnharmonic(a: SpelledNote, b: SpelledNote): boolean {
  return pitchClassOf(a) === pitchClassOf(b);
}

/** Accidental symbols. Double accidentals use doubled glyphs for reliable font support. */
function accidentalText(accidental: number, ascii: boolean): string {
  if (accidental === 0) return "";
  const symbol = accidental > 0 ? (ascii ? "#" : "♯") : ascii ? "b" : "♭";
  return symbol.repeat(Math.abs(accidental));
}

/** Formats a note for display, e.g. "F♯", "B♭", "E". */
export function formatNote(n: SpelledNote): string {
  return n.letter + accidentalText(n.accidental, false);
}

/** ASCII form, e.g. "F#", "Bb" — handy for keys, storage and tests. */
export function noteToAscii(n: SpelledNote): string {
  return n.letter + accidentalText(n.accidental, true);
}

/**
 * Parses a note name. Accepts ASCII ("C#", "Bb", "F##", "Ebb") and music glyphs
 * ("C♯", "B♭"). Throws on invalid input so data mistakes are caught early.
 */
export function parseNote(name: string): SpelledNote {
  const match = /^([A-Ga-g])((?:#|♯|b|♭|x|𝄪|𝄫)*)$/u.exec(name.trim());
  if (!match) throw new Error(`Invalid note name: "${name}"`);
  const letter = match[1].toUpperCase() as Letter;
  let accidental = 0;
  for (const ch of Array.from(match[2])) {
    if (ch === "#" || ch === "♯") accidental += 1;
    else if (ch === "x" || ch === "𝄪") accidental += 2;
    else if (ch === "b" || ch === "♭") accidental -= 1;
    else if (ch === "𝄫") accidental -= 2;
  }
  return { letter, accidental };
}

/** MIDI note number of a pitch (C4 = 60, A4 = 69, low E on a guitar = E2 = 40). */
export function midiOf(p: Pitch): number {
  return (p.octave + 1) * 12 + NATURAL_PITCH_CLASS[p.note.letter] + p.note.accidental;
}

/**
 * Builds a pitch from a MIDI number using the given spelling.
 * The octave follows the written letter, so MIDI 60 spelled B♯ is B♯3 and
 * MIDI 59 spelled C♭ is C♭4 — exactly how it is notated.
 */
export function pitchFromMidi(midi: number, spelling: SpelledNote): Pitch {
  if (mod12(midi) !== pitchClassOf(spelling)) {
    throw new Error(`Spelling ${noteToAscii(spelling)} does not match MIDI ${midi}`);
  }
  const naturalMidi = midi - spelling.accidental - NATURAL_PITCH_CLASS[spelling.letter];
  return { note: spelling, octave: Math.floor(naturalMidi / 12) - 1 };
}

export function parsePitch(text: string): Pitch {
  const match = /^(.+?)(-?\d+)$/.exec(text.trim());
  if (!match) throw new Error(`Invalid pitch: "${text}"`);
  return { note: parseNote(match[1]), octave: Number(match[2]) };
}

export function formatPitch(p: Pitch): string {
  return `${formatNote(p.note)}${p.octave}`;
}

const SHARP_NAMES: readonly SpelledNote[] = [
  note("C"), note("C", 1), note("D"), note("D", 1), note("E"), note("F"),
  note("F", 1), note("G"), note("G", 1), note("A"), note("A", 1), note("B"),
];

const FLAT_NAMES: readonly SpelledNote[] = [
  note("C"), note("D", -1), note("D"), note("E", -1), note("E"), note("F"),
  note("G", -1), note("G"), note("A", -1), note("A"), note("B", -1), note("B"),
];

/** The simplest spelling of a pitch class, using sharps or flats for the black keys. */
export function defaultSpelling(pc: PitchClass, preferFlats: boolean): SpelledNote {
  return (preferFlats ? FLAT_NAMES : SHARP_NAMES)[mod12(pc)];
}

/**
 * For "black key" notes written with one sharp or flat, returns the other
 * common spelling (C♯ ↔ D♭, E♭ ↔ D♯, ...). Returns null for natural notes.
 */
export function enharmonicAlternative(n: SpelledNote): SpelledNote | null {
  if (Math.abs(n.accidental) !== 1) return null;
  const pc = pitchClassOf(n);
  const isBlackKey = !Object.values(NATURAL_PITCH_CLASS).includes(pc);
  if (!isBlackKey) return null;
  return n.accidental > 0 ? FLAT_NAMES[pc] : SHARP_NAMES[pc];
}

/** Transposes a pitch by semitones, spelling the result with sharps or flats. */
export function transposePitch(p: Pitch, semitones: number, preferFlats = false): Pitch {
  const midi = midiOf(p) + semitones;
  return pitchFromMidi(midi, defaultSpelling(mod12(midi), preferFlats));
}

/** Ordinal suffix helper: 1 → "1st", 2 → "2nd", 3 → "3rd", 4 → "4th". */
export function ordinal(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}
