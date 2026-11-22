import { describe, expect, it } from "vitest";
import { getScale } from "@/lib/data/scales";
import { getTuningPreset } from "@/lib/data/tunings";
import { parseNote, pitchClassOf } from "./notes";
import { choosePlayShape, shapePath } from "./play-path";
import { scalePositions, type PositionNote } from "./positions";
import { spellScale } from "./scales";

const standard = getTuningPreset("standard")!;
const aMinorPent = spellScale(parseNote("A"), getScale("minor-pentatonic"));
const boxes = scalePositions(aMinorPent, standard, "boxes");
const eShape = boxes.find((b) => b.cagedShape === "E")!;
const span = (notes: readonly PositionNote[]) => {
  const frets = notes.map((n) => n.fret);
  return [Math.min(...frets), Math.max(...frets)];
};

describe("play scale on the neck", () => {
  it("plays the chosen shape where it fits in the visible frets, nearest the nut", () => {
    expect(span(choosePlayShape([eShape], 0, 24)!)).toEqual([5, 8]); // box 1 at the 5th fret
    expect(span(choosePlayShape([eShape], 12, 24)!)).toEqual([17, 20]); // its copy 12 frets higher
    expect(choosePlayShape([eShape], 0, 6)).toBeNull(); // doesn't fit
  });

  it("without a chosen shape, plays the one nearest the nut", () => {
    expect(span(choosePlayShape(boxes, 0, 24)!)).toEqual([0, 3]); // open position
    expect(span(choosePlayShape(boxes, 12, 24)!)).toEqual([12, 15]);
  });

  it("goes up through the shape and back down, the top note once", () => {
    const notes = choosePlayShape([eShape], 0, 24)!;
    const path = shapePath(notes, pitchClassOf(aMinorPent.root), aMinorPent.scale.intervals);
    expect(path).toHaveLength(notes.length * 2 - 1);
    const midis = path.map((s) => s.midi);
    const top = notes.length - 1;
    for (let i = 1; i <= top; i++) expect(midis[i]).toBeGreaterThan(midis[i - 1]);
    for (let i = top + 1; i < path.length; i++) expect(midis[i]).toBeLessThan(midis[i - 1]);
    expect(path[0]).toMatchObject({ stringIndex: 0, fret: 5, scaleIndex: 0 }); // starts on the low A root
    expect(path.at(-1)).toEqual(path[0]);
    // A C D E G → scale notes 0 1 2 3 4, in order, twice over two octaves
    expect(path.slice(0, 5).map((s) => s.scaleIndex)).toEqual([0, 1, 2, 3, 4]);
  });
});
