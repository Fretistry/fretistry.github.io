"use client";

import { useState } from "react";
import { Minus, Play, Plus, SlidersHorizontal, Square, Volume1, Volume2, X } from "lucide-react";
import { ToolbarSwitch } from "@/components/explorer/display-toolbar";
import { SegmentedControl } from "@/components/explorer/segmented-control";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { BPM_MAX, BPM_MIN, tempoMarking, type ScheduledTick, type Subdivision } from "@/lib/audio/metronome";
import { useDrone } from "@/hooks/use-drone";
import { cn } from "@/lib/utils";
import { DroneControls, DroneSettingsPanel } from "./drone-controls";
import { useSharedMetronome } from "./metronome-provider";

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

/** Large beat lights: easy to catch from the corner of your eye while looking at the neck. */
function BeatLights({ beatsPerBar, current, accent }: { beatsPerBar: number; current: ScheduledTick | null; accent: boolean }) {
  return (
    <div className="flex items-center gap-1 sm:gap-2" aria-hidden="true">
      {Array.from({ length: beatsPerBar }, (_, beat) => {
        const active = current?.beat === beat;
        const isAccent = beat === 0 && accent;
        return (
          <span
            key={beat}
            className={cn(
              "size-3 rounded-full transition-all duration-75 sm:size-4",
              active
                ? isAccent
                  ? "scale-125 bg-note-root shadow-[0_0_14px] shadow-note-root"
                  : "scale-125 bg-note-scale shadow-[0_0_14px] shadow-note-scale"
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

/** The swinging pendulum angle, flipped on every beat (derived during render from the latest tick). */
function usePendulum(running: boolean, current: ScheduledTick | null) {
  const [swing, setSwing] = useState<{ key: number; angle: number }>({ key: -1, angle: 0 });
  const onBeat = current && current.sub === 0 ? current : null;
  if (running && onBeat && onBeat.time !== swing.key) {
    setSwing({ key: onBeat.time, angle: swing.angle >= 0 ? -24 : 24 });
  } else if (!running && swing.angle !== 0) {
    setSwing({ key: -1, angle: 0 });
  }
  return running ? swing.angle : 0;
}

/**
 * Header button: shows or hides the metronome bar at the neck. While the
 * metronome runs it shows the tempo and flashes on every beat, so the beat
 * stays visible even when the bar is hidden.
 */
export function MetronomeHeaderButton({ barVisible, onToggleBar }: { barVisible: boolean; onToggleBar: () => void }) {
  const { settings, running, current } = useSharedMetronome();
  const t = useI18n().ui.metronome;
  const angle = usePendulum(running, current);
  const label = barVisible ? t.hideBar : t.showBar;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size={running ? "sm" : "icon"}
          aria-label={running ? `${label} — ${t.running(settings.bpm)}` : label}
          aria-pressed={barVisible}
          onClick={onToggleBar}
          className={cn(running && "gap-1.5 px-2 text-primary", barVisible && !running && "bg-accent")}
        >
          <MetronomeIcon angle={angle} beatSeconds={60 / settings.bpm} className="size-[18px]" />
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
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/** The less-used metronome settings, behind the bar's Settings button. */
function MetronomeSettingsPanel() {
  const { settings, update } = useSharedMetronome();
  const t = useI18n().ui.metronome;
  return (
    <div className="space-y-3">
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
      </div>
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
      <ToolbarSwitch id="metronome-accent" label={t.accent} checked={settings.accent} onCheckedChange={(accent) => update({ accent })} />
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
      <p className="text-xs text-muted-foreground">{t.note}</p>
    </div>
  );
}

/**
 * The bar docked right above the neck, so the beat is in view while playing:
 * the metronome (start/stop, tempo, tap tempo, big beat lights) and the drone
 * (on/off in the current key, pad or harmonium, + fifth). Everything else is
 * behind the Settings button.
 */
export function MetronomeBar({
  rootPitchClass,
  rootName,
  onClose,
  className,
}: {
  /** The key's root, which the drone plays. */
  rootPitchClass: number;
  /** The root's name in the chosen note names (on the drone button). */
  rootName: string;
  onClose: () => void;
  className?: string;
}) {
  const { settings, update, running, toggle, tap, current } = useSharedMetronome();
  const drone = useDrone(rootPitchClass);
  const { ui } = useI18n();
  const t = ui.metronome;
  return (
    <div
      role="group"
      aria-label={t.barTitle}
      className={cn(
        "flex flex-wrap items-center gap-x-1.5 gap-y-1.5 rounded-xl border border-border/70 bg-card/95 px-2 py-1.5 backdrop-blur-sm sm:gap-x-3",
        className,
      )}
    >
      {/* Metronome */}
      <div role="group" aria-label={t.title} className="flex flex-auto items-center gap-x-1.5 sm:gap-x-3">
        <Button
          onClick={toggle}
          size="sm"
          variant={running ? "default" : "outline"}
          aria-label={running ? t.stop : t.start}
          className="rounded-full"
        >
          {running ? <Square className="fill-current" /> : <Play className="fill-current" />}
          <span className="hidden sm:inline">{running ? t.stopShort : t.startShort}</span>
        </Button>
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon-sm" aria-label={t.slower} onClick={() => update({ bpm: settings.bpm - (settings.bpm > 100 ? 5 : 2) })}>
            <Minus />
          </Button>
          <p className="min-w-[3.5rem] text-center leading-tight sm:min-w-[4.5rem]" aria-live="off">
            <span className="text-lg font-semibold tabular-nums">{settings.bpm}</span>
            <span className="ml-1 text-xs text-muted-foreground">BPM</span>
            <span className="hidden text-[11px] text-muted-foreground italic md:block">{tempoMarking(settings.bpm)}</span>
          </p>
          <Button variant="ghost" size="icon-sm" aria-label={t.faster} onClick={() => update({ bpm: settings.bpm + (settings.bpm >= 100 ? 5 : 2) })}>
            <Plus />
          </Button>
        </div>
        {/* On phones Tap tempo sits in Settings, so the metronome fits on one row */}
        <Button variant="outline" size="xs" onClick={tap} title={t.tapTitle} className="hidden sm:inline-flex">
          {t.tap}
        </Button>
        <div className="flex flex-1 justify-center sm:px-1">
          <BeatLights beatsPerBar={settings.beatsPerBar} current={running ? current : null} accent={settings.accent} />
        </div>
      </div>

      {/* Settings + close: on phones at the end of the metronome row, on larger screens at the very end */}
      <div className="flex items-center gap-1 sm:order-last">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" aria-label={t.more} title={t.more} className="max-sm:w-7 max-sm:px-0">
              <SlidersHorizontal />
              <span className="hidden sm:inline">{t.settings}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" collisionPadding={8}
            className="max-h-[calc(var(--radix-popover-content-available-height)-0.5rem)] w-[min(20rem,calc(100vw-1.5rem))] overflow-y-auto">
            <p className="mb-3 text-sm font-semibold">{t.title}</p>
            <Button variant="outline" size="sm" onClick={tap} title={t.tapTitle} className="mb-4 w-full sm:hidden">
              {t.tap}
            </Button>
            <MetronomeSettingsPanel />
            <div className="mt-4 border-t border-border/60 pt-3">
              <p className="mb-3 text-sm font-semibold">{ui.drone.title}</p>
              <DroneSettingsPanel drone={drone} />
            </div>
          </PopoverContent>
        </Popover>
        <Button variant="ghost" size="icon-sm" aria-label={t.hideBar} title={t.hideBar} onClick={onClose}>
          <X />
        </Button>
      </div>

      {/* Drone (its own row on phones) */}
      <DroneControls drone={drone} rootName={rootName} className="max-sm:basis-full sm:border-l sm:border-border/60 sm:pl-3" />
    </div>
  );
}
