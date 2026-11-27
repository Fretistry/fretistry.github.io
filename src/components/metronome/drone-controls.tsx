"use client";

import { Play, Square, Volume1, Volume2 } from "lucide-react";
import { InfoTip } from "@/components/explorer/info-tip";
import { SELECTED, SegmentedControl } from "@/components/explorer/segmented-control";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import type { useDrone } from "@/hooks/use-drone";
import type { DroneSound } from "@/lib/audio/drone";
import { cn } from "@/lib/utils";

type DroneApi = ReturnType<typeof useDrone>;

/**
 * Drone on/off (in the current key), its sound and the optional fifth — right
 * in the bar above the neck, next to the metronome.
 */
interface DroneProps {
  drone: DroneApi;
  rootName: string;
  /** The ⓘ's "listen" paragraph with this scale's own notes (falls back to the general one). */
  listen?: string | null;
  className?: string;
}

export function DroneControls({ drone, rootName, listen, className }: DroneProps) {
  const t = useI18n().ui.drone;
  const { running, toggle } = drone;
  return (
    <div role="group" aria-label={t.title} className={cn("flex flex-wrap items-center gap-1 sm:gap-1.5", className)}>
      {/* ▶ / ■ like the metronome's button, so it's clear this starts something */}
      <Button
        variant={running ? "default" : "outline"}
        size="sm"
        className="rounded-full max-sm:px-2 max-sm:text-xs"
        aria-pressed={running}
        title={running ? t.stop : t.start}
        onClick={toggle}
      >
        {running ? <Square className="fill-current" /> : <Play className="fill-current" />}
        {t.title}
        {/* the note it plays (phones: in the ⓘ, so metronome and drone fit on one row) */}
        <span className="hidden font-normal opacity-80 sm:inline">· {rootName}</span>
      </Button>
      {/* phones: sound, fifth and ⓘ are in the bar's Settings, so the whole bar is one row */}
      <DroneSoundOptions drone={drone} rootName={rootName} listen={listen} className="max-sm:hidden" />
    </div>
  );
}

/** Pad or harmonium, the optional fifth, and what a drone is (ⓘ). */
export function DroneSoundOptions({ drone, rootName, listen, className }: DroneProps) {
  const t = useI18n().ui.drone;
  const { settings, update } = drone;
  const info = t.info(rootName);
  return (
    <div className={cn("flex flex-wrap items-center gap-1 sm:gap-1.5", className)}>
      <SegmentedControl<DroneSound>
        ariaLabel={t.sound}
        value={settings.sound}
        onChange={(sound) => update({ sound })}
        options={[
          { value: "pad", label: t.pad, title: t.padTitle },
          { value: "harmonium", label: t.harmonium, title: t.harmoniumTitle },
        ]}
      />
      <button
        type="button"
        aria-pressed={settings.fifth}
        aria-label={t.fifth}
        title={t.fifthTitle}
        onClick={() => update({ fifth: !settings.fifth })}
        className={cn(
          "h-7 rounded-lg px-2 text-[0.8rem] font-medium whitespace-nowrap ring-1 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 pointer-coarse:h-9",
          settings.fifth ? SELECTED : "bg-card text-muted-foreground ring-border hover:text-foreground",
        )}
      >
        {t.fifth}
      </button>
      <InfoTip label={t.infoTitle} paragraphs={listen ? [info[0], listen, ...info.slice(2)] : info} />
    </div>
  );
}

/** Drone volume and a short explanation, in the bar's settings panel. */
export function DroneSettingsPanel({ drone }: { drone: DroneApi }) {
  const t = useI18n().ui.drone;
  const { settings, update } = drone;
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">{t.volume}</p>
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
