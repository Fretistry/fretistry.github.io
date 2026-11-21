import { describe, expect, it } from "vitest";
import { intervalBetween, intervalFromDegree, spellInterval } from "./intervals";
import { noteToAscii, parseNote } from "./notes";

const between = (a: string, b: string) => intervalBetween(parseNote(a), parseNote(b));

describe("intervals", () => {
  it("identifies intervals from spelled notes", () => {
    expect(between("C", "C").name).toBe("Root");
    expect(between("C", "E").name).toBe("Major 3rd");
    expect(between("A", "C").name).toBe("Minor 3rd");
    expect(between("C", "G").name).toBe("Perfect 5th");
    expect(between("C", "F").name).toBe("Perfect 4th");
    expect(between("C", "B").name).toBe("Major 7th");
    expect(between("C", "Bb").name).toBe("Minor 7th");
    expect(between("E", "G").name).toBe("Minor 3rd");
    expect(between("C#", "E#").name).toBe("Major 3rd");
    expect(between("Eb", "Ab").name).toBe("Perfect 4th");
  });

  it("distinguishes enharmonic intervals by spelling", () => {
    expect(between("C", "F#").name).toBe("Augmented 4th");
    expect(between("C", "F#").short).toBe("#4");
    expect(between("C", "Gb").name).toBe("Diminished 5th");
    expect(between("C", "Gb").short).toBe("b5");
    expect(between("C", "D#").name).toBe("Augmented 2nd");
    expect(between("C", "Eb").name).toBe("Minor 3rd");
  });

  it("builds intervals from semitones + degree", () => {
    expect(intervalFromDegree(0, 1).short).toBe("1");
    expect(intervalFromDegree(3, 3).short).toBe("b3");
    expect(intervalFromDegree(3, 3).label).toBe("♭3");
    expect(intervalFromDegree(6, 5).short).toBe("b5");
    expect(intervalFromDegree(6, 4).short).toBe("#4");
    expect(intervalFromDegree(8, 5).short).toBe("#5");
    expect(intervalFromDegree(10, 7).quality).toBe("minor");
    expect(intervalFromDegree(9, 7).quality).toBe("diminished");
  });

  it("spells notes by degree", () => {
    expect(noteToAscii(spellInterval(parseNote("Eb"), 5, 4))).toBe("Ab");
    expect(noteToAscii(spellInterval(parseNote("F#"), 11, 7))).toBe("E#");
    expect(noteToAscii(spellInterval(parseNote("C"), 6, 5))).toBe("Gb");
    expect(noteToAscii(spellInterval(parseNote("C"), 6, 4))).toBe("F#");
  });
});
