import { describe, expect, it } from "vitest";
import { effectiveFretRange, settingsFromSaved } from "@/hooks/use-explorer-state";
import { FRET_RANGES, fretRangeBounds, fretRangeLabel } from "./geometry";

describe("fret ranges", () => {
  it("offers 12, 15, 22 and 24 frets plus the upper octave, shortest neck first", () => {
    expect(FRET_RANGES.map((r) => fretRangeLabel(r))).toEqual(["0–12", "0–15", "0–22", "0–24", "12–24"]);
    expect(fretRangeBounds("to15")).toEqual([0, 15]);
    expect(fretRangeBounds("to22")).toEqual([0, 22]);
    expect(fretRangeBounds("high")).toEqual([12, 24]);
  });

  it("never goes past the frets the neck has", () => {
    expect(fretRangeBounds("to22", 21)).toEqual([0, 21]);
    expect(fretRangeBounds("all", 21)).toEqual([0, 21]);
  });

  it("shows 12 frets on phones and the whole neck elsewhere by default", () => {
    expect(effectiveFretRange("auto", true)).toBe("low");
    expect(effectiveFretRange("auto", false)).toBe("all");
    expect(effectiveFretRange("to22", true)).toBe("to22"); // a choice of your own always wins
  });

  it("reads saved preferences, treating the old automatic 0–24 as the new default", () => {
    // older versions always saved "all", their only default
    expect(settingsFromSaved({ fretRange: "all" }).fretRange).toBe("auto");
    expect(settingsFromSaved({ fretRange: "low" }).fretRange).toBe("low");
    // from now on "all" is a real choice
    expect(settingsFromSaved({ version: 2, fretRange: "all" }).fretRange).toBe("all");
    expect(settingsFromSaved({ version: 2, fretRange: "to15" }).fretRange).toBe("to15");
    expect(settingsFromSaved({ version: 2, fretRange: "nonsense" }).fretRange).toBe("auto");
  });
});
