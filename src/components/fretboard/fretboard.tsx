"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/components/i18n/i18n-provider";
import type { FretboardNote, PositionNote, Tuning } from "@/lib/theory";
import { cn } from "@/lib/utils";
import {
  DOUBLE_INLAYS,
  FRET_NUMBER_GUTTER,
  SINGLE_INLAYS,
  computeGeometry,
  fitTaper,
  fretRangeBounds,
  minimumLength,
  positionArea,
  type FretboardGeometry,
  type NeckOrientation,
  type SpacingMode,
} from "./geometry";
import type { MarkerModel } from "./marker-model";
import { NoteMarker } from "./note-marker";

interface FretboardProps {
  notes: FretboardNote[][];
  markers: Map<string, MarkerModel>;
  tuning: Tuning;
  spacing: SpacingMode;
  fretRange: "all" | "low" | "high";
  showFretNumbers: boolean;
  orientation: NeckOrientation;
  leftHanded: boolean;
  /** The scale positions (CAGED shapes / boxes) to shade, each in its own colour. */
  positionAreas?: PositionArea[] | null;
  /** Keep the shape-letter lane even when no shape is shown (so the neck doesn't jump while toggling shapes). */
  reserveLabelLane?: boolean;
  onNoteActivate: (note: FretboardNote) => void;
  /** Told whether the horizontal neck is wider than the screen (so a "scroll sideways" hint can be shown). */
  onOverflowChange?: (overflowing: boolean) => void;
}

export const LABEL_SIZE = 44;
/** Smallest fret (px) in the horizontal view, so markers never overlap. */
const MIN_FRET_SIZE = 24;
/** Neck width (px) from which the horizontal neck starts growing, and its largest size factor. */
const WIDE_NECK = 1500;
const MAX_SCALE = 1.45;
/** Height (px) of the lane above the neck that holds the shape letters. */
const LABEL_LANE = 18;

/** A scale position to shade on the neck. */
export interface PositionArea {
  /** Every copy of the pattern on the neck (it repeats 12 frets higher). */
  occurrences: PositionNote[][];
  color: string;
  /** Shown in a small badge above the shape (CAGED letter or box number); null = no badge. */
  label: string | null;
}
/** Colour of the highlighted scale-position box (also used for its legend swatch). */
export const POSITION_TINT = "#f6ead0";
const VERTICAL_LABEL_HEIGHT = 30;

/**
 * The interactive guitar neck, drawn as SVG at the exact pixel size of its
 * container so markers stay crisp. Horizontal on larger screens (scrolls
 * sideways when narrow, string names pinned), vertical on phones (scrolls with
 * the page, string names pinned at the top). Mirrors for left-handed players.
 */
export function Fretboard({
  notes,
  markers,
  tuning,
  spacing,
  fretRange,
  showFretNumbers,
  orientation,
  leftHanded,
  positionAreas,
  reserveLabelLane = false,
  onNoteActivate,
  onOverflowChange,
}: FretboardProps) {
  const { ui, tuningName } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1200);
  /** Whether there is more neck to scroll to on the left / right. */
  const [more, setMore] = useState({ left: false, right: false });

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => setContainerWidth(el.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const fretCount = notes[0]?.length ? notes[0].length - 1 : 24;
  const [firstFret, lastFret] = fretRangeBounds(fretRange, fretCount);
  const stringCount = tuning.strings.length;
  const vertical = orientation === "vertical";
  // Large monitors: the horizontal neck grows with the space it gets (taller strings, bigger notes
  // and labels), up to 45% larger than on a normal laptop screen.
  const scale = vertical ? 1 : Math.min(MAX_SCALE, Math.max(1, containerWidth / WIDE_NECK));
  const labelSize = Math.round(LABEL_SIZE * scale);
  // Room for the shape letters (C, A, G, E, D) beside the highest string when shapes are shown.
  const labelLane = reserveLabelLane || positionAreas?.some((a) => a.label) ? Math.round(LABEL_LANE * scale) : 0;

  const geometry = useMemo(() => {
    if (vertical) {
      const gutter = showFretNumbers ? FRET_NUMBER_GUTTER : 8;
      const stringSpacing = Math.max(34, Math.min(60, (containerWidth - gutter - 12 - labelLane) / stringCount));
      return computeGeometry({
        length: minimumLength(firstFret, lastFret, spacing, 32),
        stringCount,
        firstFret,
        lastFret,
        spacing,
        showFretNumbers,
        stringSpacing,
        orientation: "vertical",
        leftHanded,
        labelLane,
      });
    }
    // Show all frets when possible: soften the narrowing only as much as the screen needs.
    const available = containerWidth - labelSize;
    const minFret = MIN_FRET_SIZE * scale;
    const taper = spacing === "realistic" ? fitTaper(firstFret, lastFret, available, minFret) : undefined;
    return computeGeometry({
      length: Math.max(available, minimumLength(firstFret, lastFret, spacing, minFret, taper)),
      stringCount,
      firstFret,
      lastFret,
      spacing,
      showFretNumbers,
      stringSpacing: (containerWidth < 640 ? 32 : 36) * scale,
      orientation: "horizontal",
      leftHanded,
      taper,
      scale,
      labelLane,
    });
  }, [vertical, containerWidth, firstFret, lastFret, spacing, showFretNumbers, stringCount, leftHanded, scale, labelSize, labelLane]);

  // Left-handed horizontal necks start at the right: show the nut end first.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || vertical) return;
    el.scrollLeft = leftHanded ? el.scrollWidth : 0;
  }, [leftHanded, vertical, geometry.width]);

  // Track whether part of the neck is hidden, for the edge fades and the hint.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || vertical) return;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      const left = el.scrollLeft > 2;
      const right = el.scrollLeft < max - 2;
      setMore((prev) => (prev.left === left && prev.right === right ? prev : { left, right }));
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    return () => el.removeEventListener("scroll", update);
  }, [vertical, geometry.width, containerWidth]);

  const overflowing = !vertical && (more.left || more.right);
  useEffect(() => onOverflowChange?.(overflowing), [overflowing, onOverflowChange]);

  const ariaLabel = ui.fretboard.aria(tuningName(tuning), firstFret, lastFret, leftHanded, vertical);

  const board = (
    <svg width={geometry.width} height={geometry.height} role="group" aria-label={ariaLabel} className="block shrink-0 touch-manipulation select-none">
      <FretboardArt g={geometry} tuning={tuning} showFretNumbers={showFretNumbers} positionAreas={positionAreas} />
      {notes.map((row) =>
        row.map((note) => {
          if (note.fret < firstFret || note.fret > lastFret) return null;
          const model = markers.get(note.key);
          if (!model) return null;
          const { x, y } = geometry.noteXY(note.stringIndex, note.fret);
          return (
            <NoteMarker
              key={note.key}
              note={note}
              model={model}
              cx={x}
              cy={y}
              radius={geometry.markerRadius(note.fret)}
              onActivate={onNoteActivate}
            />
          );
        }),
      )}
    </svg>
  );

  const shell =
    "relative w-full rounded-xl border border-white/5 bg-[#17110d] shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_20px_50px_-20px_rgba(0,0,0,0.7)]";

  if (vertical) {
    return (
      <div ref={containerRef} className={cn(shell, "overflow-clip")}>
        {/* String names stay pinned below the app header while scrolling down the neck */}
        <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-10 flex justify-center border-b border-white/5 bg-[#120d0a]/95 backdrop-blur-sm">
          <svg width={geometry.width} height={VERTICAL_LABEL_HEIGHT} aria-hidden="true">
            {tuning.strings.map((pitch, i) => (
              <StringLabel key={i} x={geometry.toXY(0, geometry.stringC(i)).x} y={VERTICAL_LABEL_HEIGHT / 2} pitch={pitch} />
            ))}
          </svg>
        </div>
        <div className="flex justify-center">{board}</div>
      </div>
    );
  }

  // Soft fades over the edges where more of the neck is hidden (not over the string names).
  const fade = "pointer-events-none absolute inset-y-0 z-20 w-12 from-[#17110d] to-transparent transition-opacity duration-200";
  return (
    <div ref={containerRef} className={cn(shell, "overflow-hidden")}>
      <div
        aria-hidden="true"
        className={cn(fade, "bg-gradient-to-r", more.left ? "opacity-100" : "opacity-0")}
        style={{ left: leftHanded ? 0 : labelSize }}
      />
      <div
        aria-hidden="true"
        className={cn(fade, "bg-gradient-to-l", more.right ? "opacity-100" : "opacity-0")}
        style={{ right: leftHanded ? labelSize : 0 }}
      />
      <div ref={scrollRef} className="fretboard-scroll overflow-x-auto overflow-y-hidden overscroll-x-contain">
        <div className={cn("flex", leftHanded && "flex-row-reverse")} style={{ width: geometry.width + labelSize }}>
          {/* String names — sticky so they stay visible while scrolling sideways */}
          <div
            className={cn(
              "sticky z-10 shrink-0 border-white/5 bg-[#120d0a]/95 backdrop-blur-sm",
              leftHanded ? "right-0 border-l" : "left-0 border-r",
            )}
            style={{ width: labelSize }}
          >
            <svg width={labelSize} height={geometry.height} aria-hidden="true">
              {tuning.strings.map((pitch, i) => (
                <StringLabel key={i} x={labelSize / 2 - 3 * scale} y={geometry.stringC(i)} pitch={pitch} scale={scale} />
              ))}
            </svg>
          </div>
          {board}
        </div>
      </div>
    </div>
  );
}

function StringLabel({ x, y, pitch, scale = 1 }: { x: number; y: number; pitch: Tuning["strings"][number]; scale?: number }) {
  const { note } = useI18n();
  return <StringName x={x} y={y} name={note(pitch.note)} octave={pitch.octave} scale={scale} />;
}

/** An open-string name with its octave (e.g. "E₂"), drawn in SVG. */
export function StringName({ x, y, name, octave, scale = 1 }: { x: number; y: number; name: string; octave: number; scale?: number }) {
  return (
    <text
      x={x}
      y={y}
      dy="0.35em"
      textAnchor="middle"
      className="fill-[oklch(0.88_0.02_80)] font-mono"
      fontSize={(name.length > 3 ? 10 : name.length > 2 ? 11 : 13) * scale}
      fontWeight={600}
    >
      {name}
      <tspan fontSize={9 * scale} dx={1} dy="0.25em" className="fill-[oklch(0.62_0.02_80)]" fontWeight={500}>
        {octave}
      </tspan>
    </text>
  );
}

/** Everything except the note markers: wood, inlays, frets, strings, numbers and position areas. */
export function FretboardArt({
  g,
  tuning,
  showFretNumbers,
  positionAreas,
}: {
  g: FretboardGeometry;
  tuning: Tuning;
  showFretNumbers: boolean;
  positionAreas?: PositionArea[] | null;
}) {
  const vertical = g.orientation === "vertical";
  const stringCount = tuning.strings.length;
  const midC = (g.stringC(0) + g.stringC(stringCount - 1)) / 2;
  const boardRect = g.toRect(g.boardStart, g.boardTop, g.boardEnd, g.boardBottom);
  const visibleFrets = new Set(g.frets);
  // Each copy of each shape, cut to the visible frets.
  const shownAreas = (positionAreas ?? []).flatMap((area, a) =>
    area.occurrences
      .map((occ, o) => ({ area, key: `${a}-${o}`, notes: occ.filter((n) => visibleFrets.has(n.fret)) }))
      .filter((x) => x.notes.length > 0),
  );

  return (
    <>
      <defs>
        <linearGradient id="fb-wood" x1="0" y1="0" x2={vertical ? 1 : 0} y2={vertical ? 0 : 1}>
          <stop offset="0%" stopColor="#3b2a1f" />
          <stop offset="50%" stopColor="#2e2018" />
          <stop offset="100%" stopColor="#241912" />
        </linearGradient>
        <pattern id="fb-grain" width="180" height="22" patternUnits="userSpaceOnUse" patternTransform={vertical ? "rotate(90)" : undefined}>
          <path d="M0 4 Q45 2 90 5 T180 4" stroke="#1a110b" strokeWidth="0.8" fill="none" opacity="0.7" />
          <path d="M0 12 Q60 14 110 11 T180 12" stroke="#4a3526" strokeWidth="0.6" fill="none" opacity="0.6" />
          <path d="M0 18 Q40 17 95 19 T180 18" stroke="#1a110b" strokeWidth="0.5" fill="none" opacity="0.5" />
        </pattern>
        <radialGradient id="fb-pearl" cx="35%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#fbf6ec" />
          <stop offset="60%" stopColor="#d9cdb8" />
          <stop offset="100%" stopColor="#a99c88" />
        </radialGradient>
        {/* Metal and bone shading runs across the wire/nut, so it rotates with the neck */}
        <linearGradient id="fb-fret" x1="0" y1="0" x2={vertical ? 0 : 1} y2={vertical ? 1 : 0}>
          <stop offset="0%" stopColor="#8d8d8d" />
          <stop offset="45%" stopColor="#f2f2f2" />
          <stop offset="100%" stopColor="#9a9a9a" />
        </linearGradient>
        <linearGradient id="fb-nut" x1="0" y1="0" x2={vertical ? 0 : 1} y2={vertical ? 1 : 0}>
          <stop offset="0%" stopColor="#cfc4ab" />
          <stop offset="50%" stopColor="#f3ecdc" />
          <stop offset="100%" stopColor="#bfb398" />
        </linearGradient>
        <linearGradient id="fb-string-plain" x1="0" y1="0" x2={vertical ? 1 : 0} y2={vertical ? 0 : 1}>
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#9c9c9c" />
        </linearGradient>
        <linearGradient id="fb-string-wound" x1="0" y1="0" x2={vertical ? 1 : 0} y2={vertical ? 0 : 1}>
          <stop offset="0%" stopColor="#efe2c4" />
          <stop offset="100%" stopColor="#8f7d5c" />
        </linearGradient>
        <filter id="marker-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      {/* Wood */}
      <rect {...boardRect} fill="url(#fb-wood)" />
      <rect {...boardRect} fill="url(#fb-grain)" opacity={0.55} />
      {/* Binding edges */}
      <rect {...g.toRect(g.boardStart, g.boardTop - 1.5, g.boardEnd, g.boardTop)} fill="#e9dfcc" opacity={0.35} />
      <rect {...g.toRect(g.boardStart, g.boardBottom, g.boardEnd, g.boardBottom + 1.5)} fill="#e9dfcc" opacity={0.35} />

      {/* Inlays */}
      {g.frets.map((fret) => {
        if (fret === 0) return null;
        const u = g.noteU(fret);
        const inlayR = 5.5 * g.scale;
        if (SINGLE_INLAYS.includes(fret)) {
          const p = g.toXY(u, midC);
          return <circle key={`inlay-${fret}`} cx={p.x} cy={p.y} r={inlayR} fill="url(#fb-pearl)" opacity={0.75} />;
        }
        if (DOUBLE_INLAYS.includes(fret)) {
          const a = g.toXY(u, midC - g.stringSpacing);
          const b = g.toXY(u, midC + g.stringSpacing);
          return (
            <g key={`inlay-${fret}`} opacity={0.75}>
              <circle cx={a.x} cy={a.y} r={inlayR} fill="url(#fb-pearl)" />
              <circle cx={b.x} cy={b.y} r={inlayR} fill="url(#fb-pearl)" />
            </g>
          );
        }
        return null;
      })}

      {/* Scale position (CAGED shape / box) areas, behind frets and strings: on each string exactly
          the frets the shape uses, edges on the fret wires. A light, neutral highlight — amber is
          reserved for root notes. */}
      {shownAreas.map(({ area, key, notes }) => {
        const points = positionArea(g, notes);
        const coloured = area.color !== POSITION_TINT;
        return (
          <polygon
            key={`pos-${key}`}
            className="pointer-events-none"
            points={points.map((p) => `${p.x},${p.y}`).join(" ")}
            fill={area.color}
            fillOpacity={coloured ? 0.2 : 0.13}
            stroke={area.color}
            strokeOpacity={coloured ? 0.85 : 0.5}
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
        );
      })}

      {/* Frets and nut */}
      {g.wires.map((wire) =>
        wire.isNut ? (
          <rect key="nut" {...g.toRect(wire.u - 6, g.boardTop - 2, wire.u + 1, g.boardBottom + 2)} rx={1.5} fill="url(#fb-nut)" />
        ) : (
          <g key={`fret-${wire.fret}`}>
            <rect {...g.toRect(wire.u - 1.6, g.boardTop, wire.u + 1.6, g.boardBottom)} fill="url(#fb-fret)" />
            <rect {...g.toRect(wire.u + 1.6, g.boardTop, wire.u + 3.1, g.boardBottom)} fill="#000" opacity={0.25} />
          </g>
        ),
      )}

      {/* Strings: thicker and wound towards the bass side (drawn as thin rectangles so gradients render everywhere) */}
      {tuning.strings.map((_, i) => {
        const c = g.stringC(i);
        const thickness = 0.9 + ((stringCount - 1 - i) / Math.max(1, stringCount - 1)) * 1.9;
        const wound = i < Math.ceil(stringCount / 2);
        const u1 = g.hasOpenStrings ? 2 : g.boardStart;
        return (
          <g key={`string-${i}`}>
            <rect {...g.toRect(u1, c + 1.2, g.boardEnd, c + 1.2 + thickness)} fill="#000" opacity={0.35} />
            <rect
              {...g.toRect(u1, c - thickness / 2, g.boardEnd, c + thickness / 2)}
              fill={wound ? "url(#fb-string-wound)" : "url(#fb-string-plain)"}
            />
          </g>
        );
      })}

      {/* Fret numbers */}
      {showFretNumbers &&
        g.frets.map((fret) => {
          const marked = SINGLE_INLAYS.includes(fret) || DOUBLE_INLAYS.includes(fret);
          const p = g.toXY(g.noteU(fret), g.fretNumberC);
          return (
            <text
              key={`num-${fret}`}
              x={p.x}
              y={p.y}
              dy={vertical ? "0.35em" : undefined}
              textAnchor="middle"
              fontSize={11 * g.scale}
              fontWeight={marked ? 650 : 450}
              className={marked ? "fill-[oklch(0.86_0.02_80)]" : "fill-[oklch(0.6_0.015_80)]"}
            >
              {fret}
            </text>
          );
        })}

      {/* Shape letters (C, A, G, E, D) in the lane above the neck, centred over each shape */}
      {g.labelLane > 0 &&
        shownAreas.map(({ area, key, notes }) => {
          if (!area.label) return null;
          const frets = notes.map((n) => n.fret);
          const lo = Math.min(...frets);
          const u = ((lo === 0 ? 4 : g.wireU(lo - 1)) + g.wireU(Math.max(...frets))) / 2;
          const w = (area.label.length > 1 ? 24 : 18) * g.scale;
          const h = 14 * g.scale;
          const rect = g.toRect(u - w / 2, g.labelLaneC - h / 2, u + w / 2, g.labelLaneC + h / 2);
          const p = g.toXY(u, g.labelLaneC);
          return (
            <g key={`shape-label-${key}`} className="pointer-events-none">
              <rect {...rect} rx={Math.min(rect.width, rect.height) / 2} fill={area.color} />
              <text x={p.x} y={p.y} dy="0.35em" textAnchor="middle" fontSize={10 * g.scale} fontWeight={700} fill="#1a1310">
                {area.label}
              </text>
            </g>
          );
        })}
    </>
  );
}
