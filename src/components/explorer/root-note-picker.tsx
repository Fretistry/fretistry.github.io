"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ROOT_NAMES, rootNote, type RootName } from "@/lib/data/roots";
import { cn } from "@/lib/utils";

interface RootNotePickerProps {
  value: RootName;
  onChange: (root: RootName) => void;
}

/**
 * The 12 root notes as a row of pills. On phones a single amber button shows the
 * current root and opens the same 12 notes (two rows of six), so the key, scale
 * and tuning fit on one row and the neck starts higher up the page.
 */
export function RootNotePicker({ value, onChange }: RootNotePickerProps) {
  const { ui, note } = useI18n();
  const [open, setOpen] = useState(false);
  const current = note(rootNote(value));
  return (
    <>
      <div className="hidden sm:block">
        <RootGrid value={value} onChange={onChange} className="grid-cols-12" />
      </div>
      <div className="sm:hidden">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={`${ui.controls.rootNote}: ${current}`}
              className="flex h-9 min-w-14 items-center justify-center gap-1 rounded-lg bg-note-root px-2.5 text-base font-semibold text-note-root-foreground shadow-[0_0_18px_-4px] shadow-note-root/70 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span className="leading-none">{current}</span>
              <ChevronDown className="size-4 opacity-70" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" collisionPadding={12} className="w-[min(21rem,calc(100vw-1.5rem))] p-2.5">
            <p className="mb-2 px-0.5 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">{ui.controls.rootNote}</p>
            <RootGrid
              value={value}
              onChange={(root) => {
                onChange(root);
                setOpen(false);
              }}
              className="grid-cols-6"
            />
          </PopoverContent>
        </Popover>
      </div>
    </>
  );
}

function RootGrid({ value, onChange, className }: RootNotePickerProps & { className: string }) {
  const { ui, note } = useI18n();
  return (
    <div role="radiogroup" aria-label={ui.controls.rootNote} className={cn("grid gap-1", className)}>
      {ROOT_NAMES.map((name) => {
        const active = name === value;
        const isAccidental = name.length > 1;
        const label = note(rootNote(name));
        return (
          <button
            key={name}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(name)}
            className={cn(
              // flex-centred with leading-none, so C♯ and E♭ sit level with the natural notes
              "relative flex h-9 min-w-0 items-center justify-center rounded-lg px-0.5 text-sm font-semibold tabular-nums transition-all outline-none pointer-coarse:h-10",
              "focus-visible:ring-3 focus-visible:ring-ring/50",
              active
                ? "bg-note-root text-note-root-foreground shadow-[0_0_18px_-4px] shadow-note-root/70"
                : cn(
                    "text-foreground ring-1 ring-border/70 hover:bg-accent dark:text-foreground/85 dark:hover:text-foreground",
                    // Sharps/flats are a shade darker, like the black keys of a piano (but never look disabled).
                    isAccidental ? "bg-[oklch(0.9_0.006_265)] dark:bg-muted/80" : "bg-card",
                  ),
            )}
          >
            {/* Solfège names such as "Do♯" or "Sol" are wider than letter names. */}
            <span className={cn("block truncate leading-none", label.length >= 3 && "text-[0.8125rem] tracking-tight")}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
