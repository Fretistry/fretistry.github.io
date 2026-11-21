import { b, listJoiner, naturalNames, type DegreeChangeText, type NoteFormat, type NoteRef, type TheoryLanguage } from "@/lib/theory";
import type { IntervalQuality } from "@/lib/theory";
import { lowerFirst, scaleTexts, upperFirst, type ScaleTexts } from "./shared";

/** Nederlandse namen en beschrijvingen van de toonladders. */
export const NL_SCALES: ScaleTexts = {
  major: {
    name: "Majeur",
    modeName: "Ionisch",
    character: "Helder, stabiel en vrolijk — het vertrekpunt van bijna alle westerse muziektheorie.",
    usage: "Pop, rock, folk, country en klassiek — talloze melodieën en akkoordenschema’s.",
  },
  "major-pentatonic": {
    name: "Majeur pentatonisch",
    character: "Open, lieflijk en zingbaar — zonder halve tonen is het bijna onmogelijk om een ‘foute’ noot te spelen.",
    usage: "Country, southern rock, bluesrocksolo’s en folkmelodieën.",
  },
  lydian: {
    name: "Lydisch",
    character: "Dromerig, zwevend en extra helder — de verhoogde 4e trap geeft een glinsterende, ‘sciencefiction’-kleur.",
    usage: "Film- en gamemuziek, Joe Satriani, Steve Vai en jazz.",
  },
  mixolydian: {
    name: "Mixolydisch",
    character: "Majeur maar bluesy — de verlaagde 7e trap geeft een relaxte rock-’n-roll-swagger.",
    usage: "Classic rock, blues, funk, jambands en Keltische muziek.",
  },
  "natural-minor": {
    name: "Natuurlijk mineur",
    fullName: "Natuurlijk mineur (aeolisch)",
    modeName: "Aeolisch",
    character: "Droevig, ernstig en expressief — de standaard mineurklank.",
    usage: "Rock, metal, popballades, filmmuziek en klassiek.",
  },
  "harmonic-minor": {
    name: "Harmonisch mineur",
    character: "Donker en exotisch — de verhoogde 7e trap zorgt voor een dramatische sprong van anderhalve toon.",
    usage: "Neoklassieke metal, flamenco, Midden-Oosterse kleuren en klassieke muziek.",
  },
  "melodic-minor": {
    name: "Melodisch mineur",
    character: "Soepel en verfijnd — onderaan mineur, bovenaan majeur.",
    usage: "Jazz en fusion (dit is de ‘jazz’-versie: stijgend en dalend hetzelfde).",
  },
  "minor-pentatonic": {
    name: "Mineur pentatonisch",
    character: "De thuisbasis van elke gitarist — rauw, bluesy en meteen herkenbaar.",
    usage: "Blues, rock, metal en funk — de meeste gitaarsolo’s beginnen hier.",
  },
  dorian: {
    name: "Dorisch",
    character: "Mineur maar hoopvol — de grote sext voegt een soulvolle, jazzy helderheid toe.",
    usage: "Funk, jazz, Santana, Pink Floyd en folk.",
  },
  phrygian: {
    name: "Frygisch",
    character: "Donker en Spaans klinkend — de verlaagde 2e trap zorgt meteen voor spanning.",
    usage: "Metal, flamenco en dramatische filmmuziek.",
  },
  locrian: {
    name: "Locrisch",
    character: "Onstabiel en onrustig — door de verminderde kwint is er geen stevig thuisakkoord.",
    usage: "Metalriffs, spanningsmomenten en jazz over halfverminderde akkoorden.",
  },
  blues: {
    name: "Blues",
    character: "Mineur pentatonisch plus de ‘blue note’ — rauw, expressief en vocaal.",
    usage: "Blues, rock, jazz en soul.",
  },
  "major-blues": {
    name: "Majeur blues",
    character: "Majeur pentatonisch plus een ♭3-‘blue note’ die naar de grote terts glijdt — zonnig, maar met een bluesy randje.",
    usage: "Country, rockabilly, Texasblues, B.B. King en de Allman Brothers.",
  },
  "lydian-dominant": {
    name: "Lydisch dominant",
    character: "Helder en avontuurlijk — de verhoogde 4e trap van lydisch gecombineerd met de verlaagde 7e van mixolydisch.",
    usage: "Jazz over dominant-septiemakkoorden, fusion, en de begintune van The Simpsons.",
  },
  altered: {
    name: "Altered",
    fullName: "Altered (superlocrisch)",
    character: "Maximale spanning — elke noot die je kunt alteren is gealtereerd, dus ze trekt sterk naar het volgende akkoord.",
    usage: "Jazzsolo’s over dominantakkoorden die oplossen (V7 → I). Jazzmuzikanten denken aan haar noten als ♭9, ♯9, 3, ♭5, ♯5 en ♭7.",
  },
  "whole-tone": {
    name: "Heletoonsladder",
    character: "Droomachtig en dubbelzinnig — elke stap is even groot, dus er is geen duidelijk thuis.",
    usage: "Impressionistische muziek (Debussy), jazz over overmatige akkoorden, droomsequenties.",
  },
  diminished: {
    name: "Verminderd",
    fullName: "Verminderd (heel-half)",
    character: "Gespannen en symmetrisch — strikt afwisselend hele en halve tonen.",
    usage: "Jazz over verminderde septiemakkoorden, metal en spannende filmmuziek.",
  },
  "diminished-half-whole": {
    name: "Verminderd half-heel",
    fullName: "Verminderd (half-heel)",
    character: "Prikkelend en symmetrisch — afwisselend halve en hele tonen, vol ♭9- en ♯9-kleur.",
    usage: "Jazz over dominant-septiemakkoorden met ♭9, fusion en metal.",
  },
  "phrygian-dominant": {
    name: "Frygisch dominant",
    fullName: "Frygisch dominant (Spaans)",
    character: "Vurig en exotisch — de donkere verlaagde 2e trap van frygisch met een heldere grote terts.",
    usage: "Flamenco, metal, Midden-Oosterse muziek en klezmer; de 5e modus van harmonisch mineur.",
  },
  "hungarian-minor": {
    name: "Hongaars mineur",
    character: "Dramatisch en spookachtig — harmonisch mineur met een verhoogde 4e trap, met twee sprongen van anderhalve toon.",
    usage: "Oost-Europese en zigeunermuziek, neoklassieke metal en filmmuziek.",
  },
  "double-harmonic": {
    name: "Dubbel harmonisch majeur",
    fullName: "Dubbel harmonisch majeur (Byzantijns)",
    character: "Sterk Midden-Oosters — twee sprongen van anderhalve toon rond een majeurakkoord.",
    usage: "Arabisch en Indiaas getinte melodieën, surfrock (Misirlou) en filmmuziek.",
  },
  hirajoshi: {
    name: "Hirajoshi",
    character: "Teer en melancholisch — een Japanse pentatonische toonladder met twee halve tonen.",
    usage: "Japanse kotomuziek, ambient en sfeervolle metal.",
  },
};

const QUALITY: Record<IntervalQuality, string> = {
  perfect: "reine",
  major: "grote",
  minor: "kleine",
  augmented: "overmatige",
  diminished: "verminderde",
  "doubly-augmented": "dubbel overmatige",
  "doubly-diminished": "dubbel verminderde",
};
const DEGREE = ["prime", "secunde", "terts", "kwart", "kwint", "sext", "septiem"];
const MODES = ["Ionisch", "Dorisch", "Frygisch", "Lydisch", "Mixolydisch", "Aeolisch", "Locrisch"];
const CHORDS: Record<string, string> = {
  maj: "majeur",
  min: "mineur",
  dim: "verminderd",
  aug: "overmatig",
  maj7: "groot septiem",
  "7": "dominant septiem",
  m7: "mineur septiem",
  m7b5: "halfverminderd",
  dim7: "verminderd septiem",
  mMaj7: "mineur groot septiem",
  augMaj7: "overmatig groot septiem",
  aug7: "overmatig septiem",
  majb5: "majeur met verlaagde kwint",
  "7b5": "dominant septiem met verlaagde kwint",
  m6: "mineur sext",
  sus2b5: "sus2 met verlaagde kwint",
  "6sus2b5": "sext sus2 met verlaagde kwint",
};

export function createDutchTheory(format: NoteFormat): TheoryLanguage {
  const text = scaleTexts(NL_SCALES);
  const ordinal = (n: number) => `${n}e`;
  const halfSteps = (n: number) => (n === 1 ? "1 halve toon" : `${n} halve tonen`);
  const frets = (n: number) => (n === 1 ? "1 fret" : `${n} frets`);
  const joinList = listJoiner("en");
  const step = (semitones: number) => {
    switch (semitones) {
      case 1:
        return { symbol: "½", name: "halve toon" };
      case 2:
        return { symbol: "1", name: "hele toon" };
      case 3:
        return { symbol: "1½", name: "anderhalve toon" };
      case 4:
        return { symbol: "2", name: "twee hele tonen" };
      default:
        return { symbol: `${semitones}×½`, name: `${semitones} halve tonen` };
    }
  };
  const intervalName = ({ degree, quality }: { degree: number; quality: IntervalQuality }) =>
    degree === 1 && quality === "perfect" ? "Grondtoon" : upperFirst(`${QUALITY[quality]} ${DEGREE[degree - 1]}`);
  const word =
    format.naming === "solfege"
      ? { one: "notennaam", many: "notennamen", all: `elke notennaam (${naturalNames(format).join(" ").toLowerCase()})` }
      : format.naming === "german"
        ? { one: "stamtoon", many: "stamtonen", all: `elke stamtoon (${naturalNames(format).join(" ")})` }
        : { one: "letter", many: "letters", all: "elke letter van A tot G" };
  const accidentalWords = (accidental: number) => {
    const sharp = accidental > 0;
    return Math.abs(accidental) === 1 ? (sharp ? "een kruis" : "een mol") : sharp ? "een dubbelkruis" : "een dubbelmol";
  };
  const change = (c: DegreeChangeText) =>
    `een ${c.direction === "raised" ? "verhoogde" : "verlaagde"} ${ordinal(c.degree)} trap (${c.note} in plaats van ${c.from})`;
  const ref = (r: NoteRef) => (r.label ? `de ${r.label} (${r.note})` : `de ${ordinal(r.degree)} trap (${r.note})`);
  const plural = (name: string) => name.replace(/toon$/, "tonen");

  return {
    note: format.note,
    letter: format.letter,
    scaleName: text.name,
    scaleFullName: text.fullName,
    modeName: (s, index) => text.modeName(s, MODES[index]),
    character: text.character,
    usage: text.usage,
    title: (root, name) => `${root} ${lowerFirst(name)}`,
    intervalName,
    rootLabel: "G",
    ordinal,
    halfSteps,
    frets,
    joinList,
    step,
    chordTypeName: (id, english) => CHORDS[id] ?? english,
    chordName: (root, typeName) => `${root} ${typeName}`,
    chordGap: (s) => (s === 3 ? "kleine terts" : s === 4 ? "grote terts" : halfSteps(s)),

    construction: ({ root, moves, summary, scaleName }) => {
      const parts = moves.map((m, i) => {
        const s = step(m.semitones);
        const article = /^(anderhalve|twee|\d)/.test(s.name) ? "" : "een ";
        const target = i === moves.length - 1 ? `terug naar ${b(m.to)}, een octaaf hoger` : `naar ${b(m.to)}`;
        return `${article}${s.name} (${frets(m.semitones)}) ${target}`;
      });
      return [
        `Begin op ${b(root)}. Ga omhoog met ${parts[0]}` +
          (parts.length > 2 ? `, dan ${parts.slice(1, -1).join(", ")}` : "") +
          `, en tot slot ${parts[parts.length - 1]}.`,
        `Dat geeft het patroon ${b(summary)}. Elke toonladder van het type ${lowerFirst(scaleName)} gebruikt dit patroon — alleen de beginnoot verandert.`,
        "Op de gitaar zie je dat meteen: op één snaar is een halve toon (½) de volgende fret, en een hele toon (1) slaat één fret over.",
      ];
    },
    characterHeading: (q) => (q === "major" ? "Waarom ze majeur klinkt" : q === "minor" ? "Waarom ze mineur klinkt" : "Majeur of mineur?"),
    third: ({ quality, note, semitones, root }) =>
      `Ze heeft een ${b(quality === "major" ? "grote terts" : "kleine terts")}: ${b(note)} ligt ${halfSteps(semitones)} boven ${root}. ` +
      "De terts is de noot die bepaalt of een toonladder majeur (helderder) of mineur (donkerder) klinkt.",
    noThird: () => "Ze heeft geen duidelijke grote of kleine terts, dus ze klinkt niet duidelijk majeur of mineur.",
    majorYardstick: () =>
      "De majeurtoonladder is de maatstaf van de muziektheorie: elke intervalnaam (grote terts, reine kwint, …) wordt eraan afgemeten. Daarom is haar formule gewoon 1 2 3 4 5 6 7, en worden andere toonladders beschreven aan de hand van hoe ze ervan verschillen.",
    comparedWith: ({ reference, changes }) => `Vergeleken met ${reference} heeft ze ${joinList(changes.map(change))}.`,
    plusOneNote: ({ base, label, note, blueNote }) =>
      `Het is de toonladder ${base} plus één extra noot: de ${label} (${b(note)})` +
      (blueNote ? " — de beroemde ‘blue note’, die spanning en rauwheid toevoegt." : "."),
    withNotesRemoved: ({ parent, removed, noHalfSteps }) =>
      `Het is de toonladder ${parent} zonder de ${joinList(removed.map((r) => ordinal(r.degree)))} trap (${joinList(removed.map((r) => r.note))})` +
      (noHalfSteps ? " — daardoor blijven er geen halve tonen over, zodat elke noot goed klinkt tegen de andere." : "."),
    equalSteps: (name) => `Elke stap is een ${name}, dus geen enkele noot voelt als ‘thuis’ — de toonladder lijkt te zweven.`,
    alternatingSteps: (a, c) => `Ze wisselt strikt ${plural(a)} en ${plural(c)} af, wat haar volkomen symmetrisch en erg gespannen maakt.`,
    noPerfectFifth: ({ fifth }) =>
      `Ze heeft geen reine kwint${fifth ? ` (haar kwint is ${b(fifth.note)}, een ${fifth.intervalName.toLowerCase()})` : ""}, dus het akkoord op de grondtoon is geen stabiel majeur- of mineurakkoord — het komt nooit helemaal tot rust.`,

    whyIntroLetters: ({ root, letters, formula }) =>
      `Een toonladder van 7 noten gebruikt ${word.all} precies één keer, in volgorde. Vanaf ${root} moeten de ${word.many} dus ${b(letters.join(" "))} zijn. De formule (${formula}) bepaalt daarna of elke ${word.one} een kruis, een mol of niets nodig heeft.`,
    whyIntroSparse: ({ count, formula }) =>
      `Deze toonladder van ${count} noten slaat enkele ${word.many} over, dus elke noot wordt genoemd naar de trap die ze voorstelt: een ♭3 wordt geschreven als een soort terts, een ♭7 als een soort septiem. Zo blijven de notennamen in lijn met de formule (${formula}).`,
    whyRoot: (note) => `${b(note)} is de grondtoon — de thuisnoot waarop de toonladder gebouwd is en waarnaar ze genoemd wordt.`,
    whyHead: ({ note, intervalName: name, semitones, root }) => `${b(note)} — ${name.toLowerCase()}, ${halfSteps(semitones)} boven ${root}.`,
    whyRespelled: ({ original, note }) =>
      `Strikt genomen is het een andere trap (${original}), maar ze wordt ${note} geschreven om een dubbelkruis of dubbelmol te vermijden — zelfde klank, makkelijker te lezen.`,
    whyNatural: ({ degree, letter, semitones, letterPerDegree }) =>
      letterPerDegree
        ? `Trap ${degree} gebruikt de ${word.one} ${letter}, en ${letter} zonder voorteken ligt precies ${halfSteps(semitones)} hoger — geen kruis of mol nodig.`
        : `Als een soort ${DEGREE[degree - 1]} gebruikt ze de ${word.one} ${letter}, en ${letter} zonder voorteken ligt precies op de juiste afstand — geen kruis of mol nodig.`,
    whyAccidental: ({ degree, letter, naturalSemitones, accidental, note, letterPerDegree }) => {
      const direction = accidental > 0 ? "verhoogd" : "verlaagd";
      return letterPerDegree
        ? `Trap ${degree} moet de ${word.one} ${letter} gebruiken, maar ${letter} zonder voorteken ligt ${halfSteps(naturalSemitones)} hoger, dus wordt ze met ${accidentalWords(accidental)} ${direction} tot ${note}.`
        : `Als een soort ${DEGREE[degree - 1]} gebruikt ze de ${word.one} ${letter}; ${letter} zonder voorteken ligt ${halfSteps(naturalSemitones)} hoger, dus wordt ze met ${accidentalWords(accidental)} ${direction}.`;
    },
    whyWrittenAs: ({ note, alternative, alternativeLetter, degree, owner }) =>
      owner
        ? `Ze wordt ${note} geschreven en niet ${alternative}, omdat de ${word.one} ${alternativeLetter} al bij de ${owner.isRoot ? "grondtoon" : `${ordinal(owner.degree)} trap`} (${owner.note}) hoort.`
        : `Ze wordt ${note} geschreven en niet ${alternative}, omdat ze als ${ordinal(degree)} trap van de toonladder dienstdoet.`,

    relationshipKind: {
      mode: "Modus",
      relative: "Parallel",
      parallel: "Gelijknamig",
      neighbour: "Naaste verwant",
      "contained-in": "Grotere toonladder",
      contains: "Kleinere toonladder",
      symmetry: "Symmetrie",
    },
    modeParent: ({ title, parentName }) => ({
      title: `${title} is de moeder van zeven modi`,
      text: `Speel dezelfde zeven noten maar kies een andere noot als thuis, en je krijgt een andere modus met een eigen sfeer. De tabel hieronder toont alle zeven modi van ${parentName}.`,
    }),
    modeOf: ({ root, modeName, modeNumber, parentName, parentRoot }) => ({
      title: `${root} ${lowerFirst(modeName)} is de ${ordinal(modeNumber)} modus van ${parentName}`,
      text: `Ze gebruikt precies dezelfde noten als ${parentName}, maar met ${b(root)} als thuis in plaats van ${b(parentRoot)}. Begin de toonladder ${parentName} op haar ${ordinal(modeNumber)} noot en je krijgt ${root} ${lowerFirst(modeName)}.`,
    }),
    relative: (p) => {
      const shared = p.letterPerDegree ? "alle zeven noten en dezelfde voortekening" : `dezelfde ${p.noteCount} noten`;
      return {
        title: p.kind === "relative-minor" ? `Parallelle mineur: ${p.otherName}` : `Parallelle majeur: ${p.otherName}`,
        text:
          `${p.title} en ${p.otherName} delen ${shared} — daarom heet ${p.minorName} de parallelle (of relatieve) mineur van ${p.majorName}. ` +
          `${b(p.otherRoot)} is de ${ordinal(p.position)} noot van ${p.title}${p.label ? ` (de ${p.label})` : ""} — ${halfSteps(p.semitones)} (${frets(p.semitones)}) ${p.higher ? "hoger" : "lager"} dan ${p.root}. ` +
          "Op de hals gebruiken beide toonladders exact dezelfde vormen — alleen de noot die als thuis voelt, verandert.",
      };
    },
    parallel: ({ quality, name, changes, notes, common }) => ({
      title: `Gelijknamige ${quality === "major" ? "majeur" : "mineur"}: ${name}`,
      text: changes
        ? `Zelfde grondtoon, andere noten. ${name} ${changes[0]?.direction === "raised" ? "verhoogt" : "verlaagt"} de ${joinList(changes.map((c) => ordinal(c.degree)))} trap met een halve toon (${joinList(changes.map((c) => c.note))} in plaats van ${joinList(changes.map((c) => c.from))}).`
        : `Zelfde grondtoon, andere noten: ${name} is ${notes.join(" ")}. Ze hebben alleen ${joinList(common)} gemeen.`,
    }),
    neighbour: ({ title, otherName, change: c }) => ({
      title: `Eén noot verschil: ${otherName}`,
      text: `${c.direction === "raised" ? "Verhoog" : "Verlaag"} de ${ordinal(c.degree)} trap met een halve toon (${c.from} → ${c.note}) en ${title} wordt ${otherName}.`,
    }),
    containedIn: ({ title, otherName, added }) => ({
      title: `Past binnen ${otherName}`,
      text: `Elke noot van ${title} zit ook in ${otherName}. Voeg ${joinList(added.map(ref))} toe en je krijgt ${otherName}.`,
    }),
    contains: ({ otherName, removed }) => ({
      title: `Bevat ${otherName}`,
      text: `Haal ${joinList(removed.map(ref))} weg en je houdt ${otherName} over.`,
    }),
    symmetry: ({ period, roots, name }) => ({
      title: "Een symmetrische toonladder",
      text: `Het patroon herhaalt zich elke ${halfSteps(period)}, dus de toonladders van het type ${lowerFirst(name)} op ${joinList(roots)} bevatten precies dezelfde noten. Er bestaan dus maar ${period} verschillende toonladders van dit type.`,
    }),

    respelledRoot: ({ shown, from, avoided }) =>
      `Getoond als ${b(shown)}: vanaf ${from} zou je ${avoided.length === 1 ? "een dubbelkruis of dubbelmol" : "dubbelkruisen of dubbelmollen"} nodig hebben (${avoided.join(", ")}). Beide namen klinken precies hetzelfde.`,
    enharmonicTip: ({ current, currentCount, currentFlats, alternative, alternativeCount }) =>
      `Tip: ${current} (${currentCount} ${currentFlats ? "mollen" : "kruisen"}) wordt vaker geschreven als ${b(alternative)} (${alternativeCount} ${currentFlats ? "kruisen" : "mollen"}). Ze klinken identiek.`,
    respelledNote: ({ label, used, original }) =>
      `De ${label} wordt geschreven als ${b(used)} in plaats van ${original}, om een dubbelkruis of dubbelmol te vermijden.`,

    chordBasis: ({ basis, noteCount, parentName, scaleTitle, wholeTone }) => {
      if (basis === "scale") return "Elk akkoord ontstaat door om de andere noot van de toonladder (tertsen) op een toonladdernoot te stapelen.";
      if (basis === "symmetric")
        return wholeTone
          ? "Om de andere noot van een heletoonsladder stapelen geeft altijd een overmatige drieklank — elk akkoord heeft dezelfde vorm, telkens een hele toon hoger."
          : "Om de andere noot van de verminderde toonladder stapelen geeft verminderde akkoorden — dezelfde vorm herhaalt zich elke 3 frets.";
      return `Een toonladder van ${noteCount} noten heeft te weinig noten om tertsen te stapelen, dus dit zijn de akkoorden van haar moedertoonladder, ${parentName}. ${upperFirst(scaleTitle)} past over al deze akkoorden.`;
    },
  };
}
