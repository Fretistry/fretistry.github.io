"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSharedAudio } from "@/lib/audio/audio-context";
import {
  DEFAULT_METRONOME,
  MetronomeScheduler,
  clampBpm,
  playClick,
  tapTempo,
  type MetronomeSettings,
  type ScheduledTick,
  type Subdivision,
} from "@/lib/audio/metronome";

const STORAGE_KEY = "fretistry-metronome";
const VISIBLE_LOOKAHEAD = 0.12;
// Background tabs only wake timers about once a second, so book further ahead there.
const HIDDEN_LOOKAHEAD = 1.5;

function loadSettings(): MetronomeSettings {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Partial<MetronomeSettings>;
    return {
      bpm: clampBpm(Number(data.bpm ?? DEFAULT_METRONOME.bpm)),
      beatsPerBar: [1, 2, 3, 4, 5, 6, 7].includes(Number(data.beatsPerBar)) ? Number(data.beatsPerBar) : DEFAULT_METRONOME.beatsPerBar,
      subdivision: ([1, 2, 3, 4] as const).includes(Number(data.subdivision) as Subdivision)
        ? (Number(data.subdivision) as Subdivision)
        : DEFAULT_METRONOME.subdivision,
      accent: typeof data.accent === "boolean" ? data.accent : DEFAULT_METRONOME.accent,
      volume: typeof data.volume === "number" ? Math.min(1, Math.max(0, data.volume)) : DEFAULT_METRONOME.volume,
    };
  } catch {
    return DEFAULT_METRONOME;
  }
}

/** Metronome state + control. Settings are remembered on this device. */
export function useMetronome() {
  const [settings, setSettings] = useState<MetronomeSettings>(loadSettings);
  const [running, setRunning] = useState(false);
  const [current, setCurrent] = useState<ScheduledTick | null>(null);
  const scheduler = useRef<MetronomeScheduler | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const frame = useRef<number | undefined>(undefined);
  const taps = useRef<number[]>([]);
  const settingsRef = useRef(settings);

  useEffect(() => {
    settingsRef.current = settings;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Not remembered — fine.
    }
    scheduler.current?.update(settings);
  }, [settings]);

  const stop = useCallback(() => {
    window.clearInterval(timer.current);
    if (frame.current !== undefined) cancelAnimationFrame(frame.current);
    scheduler.current?.stop();
    scheduler.current = null;
    setRunning(false);
    setCurrent(null);
  }, []);

  const start = useCallback(() => {
    const audio = getSharedAudio();
    if (!audio) return;
    const instance = new MetronomeScheduler({
      now: () => audio.ctx.currentTime,
      onSchedule: (tick, s) => playClick(audio.ctx, audio.master, tick.time, tick.kind, s.volume),
      lookahead: document.hidden ? HIDDEN_LOOKAHEAD : VISIBLE_LOOKAHEAD,
    });
    scheduler.current = instance;
    instance.start(settingsRef.current);
    timer.current = window.setInterval(() => instance.pump(), 25);
    const animate = () => {
      const due = instance.takeDue(audio.ctx.currentTime);
      if (due) setCurrent(due);
      frame.current = requestAnimationFrame(animate);
    };
    frame.current = requestAnimationFrame(animate);
    setRunning(true);
  }, []);

  const toggle = useCallback(() => (scheduler.current ? stop() : start()), [start, stop]);

  const update = useCallback((patch: Partial<MetronomeSettings>) => {
    setSettings((s) => ({ ...s, ...patch, bpm: clampBpm(patch.bpm ?? s.bpm) }));
  }, []);

  const tap = useCallback(() => {
    const now = performance.now();
    taps.current = [...taps.current.filter((t) => now - t < 8000), now];
    const bpm = tapTempo(taps.current);
    if (bpm) update({ bpm });
  }, [update]);

  // Keep ticking reliably when the tab goes to the background.
  useEffect(() => {
    const onVisibility = () => {
      if (scheduler.current) scheduler.current.lookahead = document.hidden ? HIDDEN_LOOKAHEAD : VISIBLE_LOOKAHEAD;
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => stop, [stop]);

  return { settings, update, running, start, stop, toggle, tap, current };
}
