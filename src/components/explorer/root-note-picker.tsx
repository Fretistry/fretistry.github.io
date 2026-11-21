"use client";

import { useI18n } from "@/components/i18n/i18n-provider";
import { ROOT_NAMES, rootNote, type RootName } from "@/lib/data/roots";
import { cn } from "@/lib/utils";

interface RootNotePickerProps {
  value: RootName;
  onChange: (root: RootName) => void;
}

/** The 12 root notes as a row of pills (two rows of six on phones). */
export function RootNotePicker({ value, onChange }: RootNotePickerProps) {
  const { ui, note } = useI18n();
  return (
    <div role="radiogroup" aria-label={ui.controls.rootNote} className="grid grid-cols-6 gap-1 sm:grid-cols-12">
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
              "relative h-9 min-w-0 rounded-lg px-0.5 text-sm font-semibold tabular-nums transition-all outline-none",
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
            <span className={cn("block truncate", label.length >= 3 && "text-[0.8125rem] tracking-tight")}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
