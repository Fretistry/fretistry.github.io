import { Info, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RichText } from "@/components/theory/rich-text";
import type { ScaleExplanation } from "@/lib/theory";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n/i18n-provider";

interface ScaleHeaderProps {
  explanation: ScaleExplanation;
  /** Shown right after the title (the favourite star). */
  titleAddon?: React.ReactNode;
  /** Buttons shown after "Play scale" (the Share menu). */
  actions?: React.ReactNode;
  soundEnabled: boolean;
  /** Hover text for "Play scale" (e.g. the metronome tempo it uses). */
  playTitle?: string;
  /** "Play scale" unavailable for another reason than sound being off (e.g. during the trainer). */
  playDisabled?: boolean;
  /** The metronome tempo "Play scale" uses (shown on the button on larger screens). */
  tempo?: number;
  isPlaying: boolean;
  /** Scale note currently sounding during "Play scale" (highlighted). */
  playingIndex: number | null;
  onPlay: () => void;
  onStop: () => void;
}

/** Scale title with its notes and formula at a glance — sits right above the fretboard. */
export function ScaleHeader({
  explanation,
  titleAddon,
  actions,
  soundEnabled,
  playTitle,
  playDisabled = false,
  tempo,
  isPlaying,
  playingIndex,
  onPlay,
  onStop,
}: ScaleHeaderProps) {
  const e = explanation;
  const t = useI18n().ui.scaleHeader;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <div className="flex items-center gap-1">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">{e.title}</h1>
              {titleAddon}
            </div>
            <Button
              variant={isPlaying ? "default" : "outline"}
              size="sm"
              onClick={isPlaying ? onStop : onPlay}
              disabled={!soundEnabled || playDisabled}
              title={soundEnabled ? playTitle : t.soundOffHint}
              className="rounded-full"
            >
              {isPlaying ? <Square className="fill-current" /> : <Play className="fill-current" />}
              {/* Both labels share one grid cell, so the button keeps its width when Play turns into Stop.
                  Phones get a short "Play" so Play, Share and Train fit on one row in every language. */}
              <span className="grid">
                <span className={cn("col-start-1 row-start-1", isPlaying && "invisible")}>
                  <span className="sm:hidden">{t.playShort}</span>
                  <span className="max-sm:hidden">{t.playScale}</span>
                  {/* the tempo it plays at: it follows the metronome */}
                  {/* (from laptop width: on a tablet it would push the scale's notes onto a new line) */}
                  {tempo !== undefined && <span className="ml-1 hidden font-normal tabular-nums opacity-70 xl:inline">{tempo} BPM</span>}
                </span>
                <span className={cn("col-start-1 row-start-1", !isPlaying && "invisible")}>{t.stop}</span>
              </span>
            </Button>
            {actions}
          </div>
          {/* the mood line is also in Music theory; phones skip it here to keep the neck close */}
          <p className="mt-0.5 max-w-2xl text-sm text-muted-foreground max-sm:hidden">{e.mood}</p>
        </div>

        <ol className="flex flex-wrap gap-1 sm:gap-1.5" aria-label={t.scaleNotes}>
          {e.intervalRows.map((row) => {
            const sounding = playingIndex === row.index;
            return (
              <li
                key={row.index}
                className={cn(
                  "flex min-w-10 flex-col items-center rounded-lg px-1.5 py-1 ring-1 transition-all duration-150 sm:min-w-11 sm:px-2",
                  row.index === 0 ? "bg-note-root/15 ring-note-root/50" : "bg-note-scale/10 ring-note-scale/30",
                  sounding &&
                    (row.index === 0
                      ? "-translate-y-0.5 bg-note-root/40 ring-2 ring-note-root"
                      : "-translate-y-0.5 bg-note-scale/35 ring-2 ring-note-scale"),
                )}
              >
                <span
                  className={cn(
                    "text-base leading-tight font-semibold",
                    row.index === 0 ? "text-note-root-text" : "text-foreground",
                  )}
                >
                  {row.note}
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">{row.formulaLabel}</span>
              </li>
            );
          })}
        </ol>
      </div>

      {e.notices.length > 0 && (
        <div className="flex gap-2 rounded-lg border border-border/70 bg-muted/50 px-3 py-2 text-sm text-foreground/85">
          <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="space-y-1">
            {e.notices.map((n) => (
              <p key={n}>
                <RichText text={n} />
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
