/**
 * One colour per CAGED shape (or numbered box), in the order the shapes are
 * listed: C, A, G, E, D. Shapes that sit next to each other on the neck
 * (C–A, A–G, G–E, E–D, D–C) get colours that are nearly opposite on the
 * colour wheel, so they separate clearly even where they overlap. None of
 * them is amber (roots) or teal (scale notes), so the markers keep their meaning.
 */
export const SHAPE_COLORS = [
  "#f87171", // C — coral red
  "#60a5fa", // A — blue
  "#a3e635", // G — lime
  "#c084fc", // E — purple
  "#4ade80", // D — green
] as const;

export function shapeColor(index: number): string {
  return SHAPE_COLORS[((index % SHAPE_COLORS.length) + SHAPE_COLORS.length) % SHAPE_COLORS.length];
}

/** Hue (0–360°) of a #rrggbb colour — used by the tests to check the contrast between neighbours. */
export function hueOf(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === min) return 0;
  const d = max - min;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}
