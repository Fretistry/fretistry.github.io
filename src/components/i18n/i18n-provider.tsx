"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { assembleBundle, defaultNamingFor, isNoteNaming, type I18nBundle, type Locale } from "@/lib/i18n/core";
import { LOCALE_KEY, initialLocale } from "@/lib/i18n/initial";
import { loadMessages, loadedMessages } from "@/lib/i18n/load";
import type { NoteNaming } from "@/lib/theory";

const NAMING_KEY = "fretistry-note-naming";

interface I18nContextValue extends I18nBundle {
  setLocale: (locale: Locale) => void;
  /** null = use the language's usual note names. */
  setNaming: (naming: NoteNaming | null) => void;
  namingIsAutomatic: boolean;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // Not remembered — fine.
  }
}

function initialNaming(): NoteNaming | null {
  const saved = read(NAMING_KEY);
  return isNoteNaming(saved) ? saved : null;
}

/**
 * The visit's language. Its texts were fetched before the app started (see ExplorerLoader);
 * if that failed (offline before it was ever downloaded), the app speaks English.
 */
function startLocale(): Locale {
  const locale = initialLocale();
  return loadedMessages(locale) ? locale : "en";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(startLocale);
  const [namingOverride, setNamingOverride] = useState<NoteNaming | null>(initialNaming);
  const naming = namingOverride ?? defaultNamingFor(locale);
  const bundle = useMemo(() => assembleBundle(locale, naming, loadedMessages(locale) ?? loadedMessages("en")!), [locale, naming]);

  // (The page title follows the scale and is set by the explorer.)
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  // A language picked in Settings is fetched first (a fraction of a second), then the whole
  // interface switches at once, never half in one language and half in another.
  const setLocale = useCallback((next: Locale) => {
    write(LOCALE_KEY, next);
    if (loadedMessages(next)) return setLocaleState(next);
    loadMessages(next).then(
      () => setLocaleState(next),
      () => {
        // Couldn't be downloaded (offline): stay in the current language.
      },
    );
  }, []);

  const setNaming = useCallback((next: NoteNaming | null) => {
    setNamingOverride(next);
    write(NAMING_KEY, next);
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({ ...bundle, setLocale, setNaming, namingIsAutomatic: namingOverride === null }),
    [bundle, setLocale, setNaming, namingOverride],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used inside <I18nProvider>");
  return context;
}
