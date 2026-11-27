import { describe, expect, it } from "vitest";
import { rootNote } from "@/lib/data/roots";
import { SCALES, getScale } from "@/lib/data/scales";
import { getTuningPreset } from "@/lib/data/tunings";
import { scalePositions, spellScale } from "@/lib/theory";
import { START_HERE, cagedIndex, pentatonicBox } from "./start-here";

const standard = getTuningPreset("standard")!;

describe("start here", () => {
  it("points at real scales and real CAGED shapes", () => {
    for (const point of START_HERE) {
      expect(SCALES.some((s) => s.id === point.scaleId)).toBe(true);
      const boxes = scalePositions(spellScale(rootNote(point.rootName), getScale(point.scaleId)), standard, "boxes");
      expect(boxes[cagedIndex(point.shape)]?.cagedShape).toBe(point.shape);
    }
  });

  it("starts in the familiar places on the neck", () => {
    const lowestFret = (i: number) => {
      const point = START_HERE[i];
      const boxes = scalePositions(spellScale(rootNote(point.rootName), getScale(point.scaleId)), standard, "boxes");
      return Math.min(...boxes[cagedIndex(point.shape)].occurrences.flat().map((n) => n.fret));
    };
    expect(lowestFret(0)).toBe(5); // A minor pentatonic, box 1 at the 5th fret
    expect(lowestFret(1)).toBe(0); // E minor pentatonic in open position
    expect(lowestFret(2)).toBe(0); // C major in open position
    expect(lowestFret(3)).toBe(5); // A blues, box 1
  });

  it("numbers the minor pentatonic and blues boxes the usual way", () => {
    expect(["E", "D", "C", "A", "G"].map((s) => pentatonicBox("minor-pentatonic", s))).toEqual([1, 2, 3, 4, 5]);
    expect(pentatonicBox("blues", "E")).toBe(1);
    // A minor pentatonic: box 1 at the 5th fret, box 2 (D shape) right above it, at the 7th/8th
    const boxes = scalePositions(spellScale(rootNote("A"), getScale("minor-pentatonic")), standard, "boxes");
    const start = (shape: string) => Math.min(...boxes.find((b) => b.cagedShape === shape)!.occurrences[0].map((n) => n.fret));
    expect(start("E")).toBe(5);
    expect(start("D")).toBeGreaterThan(start("E"));
    // Other scales have no standard box numbers
    expect(pentatonicBox("major", "E")).toBeNull();
    expect(pentatonicBox("major-pentatonic", "E")).toBeNull();
    expect(pentatonicBox("minor-pentatonic", null)).toBeNull();
  });
});
