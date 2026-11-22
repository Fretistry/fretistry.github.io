import { describe, expect, it } from "vitest";
import { rootNote } from "@/lib/data/roots";
import { SCALES, getScale } from "@/lib/data/scales";
import { getTuningPreset } from "@/lib/data/tunings";
import { scalePositions, spellScale } from "@/lib/theory";
import { START_HERE, cagedIndex } from "./start-here";

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
});
