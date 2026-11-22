/**
 * Pure layout maths for the fretboard drawing (no React).
 *
 * Real guitars place fret n at distance  L · (1 − 2^(−n/12))  from the nut
 * (L = scale length), because each fret raises the pitch by one equal-tempered
 * semitone. That is why frets get narrower towards the body. When the screen
 * is too narrow to show all 24 frets true to scale, the narrowing is softened
 * just enough to fit (a larger "taper" than 12). "Even" spacing is offered as
 * an easier-to-read alternative.
 *
 * Layout is computed in "neck space" — u runs along the neck (nut → body),
 * c runs across it (highest string → lowest string) — and then mapped to
 * screen x/y for the chosen orientation and handedness.
 */

export type SpacingMode = "realistic" | "even";
export type NeckOrientation = "horizontal" | "vertical";

export interface GeometryInput {
  /** Length available along the neck, in pixels. */
  length: number;
  stringCount: number;
  firstFret: number;
  lastFret: number;
  spacing: SpacingMode;
  showFretNumbers: boolean;
  stringSpacing?: number;
  orientation?: NeckOrientation;
  leftHanded?: boolean;
  /** Realistic spacing only: 12 = true to scale, larger = gentler narrowing (see {@link fitTaper}). */
  taper?: number;
  /** Size of labels, fret numbers and inlays (1 = normal; larger on big monitors). */
  scale?: number;
  /** Extra room (px) beside the highest string for the shape letters (C, A, G, E, D). */
  labelLane?: number;
}

export interface FretWire {
  fret: number;
  u: number;
  isNut: boolean;
}

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FretboardGeometry {
  /** SVG size in screen pixels. */
  width: number;
  height: number;
  orientation: NeckOrientation;
  leftHanded: boolean;
  stringSpacing: number;
  /** Size factor for labels, fret numbers and inlays. */
  scale: number;
  hasOpenStrings: boolean;
  /** Neck-space extents. */
  neckLength: number;
  neckDepth: number;
  boardStart: number;
  boardEnd: number;
  boardTop: number;
  boardBottom: number;
  wires: FretWire[];
  frets: number[];
  fretNumberC: number;
  /** Middle of the shape-letter lane beside the highest string (only meaningful when labelLane > 0). */
  labelLaneC: number;
  labelLane: number;
  /** Position of the fret wire *after* fret n along the neck (0 = the nut). */
  wireU: (fret: number) => number;
  noteU: (fret: number) => number;
  stringC: (stringIndex: number) => number;
  markerRadius: (fret: number) => number;
  /** Neck space → screen. */
  toXY: (u: number, c: number) => Point;
  /** Axis-aligned neck-space rectangle → screen rectangle. */
  toRect: (u1: number, c1: number, u2: number, c2: number) => Rect;
  noteXY: (stringIndex: number, fret: number) => Point;
}

export const OPEN_ZONE = 46;
const END_PADDING = 10;
const START_PADDING_NO_OPEN = 6;
const EDGE = 8;
export const FRET_NUMBER_GUTTER = 30;

export const SINGLE_INLAYS = [3, 5, 7, 9, 15, 17, 19, 21];
export const DOUBLE_INLAYS = [12, 24];

export const TRUE_TAPER = 12;
/** The gentlest narrowing used to make the neck fit (beyond this the neck scrolls instead). */
export const MAX_TAPER = 30;

/** Relative position of a fret wire along the neck. */
export function fretPosition(fret: number, spacing: SpacingMode, taper = TRUE_TAPER): number {
  return spacing === "realistic" ? 1 - 2 ** (-fret / taper) : fret;
}

/**
 * Shortest neck length (px) at which the smallest fret in the range is still
 * `minFretSize` pixels long — so markers never overlap.
 */
export function minimumLength(
  firstFret: number,
  lastFret: number,
  spacing: SpacingMode,
  minFretSize: number,
  taper = TRUE_TAPER,
): number {
  const startWire = firstFret === 0 ? 0 : firstFret - 1;
  const total = fretPosition(lastFret, spacing, taper) - fretPosition(startWire, spacing, taper);
  const smallest = fretPosition(lastFret, spacing, taper) - fretPosition(lastFret - 1, spacing, taper);
  const board = (minFretSize * total) / smallest;
  return Math.ceil(board + (firstFret === 0 ? OPEN_ZONE : START_PADDING_NO_OPEN) + END_PADDING);
}

/**
 * The narrowing to use for realistic spacing: true to scale (12) when the
 * neck fits in `available` pixels, otherwise the smallest gentler taper that
 * fits — up to {@link MAX_TAPER}, after which the neck scrolls sideways.
 */
export function fitTaper(firstFret: number, lastFret: number, available: number, minFretSize: number): number {
  for (let taper = TRUE_TAPER; taper < MAX_TAPER; taper += 0.5) {
    if (minimumLength(firstFret, lastFret, "realistic", minFretSize, taper) <= available) return taper;
  }
  return MAX_TAPER;
}

export function computeGeometry(input: GeometryInput): FretboardGeometry {
  const { length, stringCount, firstFret, lastFret, spacing, showFretNumbers } = input;
  const orientation = input.orientation ?? "horizontal";
  const leftHanded = input.leftHanded ?? false;
  const stringSpacing = input.stringSpacing ?? 36;
  const taper = input.taper ?? TRUE_TAPER;
  const scale = input.scale ?? 1;
  const hasOpenStrings = firstFret === 0;
  const startWire = hasOpenStrings ? 0 : firstFret - 1;
  const boardStart = hasOpenStrings ? OPEN_ZONE : START_PADDING_NO_OPEN;
  const boardEnd = length - END_PADDING;

  const p0 = fretPosition(startWire, spacing, taper);
  const p1 = fretPosition(lastFret, spacing, taper);
  const wireU = (fret: number) =>
    boardStart + ((fretPosition(fret, spacing, taper) - p0) / (p1 - p0)) * (boardEnd - boardStart);

  const wires: FretWire[] = [];
  for (let f = startWire; f <= lastFret; f++) wires.push({ fret: f, u: wireU(f), isNut: f === 0 });

  const half = stringSpacing * 0.5;
  const labelLane = input.labelLane ?? 0;
  const boardTop = EDGE + labelLane;
  const firstStringC = boardTop + half;
  const boardBottom = firstStringC + (stringCount - 1) * stringSpacing + half;
  const neckDepth = boardBottom + (showFretNumbers ? FRET_NUMBER_GUTTER * scale : EDGE);
  const neckLength = length;

  const noteU = (fret: number) => (fret === 0 ? OPEN_ZONE / 2 - 2 : (wireU(fret - 1) + wireU(fret)) / 2);
  // Highest-pitched string (last index) is at c = top, like tablature.
  const stringC = (stringIndex: number) => firstStringC + (stringCount - 1 - stringIndex) * stringSpacing;

  const markerRadius = (fret: number) => {
    const space = fret === 0 ? OPEN_ZONE - 6 : wireU(fret) - wireU(fret - 1);
    return Math.max(7.5, Math.min(stringSpacing * 0.4, (space - 4) / 2));
  };

  const toXY = (u: number, c: number): Point => {
    if (orientation === "horizontal") return { x: leftHanded ? neckLength - u : u, y: c };
    // Vertical: nut at the top, lowest string on the left (right for left-handers).
    return { x: leftHanded ? c : neckDepth - c, y: u };
  };

  const toRect = (u1: number, c1: number, u2: number, c2: number): Rect => {
    const a = toXY(u1, c1);
    const b = toXY(u2, c2);
    return { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), width: Math.abs(a.x - b.x), height: Math.abs(a.y - b.y) };
  };

  const frets: number[] = [];
  for (let f = firstFret; f <= lastFret; f++) frets.push(f);

  return {
    width: orientation === "horizontal" ? neckLength : neckDepth,
    height: orientation === "horizontal" ? neckDepth : neckLength,
    orientation,
    leftHanded,
    stringSpacing,
    scale,
    hasOpenStrings,
    neckLength,
    neckDepth,
    boardStart,
    boardEnd,
    boardTop,
    boardBottom,
    wires,
    frets,
    fretNumberC: boardBottom + 19 * scale,
    labelLaneC: (EDGE + labelLane) / 2,
    labelLane,
    wireU,
    noteU,
    stringC,
    markerRadius,
    toXY,
    toRect,
    noteXY: (stringIndex, fret) => toXY(noteU(fret), stringC(stringIndex)),
  };
}

/**
 * Which frets the neck shows: up to the 12th, 15th (where most acoustics stop
 * being comfortable), 22nd (many electrics) or 24th fret, or the upper octave.
 */
export type FretRange = "low" | "to15" | "to22" | "all" | "high";

/** In the order they appear in the picker: from the shortest neck to the longest, then the upper octave. */
export const FRET_RANGES: readonly FretRange[] = ["low", "to15", "to22", "all", "high"];

export function fretRangeBounds(range: FretRange, fretCount = 24): [number, number] {
  switch (range) {
    case "low":
      return [0, Math.min(12, fretCount)];
    case "to15":
      return [0, Math.min(15, fretCount)];
    case "to22":
      return [0, Math.min(22, fretCount)];
    case "high":
      return [12, fretCount];
    case "all":
      return [0, fretCount];
  }
}

/** "0–15" etc. */
export function fretRangeLabel(range: FretRange, fretCount = 24): string {
  const [first, last] = fretRangeBounds(range, fretCount);
  return `${first}–${last}`;
}

/**
 * The area of a scale position (box shape), aligned to the fret grid the way
 * CAGED diagrams shade a shape: on every string it covers exactly the frets
 * that string uses — from the fret wire before its lowest note to the wire
 * after its highest — so the edges sit on fret wires and step where the shape
 * shifts (e.g. at the B string). Returned as a polygon in screen coordinates.
 */
export function positionArea(g: FretboardGeometry, notes: readonly { stringIndex: number; fret: number }[]): Point[] {
  const byString = new Map<number, number[]>();
  for (const n of notes) byString.set(n.stringIndex, [...(byString.get(n.stringIndex) ?? []), n.fret]);
  const half = g.stringSpacing / 2;
  const openStart = 4; // left edge of the open-string zone
  const rows = [...byString.entries()]
    .map(([s, frets]) => {
      const lo = Math.min(...frets);
      const hi = Math.max(...frets);
      const c = g.stringC(s);
      return {
        cTop: Math.max(g.boardTop, c - half),
        cBottom: Math.min(g.boardBottom, c + half),
        uLeft: lo === 0 ? openStart : g.wireU(lo - 1),
        uRight: g.wireU(hi),
      };
    })
    .sort((a, b) => a.cTop - b.cTop);
  if (rows.length === 0) return [];
  const left = rows.flatMap((r) => [g.toXY(r.uLeft, r.cTop), g.toXY(r.uLeft, r.cBottom)]);
  const right = [...rows].reverse().flatMap((r) => [g.toXY(r.uRight, r.cBottom), g.toXY(r.uRight, r.cTop)]);
  return [...left, ...right];
}
