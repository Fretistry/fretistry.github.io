"use client";

import { createContext, useContext, type ReactNode } from "react";
import dynamic from "next/dynamic";

/**
 * The explorer runs entirely in the browser (it reads saved settings from
 * local storage), so it is loaded client-side. Until it's ready, the page shows
 * what it was given: on a scale page the scale's name, notes and explanation as
 * real text (also what search engines read), on the home page a light skeleton.
 */
const Placeholder = createContext<ReactNode>(null);

function LoadingView() {
  return useContext(Placeholder) ?? <ExplorerSkeleton />;
}

const GuitarScaleExplorer = dynamic(
  () => import("./guitar-scale-explorer").then((m) => m.GuitarScaleExplorer),
  { ssr: false, loading: () => <LoadingView /> },
);

export function ExplorerLoader({ placeholder }: { placeholder?: ReactNode }) {
  return (
    <Placeholder.Provider value={placeholder ?? null}>
      <GuitarScaleExplorer />
    </Placeholder.Provider>
  );
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
