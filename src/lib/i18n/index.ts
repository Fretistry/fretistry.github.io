import { createEnglishTheory, type NoteNaming } from "@/lib/theory";
import { assembleBundle, type I18nBundle, type Locale, type LocaleMessages } from "./core";
import { createGermanTheory } from "./theory/de";
import { createSpanishTheory } from "./theory/es";
import { createFrenchTheory } from "./theory/fr";
import { createDutchTheory } from "./theory/nl";
import { de } from "./ui/de";
import { en } from "./ui/en";
import { es } from "./ui/es";
import { fr } from "./ui/fr";
import { nl } from "./ui/nl";

/**
 * All languages at hand, for the pages built ahead of time (titles, descriptions, the text
 * search engines read) and for the tests. The app in the browser loads only the visitor's
 * language instead (see `load.ts`), so it imports from `core.ts`, never from here.
 */
export * from "./core";

const MESSAGES: Record<Locale, LocaleMessages> = {
  en: { ui: en, theory: createEnglishTheory },
  nl: { ui: nl, theory: createDutchTheory },
  de: { ui: de, theory: createGermanTheory },
  fr: { ui: fr, theory: createFrenchTheory },
  es: { ui: es, theory: createSpanishTheory },
};

export function createBundle(locale: Locale, naming: NoteNaming): I18nBundle {
  return assembleBundle(locale, naming, MESSAGES[locale]);
}
