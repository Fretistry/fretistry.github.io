"use client";

import { useI18n } from "@/components/i18n/i18n-provider";
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
import { SCALES, SCALE_CATEGORIES } from "@/lib/data/scales";

interface ScaleSelectProps {
  value: string;
  onChange: (scaleId: string) => void;
}

/**
 * The first part of a scale's character text ("Bright, stable and happy — the
 * reference point…" → "Bright, stable and happy"), as a hint in the list.
 */
export function shortMood(character: string): string {
  const first = character.split(/\s[—–]\s|:\s|;\s|\.\s/)[0].replace(/[.,;:]$/, "").trim();
  return first.length > 60 ? `${first.slice(0, 57).trimEnd()}…` : first;
}

/** Scale picker grouped by category, with a short mood line per scale. New scales appear here automatically. */
export function ScaleSelect({ value, onChange }: ScaleSelectProps) {
  const { ui, theory, categoryLabel } = useI18n();
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={ui.controls.scale} className="h-9! w-full bg-card font-medium dark:bg-card">
        <SelectValue placeholder={ui.controls.chooseScale} />
      </SelectTrigger>
      <SelectContent position="popper" className="max-h-[min(70vh,520px)]">
        {SCALE_CATEGORIES.map((cat, i) => (
          <SelectGroup key={cat.id}>
            {i > 0 && <SelectSeparator />}
            <SelectLabel className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
              {categoryLabel(cat.id)}
            </SelectLabel>
            {SCALES.filter((s) => s.category === cat.id).map((s) => (
              <SelectItem key={s.id} value={s.id} description={shortMood(theory.character(s))} className="py-1.5">
                {theory.scaleFullName(s)}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
