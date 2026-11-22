import { describe, expect, it } from "vitest";
import { parsePitch } from "@/lib/theory";
import { imageFileName } from "./file-name";
import { withSingleSvgNamespace } from "./svg-markup";

describe("saved image markup", () => {
  const ns = 'xmlns="http://www.w3.org/2000/svg"';
  it("declares the SVG namespace exactly once (Firefox writes it twice)", () => {
    const twice = `<svg ${ns} width="10" ${ns}><rect/></svg>`;
    expect(withSingleSvgNamespace(twice)).toBe(`<svg ${ns} width="10"><rect/></svg>`);
    expect(withSingleSvgNamespace('<svg width="10"><svg x="1"/></svg>')).toBe(`<svg ${ns} width="10"><svg x="1"/></svg>`);
    expect(withSingleSvgNamespace(`<svg ${ns}><g/></svg>`)).toBe(`<svg ${ns}><g/></svg>`);
  });
});
import { parseSearchParams, stateToSearchParams, type SharedState } from "./share";

describe("saved image file names", () => {
  it("makes readable, safe names in any language", () => {
    expect(imageFileName("F♯ Major")).toBe("fretistry-f-sharp-major.png");
    expect(imageFileName("B♭ Dorian", "Drop D")).toBe("fretistry-b-flat-dorian-drop-d.png");
    expect(imageFileName("La pentatonique mineure", "Mi♭ standard")).toBe("fretistry-la-pentatonique-mineure-mi-flat-standard.png");
    expect(imageFileName("Mi frigio dominante (española)")).toBe("fretistry-mi-frigio-dominante-espanola.png");
    expect(imageFileName("C-Dur", null)).toBe("fretistry-c-dur.png");
    expect(imageFileName("")).toBe("fretistry-fretboard.png");
  });
});

const base: SharedState = {
  rootName: "C",
  scaleId: "major",
  tuningId: "standard",
  customTuning: [],
  positionSystem: "all",
  positionIndices: [0],
  chordDegree: null,
  chordSize: "triad",
};

describe("shareable links", () => {
  it("writes a short, readable query string", () => {
    expect(stateToSearchParams(base).toString()).toBe("root=C&scale=major&tuning=standard");
    expect(
      stateToSearchParams({ ...base, rootName: "F#", scaleId: "dorian", positionSystem: "boxes", positionIndices: [1], chordDegree: 4, chordSize: "seventh" }).toString(),
    ).toBe("root=Fs&scale=dorian&tuning=standard&pos=boxes2&chord=5&chord7=1");
  });

  it("round-trips every field", () => {
    const state: SharedState = {
      rootName: "Eb",
      scaleId: "harmonic-minor",
      tuningId: "custom",
      customTuning: ["D2", "A2", "D3", "F#3", "A3", "D4"].map(parsePitch),
      positionSystem: "3nps",
      positionIndices: [6],
      chordDegree: 2,
      chordSize: "triad",
    };
    const parsed = parseSearchParams(new URLSearchParams(stateToSearchParams(state).toString()));
    expect(parsed).toEqual(state);
  });

  it("round-trips 7-string tunings", () => {
    const seven: SharedState = { ...base, tuningId: "seven-standard" };
    expect(parseSearchParams(stateToSearchParams(seven)).tuningId).toBe("seven-standard");
    const custom: SharedState = { ...base, tuningId: "custom", customTuning: ["A1", "D2", "G2", "C3", "F3", "A3", "D4"].map(parsePitch) };
    expect(parseSearchParams(new URLSearchParams(stateToSearchParams(custom).toString())).customTuning).toEqual(custom.customTuning);
  });

  it("shares several CAGED shapes at once, and still reads single-shape links", () => {
    const several: SharedState = { ...base, positionSystem: "boxes", positionIndices: [0, 1, 2] };
    expect(stateToSearchParams(several).get("pos")).toBe("boxes1-2-3");
    expect(parseSearchParams(stateToSearchParams(several)).positionIndices).toEqual([0, 1, 2]);
    expect(parseSearchParams(new URLSearchParams("pos=boxes2")).positionIndices).toEqual([1]);
    expect(parseSearchParams(new URLSearchParams("pos=boxes5-1-5")).positionIndices).toEqual([0, 4]); // sorted, no duplicates
    expect(parseSearchParams(new URLSearchParams("pos=3nps2-4")).positionIndices).toEqual([1]); // 3 per string: one at a time
  });

  it("ignores the old practice-mode parameter", () => {
    expect(parseSearchParams(new URLSearchParams("root=A&scale=dorian&mode=practice"))).not.toHaveProperty("mode");
  });

  it("accepts a # in root names and ignores invalid values", () => {
    expect(parseSearchParams(new URLSearchParams("root=C%23")).rootName).toBe("C#");
    const parsed = parseSearchParams(new URLSearchParams("root=H&scale=nope&tuning=weird&pos=box9x&chord=x"));
    expect(parsed.rootName).toBeUndefined();
    expect(parsed.scaleId).toBeUndefined();
    expect(parsed.tuningId).toBeUndefined();
    expect(parsed.chordDegree).toBeNull();
  });

  it("rejects unplayable custom tunings", () => {
    expect(parseSearchParams(new URLSearchParams("tuning=custom&strings=E2.A2")).tuningId).toBeUndefined();
    expect(parseSearchParams(new URLSearchParams("tuning=custom&strings=E2.A2.D3.G3.B3.E9")).tuningId).toBeUndefined();
  });

  it("leaves everything alone when the URL has no app parameters", () => {
    expect(parseSearchParams(new URLSearchParams(""))).toEqual({});
  });
});
