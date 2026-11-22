/**
 * The first part of a scale's character text ("Bright, stable and happy — the
 * reference point…" → "Bright, stable and happy"), as a short hint in lists
 * (the scale picker, the overview of all scales).
 */
export function shortMood(character: string): string {
  const first = character.split(/\s[—–]\s|:\s|;\s|\.\s/)[0].replace(/[.,;:]$/, "").trim();
  return first.length > 60 ? `${first.slice(0, 57).trimEnd()}…` : first;
}
