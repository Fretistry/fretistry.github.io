import { parseScalePagePath } from "@/lib/pages";
import { BASE_PATH } from "@/lib/site";
import { detectLocale, isLocale, type Locale } from "./core";

/** Where a language picked in Settings is remembered. */
export const LOCALE_KEY = "fretistry-locale";

/**
 * Language for this visit (in the browser): ?lang= in the link, else a language picked in
 * Settings before, else the page's own language (/nl/…), else the browser's. Known before
 * the app starts, so its texts can be fetched while the app's code is still starting up.
 */
export function initialLocale(): Locale {
  const fromUrl = new URLSearchParams(window.location.search).get("lang");
  if (isLocale(fromUrl)) return fromUrl;
  try {
    const saved = localStorage.getItem(LOCALE_KEY);
    if (isLocale(saved)) return saved;
  } catch {
    // Storage unavailable (private mode): fall through.
  }
  const page = parseScalePagePath(window.location.pathname, BASE_PATH);
  if (page) return page.locale;
  return detectLocale(navigator.languages ?? [navigator.language]);
}
