import { describe, expect, it } from "vitest";
import { ROOT_NAMES, rootNote } from "@/lib/data/roots";
import { SCALES, getScale } from "@/lib/data/scales";
import { intervalFromDegree } from "./intervals";
import { enharmonicAlternative, mod12, noteToAscii, parseNote, pitchClassOf } from "./notes";
import { spellScale, stepPattern, usesEachLetterOnce, type SpelledScale } from "./scales";

const spell = (root: string, scaleId: string) => spellScale(parseNote(root), getScale(scaleId));
const names = (s: SpelledScale) => s.notes.map((n) => noteToAscii(n.note)).join(" ");
const formula = (s: SpelledScale) => s.notes.map((n) => n.interval.short).join(" ");
const steps = (scaleId: string) =>
  stepPattern(getScale(scaleId).intervals)
    .map((x) => (x === 1 ? "H" : x === 2 ? "W" : x === 3 ? "W+H" : String(x)))
    .join(" ");

describe("scale definitions (registry)", () => {
  it("uses the specified semitone formulas", () => {
    expect(getScale("major").intervals).toEqual([0, 2, 4, 5, 7, 9, 11]);
    expect(getScale("natural-minor").intervals).toEqual([0, 2, 3, 5, 7, 8, 10]);
    expect(getScale("minor-pentatonic").intervals).toEqual([0, 3, 5, 7, 10]);
    expect(getScale("major-pentatonic").intervals).toEqual([0, 2, 4, 7, 9]);
    expect(getScale("blues").intervals).toEqual([0, 3, 5, 6, 7, 10]);
  });

  it.each(SCALES.map((s) => [s.id, s] as const))("%s is internally consistent", (_id, scale) => {
    expect(scale.intervals[0]).toBe(0);
    expect(scale.degrees[0]).toBe(1);
    expect(scale.degrees.length).toBe(scale.intervals.length);
    for (let i = 1; i < scale.intervals.length; i++) {
      expect(scale.intervals[i]).toBeGreaterThan(scale.intervals[i - 1]);
      expect(scale.degrees[i]).toBeGreaterThanOrEqual(scale.degrees[i - 1]);
    }
    expect(scale.intervals[scale.intervals.length - 1]).toBeLessThan(12);
    // every semitone/degree pair must be a sensible interval (at most one sharp/flat away from major)
    scale.intervals.forEach((semis, i) => {
      const interval = intervalFromDegree(semis, scale.degrees[i]);
      expect(["perfect", "major", "minor", "augmented", "diminished"]).toContain(interval.quality);
    });
  });

  it("has unique ids", () => {
    expect(new Set(SCALES.map((s) => s.id)).size).toBe(SCALES.length);
  });
});

describe("required scales", () => {
  it("C Major", () => {
    const s = spell("C", "major");
    expect(names(s)).toBe("C D E F G A B");
    expect(formula(s)).toBe("1 2 3 4 5 6 7");
    expect(s.notes.map((n) => n.interval.name)).toEqual([
      "Root",
      "Major 2nd",
      "Major 3rd",
      "Perfect 4th",
      "Perfect 5th",
      "Major 6th",
      "Major 7th",
    ]);
    expect(steps("major")).toBe("W W H W W W H");
  });

  it("A Natural Minor", () => {
    const s = spell("A", "natural-minor");
    expect(names(s)).toBe("A B C D E F G");
    expect(formula(s)).toBe("1 2 b3 4 5 b6 b7");
    expect(steps("natural-minor")).toBe("W H W W H W W");
  });

  it("A Minor Pentatonic", () => {
    const s = spell("A", "minor-pentatonic");
    expect(names(s)).toBe("A C D E G");
    expect(formula(s)).toBe("1 b3 4 5 b7");
  });

  it("E Minor Pentatonic", () => {
    const s = spell("E", "minor-pentatonic");
    expect(names(s)).toBe("E G A B D");
  });

  it("other scales on common roots", () => {
    expect(names(spell("G", "major-pentatonic"))).toBe("G A B D E");
    expect(names(spell("A", "blues"))).toBe("A C D Eb E G");
    expect(formula(spell("A", "blues"))).toBe("1 b3 4 b5 5 b7");
    expect(names(spell("D", "dorian"))).toBe("D E F G A B C");
    expect(names(spell("E", "phrygian"))).toBe("E F G A B C D");
    expect(names(spell("F", "lydian"))).toBe("F G A B C D E");
    expect(names(spell("G", "mixolydian"))).toBe("G A B C D E F");
    expect(names(spell("B", "locrian"))).toBe("B C D E F G A");
    expect(names(spell("A", "harmonic-minor"))).toBe("A B C D E F G#");
    expect(names(spell("A", "melodic-minor"))).toBe("A B C D E F# G#");
    expect(names(spell("C", "whole-tone"))).toBe("C D E F# G# Bb");
    expect(names(spell("C", "diminished"))).toBe("C D Eb F Gb Ab A B");
  });

  it("added scales: blues, jazz and world", () => {
    expect(names(spell("A", "major-blues"))).toBe("A B C C# E F#");
    expect(formula(spell("A", "major-blues"))).toBe("1 2 b3 3 5 6");
    expect(names(spell("C", "lydian-dominant"))).toBe("C D E F# G A Bb");
    expect(names(spell("G", "altered"))).toBe("G Ab Bb Cb Db Eb F");
    expect(names(spell("C", "diminished-half-whole"))).toBe("C Db D# E F# G A Bb");
    expect(formula(spell("C", "diminished-half-whole"))).toBe("1 b2 #2 3 #4 5 6 b7");
    expect(names(spell("E", "phrygian-dominant"))).toBe("E F G# A B C D");
    expect(names(spell("A", "hungarian-minor"))).toBe("A B C D# E F G#");
    expect(names(spell("E", "double-harmonic"))).toBe("E F G# A B C D#");
    expect(names(spell("A", "hirajoshi"))).toBe("A B C E F");
    // Unavoidable double sharp: C♯ Hungarian minor (D♭ would need a double flat too)
    expect(names(spell("C#", "hungarian-minor"))).toBe("C# D# E F## G# A B#");
  });
});

describe("enharmonic spelling", () => {
  it("uses flats and sharps correctly instead of always one or the other", () => {
    expect(names(spell("F", "major"))).toBe("F G A Bb C D E"); // Bb, not A#
    expect(names(spell("F#", "major"))).toBe("F# G# A# B C# D# E#"); // E#, not F
    expect(names(spell("Eb", "major"))).toBe("Eb F G Ab Bb C D");
    expect(names(spell("Bb", "major"))).toBe("Bb C D Eb F G A");
    expect(names(spell("C#", "major"))).toBe("C# D# E# F# G# A# B#");
    expect(names(spell("C", "natural-minor"))).toBe("C D Eb F G Ab Bb");
    expect(names(spell("F#", "harmonic-minor"))).toBe("F# G# A B C# D E#");
    expect(names(spell("Eb", "natural-minor"))).toBe("Eb F Gb Ab Bb Cb Db");
  });

  it("switches to the enharmonic root to avoid double accidentals in 7-note scales", () => {
    const s = spell("C#", "lydian"); // C# Lydian would need F##
    expect(noteToAscii(s.root)).toBe("Db");
    expect(names(s)).toBe("Db Eb F G Ab Bb C");
    expect(s.notices[0]?.kind).toBe("respelled-root");

    expect(names(spell("Eb", "locrian"))).toBe("D# E F# G# A B C#"); // avoids Bbb
    expect(names(spell("Ab", "harmonic-minor"))).toBe("Ab Bb Cb Db Eb Fb G");
  });

  it("offers a tip when the enharmonic key is simpler", () => {
    const s = spell("Ab", "natural-minor"); // 7 flats vs G# minor's 5 sharps
    expect(names(s)).toBe("Ab Bb Cb Db Eb Fb Gb");
    const tip = s.notices.find((n) => n.kind === "enharmonic-tip");
    expect(tip && noteToAscii(tip.alternativeRoot)).toBe("G#");
  });

  it("respells single notes in non-7-note scales (Eb blues uses A, not Bbb)", () => {
    const s = spell("Eb", "blues");
    expect(names(s)).toBe("Eb Gb Ab A Bb Db");
    // The blue note keeps its name from the formula: ♭5 in every key, also when it is written A.
    expect(formula(s)).toBe("1 b3 4 b5 5 b7");
    expect(formula(spell("A", "blues"))).toBe("1 b3 4 b5 5 b7");
    expect(formula(spell("Ab", "blues"))).toBe("1 b3 4 b5 5 b7");
    expect(s.notices.some((n) => n.kind === "respelled-note")).toBe(true);
  });

  it("chooses flats or sharps for notes outside the scale from the key", () => {
    expect(spell("C", "natural-minor").prefersFlats).toBe(true);
    expect(spell("E", "major").prefersFlats).toBe(false);
    expect(spell("D", "minor-pentatonic").prefersFlats).toBe(true); // D minor key signature has Bb
    expect(spell("E", "minor-pentatonic").prefersFlats).toBe(false); // E minor has F#
    expect(spell("D", "harmonic-minor").prefersFlats).toBe(true);
  });
});

describe("all roots × all scales", () => {
  const cases = ROOT_NAMES.flatMap((root) => SCALES.map((scale) => [root, scale.id] as const));

  it.each(cases)("%s %s is spelled correctly", (root, scaleId) => {
    const scale = getScale(scaleId);
    const s = spellScale(rootNote(root), scale);
    const rootPc = pitchClassOf(s.root);

    // The root always sounds like the requested root.
    expect(rootPc).toBe(pitchClassOf(rootNote(root)));
    // Every note sounds exactly `interval` semitones above the root.
    s.notes.forEach((n, i) => {
      expect(pitchClassOf(n.note)).toBe(mod12(rootPc + scale.intervals[i]));
      expect(n.interval.semitones).toBe(scale.intervals[i]);
      expect(Math.abs(n.note.accidental)).toBeLessThanOrEqual(usesEachLetterOnce(scale) ? 2 : 1);
    });

    if (usesEachLetterOnce(scale)) {
      // 7-note scales: every letter exactly once.
      expect(new Set(s.notes.map((n) => n.note.letter)).size).toBe(7);
      // Double sharps/flats only when unavoidable: the other spelling of the root would need at least as many.
      const doubles = (x: typeof s) => x.notes.filter((n) => Math.abs(n.note.accidental) >= 2).length;
      const alternative = enharmonicAlternative(rootNote(root));
      const alternativeDoubles = alternative ? doubles(spellScale(alternative, scale)) : Infinity;
      if (doubles(s) > 0) expect(doubles(s)).toBeLessThanOrEqual(alternativeDoubles);
      // The classic modes and minor scales never need them.
      if (["major", "natural-minor", "harmonic-minor", "melodic-minor", "dorian", "phrygian", "lydian", "mixolydian", "locrian"].includes(scaleId)) {
        expect(doubles(s)).toBe(0);
      }
    }
  });
});
