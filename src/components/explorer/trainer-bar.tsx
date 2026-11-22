"use client";

import { useEffect, useState } from "react";
import { Check, SkipForward, Target, X } from "lucide-react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { RichText } from "@/components/theory/rich-text";
import { Button } from "@/components/ui/button";
import type { TrainerState } from "@/hooks/use-trainer";
import { cn } from "@/lib/utils";

interface TrainerBarProps {
  state: TrainerState;
  /** The note to find, in the chosen note names. */
  noteName: string;
  total: number;
  onNext: () => void;
  onStop: () => void;
  className?: string;
}

/** "3.4" / "3,4": seconds with one decimal, in the language's own number style. */
const formatSeconds = (locale: string, ms: number) =>
  (ms / 1000).toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** The live round clock (re-renders a few times a second while a round runs). */
function useClock(startedAt: number | null, finishedAt: number | null): number {
  const [now, setNow] = useState(() => performance.now());
  useEffect(() => {
    if (startedAt === null || finishedAt !== null) return;
    const id = window.setInterval(() => setNow(performance.now()), 200);
    return () => window.clearInterval(id);
  }, [startedAt, finishedAt]);
  if (startedAt === null) return 0;
  return Math.max(0, (finishedAt ?? now) - startedAt);
}

/**
 * Fretboard trainer: "Find every G". Tap every spot where the note lives
 * (within the visible frets and the chosen shapes); found spots light up, a
 * wrong tap flashes red. Shows progress, mistakes and time.
 */
export function TrainerBar({ state, noteName, total, onNext, onStop, className }: TrainerBarProps) {
  const { ui, locale } = useI18n();
  const t = ui.trainer;
  const seconds = (ms: number) => formatSeconds(locale, ms);
  const elapsed = useClock(state.startedAt, state.finishedAt);
  const done = state.finishedAt !== null;
  const found = Math.min(state.found.length, total);

  return (
    <div
      role="group"
      aria-label={t.button}
      className={cn("rounded-xl border border-primary/30 bg-card/95 px-3 py-2 backdrop-blur-sm", className)}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="flex items-center gap-2 text-base sm:text-lg" aria-live="polite">
          {done ? <Check className="size-5 text-note-scale" /> : <Target className="size-5 text-primary" />}
          {done ? (
            <span>{t.done(total, seconds(elapsed))}</span>
          ) : (
            <RichText text={t.find(noteName)} />
          )}
        </p>
        {/* progress dots (phones: the "3 of 6" text is enough, keeping the pinned bar small) */}
        <div className="hidden items-center gap-1 sm:flex" aria-hidden="true">
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className={cn("size-2.5 rounded-full", i < found ? "bg-note-scale" : "bg-muted-foreground/25")} />
          ))}
        </div>
        <p className="text-sm text-muted-foreground tabular-nums">
          {t.progress(found, total)} · {t.mistakes(state.mistakes)} · {seconds(elapsed)} s
        </p>
        <div className="ml-auto flex items-center gap-1">
          <Button size="sm" variant={done ? "default" : "outline"} onClick={onNext} className="rounded-full">
            <SkipForward /> {done ? t.next : t.skip}
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label={t.stop} title={t.stop} onClick={onStop}>
            <X />
          </Button>
        </div>
      </div>
      <p className="mt-1 hidden text-xs text-muted-foreground sm:block">
        {state.completed > 0
          ? t.session(state.completed, seconds(state.totalMs / state.completed), state.totalMistakes)
          : t.hint}
      </p>
    </div>
  );
}
