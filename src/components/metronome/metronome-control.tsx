"use client";

import { useState } from "react";
import { Minus, Play, Plus, Square, Volume1, Volume2 } from "lucide-react";
import { ToolbarSwitch } from "@/components/explorer/display-toolbar";
import { useI18n } from "@/components/i18n/i18n-provider";
import { SegmentedControl } from "@/components/explorer/segmented-control";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { useMetronome } from "@/hooks/use-metronome";
import { BPM_MAX, BPM_MIN, tempoMarking, type ScheduledTick, type Subdivision } from "@/lib/audio/metronome";
import { cn } from "@/lib/utils";

const PRESETS = [60, 80, 100, 120, 140];

/** Metronome icon whose pendulum swings in time with the beat while running. */
function MetronomeIcon({ angle, beatSeconds, className }: { angle: number; beatSeconds: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M9 3h6l4 17.5H5L9 3z" />
      <path d="M6.2 15.5h11.6" />
      <g
        style={{
          transform: `rotate(${angle}deg)`,
          transformOrigin: "12px 15.5px",
          transformBox: "view-box",
          transition: angle === 0 ? "transform 0.3s ease" : `transform ${beatSeconds}s ease-in-out`,
        }}
      >
        <path d="M12 15.5V6" />
        <circle cx="12" cy="9" r="1.4" fill="currentColor" />
      </g>
    </svg>
  );
}

function BeatDots({ beatsPerBar, current, accent }: { beatsPerBar: number; current: ScheduledTick | null; accent: boolean }) {
  return (
    <div className="flex justify-center gap-2" aria-hidden="true">
      {Array.from({ length: beatsPerBar }, (_, beat) => {
        const active = current?.beat === beat;
        const isAccent = beat === 0 && accent;
        return (
          <span
            key={beat}
            className={cn(
              "size-3.5 rounded-full transition-all duration-75",
              active
                ? isAccent
                  ? "scale-125 bg-note-root shadow-[0_0_12px] shadow-note-root"
                  : "scale-125 bg-note-scale shadow-[0_0_12px] shadow-note-scale"
                : isAccent
                  ? "bg-note-root/30"
                  : "bg-muted-foreground/25",
            )}
          />
        );
      })}
    </div>
  );
}

/** Header button + panel for the metronome. Keeps ticking while the panel is closed. */
export function MetronomeControl() {
  const { settings, update, running, toggle, tap, current } = useMetronome();
  const t = useI18n().ui.metronome;
  const beatSeconds = 60 / settings.bpm;
  const [swing, setSwing] = useState<{ key: number; angle: number }>({ key: -1, angle: 0 });

  // Swing the pendulum the other way on every beat (derived during render from the latest tick).
  const onBeat = current && current.sub === 0 ? current : null;
  if (running && onBeat && onBeat.time !== swing.key) {
    setSwing({ key: onBeat.time, angle: swing.angle >= 0 ? -24 : 24 });
  } else if (!running && swing.angle !== 0) {
    setSwing({ key: -1, angle: 0 });
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size={running ? "sm" : "icon"}
          aria-label={running ? t.running(settings.bpm) : t.title}
          className={cn(running && "gap-1.5 px-2 text-primary")}
        >
          <MetronomeIcon angle={running ? swing.angle : 0} beatSeconds={beatSeconds} className="size-[18px]" />
          {running && (
            <>
              <span className="hidden font-semibold tabular-nums sm:inline">{settings.bpm}</span>
              <span
                key={current?.time ?? 0}
                className={cn(
                  "size-2 rounded-full",
                  current?.kind === "accent" ? "bg-note-root" : current?.kind === "sub" ? "bg-muted-foreground/50" : "bg-note-scale",
                  current && "animate-beat-flash",
                )}
              />
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(20rem,calc(100vw-1.5rem))] space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">{t.title}</p>
            <p className="mt-1 flex items-baseline gap-1.5">
              <span className="text-5xl leading-none font-semibold tabular-nums">{settings.bpm}</span>
              <span className="text-sm text-muted-foreground">BPM</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground italic">{tempoMarking(settings.bpm)}</p>
          </div>
          <Button
            onClick={toggle}
            aria-label={running ? t.stop : t.start}
            className="size-14 rounded-full [&_svg:not([class*='size-'])]:size-6"
          >
            {running ? <Square className="fill-current" /> : <Play className="ml-0.5 fill-current" />}
          </Button>
        </div>

        <BeatDots beatsPerBar={settings.beatsPerBar} current={running ? current : null} accent={settings.accent} />

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-sm" aria-label={t.slower} onClick={() => update({ bpm: settings.bpm - 1 })}>
            <Minus />
          </Button>
          <Slider
            min={BPM_MIN}
            max={BPM_MAX}
            step={1}
            value={[settings.bpm]}
            onValueChange={([bpm]) => update({ bpm })}
            aria-label={t.tempo}
            className="flex-1"
          />
          <Button variant="outline" size="icon-sm" aria-label={t.faster} onClick={() => update({ bpm: settings.bpm + 1 })}>
            <Plus />
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {PRESETS.map((bpm) => (
            <Button
              key={bpm}
              variant={settings.bpm === bpm ? "secondary" : "ghost"}
              size="xs"
              className="tabular-nums"
              onClick={() => update({ bpm })}
            >
              {bpm}
            </Button>
          ))}
          <Button variant="outline" size="xs" className="ml-auto" onClick={tap} title={t.tapTitle}>
            {t.tap}
          </Button>
        </div>

        <div className="space-y-2.5">
          <div>
            <p className="mb-1.5 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">{t.beatsPerBar}</p>
            <SegmentedControl
              ariaLabel={t.beatsPerBar}
              value={String(settings.beatsPerBar)}
              onChange={(v) => update({ beatsPerBar: Number(v) })}
              className="w-full"
              options={["2", "3", "4", "5", "6", "7"].map((v) => ({ value: v, label: v }))}
            />
          </div>
          <div>
            <p className="mb-1.5 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">{t.clicksPerBeat}</p>
            <SegmentedControl
              ariaLabel={t.clicksPerBeat}
              value={String(settings.subdivision)}
              onChange={(v) => update({ subdivision: Number(v) as Subdivision })}
              className="w-full"
              options={[
                { value: "1", label: t.beats, title: t.beatsTitle },
                { value: "2", label: t.eighths, title: t.eighthsTitle },
                { value: "3", label: t.triplets, title: t.tripletsTitle },
                { value: "4", label: t.sixteenths, title: t.sixteenthsTitle },
              ]}
            />
          </div>
          <ToolbarSwitch
            id="metronome-accent"
            label={t.accent}
            checked={settings.accent}
            onCheckedChange={(accent) => update({ accent })}
          />
          <div className="flex items-center gap-2.5">
            <Volume1 className="size-4 text-muted-foreground" />
            <Slider
              min={0}
              max={100}
              step={1}
              value={[Math.round(settings.volume * 100)]}
              onValueChange={([v]) => update({ volume: v / 100 })}
              aria-label={t.volume}
              className="flex-1"
            />
            <Volume2 className="size-4 text-muted-foreground" />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">{t.note}</p>
      </PopoverContent>
    </Popover>
  );
}
