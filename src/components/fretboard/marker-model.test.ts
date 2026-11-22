import { describe, expect, it } from "vitest";
import { SCALES, getScale } from "@/lib/data/scales";
import { getTuningPreset } from "@/lib/data/tunings";
import {
  buildScaleFretboard,
  parseNote,
  pitchClassOf,
  positionKey,
  scaleChords,
  scalePositions,
  spellScale,
} from "@/lib/theory";
import { MAX_TAPER, TRUE_TAPER, computeGeometry, fitTaper, minimumLength, positionArea } from "./geometry";
import { computeMarker, type ChordDisplay, type MarkerOptions } from "./marker-model";

const standard = getTuningPreset("standard")!;
const aMinorPent = spellScale(parseNote("A"), getScale("minor-pentatonic"));
const board = buildScaleFretboard(standard, aMinorPent);
const lowE = board[0];
const A5 = lowE[5]; // root
const C8 = lowE[8]; // b3
const B7 = lowE[7]; // outside the scale

const base: MarkerOptions = {
  labelMode: "note",
  visibility: "scale",
  selectedKey: null,
  selectedPitchClass: null,
};

describe("marker model — explore mode", () => {
  it("classifies root, scale and outside notes", () => {
    expect(computeMarker(A5, base).variant).toBe("root");
    expect(computeMarker(C8, base).variant).toBe("scale");
    expect(computeMarker(B7, base).variant).toBe("outside");
  });

  it("applies the visibility filter", () => {
    expect(computeMarker(B7, base).visible).toBe(false);
    expect(computeMarker(B7, { ...base, visibility: "all" }).visible).toBe(true);
    expect(computeMarker(C8, { ...base, visibility: "roots" }).visible).toBe(false);
    expect(computeMarker(A5, { ...base, visibility: "roots" }).visible).toBe(true);
  });

  it("shows note names, intervals, degrees or nothing", () => {
    expect(computeMarker(C8, base).label).toBe("C");
    expect(computeMarker(C8, { ...base, labelMode: "interval" }).label).toBe("♭3");
    expect(computeMarker(A5, { ...base, labelMode: "interval" }).label).toBe("R");
    expect(computeMarker(C8, { ...base, labelMode: "degree" }).label).toBe("2");
    expect(computeMarker(C8, { ...base, labelMode: "none" }).label).toBeNull();
  });

  it("highlights the selected note and other notes with the same name", () => {
    const opts = { ...base, selectedKey: A5.key, selectedPitchClass: A5.pitchClass };
    expect(computeMarker(A5, opts).emphasis).toBe("selected");
    expect(computeMarker(board[1][0], opts).emphasis).toBe("related"); // open A string
    expect(computeMarker(C8, opts).emphasis).toBe("none");
  });

  it("dims notes outside the selected scale position", () => {
    const box1 = scalePositions(aMinorPent, standard, "boxes").find((p) => p.cagedShape === "E")!; // the 5th-fret box
    const keys = new Set(box1.occurrences.flat().map((n) => positionKey(n.stringIndex, n.fret)));
    const opts = { ...base, positionKeys: keys };
    expect(computeMarker(A5, opts).dimmed).toBe(false); // 5th fret is inside box 1
    const outside = computeMarker(lowE[3], opts); // G at the 3rd fret, box 5
    expect(outside.visible).toBe(true);
    expect(outside.dimmed).toBe(true);
    expect(outside.label).toBeNull();
  });
});

describe("marker model — chord highlighting", () => {
  const cMajor = spellScale(parseNote("C"), getScale("major"));
  const cBoard = buildScaleFretboard(standard, cMajor);
  const g7 = scaleChords(cMajor, "seventh", SCALES).chords[4];
  const chord: ChordDisplay = {
    rootPitchClass: pitchClassOf(g7.root),
    tones: new Map(g7.tones.map((t) => [pitchClassOf(t.note), t.interval])),
  };
  const opts: MarkerOptions = { ...base, chord, labelMode: "interval" };
  const at = (s: number, f: number) => cBoard[s][f];

  it("colours the chord root and chord tones, and labels them relative to the chord", () => {
    const g = computeMarker(at(0, 3), opts); // G on the low E string
    expect(g.variant).toBe("root");
    expect(g.label).toBe("R");
    const f = computeMarker(at(0, 1), opts); // F = ♭7 of G7
    expect(f.variant).toBe("scale");
    expect(f.label).toBe("♭7");
    expect(computeMarker(at(1, 2), { ...opts, labelMode: "degree" }).label).toBe("3"); // B on the A string
  });

  it("dims the other scale notes but keeps the scale root marked as home", () => {
    const c = computeMarker(at(1, 3), opts); // C, the scale root, is not in G7
    expect(c.dimmed).toBe(true);
    expect(c.visible).toBe(true);
    expect(c.home).toBe(true);
    expect(computeMarker(at(1, 3), { ...opts, visibility: "roots" }).visible).toBe(false);
    expect(computeMarker(at(0, 3), opts).home).toBe(false); // G: chord root, not the key's root
    expect(computeMarker(at(1, 3), { ...opts, chord: null }).home).toBe(false); // no chord: amber fill already says "root"
  });
});

describe("fretboard geometry", () => {
  const input = { length: 1400, stringCount: 6, firstFret: 0, lastFret: 24, spacing: "realistic" as const, showFretNumbers: true };

  it("makes frets narrower towards the body with realistic spacing", () => {
    const g = computeGeometry(input);
    const size = (f: number) => g.wires[f].u - g.wires[f - 1].u;
    expect(size(1)).toBeGreaterThan(size(12));
    expect(size(12)).toBeGreaterThan(size(24));
    // Fret 12 sits at exactly 2/3 of the way to fret 24 (half the string vs three quarters).
    const ratio = (g.wires[12].u - g.boardStart) / (g.wires[24].u - g.boardStart);
    expect(ratio).toBeCloseTo(0.5 / 0.75, 5);
  });

  it("uses equal fret sizes with even spacing", () => {
    const g = computeGeometry({ ...input, spacing: "even", length: 1200 });
    expect(g.wires[2].u - g.wires[1].u).toBeCloseTo(g.wires[24].u - g.wires[23].u, 5);
  });

  it("never lets markers overlap at the minimum length", () => {
    for (const [first, last] of [
      [0, 24],
      [0, 12],
      [12, 24],
    ]) {
      const g = computeGeometry({ ...input, firstFret: first, lastFret: last, length: minimumLength(first, last, "realistic", 24) });
      const wire = (f: number) => g.wires.find((w) => w.fret === f)!.u;
      for (let f = Math.max(1, first); f <= last; f++) {
        expect(g.markerRadius(f) * 2).toBeLessThanOrEqual(wire(f) - wire(f - 1) + 0.001);
      }
    }
  });

  it("softens the fret narrowing just enough to fit a narrower screen", () => {
    expect(fitTaper(0, 24, 2000, 24)).toBe(TRUE_TAPER); // wide screen: true to scale
    const taper = fitTaper(0, 24, 1100, 24);
    expect(taper).toBeGreaterThan(TRUE_TAPER);
    expect(minimumLength(0, 24, "realistic", 24, taper)).toBeLessThanOrEqual(1100);
    expect(minimumLength(0, 24, "realistic", 24, taper - 0.5)).toBeGreaterThan(1100); // no softer than needed
    const g = computeGeometry({ ...input, length: 1100, taper });
    const size = (f: number) => g.wires[f].u - g.wires[f - 1].u;
    expect(size(1)).toBeGreaterThan(size(12)); // still narrows towards the body
    expect(size(12)).toBeGreaterThan(size(24));
    expect(g.markerRadius(24) * 2).toBeLessThanOrEqual(size(24) + 0.001);
    expect(fitTaper(0, 24, 300, 24)).toBe(MAX_TAPER); // too narrow: the neck scrolls instead
  });

  it("draws the highest string at the top in the horizontal view", () => {
    const g = computeGeometry(input);
    expect(g.noteXY(5, 3).y).toBeLessThan(g.noteXY(0, 3).y);
    expect(g.noteXY(0, 1).x).toBeLessThan(g.noteXY(0, 12).x); // nut on the left
  });

  it("mirrors the neck for left-handed players", () => {
    const right = computeGeometry(input);
    const left = computeGeometry({ ...input, leftHanded: true });
    expect(left.noteXY(0, 1).x).toBeGreaterThan(left.noteXY(0, 12).x); // nut on the right
    expect(left.noteXY(2, 7).x).toBeCloseTo(right.width - right.noteXY(2, 7).x, 6);
    expect(left.noteXY(2, 7).y).toBe(right.noteXY(2, 7).y);
  });

  it("stands the neck up vertically with the nut at the top and the low string on the left", () => {
    const g = computeGeometry({ ...input, orientation: "vertical", stringSpacing: 50 });
    expect(g.height).toBe(1400);
    expect(g.noteXY(0, 1).y).toBeLessThan(g.noteXY(0, 12).y); // frets go down the page
    expect(g.noteXY(0, 5).x).toBeLessThan(g.noteXY(5, 5).x); // low E left, high E right
    const lefty = computeGeometry({ ...input, orientation: "vertical", stringSpacing: 50, leftHanded: true });
    expect(lefty.noteXY(0, 5).x).toBeGreaterThan(lefty.noteXY(5, 5).x);
  });

  it("shades a scale position on the fret grid: edges on fret wires, steps where the shape shifts", () => {
    const g = computeGeometry(input);
    // C major, A shape: "3 5 | 2 3 5 | 2 3 5 | 2 4 5 | 3 5 6 | 3 5" (low E → high E)
    const aShape = scalePositions(spellScale(parseNote("C"), getScale("major")), standard, "boxes").find((p) => p.cagedShape === "A")!;
    const area = positionArea(g, aShape.occurrences[0]);
    expect(area).toHaveLength(24); // 2 corners on each side of each of the 6 strings
    const xs = area.map((p) => p.x);
    expect(Math.min(...xs)).toBeCloseTo(g.wireU(1), 6); // the A string starts on fret 2: from the wire after fret 1
    expect(Math.max(...xs)).toBeCloseTo(g.wireU(6), 6); // the F at fret 6 on the B string: to the wire after fret 6
    // Every corner lies on a fret wire (or the open-string zone) — never halfway through a fret.
    const wires = new Set([1, 2, 4, 5, 6].map((f) => g.wireU(f).toFixed(3)));
    expect(xs.every((x) => wires.has(x.toFixed(3)))).toBe(true);
  });
});
