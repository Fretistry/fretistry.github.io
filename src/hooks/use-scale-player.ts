"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getAudioEngine } from "@/lib/audio/audio-engine";
import type { SequenceStep } from "@/lib/audio/sequence";

const STEP_SECONDS = 0.32;

/**
 * Plays a scale note by note and reports which scale note is sounding, so the
 * UI can highlight it. Changing `resetKey` (root/scale) stops playback.
 */
export function useScalePlayer(resetKey: string) {
  const [playing, setPlaying] = useState<{ key: string; index: number } | null>(null);
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
    (steps: readonly SequenceStep[]) => {
      clearTimers();
      const engine = getAudioEngine();
      engine.stopAll();
      steps.forEach((step, i) => {
        engine.playNote(step.midi, { delay: i * STEP_SECONDS, voice: "scale-player", velocity: 0.85 });
        timers.current.push(
          window.setTimeout(() => setPlaying({ key: resetKey, index: step.scaleIndex }), i * STEP_SECONDS * 1000),
        );
      });
      timers.current.push(window.setTimeout(() => setPlaying(null), (steps.length * STEP_SECONDS + 0.4) * 1000));
    },
    [clearTimers, resetKey],
  );

  // A new root or scale stops whatever is playing.
  useEffect(() => {
    clearTimers();
    getAudioEngine().stopAll();
  }, [resetKey, clearTimers]);

  useEffect(() => clearTimers, [clearTimers]);

  const active = playing && playing.key === resetKey ? playing : null;
  return { isPlaying: active !== null, playingIndex: active?.index ?? null, play, stop };
}
