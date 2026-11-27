"use client";

import { Fragment, useState } from "react";
import { ChevronDown, ChevronUp, SlidersHorizontal } from "lucide-react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROOT_NAMES, rootNote, type RootName } from "@/lib/data/roots";
import {
  CUSTOM_STRING_COUNTS,
  CUSTOM_TUNING_ID,
  TUNING_GROUPS,
  clampMidi,
  getTuningPreset,
  pitchWithFriendlyName,
  withStringCount,
} from "@/lib/data/tunings";
import { midiOf, pitchClassOf, type Pitch, type Tuning } from "@/lib/theory";
import { SegmentedControl } from "./segmented-control";

interface TuningSelectProps {
  tuningId: string;
  activeTuning: Tuning;
  onPresetChange: (id: string) => void;
  onCustomChange: (strings: Pitch[]) => void;
}

/** The tuning presets in their menu groups (Standard & drop · Open & alternate · 7-string). */
function useGroupedPresets() {
  return TUNING_GROUPS.map((group) => ({
    id: group.id,
    tunings: group.tuningIds.map((id) => getTuningPreset(id)!),
  }));
}

/** Menu entry that opens the editor for the current custom tuning (it never becomes the selected value). */
const EDIT_CUSTOM = "__edit-custom__";

export function TuningSelect({ tuningId, activeTuning, onPresetChange, onCustomChange }: TuningSelectProps) {
  const { ui, note, tuningName } = useI18n();
  const groups = useGroupedPresets();
  const [editing, setEditing] = useState(false);
  const stringNames = (t: Tuning) => t.strings.map((p) => note(p.note)).join(" ");
  return (
    <div className="flex w-full gap-1.5">
      <Select
        value={tuningId}
        onValueChange={(id) => {
          // "Custom…" opens the editor straight away (on phones that's the only way in).
          if (id === EDIT_CUSTOM) return setEditing(true);
          if (id === CUSTOM_TUNING_ID) {
            onCustomChange([...activeTuning.strings]);
            return setEditing(true);
          }
          onPresetChange(id);
        }}
      >
        <SelectTrigger aria-label={ui.controls.tuning} className="h-9! min-w-0 flex-1 bg-card dark:bg-card">
          <SelectValue>
            <span className="truncate font-medium">{tuningName(activeTuning)}</span>
            {/* phones: just the name, so key, scale and tuning fit on one row */}
            <span className="ml-1.5 truncate font-mono text-xs text-muted-foreground max-sm:hidden">{stringNames(activeTuning)}</span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent position="popper">
          {groups.map((group, i) => (
            <Fragment key={group.id}>
              {i > 0 && <SelectSeparator />}
              <SelectGroup>
                <SelectLabel>{ui.tuningGroups[group.id]}</SelectLabel>
                {group.tunings.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    <span className="w-36 font-medium">{tuningName(t)}</span>
                    <span className="font-mono text-xs text-muted-foreground">{stringNames(t)}</span>
                  </SelectItem>
                ))}
              </SelectGroup>
            </Fragment>
          ))}
          <SelectSeparator />
          <SelectItem value={CUSTOM_TUNING_ID}>
            <span className="font-medium">{ui.controls.customOption}</span>
          </SelectItem>
          {tuningId === CUSTOM_TUNING_ID && (
            <SelectItem value={EDIT_CUSTOM}>
              <span className="font-medium">{ui.controls.customizeTuning}…</span>
            </SelectItem>
          )}
        </SelectContent>
      </Select>
      <CustomTuningDialog activeTuning={activeTuning} onChange={onCustomChange} open={editing} onOpenChange={setEditing} />
    </div>
  );
}

function CustomTuningDialog({
  activeTuning,
  onChange,
  open,
  onOpenChange: setOpen,
}: {
  activeTuning: Tuning;
  onChange: (s: Pitch[]) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { ui, note, pitch: formatPitch, tuningName } = useI18n();
  const t = ui.tuningDialog;
  const groups = useGroupedPresets();
  const strings = activeTuning.strings;
  const count = strings.length;

  const setString = (index: number, pitch: Pitch) => {
    const next = [...strings];
    next[index] = pitch;
    onChange(next);
  };
  const shiftString = (index: number, delta: number) =>
    setString(index, pitchWithFriendlyName(clampMidi(midiOf(strings[index]) + delta)));
  const shiftAll = (delta: number) => onChange(strings.map((p) => pitchWithFriendlyName(clampMidi(midiOf(p) + delta))));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon-lg"
          aria-label={ui.controls.customizeTuning}
          title={ui.controls.customizeTuning}
          // phones: reached through "Custom…" in the tuning menu instead
          className="bg-card max-sm:hidden dark:bg-card"
        >
          <SlidersHorizontal />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value=""
              onValueChange={(id) => {
                const preset = getTuningPreset(id);
                if (preset) onChange([...preset.strings]);
              }}
            >
              <SelectTrigger size="sm" aria-label={t.startFrom} className="min-w-0 flex-1">
                <SelectValue placeholder={t.startFrom} />
              </SelectTrigger>
              <SelectContent position="popper">
                {groups.map((group, i) => (
                  <Fragment key={group.id}>
                    {i > 0 && <SelectSeparator />}
                    <SelectGroup>
                      <SelectLabel>{ui.tuningGroups[group.id]}</SelectLabel>
                      {group.tunings.map((preset) => (
                        <SelectItem key={preset.id} value={preset.id}>
                          {tuningName(preset)}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </Fragment>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">{t.strings}</span>
              <SegmentedControl
                ariaLabel={t.strings}
                value={String(count)}
                onChange={(value) => onChange(withStringCount(strings, Number(value)))}
                options={CUSTOM_STRING_COUNTS.map((n) => ({ value: String(n), label: n }))}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/60 px-3 py-2">
            <span className="text-xs font-medium text-muted-foreground">{t.wholeGuitar}</span>
            <div className="flex gap-1.5">
              <Button variant="outline" size="xs" onClick={() => shiftAll(-1)}>
                <ChevronDown /> {t.halfDown}
              </Button>
              <Button variant="outline" size="xs" onClick={() => shiftAll(1)}>
                <ChevronUp /> {t.halfUp}
              </Button>
            </div>
          </div>

          <ul className="divide-y divide-border/60 rounded-lg border">
            {strings
              .map((pitch, index) => ({ pitch, index }))
              .reverse()
              .map(({ pitch, index }) => {
                const stringNumber = count - index;
                const name = ROOT_NAMES.find((r) => pitchClassOf(rootNote(r)) === pitchClassOf(pitch.note))!;
                return (
                  <li key={index} className="flex items-center gap-1.5 px-2.5 py-2 sm:gap-2 sm:px-3">
                    <span className="w-14 shrink-0 text-xs text-muted-foreground sm:w-16">
                      {t.string} <span className="font-semibold text-foreground">{stringNumber}</span>
                    </span>
                    <Button variant="ghost" size="icon-sm" aria-label={t.lower(stringNumber)} onClick={() => shiftString(index, -1)}>
                      <ChevronDown />
                    </Button>
                    <Select
                      value={name}
                      onValueChange={(v) => setString(index, { note: rootNote(v as RootName), octave: pitch.octave })}
                    >
                      <SelectTrigger size="sm" aria-label={t.noteAria(stringNumber)} className="w-[76px]">
                        <SelectValue>{note(rootNote(name))}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {ROOT_NAMES.map((r) => (
                          <SelectItem key={r} value={r}>
                            {note(rootNote(r))}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={String(pitch.octave)}
                      onValueChange={(v) => {
                        const candidate = { note: pitch.note, octave: Number(v) };
                        setString(index, pitchWithFriendlyName(clampMidi(midiOf(candidate))));
                      }}
                    >
                      <SelectTrigger size="sm" aria-label={t.octaveAria(stringNumber)} className="w-[60px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[0, 1, 2, 3, 4, 5, 6].map((o) => (
                          <SelectItem key={o} value={String(o)}>
                            {o}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon-sm" aria-label={t.raise(stringNumber)} onClick={() => shiftString(index, 1)}>
                      <ChevronUp />
                    </Button>
                    <span className="ml-auto font-mono text-sm font-semibold tabular-nums">{formatPitch(pitch)}</span>
                  </li>
                );
              })}
          </ul>
        </div>

        <DialogFooter>
          <Button onClick={() => setOpen(false)}>{t.done}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
