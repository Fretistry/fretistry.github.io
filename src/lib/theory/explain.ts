import { intervalDisplayLabel } from "./intervals";
import { englishTheory, type DegreeChangeText, type NoteRef, type TheoryLanguage } from "./language";
import { NATURAL_PITCH_CLASS, defaultSpelling, enharmonicAlternative, mod12, pitchClassOf } from "./notes";
import {
  compareDegrees,
  findParallelId,
  findParentMajor,
  findParentScale,
  findRelative,
  findSubsetRelations,
  equivalentRoots,
  symmetryPeriod,
  type ModeFamilyRow,
} from "./relationships";
import {
  scaleDisplayName,
  spellScale,
  spellScaleRaw,
  stepPattern,
  thirdQuality,
  usesEachLetterOnce,
  type ScaleNote,
  type SpelledScale,
  type SpellingNotice,
} from "./scales";
import type { ScaleDefinition, SpelledNote } from "./types";

/**
 * Generates human-readable theory explanations from scale data, in any
 * language that implements `TheoryLanguage` (English by default).
 *
 * Nothing here is written per root note — every sentence is assembled from
 * intervals, spellings and relationships.
 */

export interface IntervalRow {
  index: number;
  note: string;
  /** "R", "♭3", ... */
  intervalLabel: string;
  /** "1", "♭3", ... (formula notation, root shown as 1) */
  formulaLabel: string;
  intervalName: string;
  semitones: number;
}

export interface StepInfo {
  from: string;
  to: string;
  /** Position of the starting note, in semitones above the root. */
  start: number;
  semitones: number;
  symbol: string;
  name: string;
}

export interface WhyNoteItem {
  note: string;
  intervalLabel: string;
  text: string;
}

export type RelationshipKind = "mode" | "relative" | "parallel" | "neighbour" | "contained-in" | "contains" | "symmetry";

export interface RelationshipItem {
  kind: RelationshipKind;
  /** Short label for the kind, in the explanation's language. */
  kindLabel: string;
  title: string;
  text: string;
  /** Lets the UI offer a "show me" button that switches to the related scale. */
  target?: { root: SpelledNote; scaleId: string };
}

export interface ScaleExplanation {
  title: string;
  /** Short title without the alternative name, e.g. "A Natural Minor". */
  shortTitle: string;
  rootLabel: string;
  notes: string[];
  formula: string[];
  intervalRows: IntervalRow[];
  steps: StepInfo[];
  stepSummary: string;
  construction: string[];
  thirdQuality: "major" | "minor" | null;
  characterHeading: string;
  character: string[];
  whyIntro: string;
  whyItems: WhyNoteItem[];
  relationships: RelationshipItem[];
  /** The 7 modes of the parent major scale, with localized mode names. */
  modeFamily: ModeFamilyRow[] | null;
  /** "C Major" — name of the parent key for the mode table. */
  modeFamilyTitle: string | null;
  notices: string[];
  mood: string;
  usage: string;
}

/** Text helpers that need the language. */
class Writer {
  constructor(
    readonly lang: TheoryLanguage,
    readonly registry: readonly ScaleDefinition[],
  ) {}

  note = (n: SpelledNote) => this.lang.note(n);

  /** "A Natural Minor" — root + short scale name. */
  shortTitle(root: SpelledNote, scale: ScaleDefinition): string {
    return this.lang.title(this.note(root), this.lang.scaleName(scale));
  }

  fullTitle(root: SpelledNote, scale: ScaleDefinition): string {
    return this.lang.title(this.note(root), this.lang.scaleFullName(scale));
  }

  change(c: ReturnType<typeof compareDegrees>[number]): DegreeChangeText {
    return { direction: c.direction, degree: c.to.interval.degree, note: this.note(c.to.note), from: this.note(c.from.note) };
  }

  ref(n: ScaleNote): NoteRef {
    const natural = n.interval.quality === "major" || n.interval.quality === "perfect";
    return { degree: n.interval.degree, label: natural ? null : n.interval.label, note: this.note(n.note) };
  }

  byId(id: string): ScaleDefinition | undefined {
    return this.registry.find((s) => s.id === id);
  }
}

// ── Sections ─────────────────────────────────────────────────────────────────

function buildSteps(w: Writer, spelled: SpelledScale): StepInfo[] {
  const pattern = stepPattern(spelled.scale.intervals);
  return spelled.notes.map((n, i) => {
    const next = spelled.notes[(i + 1) % spelled.notes.length];
    const { symbol, name } = w.lang.step(pattern[i]);
    return { from: w.note(n.note), to: w.note(next.note), start: n.semitones, semitones: pattern[i], symbol, name };
  });
}

function buildCharacter(w: Writer, spelled: SpelledScale): { heading: string; paragraphs: string[] } {
  const { lang } = w;
  const quality = thirdQuality(spelled.scale);
  const root = w.note(spelled.root);
  const paragraphs: string[] = [];
  const third = spelled.notes.find((n) => n.interval.degree === 3 && n.semitones === (quality === "minor" ? 3 : 4));

  if (quality && third) {
    paragraphs.push(lang.third({ quality, note: w.note(third.note), semitones: third.semitones, root }));
  } else {
    paragraphs.push(lang.noThird());
  }

  const major = w.byId("major");
  const minor = w.byId("natural-minor");
  const heptatonic = usesEachLetterOnce(spelled.scale);

  if (heptatonic && major && minor) {
    if (spelled.scale.id === major.id) {
      paragraphs.push(lang.majorYardstick());
    } else {
      const vsMajor = compareDegrees(spellScaleRaw(spelled.root, major), spelled.notes);
      if (quality === "minor" && spelled.scale.id !== minor.id) {
        const vsMinor = compareDegrees(spellScaleRaw(spelled.root, minor), spelled.notes);
        if (vsMinor.length) {
          paragraphs.push(lang.comparedWith({ reference: w.shortTitle(spelled.root, minor), changes: vsMinor.map((c) => w.change(c)) }));
        }
        if (vsMajor.length <= 2) {
          paragraphs.push(lang.comparedWith({ reference: w.shortTitle(spelled.root, major), changes: vsMajor.map((c) => w.change(c)) }));
        }
      } else if (vsMajor.length) {
        paragraphs.push(lang.comparedWith({ reference: w.shortTitle(spelled.root, major), changes: vsMajor.map((c) => w.change(c)) }));
      }
    }
  } else {
    // Non-7-note scales: describe them through subset/superset relationships.
    const relations = findSubsetRelations(spelled, w.registry);
    const parent = relations.find(
      (r) => r.kind === "contained-in" && (r.other.scale.id === "major" || r.other.scale.id === "natural-minor"),
    );
    const base = relations.find((r) => r.kind === "contains" && r.difference.length === 1);
    if (base) {
      const extra = base.difference[0];
      paragraphs.push(
        lang.plusOneNote({
          base: w.shortTitle(base.other.root, base.other.scale),
          label: extra.interval.label,
          note: w.note(extra.note),
          blueNote: extra.semitones === 6 || (extra.semitones === 3 && thirdQuality(spelled.scale) === "major"),
        }),
      );
    } else if (parent) {
      paragraphs.push(
        lang.withNotesRemoved({
          parent: w.shortTitle(parent.other.root, parent.other.scale),
          removed: parent.difference.map((n) => ({ degree: n.interval.degree, note: w.note(n.note) })),
          noHalfSteps: !stepPattern(spelled.scale.intervals).includes(1),
        }),
      );
    }
    const pattern = stepPattern(spelled.scale.intervals);
    if (pattern.every((s) => s === pattern[0])) {
      paragraphs.push(lang.equalSteps(lang.step(pattern[0]).name));
    } else if (pattern.every((s, i) => s === pattern[i % 2])) {
      paragraphs.push(lang.alternatingSteps(lang.step(pattern[0]).name, lang.step(pattern[1]).name));
    }
  }

  if (!spelled.scale.intervals.includes(7)) {
    const fifthLike = spelled.notes.find((n) => n.interval.degree === 5);
    paragraphs.push(
      lang.noPerfectFifth({
        fifth: fifthLike ? { note: w.note(fifthLike.note), intervalName: lang.intervalName(fifthLike.interval) } : null,
      }),
    );
  }

  return { heading: lang.characterHeading(quality), paragraphs };
}

function respelledNoteFor(spelled: SpelledScale, n: ScaleNote): Extract<SpellingNotice, { kind: "respelled-note" }> | undefined {
  return spelled.notices.find(
    (x): x is Extract<SpellingNotice, { kind: "respelled-note" }> =>
      x.kind === "respelled-note" && x.used.letter === n.note.letter && x.used.accidental === n.note.accidental,
  );
}

function buildWhy(w: Writer, spelled: SpelledScale, formula: string[]): { intro: string; items: WhyNoteItem[] } {
  const { lang } = w;
  const root = w.note(spelled.root);
  const letterPerDegree = usesEachLetterOnce(spelled.scale);
  const formulaText = formula.join(" ");

  const intro = letterPerDegree
    ? lang.whyIntroLetters({ root, letters: spelled.notes.map((n) => lang.letter(n.note.letter)), formula: formulaText })
    : lang.whyIntroSparse({ count: spelled.notes.length, formula: formulaText });

  const items = spelled.notes.map((n): WhyNoteItem => {
    const name = w.note(n.note);
    const intervalLabel = intervalDisplayLabel(n.interval, lang.rootLabel);
    if (n.index === 0) return { note: name, intervalLabel, text: lang.whyRoot(name) };

    const head = lang.whyHead({ note: name, intervalName: lang.intervalName(n.interval), semitones: n.semitones, root });
    const respelled = respelledNoteFor(spelled, n);
    if (respelled) {
      return { note: name, intervalLabel, text: `${head} ${lang.whyRespelled({ original: w.note(respelled.original), note: name })}` };
    }

    const letter = lang.letter(n.note.letter);
    const degree = n.interval.degree;
    let detail: string;
    if (n.note.accidental === 0) {
      detail = lang.whyNatural({ degree, letter, semitones: n.semitones, letterPerDegree });
    } else {
      const naturalSemitones = mod12(NATURAL_PITCH_CLASS[n.note.letter] - pitchClassOf(spelled.root));
      detail = lang.whyAccidental({ degree, letter, naturalSemitones, accidental: n.note.accidental, note: name, letterPerDegree });
      const alt = enharmonicAlternative(n.note) ?? defaultSpelling(pitchClassOf(n.note), n.note.accidental < 0);
      if (alt.letter !== n.note.letter) {
        const owner = spelled.notes.find((o) => o.note.letter === alt.letter);
        detail += ` ${lang.whyWrittenAs({
          note: name,
          alternative: w.note(alt),
          alternativeLetter: lang.letter(alt.letter),
          degree,
          owner: owner ? { isRoot: owner.index === 0, degree: owner.interval.degree, note: w.note(owner.note) } : null,
        })}`;
      }
    }
    return { note: name, intervalLabel, text: `${head} ${detail}` };
  });

  return { intro, items };
}

function buildRelationships(w: Writer, spelled: SpelledScale) {
  const { lang, registry } = w;
  const items: RelationshipItem[] = [];
  const add = (kind: RelationshipKind, t: { title: string; text: string }, target?: RelationshipItem["target"]) =>
    items.push({ kind, kindLabel: lang.relationshipKind[kind], ...t, ...(target ? { target } : {}) });
  const title = w.shortTitle(spelled.root, spelled.scale);
  const root = w.note(spelled.root);
  const heptatonic = usesEachLetterOnce(spelled.scale);
  const majorDef = w.byId("major");

  // 1. Mode of the major scale
  const parent = findParentMajor(spelled, registry);
  let modeFamily: ModeFamilyRow[] | null = null;
  let modeFamilyTitle: string | null = null;
  if (parent && majorDef) {
    const parentName = w.shortTitle(parent.parentRoot, majorDef);
    modeFamily = parent.modes.map((m, k) => ({ ...m, name: lang.modeName(m.scaleId ? w.byId(m.scaleId) : undefined, k) }));
    modeFamilyTitle = parentName;
    if (parent.modeNumber === 1) {
      add("mode", lang.modeParent({ title, parentName }));
    } else {
      add(
        "mode",
        lang.modeOf({
          root,
          modeName: modeFamily[parent.modeNumber - 1].name,
          modeNumber: parent.modeNumber,
          parentName,
          parentRoot: w.note(parent.parentRoot),
        }),
        { root: parent.parentRoot, scaleId: "major" },
      );
    }
  } else {
    // 1b. Mode of harmonic minor, melodic minor or double harmonic
    const other = findParentScale(spelled, registry);
    if (other) {
      add(
        "mode",
        lang.modeOf({
          root,
          modeName: lang.scaleName(spelled.scale),
          modeNumber: other.modeNumber,
          parentName: w.shortTitle(other.parentRoot, other.parent),
          parentRoot: w.note(other.parentRoot),
        }),
        { root: other.parentRoot, scaleId: other.parent.id },
      );
    }
  }

  // 2. Relative major / minor
  const relative = findRelative(spelled, registry);
  if (relative) {
    const { match } = relative;
    const otherName = w.shortTitle(match.root, match.scale);
    const up = spelled.notes[match.startIndex].semitones;
    const down = 12 - up;
    const relNote = spelled.notes[match.startIndex];
    add(
      "relative",
      lang.relative({
        kind: relative.kind,
        title,
        otherName,
        letterPerDegree: heptatonic,
        noteCount: spelled.notes.length,
        majorName: relative.kind === "relative-minor" ? title : otherName,
        minorName: relative.kind === "relative-minor" ? otherName : title,
        otherRoot: w.note(match.root),
        position: match.startIndex + 1,
        label: w.ref(relNote).label,
        semitones: up <= down ? up : down,
        higher: up <= down,
        root,
      }),
      { root: match.root, scaleId: match.scale.id },
    );
  }

  // 3. Parallel scale (same root, other side of the relative pair)
  const parallelId = findParallelId(spelled.scale.id);
  const parallelDef = parallelId ? w.byId(parallelId) : undefined;
  if (parallelDef) {
    const parallel = spellScale(spelled.root, parallelDef);
    const bothHeptatonic = heptatonic && usesEachLetterOnce(parallelDef);
    const currentSet = new Set(spelled.notes.map((n) => n.semitones));
    add(
      "parallel",
      lang.parallel({
        quality: thirdQuality(parallelDef) === "major" ? "major" : "minor",
        name: w.shortTitle(spelled.root, parallelDef),
        changes: bothHeptatonic ? compareDegrees(spelled.notes, parallel.notes).map((c) => w.change(c)) : null,
        notes: parallel.notes.map((n) => w.note(n.note)),
        common: parallel.notes.filter((n) => currentSet.has(n.semitones)).map((n) => w.note(n.note)),
      }),
      { root: spelled.root, scaleId: parallelDef.id },
    );
  }

  // 4. Seven-note scales on the same root that differ by exactly one note
  if (heptatonic) {
    const neighbours = registry
      .filter((d) => d.id !== spelled.scale.id && d.id !== parallelId && usesEachLetterOnce(d))
      .map((d) => ({ def: d, changes: compareDegrees(spelled.notes, spellScaleRaw(spelled.root, d)) }))
      .filter((x) => x.changes.length === 1)
      .slice(0, 3);
    for (const { def, changes } of neighbours) {
      add("neighbour", lang.neighbour({ title, otherName: w.shortTitle(spelled.root, def), change: w.change(changes[0]) }), {
        root: spelled.root,
        scaleId: def.id,
      });
    }
  }

  // 5. Subsets / supersets on the same root
  const relations = findSubsetRelations(spelled, registry)
    .filter((r) => r.other.scale.id !== parallelId)
    .slice(0, 4);
  for (const r of relations) {
    const otherName = w.shortTitle(r.other.root, r.other.scale);
    const refs = r.difference.map((n) => w.ref(n));
    const target = { root: r.other.root, scaleId: r.other.scale.id };
    if (r.kind === "contained-in") add("contained-in", lang.containedIn({ title, otherName, added: refs }), target);
    else add("contains", lang.contains({ otherName, removed: refs }), target);
  }

  // 6. Symmetry
  const period = symmetryPeriod(spelled.scale.intervals);
  if (period) {
    add("symmetry", lang.symmetry({ period, roots: equivalentRoots(spelled).map(w.note), name: lang.scaleName(spelled.scale) }));
  }

  return { items, modeFamily, modeFamilyTitle };
}

/** Human-readable versions of the spelling notices. */
export function describeNotices(spelled: SpelledScale, lang: TheoryLanguage = englishTheory): string[] {
  const name = lang.scaleName(spelled.scale);
  const t = (root: SpelledNote) => lang.title(lang.note(root), name);
  return spelled.notices.map((n) => {
    switch (n.kind) {
      case "respelled-root":
        return lang.respelledRoot({ shown: t(n.usedRoot), from: lang.note(n.requestedRoot), avoided: n.avoided.map(lang.note) });
      case "enharmonic-tip":
        return lang.enharmonicTip({
          current: t(spelled.root),
          currentCount: n.currentAccidentals,
          currentFlats: spelled.notes.some((x) => x.note.accidental < 0),
          alternative: t(n.alternativeRoot),
          alternativeCount: n.alternativeAccidentals,
        });
      case "respelled-note":
        return lang.respelledNote({ label: n.interval.label, used: lang.note(n.used), original: lang.note(n.original) });
    }
  });
}

/** Builds the complete explanation for a spelled scale. */
export function explainScale(
  spelled: SpelledScale,
  registry: readonly ScaleDefinition[],
  lang: TheoryLanguage = englishTheory,
): ScaleExplanation {
  const w = new Writer(lang, registry);
  const formula = spelled.notes.map((n) => n.interval.label);
  const steps = buildSteps(w, spelled);
  const stepSummary = steps.map((s) => s.symbol).join(" – ");
  const character = buildCharacter(w, spelled);
  const why = buildWhy(w, spelled, formula);
  const rel = buildRelationships(w, spelled);

  return {
    title: w.fullTitle(spelled.root, spelled.scale),
    shortTitle: w.shortTitle(spelled.root, spelled.scale),
    rootLabel: w.note(spelled.root),
    notes: spelled.notes.map((n) => w.note(n.note)),
    formula,
    intervalRows: spelled.notes.map((n) => ({
      index: n.index,
      note: w.note(n.note),
      intervalLabel: intervalDisplayLabel(n.interval, lang.rootLabel),
      formulaLabel: n.interval.label,
      intervalName: lang.intervalName(n.interval),
      semitones: n.semitones,
    })),
    steps,
    stepSummary,
    construction: lang.construction({
      root: w.note(spelled.root),
      moves: steps.map((s) => ({ to: s.to, semitones: s.semitones })),
      summary: stepSummary,
      scaleName: lang.scaleName(spelled.scale),
    }),
    thirdQuality: thirdQuality(spelled.scale),
    characterHeading: character.heading,
    character: character.paragraphs,
    whyIntro: why.intro,
    whyItems: why.items,
    relationships: rel.items,
    modeFamily: rel.modeFamily,
    modeFamilyTitle: rel.modeFamilyTitle,
    notices: [
      ...describeNotices(spelled, lang),
      // Jazz scales: the chord they're played over, and their notes named from it (C7alt: 1 ♭9 ♯9 3 ♭5 ♯5 ♭7)
      ...(spelled.scale.playedOver
        ? [lang.playedOver({ chord: lang.note(spelled.root) + spelled.scale.playedOver.suffix, labels: spelled.scale.playedOver.labels.join(" ") })]
        : []),
    ],
    mood: lang.character(spelled.scale),
    usage: lang.usage(spelled.scale),
  };
}

/** "1 half step" / "3 half steps" (English). */
export function halfSteps(n: number): string {
  return englishTheory.halfSteps(n);
}

/** "A", "A and B", "A, B and C" (English). */
export function joinList(items: readonly string[]): string {
  return englishTheory.joinList(items);
}

export { scaleDisplayName };
