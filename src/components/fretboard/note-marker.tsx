"use client";

import { memo } from "react";
import type { FretboardNote } from "@/lib/theory";
import { cn } from "@/lib/utils";
import type { MarkerModel } from "./marker-model";

interface NoteMarkerProps {
  note: FretboardNote;
  model: MarkerModel;
  cx: number;
  cy: number;
  radius: number;
  /** Omitted for the still picture used by "Save image". */
  onActivate?: (note: FretboardNote) => void;
}

const FILL: Record<MarkerModel["variant"], string> = {
  root: "fill-note-root",
  scale: "fill-note-scale",
  outside: "fill-[oklch(0.3_0.012_265/0.92)]",
};

const STROKE: Record<MarkerModel["variant"], string> = {
  root: "stroke-[oklch(0.62_0.15_60)]",
  scale: "stroke-[oklch(0.55_0.1_195)]",
  outside: "stroke-[oklch(0.72_0.01_265/0.85)]",
};

const TEXT: Record<MarkerModel["variant"], string> = {
  root: "fill-note-root-foreground",
  scale: "fill-note-scale-foreground",
  outside: "fill-[oklch(0.9_0.01_265)]",
};

const DIMMED_FILL: Record<MarkerModel["variant"], string> = {
  root: "fill-note-root/45",
  scale: "fill-note-scale/35",
  outside: "fill-[oklch(0.75_0.01_265/0.3)]",
};

/** A small legend dot in a marker's colours (used in saved images). "home" = the scale-root ring shown during chords. */
export function MarkerSwatch({
  cx,
  cy,
  r,
  variant,
  dimmed = false,
}: {
  cx: number;
  cy: number;
  r: number;
  variant: MarkerModel["variant"] | "home";
  dimmed?: boolean;
}) {
  if (variant === "home") {
    return (
      <>
        <circle cx={cx} cy={cy} r={r * 0.4} className={DIMMED_FILL.root} />
        <circle cx={cx} cy={cy} r={r * 0.85} className="fill-none stroke-note-root" strokeWidth={1.6} />
      </>
    );
  }
  if (dimmed) return <circle cx={cx} cy={cy} r={r * 0.55} className={DIMMED_FILL[variant]} />;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={variant === "outside" ? r * 0.8 : r}
      className={cn(FILL[variant], STROKE[variant])}
      strokeWidth={variant === "outside" ? 1.2 : 1.5}
    />
  );
}

/**
 * One clickable note on the fretboard. Positioned by its circle centre so CSS
 * can animate scale/opacity. Without `onActivate` it draws a still picture
 * (no hit area, focus ring or selection rings) for image export.
 */
export const NoteMarker = memo(function NoteMarker({ note, model, cx, cy, radius, onActivate }: NoteMarkerProps) {
  const { variant, visible, dimmed, label } = model;
  const interactive = Boolean(onActivate);
  const emphasis = interactive ? model.emphasis : "none";
  const r = dimmed ? radius * 0.42 : variant === "outside" ? radius * 0.72 : radius;
  const fontSize = Math.max(8, label && label.length >= 3 ? r * 0.7 : r * 0.86);

  return (
    <g
      className={cn("fret-marker", interactive && "cursor-pointer")}
      data-visible={visible}
      {...(interactive && {
        role: "button",
        tabIndex: visible && !dimmed ? 0 : -1,
        "aria-hidden": !visible,
        "aria-label": model.ariaLabel,
        "aria-pressed": emphasis === "selected",
        onClick: () => onActivate?.(note),
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onActivate?.(note);
          }
        },
      })}
    >
      {/* generous invisible hit area (comfortable on touch screens) */}
      {interactive && <circle cx={cx} cy={cy} r={Math.max(radius, 13)} fill="transparent" />}

      {variant === "root" && !dimmed && (
        <circle cx={cx} cy={cy} r={r + 3.5} className="fill-note-root/30" filter="url(#marker-glow)" />
      )}

      {/* While a chord is shown: an amber ring keeps the scale's own root (the key) findable */}
      {model.home && <circle cx={cx} cy={cy} r={r + 3} className="fill-none stroke-note-root" strokeWidth={1.6} />}

      {emphasis === "selected" && (
        <>
          <circle cx={cx} cy={cy} r={r + 4} className="marker-pulse fill-none stroke-white" strokeWidth={2} />
          <circle cx={cx} cy={cy} r={r + 3.2} className="fill-none stroke-white" strokeWidth={2} />
        </>
      )}
      {emphasis === "related" && <circle cx={cx} cy={cy} r={r + 3} className="fill-none stroke-white/45" strokeWidth={1.5} />}

      {dimmed ? (
        <circle cx={cx} cy={cy} r={r} className={DIMMED_FILL[variant]} />
      ) : (
        <circle
          cx={cx}
          cy={cy}
          r={r}
          className={cn(FILL[variant], STROKE[variant])}
          strokeWidth={variant === "outside" ? 1.2 : 1.5}
        />
      )}

      {label && (
        <text
          x={cx}
          y={cy}
          dy="0.35em"
          textAnchor="middle"
          fontSize={variant === "outside" ? fontSize * 0.92 : fontSize}
          fontWeight={variant === "outside" ? 500 : 650}
          className={cn(TEXT[variant], "pointer-events-none select-none")}
        >
          {label}
        </text>
      )}

      {/* keyboard focus ring */}
      {interactive && (
        <circle cx={cx} cy={cy} r={r + 5.5} className="marker-focus fill-none stroke-primary opacity-0" strokeWidth={2.5} />
      )}
    </g>
  );
});
