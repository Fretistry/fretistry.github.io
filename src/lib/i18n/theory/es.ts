import { b, listJoiner, naturalNames, type DegreeChangeText, type NoteFormat, type NoteRef, type TheoryLanguage } from "@/lib/theory";
import type { IntervalQuality } from "@/lib/theory";
import { lowerFirst, scaleTexts, upperFirst, type ScaleTexts } from "./shared";

/** Nombres y descripciones de las escalas en español. Los títulos se leen «Do mayor», «La menor natural»… */
export const ES_SCALES: ScaleTexts = {
  major: {
    name: "Mayor",
    modeName: "Jónico",
    character: "Brillante, estable y alegre: el punto de referencia de casi toda la teoría musical occidental.",
    usage: "Pop, rock, folk, country y clásica: incontables melodías y progresiones de acordes.",
  },
  "major-pentatonic": {
    name: "Pentatónica mayor",
    character: "Abierta, dulce y cantable: sin semitonos, es casi imposible tocar una nota «equivocada».",
    usage: "Country, southern rock, solos de blues-rock y melodías folk.",
  },
  lydian: {
    name: "Lidio",
    character: "Soñadora, flotante y muy brillante: el 4.º grado elevado le da un color brillante, de «ciencia ficción».",
    usage: "Bandas sonoras de cine y videojuegos, Joe Satriani, Steve Vai y jazz.",
  },
  mixolydian: {
    name: "Mixolidio",
    character: "Mayor pero bluesera: la séptima menor le da un aire relajado y muy rock and roll.",
    usage: "Rock clásico, blues, funk, jam bands y música celta.",
  },
  "natural-minor": {
    name: "Menor natural",
    fullName: "Menor natural (eólico)",
    modeName: "Eólico",
    character: "Triste, seria y expresiva: el sonido menor por excelencia.",
    usage: "Rock, metal, baladas pop, música de cine y clásica.",
  },
  "harmonic-minor": {
    name: "Menor armónica",
    character: "Oscura y exótica: la séptima elevada crea un salto dramático de tono y medio.",
    usage: "Metal neoclásico, flamenco, colores de Oriente Medio y música clásica.",
  },
  "melodic-minor": {
    name: "Menor melódica",
    character: "Suave y sofisticada: menor abajo, mayor arriba.",
    usage: "Jazz y fusión (la versión «de jazz»: igual al subir y al bajar).",
  },
  "minor-pentatonic": {
    name: "Pentatónica menor",
    character: "El campamento base de todo guitarrista: áspera, bluesera e inconfundible.",
    usage: "Blues, rock, metal y funk: la mayoría de los solos de guitarra empiezan aquí.",
  },
  dorian: {
    name: "Dórico",
    character: "Menor pero esperanzadora: la sexta mayor aporta un brillo soul y jazzero.",
    usage: "Funk, jazz, Santana, Pink Floyd y folk.",
  },
  phrygian: {
    name: "Frigio",
    character: "Oscura y de sonido español: la segunda menor crea tensión al instante.",
    usage: "Metal, flamenco y música de cine dramática.",
  },
  locrian: {
    name: "Locrio",
    character: "Inestable e inquietante: su quinta disminuida impide tener un acorde de reposo sólido.",
    usage: "Riffs de metal, pasajes de tensión y jazz sobre acordes semidisminuidos.",
  },
  blues: {
    name: "Blues",
    character: "La pentatónica menor más la «blue note»: cruda, expresiva y vocal.",
    usage: "Blues, rock, jazz y soul.",
  },
  "major-blues": {
    name: "Blues mayor",
    character: "La pentatónica mayor más una ♭3 como «blue note» que se desliza hacia la tercera mayor: luminosa, pero con mordiente.",
    usage: "Country, rockabilly, blues de Texas, B.B. King y los Allman Brothers.",
  },
  "lydian-dominant": {
    name: "Lidio dominante",
    character: "Brillante y aventurera: el 4.º grado elevado del lidio con la séptima menor del mixolidio.",
    usage: "Jazz sobre acordes de séptima de dominante, fusión y la sintonía de Los Simpson.",
  },
  altered: {
    name: "Alterada",
    fullName: "Alterada (superlocria)",
    character: "Tensión máxima: todas las notas que pueden alterarse están alteradas, así que tira con fuerza hacia el acorde siguiente.",
    usage: "Solos de jazz sobre acordes de dominante que resuelven (V7 → I). Los jazzistas piensan sus notas como ♭9, ♯9, 3, ♭5, ♯5 y ♭7.",
  },
  "whole-tone": {
    name: "Tonos enteros",
    character: "Onírica y ambigua: todos los pasos miden lo mismo, así que no hay un reposo claro.",
    usage: "Música impresionista (Debussy), jazz sobre acordes aumentados y escenas de ensueño.",
  },
  diminished: {
    name: "Disminuida",
    fullName: "Disminuida (tono-semitono)",
    character: "Tensa y simétrica: alterna estrictamente tonos y semitonos.",
    usage: "Jazz sobre acordes de séptima disminuida, metal y música de suspense.",
  },
  "diminished-half-whole": {
    name: "Disminuida semitono-tono",
    fullName: "Disminuida (semitono-tono)",
    character: "Punzante y simétrica: alterna semitonos y tonos, llena de colores ♭9 y ♯9.",
    usage: "Jazz sobre acordes de séptima de dominante (♭9), fusión y metal.",
  },
  "phrygian-dominant": {
    name: "Frigio dominante",
    fullName: "Frigio dominante (española)",
    character: "Ardiente y exótica: la segunda menor oscura del frigio con una tercera mayor brillante.",
    usage: "Flamenco, metal, música de Oriente Medio y klezmer; el 5.º modo de la menor armónica.",
  },
  "hungarian-minor": {
    name: "Menor húngara",
    character: "Dramática e inquietante: la menor armónica con el 4.º grado elevado, con dos saltos de tono y medio.",
    usage: "Música de Europa del Este y gitana, metal neoclásico y música de cine.",
  },
  "double-harmonic": {
    name: "Doble armónica",
    fullName: "Doble armónica (bizantina)",
    character: "Muy de Oriente Medio: dos saltos de tono y medio alrededor de un acorde mayor.",
    usage: "Melodías de sabor árabe e indio, surf rock (Misirlou) y música de cine.",
  },
  hirajoshi: {
    name: "Hirajoshi",
    character: "Delicada y melancólica: una escala pentatónica japonesa con dos semitonos.",
    usage: "Música japonesa para koto, ambient y metal atmosférico.",
  },
};

const QUALITY: Record<IntervalQuality, string> = {
  perfect: "justa",
  major: "mayor",
  minor: "menor",
  augmented: "aumentada",
  diminished: "disminuida",
  "doubly-augmented": "doble aumentada",
  "doubly-diminished": "doble disminuida",
};
const DEGREE = ["unísono", "segunda", "tercera", "cuarta", "quinta", "sexta", "séptima"];
const MODES = ["Jónico", "Dórico", "Frigio", "Lidio", "Mixolidio", "Eólico", "Locrio"];
const CHORDS: Record<string, string> = {
  maj: "mayor",
  min: "menor",
  dim: "disminuido",
  aug: "aumentado",
  maj7: "con séptima mayor",
  "7": "séptima de dominante",
  m7: "menor séptima",
  m7b5: "semidisminuido",
  dim7: "séptima disminuida",
  mMaj7: "menor con séptima mayor",
  augMaj7: "aumentado con séptima mayor",
  aug7: "aumentado con séptima",
  majb5: "mayor con quinta disminuida",
  "7b5": "séptima con quinta disminuida",
  m6: "menor sexta",
  sus2b5: "sus2 con quinta disminuida",
  "6sus2b5": "sexta sus2 con quinta disminuida",
};

export function createSpanishTheory(format: NoteFormat): TheoryLanguage {
  const text = scaleTexts(ES_SCALES);
  const ordinal = (n: number) => `${n}.º`;
  const ordinalF = (n: number) => `${n}.ª`;
  const halfSteps = (n: number) => (n === 1 ? "1 semitono" : `${n} semitonos`);
  const frets = (n: number) => (n === 1 ? "1 traste" : `${n} trastes`);
  const joinList = listJoiner("y");
  const step = (semitones: number) => {
    switch (semitones) {
      case 1:
        return { symbol: "S", name: "semitono" };
      case 2:
        return { symbol: "T", name: "tono" };
      case 3:
        return { symbol: "T+S", name: "tono y medio" };
      case 4:
        return { symbol: "2T", name: "dos tonos" };
      default:
        return { symbol: `${semitones}S`, name: `${semitones} semitonos` };
    }
  };
  const intervalName = ({ degree, quality }: { degree: number; quality: IntervalQuality }) => {
    if (degree === 1) return quality === "perfect" ? "Tónica" : `Unísono ${quality === "augmented" ? "aumentado" : "disminuido"}`;
    return upperFirst(`${DEGREE[degree - 1]} ${QUALITY[quality]}`);
  };
  const word =
    format.naming === "solfege"
      ? {
          the: "el nombre",
          theMany: "los nombres de notas",
          some: "algunos nombres de notas",
          one: "nombre de nota",
          all: `cada nombre de nota (${naturalNames(format).join(" ").toLowerCase()})`,
        }
      : {
          the: "la letra",
          theMany: "las letras",
          some: "algunas letras",
          one: "letra",
          all: format.naming === "german" ? `cada letra (${naturalNames(format).join(" ")})` : "cada letra de la A a la G",
        };
  const accidentalWords = (accidental: number) => {
    const sharp = accidental > 0;
    return Math.abs(accidental) === 1 ? (sharp ? "un sostenido" : "un bemol") : sharp ? "un doble sostenido" : "un doble bemol";
  };
  const change = (c: DegreeChangeText) =>
    `el ${ordinal(c.degree)} grado ${c.direction === "raised" ? "elevado" : "rebajado"} (${c.note} en lugar de ${c.from})`;
  const ref = (r: NoteRef) => (r.label ? `la ${r.label} (${r.note})` : `el ${ordinal(r.degree)} grado (${r.note})`);
  const degrees = (list: number[]) =>
    list.length === 1 ? `el ${ordinal(list[0])} grado` : `los grados ${joinList(list.map(ordinal))}`;
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
    chordGap: (s) => (s === 3 ? "tercera menor" : s === 4 ? "tercera mayor" : halfSteps(s)),

    construction: ({ root, moves, summary, scaleName }) => {
      const parts = moves.map((m, i) => {
        const s = step(m.semitones);
        const article = /^(dos|\d)/.test(s.name) ? "" : "un ";
        const target = i === moves.length - 1 ? `para volver a ${b(m.to)}, una octava más arriba` : `hasta ${b(m.to)}`;
        return `${article}${s.name} (${frets(m.semitones)}) ${target}`;
      });
      return [
        `Empieza en ${b(root)}. Sube ${parts[0]}` +
          (parts.length > 2 ? `, luego ${parts.slice(1, -1).join(", ")}` : "") +
          ` y, por último, ${parts[parts.length - 1]}.`,
        `Eso da la estructura ${b(summary)}. Todas las escalas de tipo ${lowerFirst(scaleName)} siguen esta misma estructura; solo cambia la nota de partida.`,
        "En la guitarra se ve enseguida: en una misma cuerda, un semitono (S) es el traste siguiente y un tono (T) se salta un traste.",
      ];
    },
    characterHeading: (q) => (q === "major" ? "Por qué suena mayor" : q === "minor" ? "Por qué suena menor" : "¿Mayor o menor?"),
    third: ({ quality, note, semitones, root }) =>
      `Tiene una ${b(quality === "major" ? "tercera mayor" : "tercera menor")}: ${b(note)} está ${halfSteps(semitones)} por encima de ${root}. ` +
      "La tercera es la nota que decide si una escala suena mayor (más brillante) o menor (más oscura).",
    noThird: () => "No tiene una tercera mayor o menor clara, así que no suena claramente mayor ni menor.",
    majorYardstick: () =>
      "La escala mayor es la vara de medir de la teoría musical: cada nombre de intervalo (tercera mayor, quinta justa…) se mide respecto a ella. Por eso su fórmula es simplemente 1 2 3 4 5 6 7, y las demás escalas se describen según en qué se diferencian de ella.",
    comparedWith: ({ reference, changes }) => `Comparada con ${reference}, tiene ${joinList(changes.map(change))}.`,
    plusOneNote: ({ base, label, note, blueNote }) =>
      `Es la escala ${base} más una nota extra: la ${label} (${b(note)})` +
      (blueNote ? ", la famosa «blue note», que añade tensión y garra." : "."),
    withNotesRemoved: ({ parent, removed, noHalfSteps }) =>
      `Es la escala ${parent} sin ${degrees(removed.map((r) => r.degree))} (${joinList(removed.map((r) => r.note))})` +
      (noHalfSteps ? ": así no queda ningún semitono y todas las notas suenan bien entre sí." : "."),
    equalSteps: (name) => `Cada paso es un ${name}, así que ninguna nota destaca como «casa»: la escala parece flotar.`,
    alternatingSteps: (a, c) => `Alterna estrictamente ${plural(a)} y ${plural(c)}, lo que la hace perfectamente simétrica y muy tensa.`,
    noPerfectFifth: ({ fifth }) =>
      `No tiene quinta justa${fifth ? ` (su quinta es ${b(fifth.note)}, una ${lowerFirst(fifth.intervalName)})` : ""}, así que el acorde construido sobre su tónica no es un acorde mayor o menor estable: nunca termina de reposar.`,

    whyIntroLetters: ({ root, letters, formula }) =>
      `Una escala de 7 notas usa ${word.all} exactamente una vez, en orden. Partiendo de ${root}, ${word.theMany} deben ser ${b(letters.join(" "))}. La fórmula (${formula}) decide después si cada ${word.one} necesita un sostenido, un bemol o nada.`,
    whyIntroSparse: ({ count, formula }) =>
      `Esta escala de ${count} notas se salta ${word.some}, así que cada nota se nombra según el grado que representa: una ♭3 se escribe como un tipo de tercera, una ♭7 como un tipo de séptima. Así los nombres de las notas siguen la fórmula (${formula}).`,
    whyRoot: (note) => `${b(note)} es la tónica: la nota «casa» sobre la que se construye la escala y que le da nombre.`,
    whyHead: ({ note, intervalName: name, semitones, root }) =>
      `${b(note)} — ${lowerFirst(name)}, ${halfSteps(semitones)} por encima de ${root}.`,
    whyRespelled: ({ original, note }) =>
      `En sentido estricto esta nota es ${original}, pero se escribe ${note} para evitar un doble sostenido o un doble bemol: mismo sonido, más fácil de leer.`,
    whyNatural: ({ degree, letter, semitones, letterPerDegree }) =>
      letterPerDegree
        ? `El ${ordinal(degree)} grado usa ${word.the} ${letter}, y ${letter} natural está exactamente ${halfSteps(semitones)} por encima: no hace falta sostenido ni bemol.`
        : `Como un tipo de ${DEGREE[degree - 1]}, usa ${word.the} ${letter}, y ${letter} natural está justo a la distancia correcta: no hace falta sostenido ni bemol.`,
    whyAccidental: ({ degree, letter, naturalSemitones, accidental, note, letterPerDegree }) => {
      const verb = accidental > 0 ? "eleva" : "rebaja";
      return letterPerDegree
        ? `El ${ordinal(degree)} grado debe usar ${word.the} ${letter}, pero ${letter} natural está ${halfSteps(naturalSemitones)} por encima, así que se ${verb} con ${accidentalWords(accidental)} hasta ${note}.`
        : `Como un tipo de ${DEGREE[degree - 1]}, usa ${word.the} ${letter}; ${letter} natural está ${halfSteps(naturalSemitones)} por encima, así que se ${verb} con ${accidentalWords(accidental)}.`;
    },
    whyWrittenAs: ({ note, alternative, alternativeLetter, degree, owner }) =>
      owner
        ? `Se escribe ${note} y no ${alternative}, porque ${word.the} ${alternativeLetter} ya pertenece ${owner.isRoot ? "a la tónica" : `al ${ordinal(owner.degree)} grado`} (${owner.note}).`
        : `Se escribe ${note} y no ${alternative}, porque funciona como ${ordinal(degree)} grado de la escala.`,

    relationshipKind: {
      mode: "Modo",
      relative: "Relativa",
      parallel: "Homónima",
      neighbour: "Pariente cercana",
      "contained-in": "Escala más grande",
      contains: "Escala más pequeña",
      symmetry: "Simetría",
    },
    modeParent: ({ title, parentName }) => ({
      title: `${title} es la escala madre de siete modos`,
      text: `Toca estas mismas siete notas pero toma otra nota como casa y obtendrás un modo distinto, con su propio carácter. La tabla de abajo muestra los siete modos de ${parentName}.`,
    }),
    modeOf: ({ root, modeName, modeNumber, parentName, parentRoot }) => ({
      title: `${root} ${lowerFirst(modeName)} es el ${ordinal(modeNumber)} modo de ${parentName}`,
      text: `Usa exactamente las mismas notas que ${parentName}, pero con ${b(root)} como casa en lugar de ${b(parentRoot)}. Empieza la escala de ${parentName} en su ${ordinalF(modeNumber)} nota y obtendrás ${root} ${lowerFirst(modeName)}.`,
    }),
    relative: (p) => {
      const shared = p.letterPerDegree ? "las siete notas y la misma armadura" : `las mismas ${p.noteCount} notas`;
      return {
        title: p.kind === "relative-minor" ? `Relativa menor: ${p.otherName}` : `Relativa mayor: ${p.otherName}`,
        text:
          `${p.title} y ${p.otherName} comparten ${shared}; por eso ${p.minorName} es la relativa menor de ${p.majorName}. ` +
          `${b(p.otherRoot)} es la ${ordinalF(p.position)} nota de ${p.title}${p.label ? ` (la ${p.label})` : ""}: ${halfSteps(p.semitones)} (${frets(p.semitones)}) más ${p.higher ? "arriba" : "abajo"} que ${p.root}. ` +
          "En el mástil, ambas escalas usan exactamente las mismas formas; solo cambia la nota que sientes como casa.",
      };
    },
    parallel: ({ quality, name, changes, notes, common }) => ({
      title: `Homónima ${quality === "major" ? "mayor" : "menor"}: ${name}`,
      text: changes
        ? `Misma tónica, notas distintas. ${name} ${changes[0]?.direction === "raised" ? "eleva" : "rebaja"} ${degrees(changes.map((c) => c.degree))} un semitono (${joinList(changes.map((c) => c.note))} en lugar de ${joinList(changes.map((c) => c.from))}).`
        : `Misma tónica, notas distintas: ${name} está formada por ${notes.join(" ")}. Solo comparten ${joinList(common)}.`,
    }),
    neighbour: ({ title, otherName, change: c }) => ({
      title: `A una nota de distancia: ${otherName}`,
      text: `${c.direction === "raised" ? "Eleva" : "Rebaja"} el ${ordinal(c.degree)} grado un semitono (${c.from} → ${c.note}) y ${title} se convierte en ${otherName}.`,
    }),
    containedIn: ({ title, otherName, added }) => ({
      title: `Cabe dentro de ${otherName}`,
      text: `Todas las notas de ${title} están también en ${otherName}. Añade ${joinList(added.map(ref))} y obtendrás ${otherName}.`,
    }),
    contains: ({ otherName, removed }) => ({
      title: `Contiene ${otherName}`,
      text: `Quita ${joinList(removed.map(ref))} y te queda ${otherName}.`,
    }),
    symmetry: ({ period, roots, name }) => ({
      title: "Una escala simétrica",
      text: `El patrón se repite cada ${halfSteps(period)}, así que las escalas de tipo ${lowerFirst(name)} sobre ${joinList(roots)} contienen exactamente las mismas notas. Por eso solo existen ${period} escalas distintas de este tipo.`,
    }),

    respelledRoot: ({ shown, from, avoided }) =>
      `Se muestra como ${b(shown)}: partiendo de ${from} harían falta ${avoided.length === 1 ? "un doble sostenido o un doble bemol" : "dobles sostenidos o dobles bemoles"} (${avoided.join(", ")}). Ambos nombres suenan exactamente igual.`,
    enharmonicTip: ({ current, currentCount, currentFlats, alternative, alternativeCount }) =>
      `Consejo: ${current} (${currentCount} ${currentFlats ? "bemoles" : "sostenidos"}) se escribe más a menudo como ${b(alternative)} (${alternativeCount} ${currentFlats ? "sostenidos" : "bemoles"}). Suenan igual.`,
    respelledNote: ({ label, used, original }) =>
      `La ${label} se escribe ${b(used)} en lugar de ${original} para evitar un doble sostenido o un doble bemol.`,

    playedOver: ({ chord, labels }) =>
      `En jazz se toca esta escala sobre **${chord}** y sus notas se nombran desde ese acorde: ${labels}.`,
    chordBasis: ({ basis, noteCount, parentName, scaleTitle, wholeTone, chordList, majorBlues }) => {
      if (basis === "scale") return "Cada acorde se forma apilando notas alternas de la escala (terceras) sobre una nota de la escala.";
      if (basis === "symmetric")
        return wholeTone
          ? "Apilar notas alternas de una escala de tonos enteros siempre da una tríada aumentada: todos los acordes tienen la misma forma, un tono más arriba cada vez."
          : "Apilar notas alternas de la escala disminuida da acordes disminuidos: la misma forma se repite cada 3 trastes.";
      if (basis === "blues")
        return (
          `Un blues de 12 compases usa tres acordes: I, IV y V, normalmente tocados como acordes de séptima de dominante (aquí ${chordList}). ` +
          (majorBlues
            ? `${upperFirst(scaleTitle)} suena mejor sobre el acorde I; sobre IV y V muchos guitarristas mueven la escala con el acorde o cambian al blues menor.`
            : `${upperFirst(scaleTitle)} es el sonido clásico sobre los tres: la ♭3 de la escala rozando con la tercera mayor del acorde I es gran parte del sonido del blues.`)
        );
      return `Una escala de ${noteCount} notas tiene muy pocas notas para apilar terceras, así que estos son los acordes de su escala madre, ${parentName}: la tonalidad de la que viene ${scaleTitle}.`;
    },
  };
}
