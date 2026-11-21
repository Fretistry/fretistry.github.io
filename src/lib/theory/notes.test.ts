import { describe, expect, it } from "vitest";
import {
  defaultSpelling,
  enharmonicAlternative,
  formatNote,
  formatPitch,
  midiOf,
  noteToAscii,
  parseNote,
  parsePitch,
  pitchClassOf,
  pitchFromMidi,
  transposePitch,
} from "./notes";

describe("notes", () => {
  it("computes pitch classes including accidentals", () => {
    expect(pitchClassOf(parseNote("C"))).toBe(0);
    expect(pitchClassOf(parseNote("C#"))).toBe(1);
    expect(pitchClassOf(parseNote("Db"))).toBe(1);
    expect(pitchClassOf(parseNote("B#"))).toBe(0);
    expect(pitchClassOf(parseNote("Cb"))).toBe(11);
    expect(pitchClassOf(parseNote("Fb"))).toBe(4);
    expect(pitchClassOf(parseNote("F##"))).toBe(7);
    expect(pitchClassOf(parseNote("Bbb"))).toBe(9);
  });

  it("parses ASCII and music-glyph note names", () => {
    expect(parseNote("F♯")).toEqual({ letter: "F", accidental: 1 });
    expect(parseNote("B♭")).toEqual({ letter: "B", accidental: -1 });
    expect(parseNote("eb")).toEqual({ letter: "E", accidental: -1 });
    expect(() => parseNote("H")).toThrow();
  });

  it("formats notes with music glyphs", () => {
    expect(formatNote(parseNote("F#"))).toBe("F♯");
    expect(formatNote(parseNote("Bb"))).toBe("B♭");
    expect(formatNote(parseNote("E"))).toBe("E");
  });

  it("converts between pitches and MIDI numbers", () => {
    expect(midiOf(parsePitch("C4"))).toBe(60);
    expect(midiOf(parsePitch("A4"))).toBe(69);
    expect(midiOf(parsePitch("E2"))).toBe(40); // low E string
    expect(midiOf(parsePitch("E4"))).toBe(64); // high E string
    expect(midiOf(parsePitch("D2"))).toBe(38);
  });

  it("assigns octaves by the written letter (B#3 = C4, Cb4 = B3)", () => {
    expect(formatPitch(pitchFromMidi(60, parseNote("B#")))).toBe("B♯3");
    expect(formatPitch(pitchFromMidi(59, parseNote("Cb")))).toBe("C♭4");
    expect(formatPitch(pitchFromMidi(60, parseNote("C")))).toBe("C4");
    expect(() => pitchFromMidi(60, parseNote("D"))).toThrow();
  });

  it("provides default sharp/flat spellings", () => {
    expect(noteToAscii(defaultSpelling(1, false))).toBe("C#");
    expect(noteToAscii(defaultSpelling(1, true))).toBe("Db");
    expect(noteToAscii(defaultSpelling(4, true))).toBe("E");
  });

  it("finds enharmonic alternatives for black keys only", () => {
    expect(noteToAscii(enharmonicAlternative(parseNote("C#"))!)).toBe("Db");
    expect(noteToAscii(enharmonicAlternative(parseNote("Eb"))!)).toBe("D#");
    expect(enharmonicAlternative(parseNote("E"))).toBeNull();
    expect(enharmonicAlternative(parseNote("E#"))).toBeNull();
  });

  it("transposes pitches across octave boundaries", () => {
    expect(formatPitch(transposePitch(parsePitch("B3"), 1))).toBe("C4");
    expect(formatPitch(transposePitch(parsePitch("E2"), -2))).toBe("D2");
    expect(formatPitch(transposePitch(parsePitch("E2"), -1, true))).toBe("E♭2");
  });
});
