"use client";

import { createContext, useContext } from "react";
import { useMetronome, type MetronomeApi } from "@/hooks/use-metronome";

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
