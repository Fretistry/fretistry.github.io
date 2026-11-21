"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  FAVOURITES_KEY,
  parseFavourites,
  removeFavourite,
  serializeFavourites,
  toggleFavourite,
  type Favourite,
} from "@/lib/favourites";

function loadFavourites(): Favourite[] {
  try {
    return parseFavourites(localStorage.getItem(FAVOURITES_KEY));
  } catch {
    return [];
  }
}

/**
 * Favourite scales, remembered in this browser. Changes made in another tab
 * show up here too.
 */
export function useFavourites() {
  const [favourites, setFavourites] = useState<Favourite[]>(loadFavourites);
  const skipSave = useRef(true);

  useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false; // nothing changed yet on the first render
      return;
    }
    try {
      localStorage.setItem(FAVOURITES_KEY, serializeFavourites(favourites));
    } catch {
      // Storage unavailable (private mode): favourites last until the page closes.
    }
  }, [favourites]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === FAVOURITES_KEY) setFavourites(parseFavourites(event.newValue));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toggle = useCallback((favourite: Favourite) => setFavourites((list) => toggleFavourite(list, favourite)), []);
  const remove = useCallback((favourite: Favourite) => setFavourites((list) => removeFavourite(list, favourite)), []);

  return { favourites, toggle, remove };
}
