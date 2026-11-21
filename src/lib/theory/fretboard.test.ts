import { describe, expect, it } from "vitest";
import { ROOT_NAMES, rootNote } from "@/lib/data/roots";
import { SCALES, getScale } from "@/lib/data/scales";
import { TUNING_GROUPS, TUNING_PRESETS, getTuningPreset, makeCustomTuning, withStringCount } from "@/lib/data/tunings";
import { annotateFretboard, buildFretboard, buildScaleFretboard } from "./fretboard";
import { formatPitch, midiOf, mod12, noteToAscii, parseNote, parsePitch, pitchClassOf } from "./notes";
import { spellScale } from "./scales";
import type { Tuning } from "./types";

const standard = getTuningPreset("standard")!;
const dropD = getTuningPreset("drop-d")!;
const noteName = (n: { note: Parameters<typeof noteToAscii>[0]; octave: number }) => `${noteToAscii(n.note)}${n.octave}`;

describe("tunings", () => {
  it("stores standard tuning as real pitches E2 A2 D3 G3 B3 E4", () => {
    expect(standard.strings.map(midiOf)).toEqual([40, 45, 50, 55, 59, 64]);
    expect(standard.strings.map(formatPitch)).toEqual(["E2", "A2", "D3", "G3", "B3", "E4"]);
  });

  it("defines every preset with real pitches", () => {
    const expected: Record<string, string> = {
      standard: "E2 A2 D3 G3 B3 E4",
      "drop-d": "D2 A2 D3 G3 B3 E4",
      "d-standard": "D2 G2 C3 F3 A3 D4",
      "drop-c": "C2 G2 C3 F3 A3 D4",
      "open-g": "D2 G2 D3 G3 B3 D4",
      "open-d": "D2 A2 D3 F#3 A3 D4",
      "eb-standard": "Eb2 Ab2 Db3 Gb3 Bb3 Eb4",
      "c-standard": "C2 F2 Bb2 Eb3 G3 C4",
      "drop-b": "B1 F#2 B2 E3 G#3 C#4",
      "open-e": "E2 B2 E3 G#3 B3 E4",
      "open-a": "E2 A2 E3 A3 C#4 E4",
      "open-c": "C2 G2 C3 G3 C4 E4",
      dadgad: "D2 A2 D3 G3 A3 D4",
      "seven-standard": "B1 E2 A2 D3 G3 B3 E4",
      "seven-drop-a": "A1 E2 A2 D3 G3 B3 E4",
    };
    for (const t of TUNING_PRESETS) {
      expect(t.strings.map((p) => `${noteToAscii(p.note)}${p.octave}`).join(" ")).toBe(expected[t.id]);
    }
    expect(TUNING_PRESETS).toHaveLength(Object.keys(expected).length);
  });

  it("puts every preset in exactly one menu group", () => {
    const grouped = TUNING_GROUPS.flatMap((g) => g.tuningIds);
    expect([...grouped].sort()).toEqual(TUNING_PRESETS.map((t) => t.id).sort());
  });

  it("adds and removes low strings for 6- and 7-string custom tunings", () => {
    const seven = withStringCount(standard.strings, 7);
    expect(seven.map(formatPitch)).toEqual(["B1", "E2", "A2", "D3", "G3", "B3", "E4"]);
    expect(withStringCount(seven, 6).map(formatPitch)).toEqual(["E2", "A2", "D3", "G3", "B3", "E4"]);
    // A new low string on Drop D lands a 4th below D: A1.
    expect(formatPitch(withStringCount(getTuningPreset("drop-d")!.strings, 7)[0])).toBe("A1");
  });
});

describe("fretboard positions", () => {
  it("builds 6 strings × 25 positions (open + 24 frets)", () => {
    const board = buildFretboard(standard, 24);
    expect(board).toHaveLength(6);
    board.forEach((row) => expect(row).toHaveLength(25));
  });

  it("numbers strings the guitarist's way (1 = high E, 6 = low E)", () => {
    const board = buildFretboard(standard);
    expect(board[0][0].stringNumber).toBe(6);
    expect(board[5][0].stringNumber).toBe(1);
  });

  it("raises the pitch by one semitone per fret", () => {
    const board = buildFretboard(standard);
    expect(board[0][5].midi).toBe(45); // A2 at the 5th fret of the low E string
    expect(board[0][12].midi).toBe(52); // octave
    expect(board[0][24].midi).toBe(64); // two octaves = high E open
    expect(board[4][1].midi).toBe(60); // B string, 1st fret = middle C
  });

  it("shows correct notes in C Major on standard tuning", () => {
    const board = buildScaleFretboard(standard, spellScale(parseNote("C"), getScale("major")));
    expect(noteName(board[0][0])).toBe("E2");
    expect(noteName(board[0][8])).toBe("C3");
    expect(board[0][8].isRoot).toBe(true);
    expect(noteName(board[4][1])).toBe("C4");
    expect(board[0][1].inScale).toBe(true); // F
    expect(board[0][2].inScale).toBe(false); // F#
    expect(noteToAscii(board[0][2].note)).toBe("F#");
    expect(board[0][2].interval.short).toBe("#4");
  });

  it("finds the A minor pentatonic roots where guitarists expect them", () => {
    const board = buildScaleFretboard(standard, spellScale(parseNote("A"), getScale("minor-pentatonic")));
    const rootFrets = (stringIndex: number) => board[stringIndex].filter((n) => n.isRoot).map((n) => n.fret);
    expect(rootFrets(0)).toEqual([5, 17]); // low E string
    expect(rootFrets(1)).toEqual([0, 12, 24]); // A string
    expect(rootFrets(3)).toEqual([2, 14]); // G string
    // The classic "box 1" at the 5th fret: C on the A string 3rd fret, D on 5th, etc.
    expect(board[0].filter((n) => n.inScale && n.fret >= 5 && n.fret <= 8).map((n) => noteToAscii(n.note))).toEqual([
      "A",
      "C",
    ]);
  });

  it("puts every open string of standard tuning inside E minor pentatonic", () => {
    const board = buildScaleFretboard(standard, spellScale(parseNote("E"), getScale("minor-pentatonic")));
    expect(board.every((row) => row[0].inScale)).toBe(true);
    expect(board[0][0].isRoot && board[5][0].isRoot).toBe(true);
    expect(board[1][0].interval.short).toBe("4"); // A is the 4th of E
    expect(board[2][0].interval.short).toBe("b7"); // D is the b7 of E
  });

  it("recalculates notes for Drop D tuning", () => {
    const board = buildFretboard(dropD);
    expect(board[0][0].midi).toBe(38); // D2
    expect(board[0][2].midi).toBe(40); // E2 — 2nd fret of dropped string = old open E
    expect(board[0][7].midi).toBe(45); // A2 — matches the open A string
    // other strings are unchanged
    expect(board.slice(1).map((row) => row[0].midi)).toEqual([45, 50, 55, 59, 64]);

    const annotated = annotateFretboard(board, spellScale(parseNote("D"), getScale("major")));
    expect(annotated[0][0].isRoot).toBe(true);
    expect(noteName(annotated[0][0])).toBe("D2");
  });

  it("supports custom tunings (DADGAD)", () => {
    const dadgad = makeCustomTuning(["D2", "A2", "D3", "G3", "A3", "D4"].map(parsePitch));
    const board = buildScaleFretboard(dadgad, spellScale(parseNote("D"), getScale("major")));
    expect(board.map((row) => row[0].midi)).toEqual([38, 45, 50, 55, 57, 62]);
    expect(board[4][0].interval.short).toBe("5"); // open A string is the 5th of D
    expect(noteName(board[4][2])).toBe("B3");
    expect(board[4][2].interval.short).toBe("6");
    expect(board[5].filter((n) => n.isRoot).map((n) => n.fret)).toEqual([0, 12, 24]);
  });

  it("supports custom tunings with any number of strings (7-string B standard)", () => {
    const seven: Tuning = makeCustomTuning(["B1", "E2", "A2", "D3", "G3", "B3", "E4"].map(parsePitch));
    const board = buildFretboard(seven);
    expect(board).toHaveLength(7);
    expect(board[0][0].stringNumber).toBe(7);
    expect(board[0][0].midi).toBe(35);
  });

  it("keeps note spelling, octave and pitch consistent for every tuning, root and scale", { timeout: 60_000 }, () => {
    // Problems are collected and checked once: millions of separate expect() calls are slow.
    const problems: string[] = [];
    for (const tuning of TUNING_PRESETS) {
      for (const root of ROOT_NAMES) {
        for (const scale of SCALES) {
          const spelled = spellScale(rootNote(root), scale);
          const board = buildScaleFretboard(tuning, spelled);
          for (const row of board) {
            for (const pos of row) {
              const where = `${tuning.id} ${root} ${scale.id} ${pos.key}`;
              if (pitchClassOf(pos.note) !== pos.pitchClass) problems.push(`${where}: pitch class`);
              if (midiOf({ note: pos.note, octave: pos.octave }) !== pos.midi) problems.push(`${where}: octave`);
              if (pos.interval.semitones !== mod12(pos.pitchClass - pitchClassOf(spelled.root))) problems.push(`${where}: interval`);
              if (pos.inScale !== scale.intervals.includes(pos.interval.semitones)) problems.push(`${where}: in scale`);
            }
          }
        }
      }
    }
    expect(problems).toEqual([]);
  });
});
