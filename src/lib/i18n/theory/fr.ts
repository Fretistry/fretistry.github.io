import { b, listJoiner, naturalNames, type DegreeChangeText, type NoteFormat, type NoteRef, type TheoryLanguage } from "@/lib/theory";
import type { IntervalQuality } from "@/lib/theory";
import { lowerFirst, scaleTexts, upperFirst, type ScaleTexts } from "./shared";

/** Noms et descriptions des gammes en français. Les titres se lisent « Do majeur », « La mineur naturel »… */
export const FR_SCALES: ScaleTexts = {
  major: {
    name: "Majeur",
    modeName: "Ionien",
    character: "Lumineuse, stable et joyeuse — la référence de presque toute la théorie musicale occidentale.",
    usage: "Pop, rock, folk, country et classique — d’innombrables mélodies et grilles d’accords.",
  },
  "major-pentatonic": {
    name: "Pentatonique majeure",
    character: "Ouverte, douce et chantante — sans demi-tons, il est presque impossible de jouer une « fausse » note.",
    usage: "Country, southern rock, solos de blues-rock et mélodies folk.",
  },
  lydian: {
    name: "Lydien",
    character: "Rêveuse, flottante et très lumineuse — le 4e degré haussé lui donne une couleur scintillante, « science-fiction ».",
    usage: "Musiques de film et de jeux vidéo, Joe Satriani, Steve Vai et jazz.",
  },
  mixolydian: {
    name: "Mixolydien",
    character: "Majeure mais bluesy — la septième mineure lui donne une décontraction très rock’n’roll.",
    usage: "Classic rock, blues, funk, jam bands et musique celtique.",
  },
  "natural-minor": {
    name: "Mineur naturel",
    fullName: "Mineur naturel (éolien)",
    modeName: "Éolien",
    character: "Triste, grave et expressive — le son mineur par excellence.",
    usage: "Rock, metal, ballades pop, musiques de film et classique.",
  },
  "harmonic-minor": {
    name: "Mineur harmonique",
    character: "Sombre et exotique — la sensible haussée crée un saut dramatique d’un ton et demi.",
    usage: "Metal néoclassique, flamenco, couleurs orientales et musique classique.",
  },
  "melodic-minor": {
    name: "Mineur mélodique",
    character: "Souple et raffinée — mineure en bas, majeure en haut.",
    usage: "Jazz et fusion (version « jazz » : identique en montant et en descendant).",
  },
  "minor-pentatonic": {
    name: "Pentatonique mineure",
    character: "Le camp de base de tout guitariste — rugueuse, bluesy et immédiatement reconnaissable.",
    usage: "Blues, rock, metal et funk — la plupart des solos de guitare commencent ici.",
  },
  dorian: {
    name: "Dorien",
    character: "Mineure mais pleine d’espoir — la sixte majeure apporte une clarté soul et jazzy.",
    usage: "Funk, jazz, Santana, Pink Floyd et folk.",
  },
  phrygian: {
    name: "Phrygien",
    character: "Sombre, aux accents espagnols — la seconde mineure crée immédiatement une tension.",
    usage: "Metal, flamenco et musiques de film dramatiques.",
  },
  locrian: {
    name: "Locrien",
    character: "Instable et inquiétante — sa quinte diminuée l’empêche d’avoir un accord de repos solide.",
    usage: "Riffs de metal, passages de tension et jazz sur les accords demi-diminués.",
  },
  blues: {
    name: "Blues",
    character: "La pentatonique mineure plus la « blue note » — brute, expressive et vocale.",
    usage: "Blues, rock, jazz et soul.",
  },
  "major-blues": {
    name: "Blues majeur",
    character: "La pentatonique majeure plus une ♭3 « blue note » qui glisse vers la tierce majeure — ensoleillée, avec du mordant.",
    usage: "Country, rockabilly, blues texan, B.B. King et les Allman Brothers.",
  },
  "lydian-dominant": {
    name: "Lydien dominant",
    character: "Lumineuse et aventureuse — le 4e degré haussé du lydien avec la septième mineure du mixolydien.",
    usage: "Jazz sur les accords de septième de dominante, fusion, et le générique des Simpson.",
  },
  altered: {
    name: "Altéré",
    fullName: "Altéré (superlocrien)",
    character: "Tension maximale — toutes les notes altérables sont altérées, elle tire donc fortement vers l’accord suivant.",
    usage: "Solos de jazz sur les accords de dominante qui se résolvent (V7 → I). Les jazzmen pensent ses notes comme ♭9, ♯9, 3, ♭5, ♯5 et ♭7.",
  },
  "whole-tone": {
    name: "Par tons",
    character: "Onirique et ambiguë — chaque intervalle a la même taille, il n’y a donc pas de point de repos clair.",
    usage: "Musique impressionniste (Debussy), jazz sur les accords augmentés, scènes de rêve.",
  },
  diminished: {
    name: "Diminuée",
    fullName: "Diminuée (ton – demi-ton)",
    character: "Tendue et symétrique — alternance stricte de tons et de demi-tons.",
    usage: "Jazz sur les accords de septième diminuée, metal et musiques de suspense.",
  },
  "diminished-half-whole": {
    name: "Diminuée demi-ton – ton",
    fullName: "Diminuée (demi-ton – ton)",
    character: "Piquante et symétrique — alternance de demi-tons et de tons, pleine de couleurs ♭9 et ♯9.",
    usage: "Jazz sur les accords de septième de dominante (♭9), fusion et metal.",
  },
  "phrygian-dominant": {
    name: "Phrygien dominant",
    fullName: "Phrygien dominant (espagnol)",
    character: "Ardente et exotique — la seconde mineure sombre du phrygien avec une tierce majeure lumineuse.",
    usage: "Flamenco, metal, musiques orientales et klezmer ; le 5e mode du mineur harmonique.",
  },
  "hungarian-minor": {
    name: "Mineur hongrois",
    character: "Dramatique et envoûtante — le mineur harmonique avec un 4e degré haussé, soit deux sauts d’un ton et demi.",
    usage: "Musiques d’Europe de l’Est et tziganes, metal néoclassique et musiques de film.",
  },
  "double-harmonic": {
    name: "Double harmonique",
    fullName: "Double harmonique (byzantine)",
    character: "Très orientale — deux sauts d’un ton et demi autour d’un accord majeur.",
    usage: "Mélodies aux couleurs arabes et indiennes, surf rock (Misirlou) et musiques de film.",
  },
  hirajoshi: {
    name: "Hirajoshi",
    character: "Délicate et mélancolique — une gamme pentatonique japonaise avec deux demi-tons.",
    usage: "Musique japonaise pour koto, ambient et metal atmosphérique.",
  },
};

const QUALITY: Record<IntervalQuality, string> = {
  perfect: "juste",
  major: "majeure",
  minor: "mineure",
  augmented: "augmentée",
  diminished: "diminuée",
  "doubly-augmented": "doublement augmentée",
  "doubly-diminished": "doublement diminuée",
};
const DEGREE = ["unisson", "seconde", "tierce", "quarte", "quinte", "sixte", "septième"];
const MODES = ["Ionien", "Dorien", "Phrygien", "Lydien", "Mixolydien", "Éolien", "Locrien"];
const CHORDS: Record<string, string> = {
  maj: "majeur",
  min: "mineur",
  dim: "diminué",
  aug: "augmenté",
  maj7: "septième majeure",
  "7": "septième de dominante",
  m7: "mineur septième",
  m7b5: "demi-diminué",
  dim7: "septième diminuée",
  mMaj7: "mineur septième majeure",
  augMaj7: "augmenté septième majeure",
  aug7: "augmenté septième",
  majb5: "majeur quinte diminuée",
  "7b5": "septième quinte diminuée",
  m6: "mineur sixte",
  sus2b5: "sus2 quinte diminuée",
  "6sus2b5": "sixte sus2 quinte diminuée",
};

export function createFrenchTheory(format: NoteFormat): TheoryLanguage {
  const text = scaleTexts(FR_SCALES);
  const ordinal = (n: number) => (n === 1 ? "1er" : `${n}e`);
  const ordinalF = (n: number) => (n === 1 ? "1re" : `${n}e`);
  const halfSteps = (n: number) => (n === 1 ? "1 demi-ton" : `${n} demi-tons`);
  const frets = (n: number) => (n === 1 ? "1 case" : `${n} cases`);
  const joinList = listJoiner("et");
  const step = (semitones: number) => {
    switch (semitones) {
      case 1:
        return { symbol: "½", name: "demi-ton" };
      case 2:
        return { symbol: "T", name: "ton" };
      case 3:
        return { symbol: "T½", name: "ton et demi" };
      case 4:
        return { symbol: "2T", name: "deux tons" };
      default:
        return { symbol: `${semitones}×½`, name: `${semitones} demi-tons` };
    }
  };
  const intervalName = ({ degree, quality }: { degree: number; quality: IntervalQuality }) => {
    if (degree === 1) return quality === "perfect" ? "Tonique" : `Unisson ${quality === "augmented" ? "augmenté" : "diminué"}`;
    return upperFirst(`${DEGREE[degree - 1]} ${QUALITY[quality]}`);
  };
  const word =
    format.naming === "solfege"
      ? {
          the: "le nom",
          many: "noms de notes",
          some: "certains noms de notes",
          one: "nom de note",
          all: `chaque nom de note (${naturalNames(format).join(" ").toLowerCase()})`,
        }
      : {
          the: "la lettre",
          many: "lettres",
          some: "certaines lettres",
          one: "lettre",
          all: format.naming === "german" ? `chaque lettre (${naturalNames(format).join(" ")})` : "chaque lettre de A à G",
        };
  const accidentalWords = (accidental: number) => {
    const sharp = accidental > 0;
    return Math.abs(accidental) === 1 ? (sharp ? "un dièse" : "un bémol") : sharp ? "un double dièse" : "un double bémol";
  };
  const change = (c: DegreeChangeText) =>
    `un ${ordinal(c.degree)} degré ${c.direction === "raised" ? "haussé" : "abaissé"} (${c.note} au lieu de ${c.from})`;
  const ref = (r: NoteRef) => (r.label ? `la ${r.label} (${r.note})` : `le ${ordinal(r.degree)} degré (${r.note})`);
  const degrees = (list: number[]) =>
    list.length === 1 ? `le ${ordinal(list[0])} degré` : `les ${joinList(list.map(ordinal))} degrés`;
  const plural = (name: string) => `${name}s`;

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
    rootLabel: "T",
    ordinal,
    halfSteps,
    frets,
    joinList,
    step,
    chordTypeName: (id, english) => CHORDS[id] ?? english,
    chordName: (root, typeName) => `${root} ${typeName}`,
    chordGap: (s) => (s === 3 ? "tierce mineure" : s === 4 ? "tierce majeure" : halfSteps(s)),

    construction: ({ root, moves, summary, scaleName }) => {
      const parts = moves.map((m, i) => {
        const s = step(m.semitones);
        const prefix = /^(deux|\d)/.test(s.name) ? "de " : "d’un ";
        const target = i === moves.length - 1 ? `pour revenir à ${b(m.to)}, une octave plus haut` : `jusqu’à ${b(m.to)}`;
        return `${prefix}${s.name} (${frets(m.semitones)}) ${target}`;
      });
      return [
        `Partez de ${b(root)}. Montez ${parts[0]}` +
          (parts.length > 2 ? `, puis ${parts.slice(1, -1).join(", ")}` : "") +
          `, et enfin ${parts[parts.length - 1]}.`,
        `Cela donne la structure ${b(summary)}. Toutes les gammes de type ${lowerFirst(scaleName)} suivent cette même structure — seule la note de départ change.`,
        "Sur la guitare, c’est facile à voir : sur une même corde, un demi-ton (½) correspond à la case suivante, et un ton (T) saute une case.",
      ];
    },
    characterHeading: (q) =>
      q === "major" ? "Pourquoi elle sonne majeur" : q === "minor" ? "Pourquoi elle sonne mineur" : "Majeur ou mineur ?",
    third: ({ quality, note, semitones, root }) =>
      `Elle a une ${b(quality === "major" ? "tierce majeure" : "tierce mineure")} : ${b(note)} se trouve ${halfSteps(semitones)} au-dessus de ${root}. ` +
      "La tierce est la note qui décide si une gamme sonne majeur (plus clair) ou mineur (plus sombre).",
    noThird: () => "Elle n’a pas de tierce majeure ou mineure nette ; elle ne sonne donc ni vraiment majeur ni vraiment mineur.",
    majorYardstick: () =>
      "La gamme majeure est l’étalon de la théorie musicale : chaque nom d’intervalle (tierce majeure, quinte juste…) se mesure par rapport à elle. C’est pourquoi sa formule est simplement 1 2 3 4 5 6 7, et pourquoi les autres gammes se décrivent par leurs différences avec elle.",
    comparedWith: ({ reference, changes }) => `Par rapport à ${reference}, elle a ${joinList(changes.map(change))}.`,
    plusOneNote: ({ base, label, note, blueNote }) =>
      `C’est la gamme ${base} plus une note : la ${label} (${b(note)})` +
      (blueNote ? " — la fameuse « blue note », qui ajoute tension et mordant." : "."),
    withNotesRemoved: ({ parent, removed, noHalfSteps }) =>
      `C’est la gamme ${parent} sans ${degrees(removed.map((r) => r.degree))} (${joinList(removed.map((r) => r.note))})` +
      (noHalfSteps ? " — il ne reste alors aucun demi-ton, et chaque note sonne bien avec les autres." : "."),
    equalSteps: (name) => `Chaque intervalle est un ${name} : aucune note ne s’impose comme « point de repos », et la gamme semble flotter.`,
    alternatingSteps: (a, c) => `Elle alterne strictement ${plural(a)} et ${plural(c)}, ce qui la rend parfaitement symétrique et très tendue.`,
    noPerfectFifth: ({ fifth }) =>
      `Elle n’a pas de quinte juste${fifth ? ` (sa quinte est ${b(fifth.note)}, une ${lowerFirst(fifth.intervalName)})` : ""} ; l’accord bâti sur sa tonique n’est donc pas un accord majeur ou mineur stable — il n’est jamais complètement au repos.`,

    whyIntroLetters: ({ root, letters, formula }) =>
      `Une gamme de 7 notes utilise ${word.all} exactement une fois, dans l’ordre. À partir de ${root}, les ${word.many} doivent donc être ${b(letters.join(" "))}. La formule (${formula}) décide ensuite si chaque ${word.one} a besoin d’un dièse, d’un bémol ou de rien du tout.`,
    whyIntroSparse: ({ count, formula }) =>
      `Cette gamme de ${count} notes saute ${word.some} : chaque note est donc nommée d’après le degré qu’elle représente — une ♭3 s’écrit comme une sorte de tierce, une ♭7 comme une sorte de septième. Les noms de notes restent ainsi cohérents avec la formule (${formula}).`,
    whyRoot: (note) => `${b(note)} est la tonique — la note « maison » sur laquelle la gamme est construite et dont elle porte le nom.`,
    whyHead: ({ note, intervalName: name, semitones, root }) => `${b(note)} — ${lowerFirst(name)}, ${halfSteps(semitones)} au-dessus de ${root}.`,
    whyRespelled: ({ original, note }) =>
      `À strictement parler, cette note est ${original}, mais on l’écrit ${note} pour éviter un double dièse ou un double bémol — même son, plus facile à lire.`,
    whyNatural: ({ degree, letter, semitones, letterPerDegree }) =>
      letterPerDegree
        ? `Le ${ordinal(degree)} degré utilise ${word.the} ${letter}, et ${letter} naturel se trouve exactement ${halfSteps(semitones)} plus haut — ni dièse ni bémol.`
        : `En tant que sorte de ${DEGREE[degree - 1]}, elle utilise ${word.the} ${letter}, et ${letter} naturel est exactement à la bonne distance — ni dièse ni bémol.`,
    whyAccidental: ({ degree, letter, naturalSemitones, accidental, note, letterPerDegree }) => {
      const verb = accidental > 0 ? "hausse" : "abaisse";
      return letterPerDegree
        ? `Le ${ordinal(degree)} degré doit utiliser ${word.the} ${letter}, mais ${letter} naturel se trouve ${halfSteps(naturalSemitones)} plus haut : on l’${verb} donc avec ${accidentalWords(accidental)} pour obtenir ${note}.`
        : `En tant que sorte de ${DEGREE[degree - 1]}, elle utilise ${word.the} ${letter} ; ${letter} naturel se trouve ${halfSteps(naturalSemitones)} plus haut, on l’${verb} donc avec ${accidentalWords(accidental)}.`;
    },
    whyWrittenAs: ({ note, alternative, alternativeLetter, degree, owner }) =>
      owner
        ? `On l’écrit ${note} et non ${alternative}, car ${word.the} ${alternativeLetter} appartient déjà ${owner.isRoot ? "à la tonique" : `au ${ordinal(owner.degree)} degré`} (${owner.note}).`
        : `On l’écrit ${note} et non ${alternative}, car elle joue le rôle de ${ordinal(degree)} degré de la gamme.`,

    relationshipKind: {
      mode: "Mode",
      relative: "Relatif",
      parallel: "Homonyme",
      neighbour: "Proche parent",
      "contained-in": "Gamme plus grande",
      contains: "Gamme plus petite",
      symmetry: "Symétrie",
    },
    modeParent: ({ title, parentName }) => ({
      title: `${title} est la gamme mère de sept modes`,
      text: `Jouez ces sept mêmes notes en prenant une autre note comme point de repos, et vous obtenez un autre mode, avec sa propre couleur. Le tableau ci-dessous montre les sept modes de ${parentName}.`,
    }),
    modeOf: ({ root, modeName, modeNumber, parentName, parentRoot }) => ({
      title: `${root} ${lowerFirst(modeName)} est le ${ordinal(modeNumber)} mode de ${parentName}`,
      text: `Il utilise exactement les mêmes notes que ${parentName}, mais avec ${b(root)} comme point de repos au lieu de ${b(parentRoot)}. Commencez la gamme de ${parentName} sur sa ${ordinalF(modeNumber)} note et vous obtenez ${root} ${lowerFirst(modeName)}.`,
    }),
    relative: (p) => {
      const shared = p.letterPerDegree ? "les sept mêmes notes et la même armure" : `les ${p.noteCount} mêmes notes`;
      return {
        title: p.kind === "relative-minor" ? `Relatif mineur : ${p.otherName}` : `Relatif majeur : ${p.otherName}`,
        text:
          `${p.title} et ${p.otherName} partagent ${shared} — c’est pourquoi ${p.minorName} est le relatif mineur de ${p.majorName}. ` +
          `${b(p.otherRoot)} est la ${ordinalF(p.position)} note de ${p.title}${p.label ? ` (la ${p.label})` : ""} — ${halfSteps(p.semitones)} (${frets(p.semitones)}) plus ${p.higher ? "haut" : "bas"} que ${p.root}. ` +
          "Sur le manche, les deux gammes utilisent exactement les mêmes formes — seule la note de repos change.",
      };
    },
    parallel: ({ quality, name, changes, notes, common }) => ({
      title: `Homonyme ${quality === "major" ? "majeur" : "mineur"} : ${name}`,
      text: changes
        ? `Même tonique, notes différentes. ${name} ${changes[0]?.direction === "raised" ? "hausse" : "abaisse"} ${degrees(changes.map((c) => c.degree))} d’un demi-ton (${joinList(changes.map((c) => c.note))} au lieu de ${joinList(changes.map((c) => c.from))}).`
        : `Même tonique, notes différentes : ${name} se compose de ${notes.join(" ")}. Elles n’ont en commun que ${joinList(common)}.`,
    }),
    neighbour: ({ title, otherName, change: c }) => ({
      title: `À une note près : ${otherName}`,
      text: `${c.direction === "raised" ? "Haussez" : "Abaissez"} le ${ordinal(c.degree)} degré d’un demi-ton (${c.from} → ${c.note}) et ${title} devient ${otherName}.`,
    }),
    containedIn: ({ title, otherName, added }) => ({
      title: `Contenue dans ${otherName}`,
      text: `Toutes les notes de ${title} se trouvent aussi dans ${otherName}. Ajoutez ${joinList(added.map(ref))} et vous obtenez ${otherName}.`,
    }),
    contains: ({ otherName, removed }) => ({
      title: `Contient ${otherName}`,
      text: `Retirez ${joinList(removed.map(ref))} et il reste ${otherName}.`,
    }),
    symmetry: ({ period, roots, name }) => ({
      title: "Une gamme symétrique",
      text: `La structure se répète tous les ${halfSteps(period)} : les gammes de type ${lowerFirst(name)} sur ${joinList(roots)} contiennent donc exactement les mêmes notes. Il n’existe que ${period} gammes différentes de ce type.`,
    }),

    respelledRoot: ({ shown, from, avoided }) =>
      `Affiché comme ${b(shown)} : à partir de ${from}, il faudrait ${avoided.length === 1 ? "un double dièse ou un double bémol" : "des doubles dièses ou doubles bémols"} (${avoided.join(", ")}). Les deux noms sonnent exactement pareil.`,
    enharmonicTip: ({ current, currentCount, currentFlats, alternative, alternativeCount }) =>
      `Astuce : ${current} (${currentCount} ${currentFlats ? "bémols" : "dièses"}) s’écrit plus souvent ${b(alternative)} (${alternativeCount} ${currentFlats ? "dièses" : "bémols"}). Les deux sonnent pareil.`,
    respelledNote: ({ label, used, original }) =>
      `La ${label} s’écrit ${b(used)} au lieu de ${original} pour éviter un double dièse ou un double bémol.`,

    playedOver: ({ chord, labels }) =>
      `En jazz, on joue cette gamme sur **${chord}** et on nomme ses notes par rapport à cet accord : ${labels}.`,
    chordBasis: ({ basis, noteCount, parentName, scaleTitle, wholeTone, chordList, majorBlues }) => {
      if (basis === "scale") return "Chaque accord se construit en empilant une note sur deux de la gamme (des tierces) à partir d’une note de la gamme.";
      if (basis === "symmetric")
        return wholeTone
          ? "Empiler une note sur deux d’une gamme par tons donne toujours une triade augmentée — chaque accord a la même forme, un ton plus haut à chaque fois."
          : "Empiler une note sur deux de la gamme diminuée donne des accords diminués — la même forme se répète toutes les 3 cases.";
      if (basis === "blues")
        return (
          `Un blues de 12 mesures utilise trois accords : I, IV et V, généralement joués en accords de septième de dominante (ici ${chordList}). ` +
          (majorBlues
            ? `${upperFirst(scaleTitle)} sonne le mieux sur l’accord I ; sur IV et V, beaucoup de guitaristes déplacent la gamme avec l’accord ou passent au blues mineur.`
            : `${upperFirst(scaleTitle)} est le son classique sur les trois : la ♭3 de la gamme qui frotte contre la tierce majeure de l’accord I fait une grande partie du son blues.`)
        );
      return `Une gamme de ${noteCount} notes en a trop peu pour empiler des tierces : voici donc les accords de sa gamme mère, ${parentName}, la tonalité d’où vient ${scaleTitle}.`;
    },
  };
}
