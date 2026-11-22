"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  createBundle,
  defaultNamingFor,
  detectLocale,
  isLocale,
  isNoteNaming,
  type I18nBundle,
  type Locale,
} from "@/lib/i18n";
import { parseScalePagePath } from "@/lib/pages";
import { BASE_PATH } from "@/lib/site";
import type { NoteNaming } from "@/lib/theory";

const LOCALE_KEY = "fretistry-locale";
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

/**
 * Language for this visit: ?lang= in the link, else a language you picked in
 * Settings before, else the page's own language (/nl/…), else the browser's.
 */
function initialLocale(): Locale {
  const fromUrl = new URLSearchParams(window.location.search).get("lang");
  if (isLocale(fromUrl)) return fromUrl;
  const saved = read(LOCALE_KEY);
  if (isLocale(saved)) return saved;
  const page = parseScalePagePath(window.location.pathname, BASE_PATH);
  if (page) return page.locale;
  return detectLocale(navigator.languages ?? [navigator.language]);
}

function initialNaming(): NoteNaming | null {
  const saved = read(NAMING_KEY);
  return isNoteNaming(saved) ? saved : null;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [namingOverride, setNamingOverride] = useState<NoteNaming | null>(initialNaming);
  const naming = namingOverride ?? defaultNamingFor(locale);
  const bundle = useMemo(() => createBundle(locale, naming), [locale, naming]);

  // (The page title follows the scale and is set by the explorer.)
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    write(LOCALE_KEY, next);
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
