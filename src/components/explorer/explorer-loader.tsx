"use client";

import dynamic from "next/dynamic";

/**
 * The explorer runs entirely in the browser (it reads saved settings from
 * local storage), so it is loaded client-side with a lightweight skeleton.
 */
const GuitarScaleExplorer = dynamic(
  () => import("./guitar-scale-explorer").then((m) => m.GuitarScaleExplorer),
  { ssr: false, loading: () => <ExplorerSkeleton /> },
);

export function ExplorerLoader() {
  return <GuitarScaleExplorer />;
}

function ExplorerSkeleton() {
  return (
    <div className="flex min-h-screen flex-col" aria-busy="true" aria-label="Loading Fretistry">
      <div className="h-14 border-b border-border/60" />
      <div className="mx-auto w-full max-w-[1600px] space-y-5 px-4 py-6 sm:px-6">
        <div className="h-24 animate-pulse rounded-2xl bg-muted/50" />
        <div className="h-[380px] animate-pulse rounded-2xl bg-muted/40" />
        <div className="h-64 animate-pulse rounded-2xl bg-muted/30" />
      </div>
    </div>
  );
}
