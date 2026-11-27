import { describe, expect, it } from "vitest";
import { ROOT_NAMES, type RootName } from "@/lib/data/roots";
import { nextInFourths, stepRoot } from "./shortcuts";

describe("key steps", () => {
  it("walks the cycle of 4ths through all 12 keys", () => {
    const keys: RootName[] = [ROOT_NAMES[0]];
    for (let i = 0; i < 11; i++) keys.push(nextInFourths(ROOT_NAMES, keys[keys.length - 1]));
    expect(keys).toEqual(["C", "F", "Bb", "Eb", "Ab", "C#", "F#", "B", "E", "A", "D", "G"]);
    expect(nextInFourths(ROOT_NAMES, "G")).toBe("C");
  });

  it("steps half steps up and down, wrapping around", () => {
    expect(stepRoot(ROOT_NAMES, "B", 1)).toBe("C");
    expect(stepRoot(ROOT_NAMES, "C", -1)).toBe("B");
    expect(stepRoot(ROOT_NAMES, "A", 2)).toBe("B");
  });
});
