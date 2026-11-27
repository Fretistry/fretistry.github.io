import type { ScaleCategory, ScaleDefinition } from "@/lib/theory/types";

/**
 * Scale registry.
 *
 * HOW TO ADD A SCALE
 * 1. Add an object below with:
 *    - `intervals`: semitones above the root (e.g. Major = 0 2 4 5 7 9 11)
 *    - `degrees`:   which letter step each note uses (1–7). For 7-note scales
 *                   this is simply 1 2 3 4 5 6 7. For other scales it decides
 *                   spelling, e.g. Blues uses degree 5 for semitone 6 → "♭5".
 * 2. That's it — the fretboard, spelling, theory explanations and the
 *    automated registry tests pick it up automatically.
 */

const SEVEN_DEGREES = [1, 2, 3, 4, 5, 6, 7] as const;

export const SCALE_CATEGORIES: readonly { id: ScaleCategory; label: string }[] = [
  { id: "major", label: "Major" },
  { id: "minor", label: "Minor" },
  { id: "blues", label: "Blues" },
  { id: "jazz", label: "Jazz & symmetric" },
  { id: "world", label: "World & exotic" },
];

export const SCALES: readonly ScaleDefinition[] = [
  // ── Major family ────────────────────────────────────────────────────────────
  {
    id: "major",
    name: "Major",
    modeName: "Ionian",
    category: "major",
    intervals: [0, 2, 4, 5, 7, 9, 11],
    degrees: SEVEN_DEGREES,
    character: "Bright, stable and happy — the reference point for most of Western music theory.",
    usage: "Pop, rock, folk, country, classical — countless melodies and chord progressions.",
  },
  {
    id: "major-pentatonic",
    name: "Major Pentatonic",
    category: "major",
    intervals: [0, 2, 4, 7, 9],
    degrees: [1, 2, 3, 5, 6],
    character: "Open, sweet and singable — with no half steps, it is very hard to hit a 'wrong' note.",
    usage: "Country, southern rock, blues-rock solos and folk melodies.",
  },
  {
    id: "lydian",
    name: "Lydian",
    modeName: "Lydian",
    category: "major",
    intervals: [0, 2, 4, 6, 7, 9, 11],
    degrees: SEVEN_DEGREES,
    character: "Dreamy, floating and extra-bright — the raised 4th adds a shimmering, 'sci-fi' colour.",
    usage: "Film and game scores, Joe Satriani, Steve Vai, jazz.",
  },
  {
    id: "mixolydian",
    name: "Mixolydian",
    modeName: "Mixolydian",
    category: "major",
    intervals: [0, 2, 4, 5, 7, 9, 10],
    degrees: SEVEN_DEGREES,
    character: "Major but bluesy — the flat 7th gives it a laid-back, rock-and-roll swagger.",
    usage: "Classic rock, blues, funk, jam bands and Celtic music.",
  },

  // ── Minor family ────────────────────────────────────────────────────────────
  {
    id: "natural-minor",
    name: "Natural Minor",
    fullName: "Natural Minor (Aeolian)",
    modeName: "Aeolian",
    category: "minor",
    intervals: [0, 2, 3, 5, 7, 8, 10],
    degrees: SEVEN_DEGREES,
    character: "Sad, serious and expressive — the standard minor sound.",
    usage: "Rock, metal, pop ballads, film music and classical.",
  },
  {
    id: "harmonic-minor",
    name: "Harmonic Minor",
    category: "minor",
    intervals: [0, 2, 3, 5, 7, 8, 11],
    degrees: SEVEN_DEGREES,
    character: "Dark and exotic — the raised 7th creates a dramatic step-and-a-half leap.",
    usage: "Neoclassical metal, flamenco, Middle-Eastern flavours and classical music.",
  },
  {
    id: "melodic-minor",
    name: "Melodic Minor",
    category: "minor",
    intervals: [0, 2, 3, 5, 7, 9, 11],
    degrees: SEVEN_DEGREES,
    character: "Smooth and sophisticated — minor at the bottom, major at the top.",
    usage: "Jazz and fusion (this is the 'jazz' melodic minor, the same going up and down).",
  },
  {
    id: "minor-pentatonic",
    name: "Minor Pentatonic",
    category: "minor",
    intervals: [0, 3, 5, 7, 10],
    degrees: [1, 3, 4, 5, 7],
    character: "The guitarist's home base — gritty, bluesy and instantly recognisable.",
    usage: "Blues, rock, metal and funk — most guitar solos start here.",
  },
  {
    id: "dorian",
    name: "Dorian",
    modeName: "Dorian",
    category: "minor",
    intervals: [0, 2, 3, 5, 7, 9, 10],
    degrees: SEVEN_DEGREES,
    character: "Minor but hopeful — the major 6th adds a soulful, jazzy brightness.",
    usage: "Funk, jazz, Santana, Pink Floyd and folk tunes.",
  },
  {
    id: "phrygian",
    name: "Phrygian",
    modeName: "Phrygian",
    category: "minor",
    intervals: [0, 1, 3, 5, 7, 8, 10],
    degrees: SEVEN_DEGREES,
    character: "Dark and Spanish-sounding — the flat 2nd creates instant tension.",
    usage: "Metal, flamenco and dramatic film scores.",
  },
  {
    id: "locrian",
    name: "Locrian",
    modeName: "Locrian",
    category: "minor",
    intervals: [0, 1, 3, 5, 6, 8, 10],
    degrees: SEVEN_DEGREES,
    character: "Unstable and unsettling — its diminished 5th means there is no solid home chord.",
    usage: "Metal riffs, tension passages, and jazz over half-diminished chords.",
  },

  // ── Blues ───────────────────────────────────────────────────────────────────
  {
    id: "blues",
    name: "Blues",
    category: "blues",
    intervals: [0, 3, 5, 6, 7, 10],
    degrees: [1, 3, 4, 5, 5, 7],
    character: "Minor pentatonic plus the 'blue note' — raw, expressive and vocal.",
    usage: "Blues, rock, jazz and soul.",
  },
  {
    id: "major-blues",
    name: "Major Blues",
    category: "blues",
    intervals: [0, 2, 3, 4, 7, 9],
    degrees: [1, 2, 3, 3, 5, 6],
    character: "Major pentatonic plus a ♭3 'blue note' that slides into the major 3rd — sunny, but with a bluesy bite.",
    usage: "Country, rockabilly, Texas blues, B.B. King and the Allman Brothers.",
  },

  // ── Jazz & symmetric ────────────────────────────────────────────────────────
  {
    id: "lydian-dominant",
    name: "Lydian Dominant",
    category: "jazz",
    intervals: [0, 2, 4, 6, 7, 9, 10],
    degrees: SEVEN_DEGREES,
    character: "Bright and adventurous — Lydian's raised 4th combined with Mixolydian's flat 7th.",
    usage: "Jazz over dominant 7th chords, fusion, and The Simpsons theme.",
  },
  {
    id: "altered",
    name: "Altered",
    fullName: "Altered (Super Locrian)",
    category: "jazz",
    intervals: [0, 1, 3, 4, 6, 8, 10],
    degrees: SEVEN_DEGREES,
    character: "Maximum tension — every note that can be altered is, so it pulls hard towards the next chord.",
    usage: "Jazz soloing over dominant chords that resolve (V7 → I). Jazz players think of its notes as ♭9, ♯9, 3, ♭5, ♯5 and ♭7.",
    playedOver: { suffix: "7alt", labels: ["1", "♭9", "♯9", "3", "♭5", "♯5", "♭7"] },
  },
  {
    id: "whole-tone",
    name: "Whole Tone",
    category: "jazz",
    intervals: [0, 2, 4, 6, 8, 10],
    degrees: [1, 2, 3, 4, 5, 7],
    character: "Dreamlike and ambiguous — every step is the same size, so there is no clear home.",
    usage: "Impressionist music (Debussy), jazz over augmented chords, dream sequences.",
  },
  {
    id: "diminished",
    name: "Diminished",
    fullName: "Diminished (Whole-Half)",
    category: "jazz",
    intervals: [0, 2, 3, 5, 6, 8, 9, 11],
    degrees: [1, 2, 3, 4, 5, 6, 6, 7],
    character: "Tense and symmetrical — strictly alternating whole and half steps.",
    usage: "Jazz over diminished 7th chords, metal, and suspenseful film music.",
  },
  {
    id: "diminished-half-whole",
    name: "Diminished Half-Whole",
    fullName: "Diminished (Half-Whole)",
    category: "jazz",
    intervals: [0, 1, 3, 4, 6, 7, 9, 10],
    degrees: [1, 2, 2, 3, 4, 5, 6, 7],
    character: "Spiky and symmetrical — alternating half and whole steps, full of ♭9 and ♯9 colour.",
    usage: "Jazz over dominant 7th(♭9) chords, fusion and metal.",
    playedOver: { suffix: "7♭9", labels: ["1", "♭9", "♯9", "3", "♯11", "5", "13", "♭7"] },
  },

  // ── World & exotic ──────────────────────────────────────────────────────────
  {
    id: "phrygian-dominant",
    name: "Phrygian Dominant",
    fullName: "Phrygian Dominant (Spanish)",
    category: "world",
    intervals: [0, 1, 4, 5, 7, 8, 10],
    degrees: SEVEN_DEGREES,
    character: "Fiery and exotic — Phrygian's dark flat 2nd with a bright major 3rd.",
    usage: "Flamenco, metal, Middle-Eastern and klezmer music; the 5th mode of harmonic minor.",
  },
  {
    id: "hungarian-minor",
    name: "Hungarian Minor",
    category: "world",
    intervals: [0, 2, 3, 6, 7, 8, 11],
    degrees: SEVEN_DEGREES,
    character: "Dramatic and haunting — harmonic minor with a raised 4th, giving two step-and-a-half leaps.",
    usage: "Eastern European and Gypsy music, neoclassical metal and film scores.",
  },
  {
    id: "double-harmonic",
    name: "Double Harmonic Major",
    fullName: "Double Harmonic Major (Byzantine)",
    category: "world",
    intervals: [0, 1, 4, 5, 7, 8, 11],
    degrees: SEVEN_DEGREES,
    character: "Strongly Middle-Eastern — two step-and-a-half leaps around a major chord.",
    usage: "Arabic and Indian-flavoured melodies, surf rock (Misirlou) and film music.",
  },
  {
    id: "hirajoshi",
    name: "Hirajoshi",
    category: "world",
    intervals: [0, 2, 3, 7, 8],
    degrees: [1, 2, 3, 5, 6],
    character: "Delicate and melancholic — a Japanese pentatonic scale with two half steps.",
    usage: "Japanese koto music, ambient and atmospheric metal.",
  },
];

export const DEFAULT_SCALE_ID = "major";

export function getScale(id: string): ScaleDefinition {
  const scale = SCALES.find((s) => s.id === id);
  if (!scale) throw new Error(`Unknown scale: ${id}`);
  return scale;
}

export function findScale(id: string): ScaleDefinition | undefined {
  return SCALES.find((s) => s.id === id);
}

export { scaleDisplayName } from "@/lib/theory/scales";
