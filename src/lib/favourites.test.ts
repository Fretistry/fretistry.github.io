import { describe, expect, it } from "vitest";
import {
  MAX_FAVOURITES,
  isFavourite,
  parseFavourites,
  removeFavourite,
  serializeFavourites,
  toggleFavourite,
  type Favourite,
} from "./favourites";

const aMinorPent: Favourite = { rootName: "A", scaleId: "minor-pentatonic" };
const eBlues: Favourite = { rootName: "E", scaleId: "blues" };

describe("favourite scales", () => {
  it("adds and removes favourites with one toggle", () => {
    const one = toggleFavourite([], aMinorPent);
    expect(one).toEqual([aMinorPent]);
    const two = toggleFavourite(one, eBlues);
    expect(two).toEqual([aMinorPent, eBlues]); // in the order they were added
    expect(isFavourite(two, { rootName: "A", scaleId: "minor-pentatonic" })).toBe(true);
    expect(toggleFavourite(two, aMinorPent)).toEqual([eBlues]);
    expect(removeFavourite(two, eBlues)).toEqual([aMinorPent]);
  });

  it("treats the same scale on another root as a different favourite", () => {
    expect(isFavourite([aMinorPent], { rootName: "E", scaleId: "minor-pentatonic" })).toBe(false);
    expect(isFavourite([aMinorPent], { rootName: "A", scaleId: "natural-minor" })).toBe(false);
  });

  it("stores the list compactly and reads it back", () => {
    const stored = serializeFavourites([aMinorPent, eBlues]);
    expect(stored).toBe('["A|minor-pentatonic","E|blues"]');
    expect(parseFavourites(stored)).toEqual([aMinorPent, eBlues]);
  });

  it("ignores broken, unknown or duplicate entries", () => {
    expect(parseFavourites(null)).toEqual([]);
    expect(parseFavourites("not json")).toEqual([]);
    expect(parseFavourites('{"a":1}')).toEqual([]);
    expect(parseFavourites('["H|major","A|no-such-scale",42,"A|minor-pentatonic","A|minor-pentatonic","C#|lydian"]')).toEqual([
      aMinorPent,
      { rootName: "C#", scaleId: "lydian" },
    ]);
  });

  it("keeps at most the newest favourites", () => {
    let list: Favourite[] = [];
    const roots = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"] as const;
    for (const scaleId of ["major", "dorian", "blues"]) for (const rootName of roots) list = toggleFavourite(list, { rootName, scaleId });
    expect(list).toHaveLength(MAX_FAVOURITES);
    expect(list.at(-1)).toEqual({ rootName: "B", scaleId: "blues" });
    expect(isFavourite(list, { rootName: "C", scaleId: "major" })).toBe(false); // the oldest were dropped
  });
});
