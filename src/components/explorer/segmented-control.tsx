"use client";

import type { ReactNode } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

export interface SegmentOption<T extends string> {
  value: T;
  label: ReactNode;
  title?: string;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: readonly SegmentOption<T>[];
  ariaLabel: string;
  className?: string;
  size?: "sm" | "default";
}

/** A compact pill-style single-choice control (like the mode switches in audio software). */
export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  className,
  size = "sm",
}: SegmentedControlProps<T>) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v as T)}
      aria-label={ariaLabel}
      spacing={0}
      size={size}
      className={cn("rounded-lg bg-muted/70 p-0.5 ring-1 ring-border/60", className)}
    >
      {options.map((o) => (
        <ToggleGroupItem
          key={o.value}
          value={o.value}
          title={o.title}
          aria-label={o.title ?? (typeof o.label === "string" ? o.label : o.value)}
          className={cn(
            "rounded-md! px-2.5 text-muted-foreground transition-colors hover:bg-transparent hover:text-foreground pointer-coarse:h-9",
            "data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm dark:data-[state=on]:bg-accent",
          )}
        >
          {o.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
