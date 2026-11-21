/**
 * A safe, readable file name for a saved fretboard picture, e.g.
 * "F♯ Major" → "fretistry-f-sharp-major.png", "La pentatonique mineure" →
 * "fretistry-la-pentatonique-mineure.png".
 */
export function imageFileName(...parts: (string | null | undefined)[]): string {
  const slug = parts
    .filter(Boolean)
    .join(" ")
    .replace(/♯/g, " sharp ")
    .replace(/♭/g, " flat ")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // é → e, ñ → n
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `fretistry-${slug || "fretboard"}.png`;
}
