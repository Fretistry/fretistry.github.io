import { describe, expect, it } from "vitest";
import { ROOT_NAMES, rootNote } from "@/lib/data/roots";
import { SCALES, getScale } from "@/lib/data/scales";
import { TUNING_PRESETS, getTuningPreset, makeCustomTuning } from "@/lib/data/tunings";
import { describeChordStack, identifyChord, scaleChords } from "./chords";
import { midiOf, mod12, noteToAscii, parseNote, parsePitch, pitchClassOf } from "./notes";
import {
  extraLowStrings,
  hasCagedShapes,
  isStandardShape,
  positionSystemsFor,
  scalePositions,
  type PositionNote,
  type ScalePosition,
} from "./positions";
import { spellScale } from "./scales";

const spell = (root: string, scaleId: string) => spellScale(parseNote(root), getScale(scaleId));
const standard = getTuningPreset("standard")!;
const byShape = (positions: ScalePosition[], letter: string) => positions.find((p) => p.cagedShape === letter)!;

/** Frets per string (low → high) of a position's first occurrence, e.g. "5 8 | 5 7 | …". */
function shape(notes: PositionNote[], stringCount = 6): string {
  return Array.from({ length: stringCount }, (_, s) =>
    notes
      .filter((n) => n.stringIndex === s)
      .map((n) => n.fret)
      .sort((a, b) => a - b)
      .join(" "),
  ).join(" | ");
}

describe("chords in the key", () => {
  it("builds the diatonic triads of C major", () => {
    const set = scaleChords(spell("C", "major"), "triad", SCALES);
    expect(set.chords.map((c) => c.symbol)).toEqual(["C", "Dm", "Em", "F", "G", "Am", "Bdim"]);
    expect(set.chords.map((c) => c.numeral)).toEqual(["I", "ii", "iii", "IV", "V", "vi", "vii°"]);
    expect(set.basis).toBe("scale");
  });

  it("builds 7th chords of C major", () => {
    const set = scaleChords(spell("C", "major"), "seventh", SCALES);
    expect(set.chords.map((c) => c.symbol)).toEqual(["Cmaj7", "Dm7", "Em7", "Fmaj7", "G7", "Am7", "Bm7♭5"]);
    expect(set.chords.map((c) => c.numeral)).toEqual(["Imaj7", "ii7", "iii7", "IVmaj7", "V7", "vi7", "viiø7"]);
    expect(set.chords[4].tones.map((t) => noteToAscii(t.note))).toEqual(["G", "B", "D", "F"]);
    expect(set.chords[4].tones.map((t) => t.interval.short)).toEqual(["1", "3", "5", "b7"]);
  });

  it("names minor-key chords relative to the major scale", () => {
    const set = scaleChords(spell("A", "natural-minor"), "triad", SCALES);
    expect(set.chords.map((c) => c.symbol)).toEqual(["Am", "Bdim", "C", "Dm", "Em", "F", "G"]);
    expect(set.chords.map((c) => c.numeral)).toEqual(["i", "ii°", "♭III", "iv", "v", "♭VI", "♭VII"]);
  });

  it("handles harmonic minor (augmented III, major V)", () => {
    const set = scaleChords(spell("A", "harmonic-minor"), "seventh", SCALES);
    expect(set.chords.map((c) => c.symbol)).toEqual(["Am(maj7)", "Bm7♭5", "Cmaj7♯5", "Dm7", "E7", "Fmaj7", "G♯dim7"]);
  });

  it("spells chords correctly in flat and sharp keys", () => {
    expect(scaleChords(spell("Bb", "major"), "triad", SCALES).chords.map((c) => c.symbol)).toEqual([
      "B♭", "Cm", "Dm", "E♭", "F", "Gm", "Adim",
    ]);
    expect(scaleChords(spell("F#", "major"), "triad", SCALES).chords[6].symbol).toBe("E♯dim");
  });

  it("uses the parent scale for pentatonic and blues scales", () => {
    const pent = scaleChords(spell("A", "minor-pentatonic"), "triad", SCALES);
    expect(pent.basis).toBe("parent");
    expect(pent.source.scale.id).toBe("natural-minor");
    expect(scaleChords(spell("C", "major-pentatonic"), "triad", SCALES).source.scale.id).toBe("major");
    expect(scaleChords(spell("E", "blues"), "triad", SCALES).source.scale.id).toBe("natural-minor");
  });

  it("builds augmented and diminished chords from symmetric scales", () => {
    const wt = scaleChords(spell("C", "whole-tone"), "seventh", SCALES);
    expect(wt.seventhsAvailable).toBe(false);
    expect(wt.chords.every((c) => c.type?.id === "aug")).toBe(true);
    const dim = scaleChords(spell("C", "diminished"), "seventh", SCALES);
    expect(dim.chords.every((c) => c.type?.id === "dim7")).toBe(true);
  });

  it("identifies chords from intervals and explains the stack", () => {
    expect(identifyChord([0, 4, 7, 10])?.name).toBe("dominant 7th");
    expect(identifyChord([7, 0, 4])?.id).toBe("maj");
    const g7 = scaleChords(spell("C", "major"), "seventh", SCALES).chords[4];
    expect(describeChordStack(g7)).toBe("G → B (major 3rd) → D (minor 3rd) → F (minor 3rd)");
  });

  it("recognises every chord for every root and scale", () => {
    for (const root of ROOT_NAMES) {
      for (const scale of SCALES) {
        for (const size of ["triad", "seventh"] as const) {
          const set = scaleChords(spellScale(rootNote(root), scale), size, SCALES);
          for (const chord of set.chords) {
            expect(chord.type, `${root} ${scale.id} ${chord.symbol}`).not.toBeNull();
            const rootPc = pitchClassOf(chord.root);
            chord.tones.forEach((t, i) => expect(mod12(pitchClassOf(t.note) - rootPc)).toBe(chord.type!.intervals[i]));
          }
        }
      }
    }
  });
});

describe("scale positions", () => {
  it("produces the five classic A minor pentatonic boxes", () => {
    const boxes = scalePositions(spell("A", "minor-pentatonic"), standard, "boxes");
    expect(boxes).toHaveLength(5);
    expect(shape(byShape(boxes, "E").occurrences[0])).toBe("5 8 | 5 7 | 5 7 | 5 7 | 5 8 | 5 8"); // "box 1"
    expect(shape(byShape(boxes, "D").occurrences[0])).toBe("8 10 | 7 10 | 7 10 | 7 9 | 8 10 | 8 10");
    expect(shape(byShape(boxes, "A").occurrences[0])).toBe("0 3 | 0 3 | 0 2 | 0 2 | 1 3 | 0 3"); // open position
    expect(shape(byShape(boxes, "A").occurrences[1])).toBe("12 15 | 12 15 | 12 14 | 12 14 | 13 15 | 12 15"); // repeats at the 12th fret
  });

  it("names the boxes C-A-G-E-D in standard tuning only, in that order", () => {
    const boxes = scalePositions(spell("C", "major"), standard, "boxes");
    expect(boxes.map((b) => b.cagedShape)).toEqual(["C", "A", "G", "E", "D"]);
    expect(boxes.map((b) => b.index)).toEqual([0, 1, 2, 3, 4]);
    expect(isStandardShape(standard)).toBe(true);
    expect(isStandardShape(getTuningPreset("d-standard")!)).toBe(true);
    expect(isStandardShape(getTuningPreset("drop-d")!)).toBe(false);
    expect(hasCagedShapes(getTuningPreset("drop-d")!)).toBe(false);
    expect(scalePositions(spell("C", "major"), getTuningPreset("open-g")!, "boxes")[0].cagedShape).toBeNull();
  });

  it("matches the standard CAGED major-scale diagrams (C major)", () => {
    const boxes = scalePositions(spell("C", "major"), standard, "boxes");
    expect(shape(byShape(boxes, "C").occurrences[0])).toBe("0 1 3 | 0 2 3 | 0 2 3 | 0 2 | 0 1 3 | 0 1 3");
    expect(shape(byShape(boxes, "A").occurrences[0])).toBe("3 5 | 2 3 5 | 2 3 5 | 2 4 5 | 3 5 6 | 3 5");
    expect(shape(byShape(boxes, "G").occurrences[0])).toBe("5 7 8 | 5 7 8 | 5 7 | 4 5 7 | 5 6 8 | 5 7 8");
    expect(shape(byShape(boxes, "E").occurrences[0])).toBe("7 8 10 | 7 8 10 | 7 9 10 | 7 9 10 | 8 10 | 7 8 10");
    expect(shape(byShape(boxes, "D").occurrences[0])).toBe("10 12 13 | 10 12 | 9 10 12 | 9 10 12 | 10 12 13 | 10 12 13");
  });

  it("fills 7-note scales into the familiar position shapes", () => {
    // A natural minor, root on the low E string at the 5th fret
    const aMinor = scalePositions(spell("A", "natural-minor"), standard, "boxes");
    expect(shape(byShape(aMinor, "E").occurrences[0])).toBe("5 7 8 | 5 7 8 | 5 7 | 4 5 7 | 5 6 8 | 5 7 8");
  });

  it("adds the blue note inside the pentatonic boxes", () => {
    const blues = scalePositions(spell("A", "blues"), standard, "boxes");
    expect(shape(byShape(blues, "E").occurrences[0])).toBe("5 8 | 5 6 7 | 5 7 | 5 7 8 | 5 8 | 5 8");
  });

  it("produces 3-notes-per-string patterns", () => {
    const g = scalePositions(spell("G", "major"), standard, "3nps");
    expect(g).toHaveLength(7);
    expect(shape(g[0].occurrences[0])).toBe("3 5 7 | 3 5 7 | 4 5 7 | 4 5 7 | 5 7 8 | 5 7 8");
    expect(g[0].occurrences[0].every((n, i, all) => i === 0 || n.midi > all[i - 1].midi)).toBe(true);
    expect(positionSystemsFor(spell("A", "minor-pentatonic"))).toEqual(["boxes"]);
    expect(positionSystemsFor(spell("A", "dorian"))).toEqual(["boxes", "3nps"]);
  });

  it("extends the boxes onto a 7th string, keeping the 6-string shapes and CAGED names", () => {
    const seven = getTuningPreset("seven-standard")!;
    const boxes7 = scalePositions(spell("A", "minor-pentatonic"), seven, "boxes");
    const boxes6 = scalePositions(spell("A", "minor-pentatonic"), standard, "boxes");
    // E shape ("box 1"): the low B string adds E and G below the familiar 5th-fret box.
    expect(shape(byShape(boxes7, "E").occurrences[0], 7)).toBe("5 8 | 5 8 | 5 7 | 5 7 | 5 7 | 5 8 | 5 8");
    for (let i = 0; i < 5; i++) {
      const topSix = boxes7[i].occurrences[0].filter((n) => n.stringIndex > 0).map((n) => ({ ...n, stringIndex: n.stringIndex - 1 }));
      expect(shape(topSix), `box ${i + 1}`).toBe(shape(boxes6[i].occurrences[0]));
    }
    expect(boxes7.map((b) => b.cagedShape)).toEqual(["C", "A", "G", "E", "D"]);
    expect(scalePositions(spell("C", "major"), getTuningPreset("seven-drop-a")!, "boxes")[0].cagedShape).toBe("C");
    expect(extraLowStrings(seven)).toBe(1);
    expect(extraLowStrings(standard)).toBe(0);
    expect(extraLowStrings(getTuningPreset("drop-b")!)).toBeNull();
    expect(isStandardShape(getTuningPreset("eb-standard")!)).toBe(true);
    expect(isStandardShape(getTuningPreset("c-standard")!)).toBe(true);
    expect(isStandardShape(seven)).toBe(false);
  });

  it("builds 3-notes-per-string patterns across all 7 strings", () => {
    const g = scalePositions(spell("G", "major"), getTuningPreset("seven-standard")!, "3nps");
    expect(g).toHaveLength(7);
    const first = g[0].occurrences[0];
    expect(new Set(first.map((n) => n.stringIndex)).size).toBe(7);
    expect(first).toHaveLength(21);
  });

  it("adapts positions to other tunings (Drop D)", () => {
    const dropD = getTuningPreset("drop-d")!;
    const boxes = scalePositions(spell("D", "minor-pentatonic"), dropD, "boxes");
    // Root D on the open 6th string in Drop D. The dropped string is a whole step
    // lower, so the G that sits on the A string in standard tuning moves to the 6th string.
    expect(shape(boxes[0].occurrences[0])).toBe("0 3 5 | 0 3 | 0 3 | 0 2 | 1 3 | 1 3");
  });

  it("always produces valid, in-scale, non-duplicated notes", { timeout: 60_000 }, () => {
    const tunings = [...TUNING_PRESETS, makeCustomTuning(["D2", "A2", "D3", "G3", "A3", "D4"].map(parsePitch))];
    const problems: string[] = [];
    for (const tuning of tunings) {
      const open = tuning.strings.map(midiOf);
      for (const root of ROOT_NAMES) {
        for (const scale of SCALES) {
          const spelled = spellScale(rootNote(root), scale);
          const rootPc = pitchClassOf(spelled.root);
          for (const system of positionSystemsFor(spelled)) {
            for (const pos of scalePositions(spelled, tuning, system)) {
              const where = `${tuning.id} ${root} ${scale.id} ${system} #${pos.index + 1}`;
              if (pos.occurrences.length === 0) problems.push(`${where}: no occurrence`);
              for (const occ of pos.occurrences) {
                const midis = occ.map((n) => n.midi);
                if (new Set(midis).size !== midis.length) problems.push(`${where}: duplicate pitch`);
                if (occ.length < scale.intervals.length) problems.push(`${where}: only ${occ.length} notes`);
                for (const n of occ) {
                  if (n.fret < 0 || n.fret > 24) problems.push(`${where}: fret ${n.fret}`);
                  if (open[n.stringIndex] + n.fret !== n.midi) problems.push(`${where}: wrong pitch`);
                  if (!scale.intervals.includes(mod12(n.midi - rootPc))) problems.push(`${where}: note outside scale`);
                }
              }
            }
          }
        }
      }
    }
    expect(problems).toEqual([]);
  });
});
