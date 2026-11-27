"use client";

import { useEffect, useState } from "react";
import { shortcutAllowed } from "@/lib/shortcuts";
import { Minus, Play, Plus, SlidersHorizontal, Square, Volume1, Volume2, X } from "lucide-react";
import { ToolbarSwitch } from "@/components/explorer/display-toolbar";
import { SegmentedControl } from "@/components/explorer/segmented-control";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { BPM_MAX, BPM_MIN, tempoMarking, type MetronomeSettings, type ScheduledTick, type Subdivision } from "@/lib/audio/metronome";
import { useDrone } from "@/hooks/use-drone";
import { cn } from "@/lib/utils";
import { DroneControls, DroneSettingsPanel, DroneSoundOptions } from "./drone-controls";
import { useMetronomeTick, useSharedMetronome } from "./metronome-provider";

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

/**
 * Large beat lights: easy to catch from the corner of your eye while looking at the neck.
 * They follow the clicks themselves, so the rest of the bar doesn't redraw on every click.
 */
function BeatLights({ beatsPerBar, running, accent }: { beatsPerBar: number; running: boolean; accent: boolean }) {
  const tick = useMetronomeTick();
  const current = running ? tick : null;
  return (
    <div className="flex items-center gap-1 sm:gap-2" aria-hidden="true">
      {Array.from({ length: beatsPerBar }, (_, beat) => {
        const active = current?.beat === beat;
        const isAccent = beat === 0 && accent;
        return (
          <span
            key={beat}
            className={cn(
              "size-2.5 rounded-full transition-all duration-75 sm:size-4",
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

/** Phones: small beat lights under the tempo, in place of "BPM", while the metronome runs. */
function MiniBeatLights({ beatsPerBar, accent }: { beatsPerBar: number; accent: boolean }) {
  const tick = useMetronomeTick();
  return (
    <span className="flex items-center justify-center gap-0.5 pt-1 sm:hidden" aria-hidden="true">
      {Array.from({ length: beatsPerBar }, (_, beat) => (
        <span
          key={beat}
          className={cn(
            "size-1.5 rounded-full transition-colors duration-75",
            tick?.beat === beat ? (beat === 0 && accent ? "bg-note-root" : "bg-note-scale") : "bg-muted-foreground/30",
          )}
        />
      ))}
    </span>
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
  const { settings, running } = useSharedMetronome();
  const current = useMetronomeTick();
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

/** Type a tempo: applied on Enter or when leaving the field (so typing "1", "12", "120" isn't cut short). */
function TempoInput({ bpm, label, onCommit }: { bpm: number; label: string; onCommit: (bpm: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    const value = Number(draft);
    if (draft !== null && Number.isFinite(value) && value > 0) onCommit(value);
    setDraft(null);
  };
  return (
    <input
      type="number"
      inputMode="numeric"
      min={BPM_MIN}
      max={BPM_MAX}
      aria-label={label}
      title={label}
      value={draft ?? String(bpm)}
      // the number is selected when you tap into the field, so typing replaces it
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
      className="h-8 w-16 rounded-md border border-input bg-background px-1.5 text-center text-sm tabular-nums outline-none focus-visible:ring-3 focus-visible:ring-ring/50 pointer-coarse:h-9"
    />
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
        <TempoInput bpm={settings.bpm} label={t.tempoInput} onCommit={(bpm) => update({ bpm })} />
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
      <div title={t.backbeatTitle}>
        <ToolbarSwitch id="metronome-backbeat" label={t.backbeat} checked={settings.backbeat} onCheckedChange={(backbeat) => update({ backbeat })} />
      </div>
      <div>
        <p className="mb-1.5 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">{t.gap}</p>
        <SegmentedControl
          ariaLabel={t.gap}
          value={String(settings.gap)}
          onChange={(v) => update({ gap: Number(v) as MetronomeSettings["gap"] })}
          className="w-full"
          options={[
            { value: "0", label: t.gapOff },
            ...[1, 2, 4].map((n) => ({ value: String(n), label: `${n} + ${n}`, title: t.gapTitle(n) })),
          ]}
        />
        <p className="mt-1.5 text-xs text-muted-foreground">{t.gapHint}</p>
      </div>
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
  droneListen,
  onClose,
  className,
}: {
  /** The key's root, which the drone plays. */
  rootPitchClass: number;
  /** The root's name in the chosen note names (on the drone button). */
  rootName: string;
  /** The drone ⓘ's "listen" paragraph with the scale's own notes. */
  droneListen?: string | null;
  onClose: () => void;
  className?: string;
}) {
  const { settings, update, running, toggle, tap } = useSharedMetronome();
  const drone = useDrone(rootPitchClass);
  const { ui } = useI18n();

  // Keyboard shortcut D: start or stop the drone (the list is under "?")
  const { toggle: toggleDrone } = drone;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "d" || e.key === "D") && shortcutAllowed(e)) {
        e.preventDefault();
        toggleDrone();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleDrone]);
  const t = ui.metronome;
  return (
    <div
      role="group"
      aria-label={t.barTitle}
      className={cn(
        "flex flex-wrap items-center gap-x-0.5 gap-y-1.5 rounded-xl border border-border/70 bg-card/95 px-1.5 py-1.5 backdrop-blur-sm sm:gap-x-3 sm:px-2",
        className,
      )}
    >
      {/* Metronome — the button names what it starts */}
      <div role="group" aria-label={t.title} className="flex flex-auto items-center gap-x-1 sm:gap-x-3">
        <Button
          onClick={toggle}
          size="sm"
          variant={running ? "default" : "outline"}
          aria-label={running ? t.stop : t.start}
          title={running ? t.stop : t.start}
          className="rounded-full max-sm:px-2 max-sm:text-xs"
        >
          {running ? <Square className="fill-current" /> : <Play className="fill-current" />}
          {t.title}
        </Button>
        <div className="flex items-center gap-0.5">
          {/* phones: narrow but tall (28×36), so the whole bar fits on one row */}
          <Button variant="ghost" size="icon-sm" className="max-sm:w-7!" aria-label={t.slower} onClick={() => update({ bpm: settings.bpm - (settings.bpm > 100 ? 5 : 2) })}>
            <Minus />
          </Button>
          {/* phones: "BPM" small under the number, so the row stays narrow */}
          <p
            className="flex min-w-8 flex-col items-center leading-none sm:block sm:min-w-[4.5rem] sm:text-center sm:leading-tight"
            aria-live="off"
          >
            <span className="text-lg font-semibold tabular-nums">{settings.bpm}</span>
            {/* phones: while running, small beat lights take the place of "BPM" (the bar is one row there) */}
            <span className={cn("text-[9px] text-muted-foreground sm:ml-1 sm:text-xs", running && "max-sm:hidden")}>BPM</span>
            {running && <MiniBeatLights beatsPerBar={settings.beatsPerBar} accent={settings.accent} />}
            <span className="hidden text-[11px] text-muted-foreground italic md:block">{tempoMarking(settings.bpm)}</span>
          </p>
          <Button variant="ghost" size="icon-sm" className="max-sm:w-7!" aria-label={t.faster} onClick={() => update({ bpm: settings.bpm + (settings.bpm >= 100 ? 5 : 2) })}>
            <Plus />
          </Button>
        </div>
        {/* Below laptop width Tap tempo sits in Settings, so the bar stays on one row */}
        <Button variant="outline" size="xs" onClick={tap} title={t.tapTitle} className="hidden xl:inline-flex">
          {t.tap}
        </Button>
        <div className="flex flex-1 justify-center max-sm:hidden sm:px-1">
          <BeatLights beatsPerBar={settings.beatsPerBar} running={running} accent={settings.accent} />
        </div>
      </div>

      {/* Settings (+ close) at the very end */}
      <div className="order-last flex items-center gap-1">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" aria-label={t.more} title={t.more} className="max-sm:w-7! max-sm:px-0">
              <SlidersHorizontal />
              <span className="hidden sm:inline">{t.settings}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" collisionPadding={8}
            className="max-h-[calc(var(--radix-popover-content-available-height)-0.5rem)] w-[min(20rem,calc(100vw-1.5rem))] overflow-y-auto">
            <p className="mb-3 text-sm font-semibold">{t.title}</p>
            <Button variant="outline" size="sm" onClick={tap} title={t.tapTitle} className="mb-4 w-full xl:hidden">
              {t.tap}
            </Button>
            <MetronomeSettingsPanel />
            <div className="mt-4 border-t border-border/60 pt-3">
              <p className="mb-3 text-sm font-semibold">{ui.drone.title}</p>
              {/* phones: the drone's sound and fifth live here (the bar itself is one row) */}
              <DroneSoundOptions drone={drone} rootName={rootName} listen={droneListen} className="mb-3 sm:hidden" />
              <DroneSettingsPanel drone={drone} />
            </div>
            {/* phones: the × lives here, so the metronome row stays one line */}
            <Button variant="outline" size="sm" onClick={onClose} className="mt-4 w-full sm:hidden">
              <X /> {t.hideBar}
            </Button>
          </PopoverContent>
        </Popover>
        <Button variant="ghost" size="icon-sm" aria-label={t.hideBar} title={t.hideBar} onClick={onClose} className="max-sm:hidden">
          <X />
        </Button>
      </div>

      {/* Drone (on phones just its start button, in the same row) */}
      <DroneControls drone={drone} rootName={rootName} listen={droneListen} className="sm:border-l sm:border-border/60 sm:pl-3" />
    </div>
  );
}
