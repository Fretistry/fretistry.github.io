import type { SpelledNote, SpelledScale } from "@/lib/theory";
import type { I18nBundle, Locale } from "./index";

/**
 * Sharps and flats written out the way people type them into a search box:
 * "E flat", Dutch/German "Es" and "Fis", French "mi bémol", Spanish
 * "fa sostenido". Page titles show the scale with ♭/♯ (E♭ Major) and add
 * this spelled-out name, so searches for "Eb major" or "Es-Dur" find it.
 */

const SOLFEGE = {
  fr: { C: "Do", D: "Ré", E: "Mi", F: "Fa", G: "Sol", A: "La", B: "Si" },
  es: { C: "Do", D: "Re", E: "Mi", F: "Fa", G: "Sol", A: "La", B: "Si" },
} as const;

/** The root written out in words; null for natural notes (nothing to spell out) and German B♭ (simply "B" there). */
export function spokenRootName(locale: Locale, note: SpelledNote): string | null {
  const { letter, accidental } = note;
  if (accidental === 0 || Math.abs(accidental) > 1) return null;
  const sharp = accidental > 0;
  switch (locale) {
    case "en":
      return `${letter} ${sharp ? "sharp" : "flat"}`;
    case "nl":
    case "de": {
      if (sharp) return `${locale === "de" && letter === "B" ? "H" : letter}is`; // Cis, Fis (German B♯ = His)
      if (letter === "B") return locale === "de" ? null : "Bes"; // German: B♭ is simply "B"
      if (letter === "E" || letter === "A") return `${letter}s`; // Es, As
      return `${letter}es`; // Des, Ges, Ces, Fes
    }
    case "fr":
    case "es":
      return `${SOLFEGE[locale][letter]} ${sharp ? (locale === "fr" ? "dièse" : "sostenido") : locale === "fr" ? "bémol" : "bemol"}`;
  }
}

/**
 * Other names searchers use for this scale, e.g. "E flat Major" for E♭ Major,
 * "Fis-Moll" for F♯-Moll — and the key that was asked for when the spelling
 * switched to its simpler twin (C♯ Lydian is written D♭ Lydian). Null if none.
 */
export function alternativeScaleTitle(bundle: I18nBundle, spelled: SpelledScale): string | null {
  const { theory } = bundle;
  const fullName = theory.scaleFullName(spelled.scale);
  // Kept short: "Fis-Moll", not "Fis-Moll (natürlich, äolisch)" — the title already shows the full name.
  const short = (title: string) => title.replace(/\s*\([^)]*\)/g, "").trim();
  const names: string[] = [];
  const spoken = spokenRootName(bundle.locale, spelled.root);
  if (spoken) names.push(short(theory.title(spoken, fullName)));
  const requested = spelled.requestedRoot;
  if (requested.letter !== spelled.root.letter || requested.accidental !== spelled.root.accidental) {
    names.push(short(theory.title(bundle.note(requested), fullName)));
  }
  return names.length > 0 ? names.join(", ") : null;
}

/** "E♭ Major (E flat Major)" — the scale's title with its other name, if it has one. */
export function titleWithAlternative(title: string, alternative: string | null): string {
  return alternative ? `${title} (${alternative})` : title;
}
