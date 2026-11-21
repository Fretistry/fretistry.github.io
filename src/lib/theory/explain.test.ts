import { describe, expect, it } from "vitest";
import { ROOT_NAMES, rootNote } from "@/lib/data/roots";
import { SCALES, getScale } from "@/lib/data/scales";
import { explainScale } from "./explain";
import { noteToAscii, parseNote } from "./notes";
import {
  equivalentRoots,
  findParentMajor,
  findParentScale,
  findRelative,
  findSubsetRelations,
  rotateIntervals,
  symmetryPeriod,
} from "./relationships";
import { spellScale } from "./scales";

const spell = (root: string, scaleId: string) => spellScale(parseNote(root), getScale(scaleId));
const explain = (root: string, scaleId: string) => explainScale(spell(root, scaleId), SCALES);

describe("relationships", () => {
  it("rotates intervals into modes", () => {
    expect(rotateIntervals([0, 2, 4, 5, 7, 9, 11], 5)).toEqual([0, 2, 3, 5, 7, 8, 10]); // Aeolian
    expect(rotateIntervals([0, 2, 4, 5, 7, 9, 11], 1)).toEqual([0, 2, 3, 5, 7, 9, 10]); // Dorian
  });

  it("finds modes of harmonic minor, melodic minor and double harmonic", () => {
    const cases: [string, string, string, string, number][] = [
      ["E", "phrygian-dominant", "A", "harmonic-minor", 5],
      ["C", "lydian-dominant", "G", "melodic-minor", 4],
      ["C", "altered", "Db", "melodic-minor", 7],
      ["C", "hungarian-minor", "G", "double-harmonic", 4],
    ];
    for (const [root, id, parentRoot, parentId, modeNumber] of cases) {
      const found = findParentScale(spell(root, id), SCALES)!;
      expect(noteToAscii(found.parentRoot), id).toBe(parentRoot);
      expect(found.parent.id, id).toBe(parentId);
      expect(found.modeNumber, id).toBe(modeNumber);
    }
    // A parent scale is not reported as a mode of itself, and major modes use findParentMajor instead.
    expect(findParentScale(spell("A", "harmonic-minor"), SCALES)).toBeNull();
    expect(findParentScale(spell("C", "major-pentatonic"), SCALES)).toBeNull();

    const mode = explain("E", "phrygian-dominant").relationships.find((r) => r.kind === "mode")!;
    expect(mode.title).toBe("E Phrygian Dominant is the 5th mode of A Harmonic Minor");
    expect(mode.target).toEqual({ root: parseNote("A"), scaleId: "harmonic-minor" });
  });

  it("finds the relative major of A minor (C) and relative minor of C major (A)", () => {
    const rel = findRelative(spell("A", "natural-minor"), SCALES)!;
    expect(rel.kind).toBe("relative-major");
    expect(noteToAscii(rel.match.root)).toBe("C");
    expect(rel.match.scale.id).toBe("major");

    const rel2 = findRelative(spell("C", "major"), SCALES)!;
    expect(noteToAscii(rel2.match.root)).toBe("A");
    expect(rel2.match.scale.id).toBe("natural-minor");

    // Correct spelling of relatives in sharp/flat keys
    expect(noteToAscii(findRelative(spell("Eb", "major"), SCALES)!.match.root)).toBe("C");
    expect(noteToAscii(findRelative(spell("F#", "major"), SCALES)!.match.root)).toBe("D#");
    expect(noteToAscii(findRelative(spell("E", "minor-pentatonic"), SCALES)!.match.root)).toBe("G");
  });

  it("detects parent major keys of modes", () => {
    const dorian = findParentMajor(spell("D", "dorian"), SCALES)!;
    expect(noteToAscii(dorian.parentRoot)).toBe("C");
    expect(dorian.modeNumber).toBe(2);
    expect(dorian.modes.map((m) => `${noteToAscii(m.root)} ${m.name}`)).toEqual([
      "C Ionian",
      "D Dorian",
      "E Phrygian",
      "F Lydian",
      "G Mixolydian",
      "A Aeolian",
      "B Locrian",
    ]);
    expect(findParentMajor(spell("A", "natural-minor"), SCALES)!.modeNumber).toBe(6);
    expect(noteToAscii(findParentMajor(spell("G", "mixolydian"), SCALES)!.parentRoot)).toBe("C");
    expect(noteToAscii(findParentMajor(spell("Bb", "lydian"), SCALES)!.parentRoot)).toBe("F");
    expect(findParentMajor(spell("A", "harmonic-minor"), SCALES)).toBeNull();
    expect(findParentMajor(spell("A", "minor-pentatonic"), SCALES)).toBeNull();
  });

  it("finds subset relationships (blues contains minor pentatonic)", () => {
    const rels = findSubsetRelations(spell("A", "blues"), SCALES);
    const pent = rels.find((r) => r.other.scale.id === "minor-pentatonic")!;
    expect(pent.kind).toBe("contains");
    expect(pent.difference.map((n) => noteToAscii(n.note))).toEqual(["Eb"]);

    const majorPent = findSubsetRelations(spell("C", "major-pentatonic"), SCALES).find(
      (r) => r.other.scale.id === "major",
    )!;
    expect(majorPent.kind).toBe("contained-in");
    expect(majorPent.difference.map((n) => noteToAscii(n.note))).toEqual(["F", "B"]);
  });

  it("detects symmetrical scales", () => {
    expect(symmetryPeriod(getScale("whole-tone").intervals)).toBe(2);
    expect(symmetryPeriod(getScale("diminished").intervals)).toBe(3);
    expect(symmetryPeriod(getScale("major").intervals)).toBeNull();
    expect(equivalentRoots(spell("C", "diminished")).map(noteToAscii)).toEqual(["C", "Eb", "Gb", "A"]);
  });
});

describe("explanations", () => {
  it("explains C Major", () => {
    const e = explain("C", "major");
    expect(e.title).toBe("C Major");
    expect(e.notes).toEqual(["C", "D", "E", "F", "G", "A", "B"]);
    expect(e.formula).toEqual(["1", "2", "3", "4", "5", "6", "7"]);
    expect(e.stepSummary).toBe("W – W – H – W – W – W – H");
    expect(e.intervalRows.map((r) => r.intervalName)).toContain("Major 3rd");
    expect(e.characterHeading).toBe("Why it sounds major");
    expect(e.relationships.some((r) => r.title.includes("Relative minor: A Natural Minor"))).toBe(true);
    expect(e.modeFamily).toHaveLength(7);
  });

  it("explains A Natural Minor and its relationship to C Major", () => {
    const e = explain("A", "natural-minor");
    expect(e.title).toBe("A Natural Minor (Aeolian)");
    expect(e.notes).toEqual(["A", "B", "C", "D", "E", "F", "G"]);
    expect(e.formula).toEqual(["1", "2", "♭3", "4", "5", "♭6", "♭7"]);
    expect(e.stepSummary).toBe("W – H – W – W – H – W – W");
    expect(e.characterHeading).toBe("Why it sounds minor");
    const relative = e.relationships.find((r) => r.kind === "relative")!;
    expect(relative.title).toBe("Relative major: C Major");
    expect(relative.text).toContain("A Natural Minor is called the relative minor of C Major");
    const mode = e.relationships.find((r) => r.kind === "mode")!;
    expect(mode.title).toBe("A Aeolian is the 6th mode of C Major");
  });

  it("explains spelling choices with the one-letter-per-degree rule", () => {
    const e = explain("Eb", "major");
    const ab = e.whyItems.find((w) => w.note === "A♭")!;
    expect(ab.text).toContain("must use the letter A");
    expect(ab.text).toContain("not G♯");
  });

  it("describes how modes differ from their reference scale", () => {
    expect(explain("D", "dorian").character.join(" ")).toContain("a raised 6th (B instead of B♭)");
    expect(explain("F", "lydian").character.join(" ")).toContain("a raised 4th (B instead of B♭)");
    expect(explain("B", "locrian").character.join(" ")).toContain("no perfect 5th");
  });

  it("explains blues as minor pentatonic plus the blue note", () => {
    const e = explain("A", "blues");
    expect(e.character.join(" ")).toContain("A Minor Pentatonic scale plus one extra note");
    expect(e.character.join(" ")).toContain("blue note");
  });

  it("generates explanations for every root and scale without errors", () => {
    for (const root of ROOT_NAMES) {
      for (const scale of SCALES) {
        const e = explainScale(spellScale(rootNote(root), scale), SCALES);
        expect(e.notes.length).toBe(scale.intervals.length);
        expect(e.whyItems.length).toBe(scale.intervals.length);
        expect(e.construction.length).toBeGreaterThan(0);
        expect(e.construction.join(" ")).not.toContain("undefined");
        expect(e.character.join(" ")).not.toContain("undefined");
        expect(e.relationships.map((r) => r.text).join(" ")).not.toContain("undefined");
      }
    }
  });
});
