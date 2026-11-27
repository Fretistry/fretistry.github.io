import { createEnglishTheory } from "@/lib/theory";
import type { Locale, LocaleMessages } from "./core";
import { en } from "./ui/en";

/**
 * Loads one language's texts at a time, so a visitor downloads only the language they read
 * (each language is its own small file). English is always included: it's the fallback,
 * and the most common choice.
 */

const IMPORTERS: Record<Exclude<Locale, "en">, () => Promise<LocaleMessages>> = {
  nl: async () => {
    const [ui, theory] = await Promise.all([import("./ui/nl"), import("./theory/nl")]);
    return { ui: ui.nl, theory: theory.createDutchTheory };
  },
  de: async () => {
    const [ui, theory] = await Promise.all([import("./ui/de"), import("./theory/de")]);
    return { ui: ui.de, theory: theory.createGermanTheory };
  },
  fr: async () => {
    const [ui, theory] = await Promise.all([import("./ui/fr"), import("./theory/fr")]);
    return { ui: ui.fr, theory: theory.createFrenchTheory };
  },
  es: async () => {
    const [ui, theory] = await Promise.all([import("./ui/es"), import("./theory/es")]);
    return { ui: ui.es, theory: theory.createSpanishTheory };
  },
};

const loaded = new Map<Locale, LocaleMessages>([["en", { ui: en, theory: createEnglishTheory }]]);
const failed = new Set<Locale>();
const pending = new Map<Locale, Promise<LocaleMessages>>();
const listeners = new Set<() => void>();

/** The language's texts if they're here already. */
export function loadedMessages(locale: Locale): LocaleMessages | undefined {
  return loaded.get(locale);
}

/** Loaded, or given up on (e.g. offline before it was ever downloaded): either way, don't wait any longer. */
export function messagesSettled(locale: Locale): boolean {
  return loaded.has(locale) || failed.has(locale);
}

/** Fetches a language's texts (once; later calls share the same download). */
export function loadMessages(locale: Locale): Promise<LocaleMessages> {
  const ready = loaded.get(locale);
  if (ready) return Promise.resolve(ready);
  let promise = pending.get(locale);
  if (!promise) {
    promise = IMPORTERS[locale as Exclude<Locale, "en">]()
      .then((messages) => {
        loaded.set(locale, messages);
        failed.delete(locale);
        return messages;
      })
      .catch((error: unknown) => {
        failed.add(locale);
        throw error;
      })
      .finally(() => {
        pending.delete(locale);
        listeners.forEach((listener) => listener());
      });
    pending.set(locale, promise);
  }
  return promise;
}

/** Called whenever a language finishes loading (or fails). */
export function subscribeMessages(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
