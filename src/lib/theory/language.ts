import { formatNote, ordinal as englishOrdinal } from "./notes";
import type { NoteFormatter, NoteNaming } from "./note-names";
import type { Interval, IntervalQuality, Letter, ScaleDefinition } from "./types";

/**
 * Everything the theory engine needs to talk about music in one language.
 *
 * Sentences are functions rather than fill-in-the-blank templates because
 * word order and grammar differ between languages. Text may contain
 * **double-asterisk** markers for emphasis.
 *
 * English is built in (below); other languages live in src/lib/i18n.
 */

export type Direction = "raised" | "lowered";

export interface DegreeChangeText {
  direction: Direction;
  /** Generic degree number (1–7). */
  degree: number;
  note: string;
  from: string;
}

/** A reference to a scale note: either an ordinal degree ("the 4th") or an altered label ("the ♭6"). */
export interface NoteRef {
  degree: number;
  /** null for natural degrees (major/perfect), otherwise the label such as "♭6". */
  label: string | null;
  note: string;
}

export interface TitledText {
  title: string;
  text: string;
}

export interface TheoryLanguage {
  // ── Names ──────────────────────────────────────────────────────────────────
  note: NoteFormatter;
  letter(letter: Letter): string;
  scaleName(scale: ScaleDefinition): string;
  scaleFullName(scale: ScaleDefinition): string;
  /** Mode name ("Aeolian"); `index` is 0 = Ionian … 6 = Locrian, used when the registry has no entry. */
  modeName(scale: ScaleDefinition | undefined, index: number): string;
  character(scale: ScaleDefinition): string;
  usage(scale: ScaleDefinition): string;
  /** "A Natural Minor", "La mineur naturel", "A-Moll". */
  title(root: string, scaleName: string): string;
  intervalName(interval: Pick<Interval, "degree" | "quality">): string;
  /** Short label for the root on the fretboard ("R"). */
  rootLabel: string;
  ordinal(n: number): string;
  halfSteps(n: number): string;
  frets(n: number): string;
  joinList(items: readonly string[]): string;
  step(semitones: number): { symbol: string; name: string };
  chordTypeName(typeId: string, englishName: string): string;
  chordName(root: string, typeName: string): string;
  /** Size of the gap between two stacked chord tones (3 → "minor 3rd"). */
  chordGap(semitones: number): string;

  // ── Scale explanation ──────────────────────────────────────────────────────
  construction(p: { root: string; moves: { to: string; semitones: number }[]; summary: string; scaleName: string }): string[];
  characterHeading(quality: "major" | "minor" | null): string;
  third(p: { quality: "major" | "minor"; note: string; semitones: number; root: string }): string;
  noThird(): string;
  majorYardstick(): string;
  comparedWith(p: { reference: string; changes: DegreeChangeText[] }): string;
  plusOneNote(p: { base: string; label: string; note: string; blueNote: boolean }): string;
  withNotesRemoved(p: { parent: string; removed: { degree: number; note: string }[]; noHalfSteps: boolean }): string;
  equalSteps(stepName: string): string;
  alternatingSteps(a: string, b: string): string;
  noPerfectFifth(p: { fifth: { note: string; intervalName: string } | null }): string;

  whyIntroLetters(p: { root: string; letters: string[]; formula: string }): string;
  whyIntroSparse(p: { count: number; formula: string }): string;
  whyRoot(note: string): string;
  whyHead(p: { note: string; intervalName: string; semitones: number; root: string }): string;
  whyRespelled(p: { original: string; note: string }): string;
  whyNatural(p: { degree: number; letter: string; semitones: number; letterPerDegree: boolean }): string;
  whyAccidental(p: {
    degree: number;
    letter: string;
    naturalSemitones: number;
    accidental: number;
    note: string;
    letterPerDegree: boolean;
  }): string;
  whyWrittenAs(p: {
    note: string;
    alternative: string;
    alternativeLetter: string;
    degree: number;
    owner: { isRoot: boolean; degree: number; note: string } | null;
  }): string;

  // ── Relationships ──────────────────────────────────────────────────────────
  relationshipKind: Record<"mode" | "relative" | "parallel" | "neighbour" | "contained-in" | "contains" | "symmetry", string>;
  modeParent(p: { title: string; parentName: string }): TitledText;
  modeOf(p: { root: string; modeName: string; modeNumber: number; parentName: string; parentRoot: string }): TitledText;
  relative(p: {
    kind: "relative-minor" | "relative-major";
    title: string;
    otherName: string;
    letterPerDegree: boolean;
    noteCount: number;
    majorName: string;
    minorName: string;
    otherRoot: string;
    position: number;
    label: string | null;
    semitones: number;
    higher: boolean;
    root: string;
  }): TitledText;
  parallel(p: { quality: "major" | "minor"; name: string; changes: DegreeChangeText[] | null; notes: string[]; common: string[] }): TitledText;
  neighbour(p: { title: string; otherName: string; change: DegreeChangeText }): TitledText;
  containedIn(p: { title: string; otherName: string; added: NoteRef[] }): TitledText;
  contains(p: { otherName: string; removed: NoteRef[] }): TitledText;
  symmetry(p: { period: number; roots: string[]; name: string }): TitledText;

  // ── Spelling notices ───────────────────────────────────────────────────────
  respelledRoot(p: { shown: string; from: string; avoided: string[] }): string;
  enharmonicTip(p: { current: string; currentCount: number; currentFlats: boolean; alternative: string; alternativeCount: number }): string;
  respelledNote(p: { label: string; used: string; original: string }): string;

  // ── Chords ─────────────────────────────────────────────────────────────────
  chordBasis(p: { basis: "scale" | "parent" | "symmetric"; noteCount: number; parentName: string; scaleTitle: string; wholeTone: boolean }): string;
}

/** Builds "A, B and C"-style lists with a language's word for "and". */
export function listJoiner(and: string): (items: readonly string[]) => string {
  return (items) => (items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} ${and} ${items[items.length - 1]}`);
}

export const b = (text: string) => `**${text}**`;

// ── English ──────────────────────────────────────────────────────────────────

const EN_QUALITY: Record<IntervalQuality, string> = {
  perfect: "Perfect",
  major: "Major",
  minor: "Minor",
  augmented: "Augmented",
  diminished: "Diminished",
  "doubly-augmented": "Doubly augmented",
  "doubly-diminished": "Doubly diminished",
};

const EN_MODES = ["Ionian", "Dorian", "Phrygian", "Lydian", "Mixolydian", "Aeolian", "Locrian"];

export interface NoteFormat {
  note: NoteFormatter;
  letter: (letter: Letter) => string;
  /** Which naming system the formatter uses — some sentences talk about "letters" vs "note names". */
  naming: NoteNaming;
}

const DEFAULT_FORMAT: NoteFormat = { note: formatNote, letter: (l) => l, naming: "letters" };

/** The seven natural note names in order from C, in the formatter's naming system. */
export function naturalNames(format: Pick<NoteFormat, "letter">): string[] {
  return (["C", "D", "E", "F", "G", "A", "B"] as const).map(format.letter);
}

export function createEnglishTheory(format: NoteFormat = DEFAULT_FORMAT): TheoryLanguage {
  const halfSteps = (n: number) => (n === 1 ? "1 half step" : `${n} half steps`);
  const frets = (n: number) => (n === 1 ? "1 fret" : `${n} frets`);
  const joinList = listJoiner("and");
  const ordinal = englishOrdinal;
  const step = (semitones: number) => {
    switch (semitones) {
      case 1:
        return { symbol: "H", name: "half step" };
      case 2:
        return { symbol: "W", name: "whole step" };
      case 3:
        return { symbol: "W+H", name: "step and a half" };
      case 4:
        return { symbol: "2W", name: "two whole steps" };
      default:
        return { symbol: `${semitones}H`, name: `${semitones} half steps` };
    }
  };
  const intervalName = (i: Pick<Interval, "degree" | "quality">) =>
    i.degree === 1 ? (i.quality === "perfect" ? "Root" : `${EN_QUALITY[i.quality]} unison`) : `${EN_QUALITY[i.quality]} ${ordinal(i.degree)}`;
  const withArticle = (text: string) => (/^[aeiou]/i.test(text) ? `an ${text}` : `a ${text}`);
  const accidentalWords = (accidental: number) => {
    const count = Math.abs(accidental);
    const kind = accidental > 0 ? "sharp" : "flat";
    return count === 1 ? `a ${kind}` : `${count === 2 ? "two" : count} ${kind}s`;
  };
  const changes = (list: DegreeChangeText[]) =>
    joinList(list.map((c) => `a ${c.direction} ${ordinal(c.degree)} (${c.note} instead of ${c.from})`));
  const ref = (r: NoteRef) => `the ${r.label ?? ordinal(r.degree)} (${r.note})`;
  const solfege = format.naming === "solfege";
  const letterWord = solfege ? "note name" : "letter";
  const letterWords = solfege ? "note names" : "letters";
  const allNames =
    format.naming === "letters" ? "each letter from A to G" : `each ${letterWord} (${naturalNames(format).join(" ")})`;

  return {
    note: format.note,
    letter: format.letter,
    scaleName: (s) => s.name,
    scaleFullName: (s) => s.fullName ?? s.name,
    modeName: (s, index) => s?.modeName ?? s?.name ?? EN_MODES[index],
    character: (s) => s.character,
    usage: (s) => s.usage,
    title: (root, name) => `${root} ${name}`,
    intervalName,
    rootLabel: "R",
    ordinal,
    halfSteps,
    frets,
    joinList,
    step,
    chordTypeName: (_id, englishName) => englishName,
    chordName: (root, typeName) => `${root} ${typeName}`,
    chordGap: (s) => (s === 3 ? "minor 3rd" : s === 4 ? "major 3rd" : `${s} half steps`),

    construction: ({ root, moves, summary, scaleName }) => {
      const parts = moves.map((m, i) => {
        const s = step(m.semitones);
        const isLast = i === moves.length - 1;
        const target = isLast ? `back to ${b(m.to)}, one octave higher` : `to ${b(m.to)}`;
        const article = /^(two|\d)/.test(s.name) ? "" : "a ";
        return `${article}${s.name} (${frets(m.semitones)}) ${target}`;
      });
      return [
        `Start on ${b(root)}. Go up ${parts[0]}` +
          (parts.length > 2 ? `, then ${parts.slice(1, -1).join(", ")}` : "") +
          `, and finally ${parts[parts.length - 1]}.`,
        `That gives the step pattern ${b(summary)}. Every ${scaleName} scale uses this same pattern — only the starting note changes.`,
        "On the guitar this is easy to see: along a single string, a half step (H) is the very next fret and a whole step (W) skips one fret.",
      ];
    },
    characterHeading: (q) => (q === "major" ? "Why it sounds major" : q === "minor" ? "Why it sounds minor" : "Major or minor?"),
    third: ({ quality, note, semitones, root }) =>
      `It has a ${b(quality === "major" ? "major 3rd" : "minor 3rd")}: ${b(note)} is ${halfSteps(semitones)} above ${root}. ` +
      "The 3rd is the note that decides whether a scale sounds major (brighter) or minor (darker).",
    noThird: () => "It has no clear major or minor 3rd, so it doesn't sound clearly major or minor.",
    majorYardstick: () =>
      "The major scale is the yardstick of music theory: every interval name (major 3rd, perfect 5th, ...) is measured against it. That is why its formula is simply 1 2 3 4 5 6 7, and why other scales are described by how they differ from it.",
    comparedWith: ({ reference, changes: list }) => `Compared with ${reference}, it has ${changes(list)}.`,
    plusOneNote: ({ base, label, note, blueNote }) =>
      `It is the ${base} scale plus one extra note: the ${label} (${b(note)})` +
      (blueNote ? " — the famous 'blue note', which adds tension and grit." : "."),
    withNotesRemoved: ({ parent, removed, noHalfSteps }) =>
      `It is the ${parent} scale with the ${joinList(removed.map((r) => `${ordinal(r.degree)} (${r.note})`))} removed` +
      (noHalfSteps ? " — which leaves no half steps at all, so every note sounds good against the others." : "."),
    equalSteps: (name) => `Every step is a ${name}, so no note stands out as 'home' — the scale sounds like it is floating.`,
    alternatingSteps: (a, c) => `It strictly alternates ${a}s and ${c}s, which makes it perfectly symmetrical and very tense.`,
    noPerfectFifth: ({ fifth }) =>
      `It has no perfect 5th${fifth ? ` (its 5th is ${b(fifth.note)}, ${withArticle(fifth.intervalName.toLowerCase())})` : ""}, so the chord built on its root isn't a stable major or minor chord — it never feels completely at rest.`,

    whyIntroLetters: ({ root, letters, formula }) =>
      `A 7-note scale uses ${allNames} exactly once, in order. Starting from ${root}, the ${letterWords} must be ${b(letters.join(" "))}. The formula (${formula}) then decides whether each ${letterWord} needs a sharp, a flat or nothing at all.`,
    whyIntroSparse: ({ count, formula }) =>
      `This ${count}-note scale skips some ${letterWords}, so each note is named after the scale degree it represents: a ♭3 is written as a kind of 3rd, a ♭7 as a kind of 7th. That keeps the note names in step with the formula (${formula}).`,
    whyRoot: (note) => `${b(note)} is the root — the home note the scale is built on and named after.`,
    whyHead: ({ note, intervalName: name, semitones, root }) => `${b(note)} — ${name}, ${halfSteps(semitones)} above ${root}.`,
    whyRespelled: ({ original, note }) =>
      `Strictly it is a different degree (${original}), but it is written ${note} to avoid a double sharp or flat — same sound, easier to read.`,
    whyNatural: ({ degree, letter, semitones, letterPerDegree }) =>
      letterPerDegree
        ? `Degree ${degree} uses the ${letterWord} ${letter}, and plain ${letter} is exactly ${halfSteps(semitones)} up — no sharp or flat needed.`
        : `As a kind of ${ordinal(degree)} it uses the ${letterWord} ${letter}, and plain ${letter} is exactly the right distance — no sharp or flat needed.`,
    whyAccidental: ({ degree, letter, naturalSemitones, accidental, note, letterPerDegree }) => {
      const direction = accidental > 0 ? "raised" : "lowered";
      return letterPerDegree
        ? `Degree ${degree} must use the ${letterWord} ${letter}, but plain ${letter} is ${halfSteps(naturalSemitones)} up, so it is ${direction} with ${accidentalWords(accidental)} to ${note}.`
        : `As a kind of ${ordinal(degree)} it uses the ${letterWord} ${letter}; plain ${letter} is ${halfSteps(naturalSemitones)} up, so it is ${direction} with ${accidentalWords(accidental)}.`;
    },
    whyWrittenAs: ({ note, alternative, alternativeLetter, degree, owner }) =>
      owner
        ? `It's written ${note}, not ${alternative}, because the ${letterWord} ${alternativeLetter} already belongs to the ${owner.isRoot ? "root" : ordinal(owner.degree)} (${owner.note}).`
        : `It's written ${note}, not ${alternative}, because it functions as the ${ordinal(degree)} of the scale.`,

    relationshipKind: {
      mode: "Mode",
      relative: "Relative",
      parallel: "Parallel",
      neighbour: "Close cousin",
      "contained-in": "Bigger scale",
      contains: "Smaller scale",
      symmetry: "Symmetry",
    },
    modeParent: ({ title, parentName }) => ({
      title: `${title} is the parent of seven modes`,
      text: `Play these same seven notes but treat a different note as home, and you get a different mode with its own mood. The table below lists all seven modes of ${parentName}.`,
    }),
    modeOf: ({ root, modeName, modeNumber, parentName, parentRoot }) => ({
      title: `${root} ${modeName} is the ${ordinal(modeNumber)} mode of ${parentName}`,
      text: `It uses exactly the same notes as ${parentName}, but treats ${b(root)} as home instead of ${b(parentRoot)}. Start the ${parentName} scale on its ${ordinal(modeNumber)} note and you get ${root} ${modeName}.`,
    }),
    relative: (p) => {
      const shared = p.letterPerDegree ? "all seven notes and the same key signature" : `the same ${p.noteCount} notes`;
      const direction = `${halfSteps(p.semitones)} (${frets(p.semitones)}) ${p.higher ? "higher" : "lower"} than ${p.root}`;
      return {
        title: p.kind === "relative-minor" ? `Relative minor: ${p.otherName}` : `Relative major: ${p.otherName}`,
        text:
          `${p.title} and ${p.otherName} share ${shared} — that is why ${p.minorName} is called the relative minor of ${p.majorName}. ` +
          `${b(p.otherRoot)} is the ${ordinal(p.position)} note of ${p.title}${p.label ? ` (the ${p.label})` : ""} — ${direction}. ` +
          "On the fretboard both scales use identical shapes — only the note you treat as home changes.",
      };
    },
    parallel: ({ quality, name, changes: list, notes, common }) => ({
      title: `Parallel ${quality}: ${name}`,
      text: list
        ? `Same root, different notes. ${name} ${list[0]?.direction === "raised" ? "raises" : "lowers"} the ${joinList(list.map((c) => ordinal(c.degree)))} by a half step (${joinList(list.map((c) => c.note))} instead of ${joinList(list.map((c) => c.from))}).`
        : `Same root, different notes: ${name} is ${notes.join(" ")}. They share only ${joinList(common)}.`,
    }),
    neighbour: ({ title, otherName, change }) => ({
      title: `One note away: ${otherName}`,
      text: `${change.direction === "raised" ? "Raise" : "Lower"} the ${ordinal(change.degree)} by a half step (${change.from} → ${change.note}) and ${title} becomes ${otherName}.`,
    }),
    containedIn: ({ title, otherName, added }) => ({
      title: `Fits inside ${otherName}`,
      text: `Every note of ${title} is also in ${otherName}. Add ${joinList(added.map(ref))} and you get ${otherName}.`,
    }),
    contains: ({ otherName, removed }) => ({
      title: `Contains ${otherName}`,
      text: `Take away ${joinList(removed.map(ref))} and you are left with ${otherName}.`,
    }),
    symmetry: ({ period, roots, name }) => ({
      title: "A symmetrical scale",
      text: `The pattern repeats every ${halfSteps(period)}, so the ${joinList(roots)} ${name} scales all contain exactly the same notes. That means there are only ${period} different ${name} scales in total.`,
    }),

    respelledRoot: ({ shown, from, avoided }) =>
      `Shown as ${b(shown)}: spelling it from ${from} would need ${avoided.length === 1 ? "a double sharp or flat" : "double sharps or flats"} (${avoided.join(", ")}). Both names sound exactly the same.`,
    enharmonicTip: ({ current, currentCount, currentFlats, alternative, alternativeCount }) =>
      `Tip: ${current} (${currentCount} ${currentFlats ? "flats" : "sharps"}) is more often written as ${b(alternative)} (${alternativeCount} ${currentFlats ? "sharps" : "flats"}). They sound identical.`,
    respelledNote: ({ label, used, original }) =>
      `The ${label} is written ${b(used)} instead of ${original} to avoid a double sharp or flat.`,

    chordBasis: ({ basis, noteCount, parentName, scaleTitle, wholeTone }) => {
      if (basis === "scale") return "Each chord is built by stacking every other note of the scale (thirds) on top of a scale note.";
      if (basis === "symmetric")
        return wholeTone
          ? "Stacking every other note of a whole-tone scale always gives an augmented triad — every chord is the same shape, moved up a whole step."
          : "Stacking every other note of the diminished scale gives diminished chords — the same shape repeats every 3 frets.";
      return `A ${noteCount}-note scale is too sparse to stack thirds, so these are the chords of its parent scale, ${parentName}. The ${scaleTitle} scale fits over all of them.`;
    },
  };
}

export const englishTheory: TheoryLanguage = createEnglishTheory();
