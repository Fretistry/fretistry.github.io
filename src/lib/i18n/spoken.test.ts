import { describe, expect, it } from "vitest";
import { getScale } from "@/lib/data/scales";
import { parseNote, spellScale } from "@/lib/theory";
import { createBundle, defaultNamingFor, type Locale } from "./index";
import { alternativeScaleTitle, spokenRootName, titleWithAlternative } from "./spoken";

const bundle = (locale: Locale) => createBundle(locale, defaultNamingFor(locale));
const alt = (locale: Locale, root: string, scaleId: string) =>
  alternativeScaleTitle(bundle(locale), spellScale(parseNote(root), getScale(scaleId)));

describe("sharps and flats written out (as people search for them)", () => {
  it("spells the root the way each language says it", () => {
    expect(spokenRootName("en", parseNote("Eb"))).toBe("E flat");
    expect(spokenRootName("en", parseNote("F#"))).toBe("F sharp");
    expect(spokenRootName("nl", parseNote("Eb"))).toBe("Es");
    expect(spokenRootName("nl", parseNote("Bb"))).toBe("Bes");
    expect(spokenRootName("nl", parseNote("C#"))).toBe("Cis");
    expect(spokenRootName("de", parseNote("Ab"))).toBe("As");
    expect(spokenRootName("de", parseNote("F#"))).toBe("Fis");
    expect(spokenRootName("de", parseNote("Bb"))).toBeNull(); // German names B♭ simply "B"
    expect(spokenRootName("fr", parseNote("Eb"))).toBe("Mi bémol");
    expect(spokenRootName("es", parseNote("F#"))).toBe("Fa sostenido");
    expect(spokenRootName("en", parseNote("A"))).toBeNull(); // nothing to spell out
  });

  it("gives scale titles their spelled-out twin", () => {
    expect(alt("en", "Eb", "major")).toBe("E flat Major");
    expect(alt("de", "Eb", "major")).toBe("Es-Dur");
    expect(alt("de", "F#", "natural-minor")).toBe("Fis-Moll"); // short: the title already says "(natürlich, äolisch)"
    expect(alt("fr", "Eb", "major")).toBe("Mi bémol majeur");
    expect(alt("es", "F#", "dorian")).toBe("Fa sostenido dórico");
    expect(alt("en", "A", "minor-pentatonic")).toBeNull();
    expect(alt("de", "Bb", "major")).toBeNull(); // "B-Dur" already is the plain name
  });

  it("mentions the key that was asked for when the spelling switched to its simpler twin", () => {
    // C♯ Lydian is written D♭ Lydian (fewer sharps), but people may search for C♯ Lydian
    expect(alt("en", "C#", "lydian")).toBe("D flat Lydian, C♯ Lydian");
  });

  it("builds page titles with the word for “scale” and the other name", () => {
    expect(bundle("en").ui.seo.pageTitle("E♭ Major", "E flat Major")).toBe("E♭ Major scale (E flat Major) on guitar: notes, shapes & chords");
    expect(bundle("en").ui.seo.pageTitle("A Minor Pentatonic", null)).toBe("A Minor Pentatonic scale on guitar: notes, shapes & chords");
    expect(bundle("de").ui.seo.pageTitle("E♭-Dur", "Es-Dur")).toContain("E♭-Dur (Es-Dur) – Tonleiter");
    expect(titleWithAlternative("Mi♭ majeur", "Mi bémol majeur")).toBe("Mi♭ majeur (Mi bémol majeur)");
    expect(titleWithAlternative("La pentatonique mineure", null)).toBe("La pentatonique mineure");
  });
});
