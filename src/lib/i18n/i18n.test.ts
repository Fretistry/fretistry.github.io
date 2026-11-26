import { describe, expect, it } from "vitest";
import { ROOT_NAMES, rootNote } from "@/lib/data/roots";
import { SCALES, getScale } from "@/lib/data/scales";
import { TUNING_GROUPS, TUNING_PRESETS } from "@/lib/data/tunings";
import { describeChordStack, explainScale, intervalFromDegree, parseNote, scaleChords, spellScale } from "@/lib/theory";
import { LOCALES, createBundle, detectLocale, type Locale } from "./index";
import { DE_SCALES } from "./theory/de";
import { ES_SCALES } from "./theory/es";
import { FR_SCALES } from "./theory/fr";
import { NL_SCALES } from "./theory/nl";
import { en } from "./ui/en";

const spell = (root: string, id: string) => spellScale(parseNote(root), getScale(id));
const bundle = (locale: Locale) => createBundle(locale, LOCALES.find((l) => l.code === locale)!.defaultNaming);

/** All string leaves of a message object, as dotted paths. */
function keys(obj: object, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === "object" && !Array.isArray(v) ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
}

describe("language selection", () => {
  it("detects the browser language", () => {
    expect(detectLocale(["nl-BE", "en"])).toBe("nl");
    expect(detectLocale(["de-AT"])).toBe("de");
    expect(detectLocale(["pt-BR", "es-MX"])).toBe("es");
    expect(detectLocale(["ja"])).toBe("en");
  });
});

describe("interface translations", () => {
  it.each(LOCALES.map((l) => l.code))("%s has every interface text", (locale) => {
    const ui = bundle(locale).ui;
    expect(keys(ui).sort()).toEqual(keys(en).sort());
    expect(ui.theory.numeralsText).toHaveLength(en.theory.numeralsText.length);
  });

  it("names tunings with the chosen note names", () => {
    const preset = (id: string) => TUNING_PRESETS.find((t) => t.id === id)!;
    expect(bundle("en").tuningName(preset("drop-d"))).toBe("Drop D");
    expect(bundle("fr").tuningName(preset("drop-d"))).toBe("Drop Ré");
    expect(bundle("es").tuningName(preset("open-g"))).toBe("Open Sol");
    expect(bundle("nl").tuningName(TUNING_PRESETS[0])).toBe("Standaard");
    expect(bundle("en").tuningName(preset("eb-standard"))).toBe("E♭ Standard");
    expect(bundle("fr").tuningName(preset("eb-standard"))).toBe("Mi♭ standard");
    expect(bundle("de").tuningName(preset("drop-b"))).toBe("Drop H");
    expect(bundle("en").tuningName(preset("seven-drop-a"))).toBe("7-string Drop A");
    expect(bundle("es").tuningName(preset("seven-drop-a"))).toBe("7 cuerdas Drop La");
    expect(bundle("fr").tuningName(preset("dadgad"))).toBe("DADGAD");
  });

  it.each(LOCALES.map((l) => l.code))("%s names every tuning preset and tuning group", (locale) => {
    const b = bundle(locale);
    for (const t of TUNING_PRESETS) {
      expect(b.ui.tunings[t.id], t.id).toBeDefined();
      expect(b.tuningName(t)).not.toMatch(/[{}]/);
    }
    for (const g of TUNING_GROUPS) expect(b.ui.tuningGroups[g.id], g.id).toBeTruthy();
  });
});

describe("scale translations", () => {
  it.each([
    ["nl", NL_SCALES],
    ["de", DE_SCALES],
    ["fr", FR_SCALES],
    ["es", ES_SCALES],
  ] as const)("%s translates every scale", (_locale, map) => {
    for (const scale of SCALES) {
      const t = map[scale.id];
      expect(t, scale.id).toBeDefined();
      expect(t!.name.length).toBeGreaterThan(1);
      expect(t!.character.length).toBeGreaterThan(10);
      expect(t!.usage.length).toBeGreaterThan(5);
    }
  });

  it("builds natural titles in each language", () => {
    expect(explainScale(spell("C", "major"), SCALES, bundle("nl").theory).title).toBe("C majeur");
    expect(explainScale(spell("A", "natural-minor"), SCALES, bundle("nl").theory).title).toBe("A natuurlijk mineur (aeolisch)");
    expect(explainScale(spell("C", "major"), SCALES, bundle("de").theory).title).toBe("C-Dur");
    expect(explainScale(spell("D", "dorian"), SCALES, bundle("de").theory).title).toBe("D-Dorisch");
    expect(explainScale(spell("C", "major"), SCALES, bundle("fr").theory).title).toBe("Do majeur");
    expect(explainScale(spell("A", "minor-pentatonic"), SCALES, bundle("fr").theory).title).toBe("La pentatonique mineure");
    expect(explainScale(spell("A", "natural-minor"), SCALES, bundle("es").theory).title).toBe("La menor natural (eólico)");
  });
});

describe("note names", () => {
  it("uses H and B the German way", () => {
    const de = bundle("de");
    expect(explainScale(spell("F", "major"), SCALES, de.theory).notes).toEqual(["F", "G", "A", "B", "C", "D", "E"]);
    expect(explainScale(spell("B", "major"), SCALES, de.theory).title).toBe("H-Dur");
    expect(explainScale(spell("Bb", "major"), SCALES, de.theory).title).toBe("B-Dur");
  });

  it("uses solfège with the right accents", () => {
    expect(explainScale(spell("D", "major"), SCALES, bundle("fr").theory).notes).toEqual(["Ré", "Mi", "Fa♯", "Sol", "La", "Si", "Do♯"]);
    expect(explainScale(spell("D", "major"), SCALES, bundle("es").theory).notes).toEqual(["Re", "Mi", "Fa♯", "Sol", "La", "Si", "Do♯"]);
  });

  it("lets any language use any naming system", () => {
    const nlSolfege = createBundle("nl", "solfege");
    expect(nlSolfege.note(parseNote("Eb"))).toBe("Mi♭");
    const enGerman = createBundle("en", "german");
    expect(enGerman.note(parseNote("Bb"))).toBe("B");
  });
});

describe("music terminology", () => {
  it("names intervals correctly", () => {
    const m3 = intervalFromDegree(4, 3);
    const p5 = intervalFromDegree(7, 5);
    const a4 = intervalFromDegree(6, 4);
    expect([m3, p5, a4].map((i) => bundle("nl").theory.intervalName(i))).toEqual(["Grote terts", "Reine kwint", "Overmatige kwart"]);
    expect([m3, p5, a4].map((i) => bundle("de").theory.intervalName(i))).toEqual(["Große Terz", "Reine Quinte", "Übermäßige Quarte"]);
    expect([m3, p5, a4].map((i) => bundle("fr").theory.intervalName(i))).toEqual(["Tierce majeure", "Quinte juste", "Quarte augmentée"]);
    expect([m3, p5, a4].map((i) => bundle("es").theory.intervalName(i))).toEqual(["Tercera mayor", "Quinta justa", "Cuarta aumentada"]);
  });

  it("uses each language's word for relative and parallel keys", () => {
    const rel = (locale: Locale) =>
      explainScale(spell("A", "natural-minor"), SCALES, bundle(locale).theory).relationships.find((r) => r.kind === "relative")!;
    expect(rel("nl").title).toBe("Parallelle majeur: C majeur");
    expect(rel("de").title).toBe("Paralleltonart (Dur): C-Dur");
    expect(rel("fr").title).toBe("Relatif majeur : Do majeur");
    expect(rel("es").title).toBe("Relativa mayor: Do mayor");
    const par = explainScale(spell("C", "major"), SCALES, bundle("de").theory).relationships.find((r) => r.kind === "parallel")!;
    expect(par.title).toBe("Variante (Moll): C-Moll (natürlich)");
  });

  it("writes step patterns with local symbols", () => {
    const steps = (locale: Locale) => explainScale(spell("C", "major"), SCALES, bundle(locale).theory).stepSummary;
    expect(steps("nl")).toBe("1 – 1 – ½ – 1 – 1 – 1 – ½");
    // GT/HT, because G and H are also German note names
    expect(steps("de")).toBe("GT – GT – HT – GT – GT – GT – HT");
    expect(steps("fr")).toBe("T – T – ½ – T – T – T – ½");
    expect(steps("es")).toBe("T – T – S – T – T – T – S");
  });

  it("localizes chord names and symbols", () => {
    const g7 = (locale: Locale) => scaleChords(spell("C", "major"), "seventh", SCALES, bundle(locale).theory).chords[4];
    expect(g7("de").name).toBe("G Dominantseptakkord");
    expect(g7("fr").symbol).toBe("Sol7");
    expect(g7("es").name).toBe("Sol séptima de dominante");
    expect(describeChordStack(g7("nl"), bundle("nl").theory)).toBe("G → B (grote terts) → D (kleine terts) → F (kleine terts)");
    const deChords = scaleChords(spell("F", "major"), "triad", SCALES, bundle("de").theory).chords.map((c) => c.symbol);
    expect(deChords).toEqual(["F", "Gm", "Am", "B", "C", "Dm", "Edim"]); // B = B♭ in German
  });
});

describe("explanations in every language", () => {
  const bad = /undefined|NaN|\[object|\{[A-Za-z]+\}/;
  it("generate cleanly for every language, naming system, scale and a range of roots", { timeout: 60_000 }, () => {
    const problems: string[] = [];
    for (const { code } of LOCALES) {
      for (const naming of ["letters", "german", "solfege"] as const) {
        const b = createBundle(code, naming);
        for (const root of ROOT_NAMES) {
          for (const scale of SCALES) {
            const spelled = spellScale(rootNote(root), scale);
            const e = explainScale(spelled, SCALES, b.theory);
            const chords = scaleChords(spelled, "seventh", SCALES, b.theory);
            const all = [
              e.title,
              e.mood,
              e.usage,
              e.characterHeading,
              e.whyIntro,
              e.stepSummary,
              ...e.construction,
              ...e.character,
              ...e.whyItems.map((w) => w.text),
              ...e.relationships.flatMap((r) => [r.title, r.text, r.kindLabel]),
              ...e.intervalRows.map((r) => r.intervalName),
              ...e.notices,
              chords.note,
              ...chords.chords.flatMap((c) => [c.name, c.symbol, describeChordStack(c, b.theory)]),
            ];
            for (const text of all) if (!text || bad.test(text)) problems.push(`${code}/${naming} ${root} ${scale.id}: "${text}"`);
          }
        }
      }
    }
    expect(problems.slice(0, 10)).toEqual([]);
  });
});
