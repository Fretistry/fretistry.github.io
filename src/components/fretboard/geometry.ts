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
  const boardTop = EDGE;
  const firstStringC = boardTop + half;
  const boardBottom = firstStringC + (stringCount - 1) * stringSpacing + half;
  const neckDepth = boardBottom + (showFretNumbers ? FRET_NUMBER_GUTTER : EDGE);
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
    hasOpenStrings,
    neckLength,
    neckDepth,
    boardStart,
    boardEnd,
    boardTop,
    boardBottom,
    wires,
    frets,
    fretNumberC: boardBottom + 19,
    noteU,
    stringC,
    markerRadius,
    toXY,
    toRect,
    noteXY: (stringIndex, fret) => toXY(noteU(fret), stringC(stringIndex)),
  };
}

export function fretRangeBounds(range: "all" | "low" | "high", fretCount = 24): [number, number] {
  if (range === "low") return [0, 12];
  if (range === "high") return [12, fretCount];
  return [0, fretCount];
}

/**
 * Outline of a scale position: a polygon through the outermost notes on each
 * string, in screen coordinates (drawn with a thick round stroke to pad it).
 */
export function positionOutline(
  g: FretboardGeometry,
  notes: readonly { stringIndex: number; fret: number }[],
): Point[] {
  const byString = new Map<number, number[]>();
  for (const n of notes) byString.set(n.stringIndex, [...(byString.get(n.stringIndex) ?? []), n.fret]);
  const rows = [...byString.entries()]
    .map(([s, frets]) => ({ c: g.stringC(s), uMin: g.noteU(Math.min(...frets)), uMax: g.noteU(Math.max(...frets)) }))
    .sort((a, b) => a.c - b.c);
  if (rows.length === 0) return [];
  const left = rows.map((r) => g.toXY(r.uMin, r.c));
  const right = [...rows].reverse().map((r) => g.toXY(r.uMax, r.c));
  return [...left, ...right];
}
