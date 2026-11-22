import { ROOT_NAMES, rootNote, type RootName } from "@/lib/data/roots";
import { SCALES, findScale } from "@/lib/data/scales";
import { LOCALES, isLocale, type Locale } from "@/lib/i18n";
import { noteToAscii, pitchClassOf, type SpelledNote } from "@/lib/theory";

/**
 * Findable pages: every scale in every key gets its own address, per language,
 * e.g. /nl/a-minor-pentatonic or /en/c-sharp-dorian. Search engines can then
 * find "A minor pentatonic" on its own page (with its own title and text),
 * and links read naturally. The app on such a page starts on that scale.
 */

const ROOT_SLUGS: Record<RootName, string> = {
  C: "c",
  "C#": "c-sharp",
  D: "d",
  Eb: "e-flat",
  E: "e",
  F: "f",
  "F#": "f-sharp",
  G: "g",
  Ab: "a-flat",
  A: "a",
  Bb: "b-flat",
  B: "b",
};

// Longest first, so "c-sharp-…" is never read as "c" + "sharp-…".
const ROOTS_BY_SLUG_LENGTH = [...ROOT_NAMES].sort((a, b) => ROOT_SLUGS[b].length - ROOT_SLUGS[a].length);

export interface ScalePage {
  locale: Locale;
  rootName: RootName;
  scaleId: string;
}

/** "a-minor-pentatonic", "c-sharp-dorian", "e-flat-major". */
export function scalePageSlug(rootName: RootName, scaleId: string): string {
  return `${ROOT_SLUGS[rootName]}-${scaleId}`;
}

/** Reads a page slug back; null when it isn't a known key + scale. */
export function parseScalePageSlug(slug: string): Omit<ScalePage, "locale"> | null {
  const lower = slug.toLowerCase();
  for (const rootName of ROOTS_BY_SLUG_LENGTH) {
    const prefix = `${ROOT_SLUGS[rootName]}-`;
    if (!lower.startsWith(prefix)) continue;
    const scaleId = lower.slice(prefix.length);
    if (findScale(scaleId)) return { rootName, scaleId };
  }
  return null;
}

/** "/nl/a-minor-pentatonic/" (without the site's sub-folder; every page is a folder, hence the slash). */
export function scalePagePath({ locale, rootName, scaleId }: ScalePage): string {
  return `/${locale}/${scalePageSlug(rootName, scaleId)}/`;
}

/** The page an address points to (the site's sub-folder, if any, is skipped); null for other addresses. */
export function parseScalePagePath(pathname: string, basePath = ""): ScalePage | null {
  const path = basePath && pathname.startsWith(basePath) ? pathname.slice(basePath.length) : pathname;
  const match = /^\/([a-z]{2})\/([a-z0-9-]+?)(?:\.html)?\/?$/i.exec(path);
  if (!match || !isLocale(match[1].toLowerCase())) return null;
  const page = parseScalePageSlug(match[2]);
  return page ? { locale: match[1].toLowerCase() as Locale, ...page } : null;
}

/** "/nl/": a language's overview of every scale in every key. */
export function scaleIndexPath(locale: Locale): string {
  return `/${locale}/`;
}

/** The root-picker key for a spelled note ("D♭" → "C#" when D♭ isn't one of the 12 offered names). */
export function rootNameForNote(note: SpelledNote): RootName {
  const ascii = noteToAscii(note);
  const exact = ROOT_NAMES.find((r) => r === ascii);
  if (exact) return exact;
  const pc = pitchClassOf(note);
  return ROOT_NAMES.find((r) => pitchClassOf(rootNote(r)) === pc) ?? "C";
}

/** Every page: each language × each key × each scale. */
export function allScalePages(): ScalePage[] {
  return LOCALES.flatMap(({ code }) =>
    ROOT_NAMES.flatMap((rootName) => SCALES.map((scale) => ({ locale: code, rootName, scaleId: scale.id }))),
  );
}
