"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
// Clicks are booked this far ahead on the audio clock, so a busy moment on a slower phone
// (redrawing the neck after a key change) can't make a click late.
const VISIBLE_LOOKAHEAD = 0.3;
// Background tabs only wake timers about once a second, so book further ahead there.
const HIDDEN_LOOKAHEAD = 1.5;

/**
 * The latest click, kept outside React state: only the beat lights listen to it
 * (with `useSyncExternalStore`), so the rest of the app doesn't redraw on every click.
 */
export interface TickStore {
  get: () => ScheduledTick | null;
  subscribe: (listener: () => void) => () => void;
}

function createTickStore(): TickStore & { set: (tick: ScheduledTick | null) => void } {
  let current: ScheduledTick | null = null;
  const listeners = new Set<() => void>();
  return {
    get: () => current,
    set: (tick) => {
      if (tick === current) return;
      current = tick;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/** A lesson link can carry the tempo ("?bpm=80"); it wins over the tempo remembered on this device. */
function linkTempo(): Partial<MetronomeSettings> {
  try {
    const bpm = Number(new URLSearchParams(window.location.search).get("bpm"));
    return bpm ? { bpm: clampBpm(bpm) } : {};
  } catch {
    return {};
  }
}

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
      backbeat: typeof data.backbeat === "boolean" ? data.backbeat : DEFAULT_METRONOME.backbeat,
      gap: ([0, 1, 2, 4] as const).includes(Number(data.gap) as MetronomeSettings["gap"])
        ? (Number(data.gap) as MetronomeSettings["gap"])
        : DEFAULT_METRONOME.gap,
      // a shared lesson link can set the tempo ("?bpm=80")
      ...linkTempo(),
    };
  } catch {
    return DEFAULT_METRONOME;
  }
}

/** Metronome state + control. Settings are remembered on this device. */
export function useMetronome() {
  const [settings, setSettings] = useState<MetronomeSettings>(loadSettings);
  const [running, setRunning] = useState(false);
  const [ticks] = useState(createTickStore);
  const scheduler = useRef<MetronomeScheduler | null>(null);
  /** Each run plays through its own volume knob, so Stop can silence clicks that are already booked. */
  const runOutput = useRef<GainNode | null>(null);
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
    const output = runOutput.current;
    if (output) {
      // Fade out within a few milliseconds: clicks booked ahead of time stay silent.
      output.gain.setTargetAtTime(0, output.context.currentTime, 0.005);
      window.setTimeout(() => output.disconnect(), 500);
      runOutput.current = null;
    }
    setRunning(false);
    ticks.set(null);
  }, [ticks]);

  const start = useCallback(() => {
    const audio = getSharedAudio();
    if (!audio) return;
    const output = audio.ctx.createGain();
    output.connect(audio.master);
    runOutput.current = output;
    const instance = new MetronomeScheduler({
      now: () => audio.ctx.currentTime,
      onSchedule: (tick, s) => {
        if (!tick.silent) playClick(audio.ctx, output, tick.time, tick.kind, s.volume);
      },
      lookahead: document.hidden ? HIDDEN_LOOKAHEAD : VISIBLE_LOOKAHEAD,
    });
    scheduler.current = instance;
    instance.start(settingsRef.current);
    timer.current = window.setInterval(() => instance.pump(), 25);
    const animate = () => {
      const due = instance.takeDue(audio.ctx.currentTime);
      if (due) ticks.set(due);
      frame.current = requestAnimationFrame(animate);
    };
    frame.current = requestAnimationFrame(animate);
    setRunning(true);
  }, [ticks]);

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

  /** Audio-clock time of the next beat (null when not running), to start things exactly on the beat. */
  const nextBeatTime = useCallback((after: number) => scheduler.current?.nextBeatTime(after) ?? null, []);

  // A stable object: it only changes when settings or running change — never on a click.
  return useMemo(
    () => ({ settings, update, running, start, stop, toggle, tap, ticks: ticks as TickStore, nextBeatTime }),
    [settings, update, running, start, stop, toggle, tap, ticks, nextBeatTime],
  );
}

export type MetronomeApi = ReturnType<typeof useMetronome>;
