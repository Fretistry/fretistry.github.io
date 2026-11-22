"use client";

import type { ReactNode } from "react";
import { ChevronDown, Eye } from "lucide-react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { FRET_RANGES, fretRangeLabel, type FretRange } from "@/components/fretboard/geometry";
import type { ExplorerSettings } from "@/hooks/use-explorer-state";
import { InfoTip } from "./info-tip";
import { SegmentedControl } from "./segmented-control";

interface DisplayToolbarProps {
  settings: ExplorerSettings;
  /** The fret range actually shown (the setting may be "auto"). */
  fretRange: FretRange;
  onChange: (patch: Partial<ExplorerSettings>) => void;
}

export function ToolbarGroup({ label, info, children }: { label: string; info?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* the ⓘ sits right after its label, so it never ends up alone on a line */}
      <span className="flex min-w-12 items-center gap-0.5 sm:min-w-0">
        <span className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">{label}</span>
        {info}
      </span>
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


/**
 * What the neck shows: labels, which notes, and which frets. One row on
 * larger screens; on phones a single "Display" button (with the current
 * choices as its caption) so the neck starts higher up the page.
 */
export function DisplayToolbar({ settings, fretRange, onChange }: DisplayToolbarProps) {
  const t = useI18n().ui.toolbar;
  const labelNames = { note: t.notes, interval: t.intervals, degree: t.degrees, none: t.none };
  const showNames = { all: t.allNotes, scale: t.scaleOnly, roots: t.rootsOnly };
  return (
    <>
      <div className="hidden sm:block">
        <DisplayControls settings={settings} fretRange={fretRange} onChange={onChange} />
      </div>
      <div className="sm:hidden">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="max-w-full bg-card dark:bg-card">
              <Eye />
              <span className="font-medium">{t.display}</span>
              <span className="truncate text-muted-foreground">
                {labelNames[settings.labelMode]} · {showNames[settings.visibility]} · {fretRangeLabel(fretRange)}
              </span>
              <ChevronDown className="text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-[min(22rem,calc(100vw-1.5rem))]">
            <DisplayControls settings={settings} fretRange={fretRange} onChange={onChange} stacked />
          </PopoverContent>
        </Popover>
      </div>
    </>
  );
}

function DisplayControls({ settings, fretRange, onChange, stacked = false }: DisplayToolbarProps & { stacked?: boolean }) {
  const { ui } = useI18n();
  const t = ui.toolbar;
  const fretTitles: Record<FretRange, string> = {
    low: t.lowTitle,
    to15: t.to15Title,
    to22: t.to22Title,
    all: t.wholeNeckTitle,
    high: t.highTitle,
  };
  return (
    <div className={stacked ? "space-y-3" : "flex flex-wrap items-center gap-x-5 gap-y-2.5"}>
      <ToolbarGroup label={t.labels} info={<InfoTip label={ui.info.labelsTitle} paragraphs={[ui.info.labels]} />}>
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
          value={fretRange}
          onChange={(range) => onChange({ fretRange: range })}
          // shortest neck first: 0–12, 0–15, 0–22, 0–24, then the upper octave 12–24
          options={FRET_RANGES.map((range) => ({ value: range, label: fretRangeLabel(range), title: fretTitles[range] }))}
        />
      </ToolbarGroup>
    </div>
  );
}
