"use client";

import { createContext, useContext, useSyncExternalStore } from "react";
import { useMetronome, type MetronomeApi } from "@/hooks/use-metronome";
import type { ScheduledTick } from "@/lib/audio/metronome";

const MetronomeContext = createContext<MetronomeApi | null>(null);

/** One shared metronome for the header button, the bar at the neck and "Play scale". */
export function MetronomeProvider({ children }: { children: React.ReactNode }) {
  const metronome = useMetronome();
  return <MetronomeContext.Provider value={metronome}>{children}</MetronomeContext.Provider>;
}

export function useSharedMetronome(): MetronomeApi {
  const metronome = useContext(MetronomeContext);
  if (!metronome) throw new Error("useSharedMetronome must be used inside <MetronomeProvider>");
  return metronome;
}

const noTick = () => null;

/** The click that is sounding now. Only the beat lights use this, so only they redraw on every click. */
export function useMetronomeTick(): ScheduledTick | null {
  const { ticks } = useSharedMetronome();
  return useSyncExternalStore(ticks.subscribe, ticks.get, noTick);
}
