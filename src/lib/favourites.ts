import { isRootName, type RootName } from "@/lib/data/roots";
import { findScale } from "@/lib/data/scales";

/**
 * Favourite scales (a root + a scale, e.g. "A Minor Pentatonic"). They are
 * stored in the browser's local storage on this device — no account or
 * server needed — as a small list like ["A|minor-pentatonic", "E|blues"].
 */

export interface Favourite {
  rootName: RootName;
  scaleId: string;
}

export const FAVOURITES_KEY = "fretistry-favourites";

/** Keeps the list easy to scan; adding more drops the oldest. */
export const MAX_FAVOURITES = 30;

export function favouriteKey(favourite: Favourite): string {
  return `${favourite.rootName}|${favourite.scaleId}`;
}

export function sameFavourite(a: Favourite, b: Favourite): boolean {
  return a.rootName === b.rootName && a.scaleId === b.scaleId;
}

/** Reads a stored list defensively: unknown roots/scales and duplicates are dropped. */
export function parseFavourites(raw: string | null): Favourite[] {
  if (!raw) return [];
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    const seen = new Set<string>();
    const result: Favourite[] = [];
    for (const item of data) {
      if (typeof item !== "string") continue;
      const [rootName, scaleId] = item.split("|");
      if (!isRootName(rootName) || !scaleId || !findScale(scaleId)) continue;
      const favourite = { rootName, scaleId };
      const key = favouriteKey(favourite);
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(favourite);
    }
    return result.slice(-MAX_FAVOURITES);
  } catch {
    return [];
  }
}

export function serializeFavourites(list: readonly Favourite[]): string {
  return JSON.stringify(list.map(favouriteKey));
}

export function isFavourite(list: readonly Favourite[], favourite: Favourite): boolean {
  return list.some((f) => sameFavourite(f, favourite));
}

/** Removes the favourite if it is in the list, otherwise adds it at the end. */
export function toggleFavourite(list: readonly Favourite[], favourite: Favourite): Favourite[] {
  if (isFavourite(list, favourite)) return list.filter((f) => !sameFavourite(f, favourite));
  return [...list, { rootName: favourite.rootName, scaleId: favourite.scaleId }].slice(-MAX_FAVOURITES);
}

export function removeFavourite(list: readonly Favourite[], favourite: Favourite): Favourite[] {
  return list.filter((f) => !sameFavourite(f, favourite));
}
