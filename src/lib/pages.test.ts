import { describe, expect, it } from "vitest";
import { ROOT_NAMES } from "@/lib/data/roots";
import { SCALES } from "@/lib/data/scales";
import { DEFAULT_SETTINGS } from "@/hooks/use-explorer-state";
import { allScalePages, parseScalePagePath, parseScalePageSlug, scalePagePath, scalePageSlug } from "./pages";
import { pageSearchParams, parseSearchParams } from "./share";

describe("scale pages", () => {
  it("gives every key and scale a readable address", () => {
    expect(scalePageSlug("A", "minor-pentatonic")).toBe("a-minor-pentatonic");
    expect(scalePageSlug("C#", "dorian")).toBe("c-sharp-dorian");
    expect(scalePageSlug("Eb", "major")).toBe("e-flat-major");
    expect(scalePagePath({ locale: "nl", rootName: "A", scaleId: "minor-pentatonic" })).toBe("/nl/a-minor-pentatonic/");
  });

  it("reads every address back to exactly its own key and scale", () => {
    const slugs = new Set<string>();
    for (const rootName of ROOT_NAMES) {
      for (const scale of SCALES) {
        const slug = scalePageSlug(rootName, scale.id);
        expect(parseScalePageSlug(slug)).toEqual({ rootName, scaleId: scale.id });
        slugs.add(slug);
      }
    }
    expect(slugs.size).toBe(ROOT_NAMES.length * SCALES.length); // no two pages share an address
    expect(parseScalePageSlug("c-sharp-major")).toEqual({ rootName: "C#", scaleId: "major" }); // not "C" + "sharp-major"
    expect(parseScalePageSlug("h-major")).toBeNull();
    expect(parseScalePageSlug("a-kazoo")).toBeNull();
  });

  it("has a page for every language × key × scale", () => {
    expect(allScalePages()).toHaveLength(5 * 12 * SCALES.length);
  });

  it("recognises a page address, also in a sub-folder and with a trailing slash or .html", () => {
    const page = { locale: "de", rootName: "Bb", scaleId: "blues" };
    expect(parseScalePagePath("/de/b-flat-blues")).toEqual(page);
    expect(parseScalePagePath("/fretistry/de/b-flat-blues/", "/fretistry")).toEqual(page);
    expect(parseScalePagePath("/de/b-flat-blues.html")).toEqual(page);
    expect(parseScalePagePath("/")).toBeNull();
    expect(parseScalePagePath("/xx/b-flat-blues")).toBeNull(); // unknown language
    expect(parseScalePagePath("/de/b-flat-blues/extra")).toBeNull();
  });

  it("keeps only the extras after the “?” (standard tuning and plain view need nothing)", () => {
    expect(pageSearchParams(DEFAULT_SETTINGS).toString()).toBe("");
    const view = { ...DEFAULT_SETTINGS, tuningId: "drop-d", positionSystem: "boxes" as const, positionIndices: [1, 2], chordDegree: 4 };
    const query = pageSearchParams(view);
    expect(query.toString()).toBe("tuning=drop-d&pos=boxes2-3&chord=5");
    // …and they read back the same
    expect(parseSearchParams(query)).toMatchObject({ tuningId: "drop-d", positionSystem: "boxes", positionIndices: [1, 2], chordDegree: 4 });
  });
});
