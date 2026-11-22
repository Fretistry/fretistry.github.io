import { describe, expect, it } from "vitest";
import { getScale } from "@/lib/data/scales";
import { getTuningPreset } from "@/lib/data/tunings";
import { buildScaleFretboard, parseNote, pitchClassOf, positionKey, spellScale } from "@/lib/theory";
import { inTrainerArea, pickTarget, trainerTargets } from "./trainer";

const standard = getTuningPreset("standard")!;
const aMinorPent = spellScale(parseNote("A"), getScale("minor-pentatonic"));
const board = buildScaleFretboard(standard, aMinorPent);
const A = pitchClassOf(parseNote("A"));

describe("fretboard trainer", () => {
  it("finds every spot of a note within the visible frets", () => {
    // A in frets 0–12 of standard tuning: low E 5, A 0 and 12, D 7, G 2, B 10, high E 5
    const targets = trainerTargets(board, A, 0, 12, null);
    expect([...targets].sort()).toEqual(
      [positionKey(0, 5), positionKey(1, 0), positionKey(1, 12), positionKey(2, 7), positionKey(3, 2), positionKey(4, 10), positionKey(5, 5)].sort(),
    );
    // 12–24: the same spots an octave up (and the A string's 12th fret again)
    expect(trainerTargets(board, A, 12, 24, null).size).toBe(7);
  });

  it("narrows the quiz to the chosen shapes", () => {
    const area = new Set([positionKey(0, 5), positionKey(0, 6), positionKey(5, 5), positionKey(3, 7)]);
    expect([...trainerTargets(board, A, 0, 24, area)].sort()).toEqual([positionKey(0, 5), positionKey(5, 5)].sort());
    expect(inTrainerArea(board[0][5], 0, 24, area)).toBe(true);
    expect(inTrainerArea(board[0][7], 0, 24, area)).toBe(false); // outside the shapes
    expect(inTrainerArea(board[0][5], 12, 24, area)).toBe(false); // outside the visible frets
    expect(inTrainerArea(board[0][15], 12, 24, null)).toBe(true);
  });

  it("picks notes repeatably, with variety, and never the same note twice in a row", () => {
    const pcs = aMinorPent.notes.map((n) => pitchClassOf(n.note));
    expect(pickTarget(pcs, "ctx", 3, null)).toBe(pickTarget(pcs, "ctx", 3, null));
    let previous: number | null = null;
    const seen = new Set<number>();
    for (let round = 0; round < 200; round++) {
      const index = pickTarget(pcs, "A|minor-pentatonic", round, previous);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(pcs.length);
      expect(pcs[index]).not.toBe(previous);
      seen.add(pcs[index]);
      previous = pcs[index];
    }
    expect(seen.size).toBe(pcs.length); // every note comes up sooner or later
    expect(pickTarget([7], "ctx", 5, 7)).toBe(0); // a single note can only be asked again
  });
});
