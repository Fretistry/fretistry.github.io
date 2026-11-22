"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getAudioEngine } from "@/lib/audio/audio-engine";

export interface PlayStep {
  midi: number;
  /** Index of the scale note (0 = root), for the note chips above the neck. */
  scaleIndex: number;
  /** Fretboard spot ("string:fret") to light up on the neck, if the step has one. */
  key?: string;
}

export interface PlayOptions {
  /** Time between notes, in seconds (one metronome click). */
  stepSeconds: number;
  /** Wait before the first note, in seconds (to land exactly on the metronome's next beat). */
  startDelay?: number;
}

/**
 * Plays a scale note by note and reports which note is sounding — both its
 * scale degree (note chips) and its spot on the neck — so the UI can light it
 * up. Changing `resetKey` (root/scale/shape) stops playback.
 */
export function useScalePlayer(resetKey: string) {
  const [playing, setPlaying] = useState<{ reset: string; index: number; key: string | null } | null>(null);
  const timers = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }, []);

  const stop = useCallback(() => {
    clearTimers();
    getAudioEngine().stopAll();
    setPlaying(null);
  }, [clearTimers]);

  const play = useCallback(
    (steps: readonly PlayStep[], { stepSeconds, startDelay = 0 }: PlayOptions) => {
      clearTimers();
      const engine = getAudioEngine();
      engine.stopAll();
      steps.forEach((step, i) => {
        const at = startDelay + i * stepSeconds;
        engine.playNote(step.midi, { delay: at, voice: "scale-player", velocity: 0.85 });
        timers.current.push(
          window.setTimeout(() => setPlaying({ reset: resetKey, index: step.scaleIndex, key: step.key ?? null }), at * 1000),
        );
      });
      const end = startDelay + steps.length * stepSeconds + 0.4;
      timers.current.push(window.setTimeout(() => setPlaying(null), end * 1000));
      // Show "playing" straight away, even while waiting for the next beat.
      if (startDelay > 0.02) setPlaying({ reset: resetKey, index: -1, key: null });
    },
    [clearTimers, resetKey],
  );

  // A new root, scale or shape stops whatever is playing.
  useEffect(() => {
    clearTimers();
    getAudioEngine().stopAll();
  }, [resetKey, clearTimers]);

  useEffect(() => clearTimers, [clearTimers]);

  const active = playing && playing.reset === resetKey ? playing : null;
  return {
    isPlaying: active !== null,
    playingIndex: active && active.index >= 0 ? active.index : null,
    playingKey: active?.key ?? null,
    play,
    stop,
  };
}
