import { describe, expect, it } from "vitest";
import { parsePitch } from "@/lib/theory";
import { DEFAULT_SETTINGS, explorerReducer, type ExplorerState } from "./use-explorer-state";

const start: ExplorerState = {
  settings: { ...DEFAULT_SETTINGS, chordDegree: 4, positionSystem: "boxes", positionIndex: 2 },
  selection: { stringIndex: 0, fret: 5 },
};

describe("explorer state", () => {
  it("starts on C Major", () => {
    expect(DEFAULT_SETTINGS.rootName).toBe("C");
    expect(DEFAULT_SETTINGS.scaleId).toBe("major");
    expect(DEFAULT_SETTINGS.chordDegree).toBeNull();
  });

  it("clears the highlighted chord when the root or scale changes", () => {
    expect(explorerReducer(start, { type: "update", patch: { rootName: "G" } }).settings.chordDegree).toBeNull();
    expect(explorerReducer(start, { type: "update", patch: { scaleId: "dorian" } }).settings.chordDegree).toBeNull();
  });

  it("keeps the chord when nothing about the key changes", () => {
    expect(explorerReducer(start, { type: "update", patch: { rootName: "C" } }).settings.chordDegree).toBe(4);
    expect(explorerReducer(start, { type: "update", patch: { tuningId: "drop-d" } }).settings.chordDegree).toBe(4);
    expect(explorerReducer(start, { type: "update", patch: { labelMode: "interval" } }).settings.chordDegree).toBe(4);
  });

  it("lets one update change key and pick a chord at the same time (shared links, 'Show me')", () => {
    const next = explorerReducer(start, { type: "update", patch: { rootName: "A", chordDegree: 1 } });
    expect(next.settings.chordDegree).toBe(1);
  });

  it("keeps position choices and the clicked spot across key changes", () => {
    const next = explorerReducer(start, { type: "update", patch: { rootName: "E", scaleId: "natural-minor" } });
    expect(next.settings.positionSystem).toBe("boxes");
    expect(next.settings.positionIndex).toBe(2);
    expect(next.selection).toEqual({ stringIndex: 0, fret: 5 });
  });

  it("drops a selection that no longer exists after a tuning with fewer strings", () => {
    const sevenString: ExplorerState = { ...start, selection: { stringIndex: 6, fret: 3 } };
    const sixStrings = ["E2", "A2", "D3", "G3", "B3", "E4"].map(parsePitch);
    expect(explorerReducer(sevenString, { type: "update", patch: { customTuning: sixStrings } }).selection).toBeNull();
  });
});
