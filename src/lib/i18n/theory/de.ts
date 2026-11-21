import { b, listJoiner, naturalNames, type DegreeChangeText, type NoteFormat, type NoteRef, type TheoryLanguage } from "@/lib/theory";
import type { IntervalQuality } from "@/lib/theory";
import { lowerFirst, scaleTexts, type ScaleTexts } from "./shared";

/** Deutsche Namen und Beschreibungen der Tonleitern. Titel werden als „C-Dur“, „D-Dorisch“ … gebildet. */
export const DE_SCALES: ScaleTexts = {
  major: {
    name: "Dur",
    modeName: "Ionisch",
    character: "Hell, stabil und fröhlich — der Bezugspunkt fast der gesamten westlichen Musiktheorie.",
    usage: "Pop, Rock, Folk, Country und Klassik — unzählige Melodien und Akkordfolgen.",
  },
  "major-pentatonic": {
    name: "Dur-Pentatonik",
    character: "Offen, lieblich und sanglich — ohne Halbtonschritte kann man kaum einen „falschen“ Ton spielen.",
    usage: "Country, Southern Rock, Bluesrock-Soli und Folk-Melodien.",
  },
  lydian: {
    name: "Lydisch",
    character: "Verträumt, schwebend und besonders hell — die erhöhte 4. Stufe gibt einen schimmernden „Science-Fiction“-Klang.",
    usage: "Film- und Spielemusik, Joe Satriani, Steve Vai und Jazz.",
  },
  mixolydian: {
    name: "Mixolydisch",
    character: "Dur, aber bluesig — die erniedrigte 7. Stufe sorgt für lässigen Rock-’n’-Roll-Charakter.",
    usage: "Classic Rock, Blues, Funk, Jambands und keltische Musik.",
  },
  "natural-minor": {
    name: "Moll (natürlich)",
    fullName: "Moll (natürlich, äolisch)",
    modeName: "Äolisch",
    character: "Traurig, ernst und ausdrucksstark — der typische Mollklang.",
    usage: "Rock, Metal, Pop-Balladen, Filmmusik und Klassik.",
  },
  "harmonic-minor": {
    name: "Moll harmonisch",
    character: "Dunkel und exotisch — die erhöhte 7. Stufe erzeugt einen dramatischen Sprung von anderthalb Tönen.",
    usage: "Neoklassischer Metal, Flamenco, orientalische Farben und Klassik.",
  },
  "melodic-minor": {
    name: "Moll melodisch",
    character: "Geschmeidig und raffiniert — unten Moll, oben Dur.",
    usage: "Jazz und Fusion (die „Jazz“-Variante: aufwärts und abwärts gleich).",
  },
  "minor-pentatonic": {
    name: "Moll-Pentatonik",
    character: "Die Heimat jedes Gitarristen — rau, bluesig und sofort erkennbar.",
    usage: "Blues, Rock, Metal und Funk — die meisten Gitarrensoli beginnen hier.",
  },
  dorian: {
    name: "Dorisch",
    character: "Moll, aber hoffnungsvoll — die große Sexte bringt eine soulige, jazzige Helligkeit.",
    usage: "Funk, Jazz, Santana, Pink Floyd und Folk.",
  },
  phrygian: {
    name: "Phrygisch",
    character: "Dunkel und spanisch klingend — die erniedrigte 2. Stufe erzeugt sofort Spannung.",
    usage: "Metal, Flamenco und dramatische Filmmusik.",
  },
  locrian: {
    name: "Lokrisch",
    character: "Instabil und unruhig — durch die verminderte Quinte gibt es keinen festen Grundakkord.",
    usage: "Metal-Riffs, Spannungsmomente und Jazz über halbverminderten Akkorden.",
  },
  blues: {
    name: "Blues",
    character: "Moll-Pentatonik plus „Blue Note“ — rau, ausdrucksstark und gesanglich.",
    usage: "Blues, Rock, Jazz und Soul.",
  },
  "major-blues": {
    name: "Dur-Blues",
    character: "Dur-Pentatonik plus eine ♭3 als „Blue Note“, die in die große Terz gleitet — sonnig, aber mit bluesigem Biss.",
    usage: "Country, Rockabilly, Texas-Blues, B.B. King und die Allman Brothers.",
  },
  "lydian-dominant": {
    name: "Lydisch-dominant",
    character: "Hell und abenteuerlustig — die erhöhte 4. Stufe von Lydisch mit der kleinen Septime von Mixolydisch.",
    usage: "Jazz über Dominantseptakkorden, Fusion und die Titelmelodie der Simpsons.",
  },
  altered: {
    name: "Alteriert",
    fullName: "Alteriert (superlokrisch)",
    character: "Maximale Spannung — jeder Ton, der sich alterieren lässt, ist alteriert, daher zieht sie stark zum nächsten Akkord.",
    usage: "Jazz-Soli über Dominantakkorden, die sich auflösen (V7 → I). Jazzmusiker denken ihre Töne als ♭9, ♯9, 3, ♭5, ♯5 und ♭7.",
  },
  "whole-tone": {
    name: "Ganztonleiter",
    character: "Traumhaft und mehrdeutig — jeder Schritt ist gleich groß, daher gibt es kein klares Zuhause.",
    usage: "Impressionismus (Debussy), Jazz über übermäßigen Akkorden, Traumsequenzen.",
  },
  diminished: {
    name: "Ganzton-Halbton",
    fullName: "Ganzton-Halbton (vermindert)",
    character: "Spannungsvoll und symmetrisch — streng abwechselnd Ganz- und Halbtonschritte.",
    usage: "Jazz über verminderten Septakkorden, Metal und spannende Filmmusik.",
  },
  "diminished-half-whole": {
    name: "Halbton-Ganzton",
    fullName: "Halbton-Ganzton (vermindert)",
    character: "Kantig und symmetrisch — abwechselnd Halb- und Ganztonschritte, voller ♭9- und ♯9-Farben.",
    usage: "Jazz über Dominantseptakkorden mit ♭9, Fusion und Metal.",
  },
  "phrygian-dominant": {
    name: "Phrygisch-dominant",
    fullName: "Phrygisch-dominant (spanisch)",
    character: "Feurig und exotisch — die dunkle kleine Sekunde von Phrygisch mit einer hellen großen Terz.",
    usage: "Flamenco, Metal, orientalische Musik und Klezmer; der 5. Modus von harmonisch Moll.",
  },
  "hungarian-minor": {
    name: "Ungarisch-Moll",
    character: "Dramatisch und unheimlich — harmonisch Moll mit erhöhter 4. Stufe und zwei Sprüngen von anderthalb Tönen.",
    usage: "Osteuropäische Musik, Gypsy-Musik, neoklassischer Metal und Filmmusik.",
  },
  "double-harmonic": {
    name: "Doppelharmonisch",
    fullName: "Doppelharmonisch (byzantinisch)",
    character: "Stark orientalisch — zwei Sprünge von anderthalb Tönen rund um einen Durakkord.",
    usage: "Arabisch und indisch gefärbte Melodien, Surfrock (Misirlou) und Filmmusik.",
  },
  hirajoshi: {
    name: "Hirajoshi",
    character: "Zart und melancholisch — eine japanische pentatonische Tonleiter mit zwei Halbtonschritten.",
    usage: "Japanische Koto-Musik, Ambient und atmosphärischer Metal.",
  },
};

const QUALITY: Record<IntervalQuality, string> = {
  perfect: "Reine",
  major: "Große",
  minor: "Kleine",
  augmented: "Übermäßige",
  diminished: "Verminderte",
  "doubly-augmented": "Doppelt übermäßige",
  "doubly-diminished": "Doppelt verminderte",
};
const DEGREE = ["Prime", "Sekunde", "Terz", "Quarte", "Quinte", "Sexte", "Septime"];
const MODES = ["Ionisch", "Dorisch", "Phrygisch", "Lydisch", "Mixolydisch", "Äolisch", "Lokrisch"];
const CHORDS: Record<string, string> = {
  maj: "Dur",
  min: "Moll",
  dim: "vermindert",
  aug: "übermäßig",
  maj7: "mit großer Septime",
  "7": "Dominantseptakkord",
  m7: "Moll-Septakkord",
  m7b5: "halbvermindert",
  dim7: "verminderter Septakkord",
  mMaj7: "Moll mit großer Septime",
  augMaj7: "übermäßig mit großer Septime",
  aug7: "übermäßiger Septakkord",
  majb5: "Dur mit verminderter Quinte",
  "7b5": "Dominantseptakkord mit verminderter Quinte",
  m6: "Moll mit Sexte",
  sus2b5: "sus2 mit verminderter Quinte",
  "6sus2b5": "sus2 mit Sexte und verminderter Quinte",
};

export function createGermanTheory(format: NoteFormat): TheoryLanguage {
  const text = scaleTexts(DE_SCALES);
  const ordinal = (n: number) => `${n}.`;
  const halfSteps = (n: number) => (n === 1 ? "1 Halbton" : `${n} Halbtöne`);
  const frets = (n: number) => (n === 1 ? "1 Bund" : `${n} Bünde`);
  const joinList = listJoiner("und");
  const step = (semitones: number) => {
    switch (semitones) {
      case 1:
        return { symbol: "H", name: "Halbton" };
      case 2:
        return { symbol: "G", name: "Ganzton" };
      case 3:
        return { symbol: "G+H", name: "anderthalb Töne" };
      case 4:
        return { symbol: "2G", name: "zwei Ganztöne" };
      default:
        return { symbol: `${semitones}H`, name: `${semitones} Halbtöne` };
    }
  };
  const intervalName = ({ degree, quality }: { degree: number; quality: IntervalQuality }) =>
    degree === 1 && quality === "perfect" ? "Grundton" : `${QUALITY[quality]} ${DEGREE[degree - 1]}`;
  // German grammar: "der Stammton" (masculine) vs "die Tonsilbe" (feminine).
  const word =
    format.naming === "solfege"
      ? { nom: "die Tonsilbe", acc: "die Tonsilbe", each: "jede Tonsilbe", many: "Tonsilben", all: `jede Tonsilbe (${naturalNames(format).join(" ")})` }
      : { nom: "der Stammton", acc: "den Stammton", each: "jeder Stammton", many: "Stammtöne", all: `jeden Stammton (${naturalNames(format).join(" ")})` };
  const accidentalWords = (accidental: number) => {
    const sharp = accidental > 0;
    return Math.abs(accidental) === 1 ? (sharp ? "einem ♯" : "einem ♭") : sharp ? "einem Doppelkreuz" : "einem Doppel-♭";
  };
  const change = (c: DegreeChangeText) =>
    `eine ${c.direction === "raised" ? "erhöhte" : "erniedrigte"} ${ordinal(c.degree)} Stufe (${c.note} statt ${c.from})`;
  const ref = (r: NoteRef) => (r.label ? `die ${r.label} (${r.note})` : `die ${ordinal(r.degree)} Stufe (${r.note})`);
  const dativePlural = (name: string) => (name === "Halbton" ? "Halbtönen" : name === "Ganzton" ? "Ganztönen" : name);
  const hyphenate = (root: string, name: string) => `${root}-${name}`;

  return {
    note: format.note,
    letter: format.letter,
    scaleName: text.name,
    scaleFullName: text.fullName,
    modeName: (s, index) => text.modeName(s, MODES[index]),
    character: text.character,
    usage: text.usage,
    title: hyphenate,
    intervalName,
    rootLabel: "G",
    ordinal,
    halfSteps,
    frets,
    joinList,
    step,
    chordTypeName: (id, english) => CHORDS[id] ?? english,
    chordName: (root, typeName) => (/^(Dur|Moll)\b/.test(typeName) ? `${root}-${typeName}` : `${root} ${typeName}`),
    chordGap: (s) => (s === 3 ? "kleine Terz" : s === 4 ? "große Terz" : halfSteps(s)),

    construction: ({ root, moves, summary, scaleName }) => {
      const parts = moves.map((m, i) => {
        const s = step(m.semitones);
        const article = /^(anderthalb|zwei|\d)/.test(s.name) ? "" : "einen ";
        const target = i === moves.length - 1 ? `zurück zu ${b(m.to)}, eine Oktave höher` : `zu ${b(m.to)}`;
        return `${article}${s.name} (${frets(m.semitones)}) ${target}`;
      });
      return [
        `Beginne auf ${b(root)}. Geh ${parts[0].replace(/ zu /, " aufwärts zu ")}` +
          (parts.length > 2 ? `, dann ${parts.slice(1, -1).join(", ")}` : "") +
          ` und zum Schluss ${parts[parts.length - 1]}.`,
        `Das ergibt das Muster ${b(summary)}. Jede Tonleiter vom Typ ${scaleName} verwendet dieses Muster — nur der Anfangston ändert sich.`,
        "Auf der Gitarre sieht man das sofort: Auf einer Saite ist ein Halbton (H) der nächste Bund, ein Ganzton (G) überspringt einen Bund.",
      ];
    },
    characterHeading: (q) => (q === "major" ? "Warum sie nach Dur klingt" : q === "minor" ? "Warum sie nach Moll klingt" : "Dur oder Moll?"),
    third: ({ quality, note, semitones, root }) =>
      `Sie hat eine ${b(quality === "major" ? "große Terz" : "kleine Terz")}: ${b(note)} liegt ${halfSteps(semitones)} über ${root}. ` +
      "Die Terz ist der Ton, der entscheidet, ob eine Tonleiter nach Dur (heller) oder nach Moll (dunkler) klingt.",
    noThird: () => "Sie hat keine eindeutige große oder kleine Terz und klingt daher weder eindeutig nach Dur noch nach Moll.",
    majorYardstick: () =>
      "Die Durtonleiter ist der Maßstab der Musiktheorie: Jeder Intervallname (große Terz, reine Quinte …) wird an ihr gemessen. Deshalb lautet ihre Formel einfach 1 2 3 4 5 6 7, und andere Tonleitern werden danach beschrieben, wie sie sich von ihr unterscheiden.",
    comparedWith: ({ reference, changes }) => `Verglichen mit ${reference} hat sie ${joinList(changes.map(change))}.`,
    plusOneNote: ({ base, label, note, blueNote }) =>
      `Es ist die Tonleiter ${base} plus ein zusätzlicher Ton: die ${label} (${b(note)})` +
      (blueNote ? " — die berühmte „Blue Note“, die Spannung und Biss bringt." : "."),
    withNotesRemoved: ({ parent, removed, noHalfSteps }) =>
      `Es ist die Tonleiter ${parent} ohne die ${joinList(removed.map((r) => `${ordinal(r.degree)} Stufe (${r.note})`))}` +
      (noHalfSteps ? " — dadurch bleiben keine Halbtonschritte übrig, sodass jeder Ton zu den anderen passt." : "."),
    equalSteps: (name) => `Jeder Schritt ist ein ${name}, daher wirkt kein Ton wie „zu Hause“ — die Tonleiter scheint zu schweben.`,
    alternatingSteps: (a, c) =>
      `Sie wechselt streng zwischen ${dativePlural(a)} und ${dativePlural(c)} und ist dadurch vollkommen symmetrisch und sehr spannungsreich.`,
    noPerfectFifth: ({ fifth }) =>
      `Sie hat keine reine Quinte${fifth ? ` (ihre Quinte ist ${b(fifth.note)}, eine ${lowerFirst(fifth.intervalName)})` : ""}, daher ist der Akkord auf dem Grundton kein stabiler Dur- oder Mollakkord — er kommt nie ganz zur Ruhe.`,

    whyIntroLetters: ({ root, letters, formula }) =>
      `Eine Tonleiter mit 7 Tönen verwendet ${word.all} genau einmal, der Reihe nach. Ab ${root} müssen die ${word.many} also ${b(letters.join(" "))} sein. Die Formel (${formula}) entscheidet dann, ob ${word.each} ein ♯, ein ♭ oder nichts braucht.`,
    whyIntroSparse: ({ count, formula }) =>
      `Diese Tonleiter mit ${count} Tönen überspringt einige ${word.many}, daher wird jeder Ton nach der Stufe benannt, die er darstellt: Eine ♭3 wird als eine Art Terz geschrieben, eine ♭7 als eine Art Septime. So bleiben die Tonnamen im Einklang mit der Formel (${formula}).`,
    whyRoot: (note) => `${b(note)} ist der Grundton — der Heimatton, auf dem die Tonleiter aufgebaut ist und nach dem sie benannt wird.`,
    whyHead: ({ note, intervalName: name, semitones, root }) => `${b(note)} — ${name}, ${halfSteps(semitones)} über ${root}.`,
    whyRespelled: ({ original, note }) =>
      `Streng genommen ist es eine andere Stufe (${original}), aber der Ton wird ${note} geschrieben, um ein Doppelkreuz oder Doppel-♭ zu vermeiden — gleicher Klang, leichter zu lesen.`,
    whyNatural: ({ degree, letter, semitones, letterPerDegree }) =>
      letterPerDegree
        ? `Stufe ${degree} verwendet ${word.acc} ${letter}, und ${letter} ohne Vorzeichen liegt genau ${halfSteps(semitones)} höher — kein ♯ oder ♭ nötig.`
        : `Als eine Art ${DEGREE[degree - 1]} verwendet er ${word.acc} ${letter}, und ${letter} ohne Vorzeichen liegt genau im richtigen Abstand — kein ♯ oder ♭ nötig.`,
    whyAccidental: ({ degree, letter, naturalSemitones, accidental, note, letterPerDegree }) => {
      const direction = accidental > 0 ? "erhöht" : "erniedrigt";
      return letterPerDegree
        ? `Stufe ${degree} muss ${word.acc} ${letter} verwenden, aber ${letter} ohne Vorzeichen liegt ${halfSteps(naturalSemitones)} höher, also wird er mit ${accidentalWords(accidental)} zu ${note} ${direction}.`
        : `Als eine Art ${DEGREE[degree - 1]} verwendet er ${word.acc} ${letter}; ${letter} ohne Vorzeichen liegt ${halfSteps(naturalSemitones)} höher, also wird er mit ${accidentalWords(accidental)} ${direction}.`;
    },
    whyWrittenAs: ({ note, alternative, alternativeLetter, degree, owner }) =>
      owner
        ? `Er wird ${note} geschrieben und nicht ${alternative}, weil ${word.nom} ${alternativeLetter} schon ${owner.isRoot ? "zum Grundton" : `zur ${ordinal(owner.degree)} Stufe`} (${owner.note}) gehört.`
        : `Er wird ${note} geschrieben und nicht ${alternative}, weil er als ${ordinal(degree)} Stufe der Tonleiter dient.`,

    relationshipKind: {
      mode: "Modus",
      relative: "Parallele",
      parallel: "Variante",
      neighbour: "Nah verwandt",
      "contained-in": "Größere Tonleiter",
      contains: "Kleinere Tonleiter",
      symmetry: "Symmetrie",
    },
    modeParent: ({ title, parentName }) => ({
      title: `${title} ist die Mutter von sieben Modi`,
      text: `Spiele dieselben sieben Töne, aber wähle einen anderen Ton als Zuhause, und du erhältst einen anderen Modus mit eigener Stimmung. Die Tabelle unten zeigt alle sieben Modi von ${parentName}.`,
    }),
    modeOf: ({ root, modeName, modeNumber, parentName, parentRoot }) => ({
      title: `${hyphenate(root, modeName)} ist der ${ordinal(modeNumber)} Modus von ${parentName}`,
      text: `Er verwendet genau dieselben Töne wie ${parentName}, behandelt aber ${b(root)} statt ${b(parentRoot)} als Zuhause. Beginne die Tonleiter ${parentName} auf ihrem ${ordinal(modeNumber)} Ton, und du erhältst ${hyphenate(root, modeName)}.`,
    }),
    relative: (p) => {
      const shared = p.letterPerDegree ? "alle sieben Töne und dieselben Vorzeichen" : `dieselben ${p.noteCount} Töne`;
      return {
        title: p.kind === "relative-minor" ? `Paralleltonart (Moll): ${p.otherName}` : `Paralleltonart (Dur): ${p.otherName}`,
        text:
          `${p.title} und ${p.otherName} teilen ${shared} — deshalb ist ${p.minorName} die Moll-Parallele von ${p.majorName}. ` +
          `${b(p.otherRoot)} ist der ${ordinal(p.position)} Ton von ${p.title}${p.label ? ` (die ${p.label})` : ""} — ${halfSteps(p.semitones)} (${frets(p.semitones)}) ${p.higher ? "höher" : "tiefer"} als ${p.root}. ` +
          "Auf dem Griffbrett nutzen beide Tonleitern genau dieselben Formen — nur der Ton, der sich wie Zuhause anfühlt, ändert sich.",
      };
    },
    parallel: ({ quality, name, changes, notes, common }) => ({
      title: `Variante (${quality === "major" ? "Dur" : "Moll"}): ${name}`,
      text: changes
        ? `Gleicher Grundton, andere Töne. ${name} ${changes[0]?.direction === "raised" ? "erhöht" : "erniedrigt"} die ${joinList(changes.map((c) => ordinal(c.degree)))} Stufe um einen Halbton (${joinList(changes.map((c) => c.note))} statt ${joinList(changes.map((c) => c.from))}).`
        : `Gleicher Grundton, andere Töne: ${name} besteht aus ${notes.join(" ")}. Gemeinsam sind nur ${joinList(common)}.`,
    }),
    neighbour: ({ title, otherName, change: c }) => ({
      title: `Ein Ton Unterschied: ${otherName}`,
      text: `${c.direction === "raised" ? "Erhöhe" : "Erniedrige"} die ${ordinal(c.degree)} Stufe um einen Halbton (${c.from} → ${c.note}), und aus ${title} wird ${otherName}.`,
    }),
    containedIn: ({ title, otherName, added }) => ({
      title: `Passt in ${otherName}`,
      text: `Jeder Ton von ${title} kommt auch in ${otherName} vor. Füge ${joinList(added.map(ref))} hinzu, und du erhältst ${otherName}.`,
    }),
    contains: ({ otherName, removed }) => ({
      title: `Enthält ${otherName}`,
      text: `Lass ${joinList(removed.map(ref))} weg, und es bleibt ${otherName}.`,
    }),
    symmetry: ({ period, roots, name }) => ({
      title: "Eine symmetrische Tonleiter",
      text: `Das Muster wiederholt sich alle ${halfSteps(period)}, daher enthalten die Tonleitern vom Typ ${name} auf ${joinList(roots)} genau dieselben Töne. Es gibt also nur ${period} verschiedene Tonleitern dieses Typs.`,
    }),

    respelledRoot: ({ shown, from, avoided }) =>
      `Dargestellt als ${b(shown)}: Ab ${from} bräuchte man ${avoided.length === 1 ? "ein Doppelkreuz oder Doppel-♭" : "Doppelkreuze oder Doppel-♭"} (${avoided.join(", ")}). Beide Namen klingen genau gleich.`,
    enharmonicTip: ({ current, currentCount, currentFlats, alternative, alternativeCount }) =>
      `Tipp: ${current} (${currentCount} ${currentFlats ? "♭" : "♯"}) wird häufiger als ${b(alternative)} (${alternativeCount} ${currentFlats ? "♯" : "♭"}) notiert. Beide klingen identisch.`,
    respelledNote: ({ label, used, original }) =>
      `Die ${label} wird als ${b(used)} statt ${original} notiert, um ein Doppelkreuz oder Doppel-♭ zu vermeiden.`,

    chordBasis: ({ basis, noteCount, parentName, scaleTitle, wholeTone }) => {
      if (basis === "scale") return "Jeder Akkord entsteht, indem man auf einem Tonleiterton jeden zweiten Ton der Tonleiter (Terzen) schichtet.";
      if (basis === "symmetric")
        return wholeTone
          ? "Schichtet man jeden zweiten Ton einer Ganztonleiter, entsteht immer ein übermäßiger Dreiklang — jeder Akkord hat dieselbe Form, jeweils einen Ganzton höher."
          : "Schichtet man jeden zweiten Ton der verminderten Tonleiter, entstehen verminderte Akkorde — dieselbe Form wiederholt sich alle 3 Bünde.";
      return `Eine Tonleiter mit ${noteCount} Tönen hat zu wenige Töne, um Terzen zu schichten, daher sind dies die Akkorde ihrer Muttertonleiter ${parentName}. ${scaleTitle} passt über alle diese Akkorde.`;
    },
  };
}
