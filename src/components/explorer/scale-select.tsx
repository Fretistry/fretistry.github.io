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
import { shortMood } from "@/lib/short-mood";

interface ScaleSelectProps {
  value: string;
  onChange: (scaleId: string) => void;
}

/** Scale picker grouped by category, with a short mood line per scale. New scales appear here automatically. */
export function ScaleSelect({ value, onChange }: ScaleSelectProps) {
  const { ui, theory, categoryLabel } = useI18n();
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={ui.controls.scale} className="h-9! w-full bg-card font-medium dark:bg-card">
        {/* long names end in "…" instead of being cut off */}
        <span className="min-w-0 truncate">
          <SelectValue placeholder={ui.controls.chooseScale} />
        </span>
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
