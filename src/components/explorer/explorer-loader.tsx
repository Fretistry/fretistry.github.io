"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { initialLocale } from "@/lib/i18n/initial";
import { loadMessages, messagesSettled, subscribeMessages } from "@/lib/i18n/load";
import { GuitarScaleExplorer } from "./guitar-scale-explorer";

/**
 * Only the visitor's language is downloaded. Its texts are requested the moment this code
 * runs in the browser (while the app is still starting), and the page's text stays on screen
 * until they're here, so the app never shows up blank or in the wrong language first.
 */
const visitLocale = typeof window === "undefined" ? null : initialLocale();
if (visitLocale) loadMessages(visitLocale).catch(() => undefined);

function useLanguageReady(): boolean {
  return useSyncExternalStore(
    subscribeMessages,
    () => visitLocale === null || messagesSettled(visitLocale),
    () => false,
  );
}

/**
 * The explorer runs entirely in the browser (it reads saved settings from
 * local storage), so it only renders there. Until then the page shows what it
 * was given: on a scale page the scale's name, notes and explanation as real
 * text (also what search engines read), on the home page a light skeleton.
 *
 * The explorer is imported normally rather than lazily: that way its code is
 * listed in the page itself and downloads together with the page's other
 * scripts, instead of only after them (about a second sooner on mobile data).
 */
const noSubscription = () => () => {};

/** False while the page is built and while it starts up in the browser, true once it runs there. */
function useInBrowser(): boolean {
  return useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  );
}

export function ExplorerLoader({ placeholder }: { placeholder?: ReactNode }) {
  const inBrowser = useInBrowser();
  const languageReady = useLanguageReady();
  if (!inBrowser || !languageReady) return placeholder ?? <ExplorerSkeleton />;
  return <GuitarScaleExplorer />;
}

function ExplorerSkeleton() {
  return (
    <div className="flex min-h-screen flex-col" aria-busy="true" aria-label="Loading Fretistry">
      <div className="h-14 border-b border-border/60" />
      <div className="mx-auto w-full max-w-[1600px] min-[1760px]:max-w-[112rem] space-y-5 px-4 py-6 sm:px-6">
        <div className="h-24 animate-pulse rounded-2xl bg-muted/50" />
        <div className="h-[380px] animate-pulse rounded-2xl bg-muted/40" />
        <div className="h-64 animate-pulse rounded-2xl bg-muted/30" />
      </div>
    </div>
  );
}
