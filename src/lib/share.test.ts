import { describe, expect, it } from "vitest";
import { parsePitch } from "@/lib/theory";
import { imageFileName } from "./file-name";
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
  positionIndex: 0,
  chordDegree: null,
  chordSize: "triad",
};

describe("shareable links", () => {
  it("writes a short, readable query string", () => {
    expect(stateToSearchParams(base).toString()).toBe("root=C&scale=major&tuning=standard");
    expect(
      stateToSearchParams({ ...base, rootName: "F#", scaleId: "dorian", positionSystem: "boxes", positionIndex: 1, chordDegree: 4, chordSize: "seventh" }).toString(),
    ).toBe("root=Fs&scale=dorian&tuning=standard&pos=boxes2&chord=5&chord7=1");
  });

  it("round-trips every field", () => {
    const state: SharedState = {
      rootName: "Eb",
      scaleId: "harmonic-minor",
      tuningId: "custom",
      customTuning: ["D2", "A2", "D3", "F#3", "A3", "D4"].map(parsePitch),
      positionSystem: "3nps",
      positionIndex: 6,
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
