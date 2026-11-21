import {
  createEnglishTheory,
  formatNoteIn,
  letterName,
  parseNote,
  type Letter,
  type NoteFormat,
  type NoteFormatter,
  type NoteNaming,
  type Pitch,
  type ScaleCategory,
  type TheoryLanguage,
  type Tuning,
} from "@/lib/theory";
import { createGermanTheory } from "./theory/de";
import { createSpanishTheory } from "./theory/es";
import { createFrenchTheory } from "./theory/fr";
import { createDutchTheory } from "./theory/nl";
import { de } from "./ui/de";
import { en, type UiMessages } from "./ui/en";
import { es } from "./ui/es";
import { fr } from "./ui/fr";
import { nl } from "./ui/nl";

export type Locale = "en" | "nl" | "de" | "fr" | "es";

export interface LocaleInfo {
  code: Locale;
  /** Name of the language in that language. */
  nativeName: string;
  /** Note names musicians in that language usually expect. */
  defaultNaming: NoteNaming;
}

export const LOCALES: readonly LocaleInfo[] = [
  { code: "en", nativeName: "English", defaultNaming: "letters" },
  { code: "nl", nativeName: "Nederlands", defaultNaming: "letters" },
  { code: "de", nativeName: "Deutsch", defaultNaming: "german" },
  { code: "fr", nativeName: "Français", defaultNaming: "solfege" },
  { code: "es", nativeName: "Español", defaultNaming: "solfege" },
];

export const DEFAULT_LOCALE: Locale = "en";

const UI: Record<Locale, UiMessages> = { en, nl, de, fr, es };

const THEORY: Record<Locale, (format: NoteFormat) => TheoryLanguage> = {
  en: createEnglishTheory,
  nl: createDutchTheory,
  de: createGermanTheory,
  fr: createFrenchTheory,
  es: createSpanishTheory,
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && LOCALES.some((l) => l.code === value);
}

export function isNoteNaming(value: unknown): value is NoteNaming {
  return value === "letters" || value === "german" || value === "solfege";
}

/** Picks the first supported language from the browser's preference list ("nl-BE" → Dutch). */
export function detectLocale(languages: readonly string[]): Locale {
  for (const tag of languages) {
    const primary = tag.toLowerCase().split("-")[0];
    if (isLocale(primary)) return primary;
  }
  return DEFAULT_LOCALE;
}

export function defaultNamingFor(locale: Locale): NoteNaming {
  return LOCALES.find((l) => l.code === locale)?.defaultNaming ?? "letters";
}

export function createNoteFormat(locale: Locale, naming: NoteNaming): NoteFormat {
  const options = { accentedRe: locale === "fr" };
  return {
    naming,
    note: (n) => formatNoteIn(n, naming, options),
    letter: (l) => letterName(l, naming, options),
  };
}

/** Everything the interface needs to speak one language with one note-naming system. */
export interface I18nBundle {
  locale: Locale;
  naming: NoteNaming;
  ui: UiMessages;
  theory: TheoryLanguage;
  note: NoteFormatter;
  letter: (letter: Letter) => string;
  pitch: (pitch: Pitch) => string;
  tuningName: (tuning: Tuning) => string;
  categoryLabel: (category: ScaleCategory) => string;
}

export function createBundle(locale: Locale, naming: NoteNaming): I18nBundle {
  const ui = UI[locale];
  const format = createNoteFormat(locale, naming);
  const theory = THEORY[locale](format);
  return {
    locale,
    naming,
    ui,
    theory,
    note: format.note,
    letter: format.letter,
    pitch: (p) => `${format.note(p.note)}${p.octave}`,
    tuningName: (tuning) => {
      const template = ui.tunings[tuning.id];
      if (!template) return ui.controls.customName;
      // "{D}" → a letter, "{Eb}" → a note with its accidental, both in the chosen naming system.
      return template.replace(/\{([A-G])([b#]?)\}/g, (_, l: Letter, accidental: string) =>
        accidental ? format.note(parseNote(`${l}${accidental}`)) : format.letter(l),
      );
    },
    categoryLabel: (category) => ui.categories[category],
  };
}

export type { UiMessages };
