"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Fretboard trainer state ("find every G"). A round belongs to a context
 * (root, scale, tuning, frets, shapes): change any of those and a fresh round
 * starts. The note to find comes from `pickTarget` (see lib/trainer).
 */
export interface TrainerState {
  active: boolean;
  /** The context the current round belongs to. */
  context: string;
  round: number;
  /** Pitch class asked in the previous round (not asked twice in a row). */
  previous: number | null;
  found: string[];
  mistakes: number;
  /** When the round's clock started (ms); null until the first tap after a context change. */
  startedAt: number | null;
  finishedAt: number | null;
  wrongKey: string | null;
  /** Rounds completed in this session, and their total time (ms) and mistakes. */
  completed: number;
  totalMs: number;
  totalMistakes: number;
}

const IDLE: TrainerState = {
  active: false,
  context: "",
  round: 0,
  previous: null,
  found: [],
  mistakes: 0,
  startedAt: null,
  finishedAt: null,
  wrongKey: null,
  completed: 0,
  totalMs: 0,
  totalMistakes: 0,
};

export function useTrainer(context: string) {
  const [state, setState] = useState<TrainerState>(IDLE);
  const wrongTimer = useRef<number | undefined>(undefined);

  // A new key, scale, tuning, fret range or shape starts a fresh round (adjusted during render).
  if (state.active && state.context !== context) {
    setState((s) => ({ ...s, context, found: [], mistakes: 0, startedAt: null, finishedAt: null, wrongKey: null }));
  }

  const start = useCallback(() => {
    setState({ ...IDLE, active: true, context, startedAt: performance.now() });
  }, [context]);

  const stop = useCallback(() => {
    window.clearTimeout(wrongTimer.current);
    setState(IDLE);
  }, []);

  /** Next round; `askedPitchClass` is this round's note, so it isn't asked again straight away. */
  const next = useCallback((askedPitchClass: number) => {
    setState((s) => ({
      ...s,
      round: s.round + 1,
      previous: askedPitchClass,
      found: [],
      mistakes: 0,
      startedAt: performance.now(),
      finishedAt: null,
      wrongKey: null,
    }));
  }, []);

  /** A tap on the neck: right (one of `targets`) or wrong. Returns whether it was right. */
  const tap = useCallback((key: string, targets: ReadonlySet<string>): boolean => {
    const now = performance.now();
    const right = targets.has(key);
    setState((s) => {
      if (s.finishedAt !== null) return s;
      const startedAt = s.startedAt ?? now;
      if (!right) return { ...s, startedAt, mistakes: s.mistakes + 1, totalMistakes: s.totalMistakes + 1, wrongKey: key };
      if (s.found.includes(key)) return { ...s, startedAt };
      const found = [...s.found, key];
      const done = found.length >= targets.size;
      return {
        ...s,
        startedAt,
        found,
        wrongKey: null,
        finishedAt: done ? now : null,
        completed: done ? s.completed + 1 : s.completed,
        totalMs: done ? s.totalMs + (now - startedAt) : s.totalMs,
      };
    });
    if (!right) {
      window.clearTimeout(wrongTimer.current);
      wrongTimer.current = window.setTimeout(() => setState((s) => ({ ...s, wrongKey: null })), 650);
    }
    return right;
  }, []);

  useEffect(() => () => window.clearTimeout(wrongTimer.current), []);

  return { state, start, stop, next, tap };
}
