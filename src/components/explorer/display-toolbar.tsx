"use client";

import type { ReactNode } from "react";
import { ChevronDown, Eye } from "lucide-react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import type { ExplorerSettings } from "@/hooks/use-explorer-state";
import { SegmentedControl } from "./segmented-control";

interface DisplayToolbarProps {
  settings: ExplorerSettings;
  onChange: (patch: Partial<ExplorerSettings>) => void;
}

export function ToolbarGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="min-w-12 text-[11px] font-medium tracking-wider text-muted-foreground uppercase sm:min-w-0">{label}</span>
      {children}
    </div>
  );
}

export function ToolbarSwitch({
  id,
  label,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
      <Label htmlFor={id} className="cursor-pointer text-sm font-normal text-foreground/85">
        {label}
      </Label>
    </div>
  );
}

const FRET_RANGE_LABELS = { all: "0–24", low: "0–12", high: "12–24" } as const;

/**
 * What the neck shows: labels, which notes, and which frets. One row on
 * larger screens; on phones a single "Display" button (with the current
 * choices as its caption) so the neck starts higher up the page.
 */
export function DisplayToolbar({ settings, onChange }: DisplayToolbarProps) {
  const t = useI18n().ui.toolbar;
  const labelNames = { note: t.notes, interval: t.intervals, degree: t.degrees, none: t.none };
  const showNames = { all: t.allNotes, scale: t.scaleOnly, roots: t.rootsOnly };
  return (
    <>
      <div className="hidden sm:block">
        <DisplayControls settings={settings} onChange={onChange} />
      </div>
      <div className="sm:hidden">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="max-w-full bg-card dark:bg-card">
              <Eye />
              <span className="font-medium">{t.display}</span>
              <span className="truncate text-muted-foreground">
                {labelNames[settings.labelMode]} · {showNames[settings.visibility]} · {FRET_RANGE_LABELS[settings.fretRange]}
              </span>
              <ChevronDown className="text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-[min(22rem,calc(100vw-1.5rem))]">
            <DisplayControls settings={settings} onChange={onChange} stacked />
          </PopoverContent>
        </Popover>
      </div>
    </>
  );
}

function DisplayControls({ settings, onChange, stacked = false }: DisplayToolbarProps & { stacked?: boolean }) {
  const t = useI18n().ui.toolbar;
  return (
    <div className={stacked ? "space-y-3" : "flex flex-wrap items-center gap-x-5 gap-y-2.5"}>
      <ToolbarGroup label={t.labels}>
        <SegmentedControl
          ariaLabel={t.noteLabels}
          value={settings.labelMode}
          onChange={(labelMode) => onChange({ labelMode })}
          options={[
            { value: "note", label: t.notes, title: t.notesTitle },
            { value: "interval", label: t.intervals, title: t.intervalsTitle },
            { value: "degree", label: t.degrees, title: t.degreesTitle },
            { value: "none", label: t.none, title: t.noneTitle },
          ]}
        />
      </ToolbarGroup>
      <ToolbarGroup label={t.show}>
        <SegmentedControl
          ariaLabel={t.whichNotes}
          value={settings.visibility}
          onChange={(visibility) => onChange({ visibility })}
          options={[
            { value: "all", label: t.allNotes, title: t.allNotesTitle },
            { value: "scale", label: t.scaleOnly, title: t.scaleOnlyTitle },
            { value: "roots", label: t.rootsOnly, title: t.rootsOnlyTitle },
          ]}
        />
      </ToolbarGroup>
      <ToolbarGroup label={t.frets}>
        <SegmentedControl
          ariaLabel={t.fretRange}
          value={settings.fretRange}
          onChange={(fretRange) => onChange({ fretRange })}
          options={[
            { value: "all", label: FRET_RANGE_LABELS.all, title: t.wholeNeckTitle },
            { value: "low", label: FRET_RANGE_LABELS.low, title: t.lowTitle },
            { value: "high", label: FRET_RANGE_LABELS.high, title: t.highTitle },
          ]}
        />
      </ToolbarGroup>
    </div>
  );
}
