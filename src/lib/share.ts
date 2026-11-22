import { isRootName, type RootName } from "@/lib/data/roots";
import { findScale } from "@/lib/data/scales";
import { CUSTOM_TUNING_ID, CUSTOM_TUNING_MIDI_RANGE, getTuningPreset } from "@/lib/data/tunings";
import { midiOf, noteToAscii, parsePitch, type ChordSize, type Pitch } from "@/lib/theory";

/**
 * Shareable links: the musical state (root, scale, tuning, position, chord)
 * is stored in the address bar, e.g.
 *   ?root=A&scale=dorian&tuning=drop-d&pos=box2&chord=4
 * Personal display preferences (labels, theme, left-handed…) are not shared.
 */

export type PositionChoice = "all" | "boxes" | "3nps";

export interface SharedState {
  rootName: RootName;
  scaleId: string;
  tuningId: string;
  customTuning: Pitch[];
  positionSystem: PositionChoice;
  /** 0-based position numbers. Several = several CAGED shapes / boxes at once (3-per-string uses one). */
  positionIndices: number[];
  /** 0-based chord degree, or null for no chord. */
  chordDegree: number | null;
  chordSize: ChordSize;
}

/** URL-friendly root names: "C#" → "Cs" (a "#" would start a URL fragment). */
function rootToParam(root: RootName): string {
  return root.replace("#", "s");
}

function rootFromParam(value: string | null): RootName | undefined {
  if (!value) return undefined;
  const normalised = value.length === 2 && value[1] === "s" ? `${value[0].toUpperCase()}#` : value.charAt(0).toUpperCase() + value.slice(1);
  return isRootName(normalised) ? normalised : undefined;
}

function pitchToParam(p: Pitch): string {
  return `${noteToAscii(p.note).replace("#", "s")}${p.octave}`;
}

function pitchFromParam(value: string): Pitch | null {
  try {
    const text = value.length > 1 && value[1] === "s" ? `${value[0]}#${value.slice(2)}` : value;
    const pitch = parsePitch(text.charAt(0).toUpperCase() + text.slice(1));
    const midi = midiOf(pitch);
    return midi >= CUSTOM_TUNING_MIDI_RANGE.min && midi <= CUSTOM_TUNING_MIDI_RANGE.max ? pitch : null;
  } catch {
    return null;
  }
}

export function stateToSearchParams(state: SharedState): URLSearchParams {
  const params = new URLSearchParams();
  params.set("root", rootToParam(state.rootName));
  params.set("scale", state.scaleId);
  params.set("tuning", state.tuningId);
  if (state.tuningId === CUSTOM_TUNING_ID) params.set("strings", state.customTuning.map(pitchToParam).join("."));
  if (state.positionSystem !== "all" && state.positionIndices.length > 0) {
    params.set("pos", `${state.positionSystem}${state.positionIndices.map((i) => i + 1).join("-")}`);
  }
  if (state.chordDegree !== null) {
    params.set("chord", String(state.chordDegree + 1));
    if (state.chordSize === "seventh") params.set("chord7", "1");
  }
  return params;
}

/** Reads whatever valid state the URL contains; invalid or missing values are simply left out. */
export function parseSearchParams(params: URLSearchParams): Partial<SharedState> {
  const result: Partial<SharedState> = {};

  const root = rootFromParam(params.get("root"));
  if (root) result.rootName = root;

  const scale = params.get("scale");
  if (scale && findScale(scale)) result.scaleId = scale;

  const tuning = params.get("tuning");
  if (tuning === CUSTOM_TUNING_ID) {
    const strings = (params.get("strings") ?? "").split(".").map(pitchFromParam);
    if (strings.length >= 4 && strings.length <= 8 && strings.every((p): p is Pitch => p !== null)) {
      result.tuningId = CUSTOM_TUNING_ID;
      result.customTuning = strings;
    }
  } else if (tuning && getTuningPreset(tuning)) {
    result.tuningId = tuning;
  }

  // "boxes2" (one shape) or "boxes1-2-3" (several shapes at once)
  const pos = /^(boxes|3nps)(\d{1,2}(?:-\d{1,2}){0,6})$/.exec(params.get("pos") ?? "");
  if (pos) {
    const system = pos[1] as PositionChoice;
    const indices = [...new Set(pos[2].split("-").map((n) => Math.max(0, Number(n) - 1)))].sort((a, b) => a - b);
    result.positionSystem = system;
    result.positionIndices = system === "3nps" ? indices.slice(0, 1) : indices;
  } else if (params.has("root") || params.has("scale")) {
    result.positionSystem = "all";
  }

  const chord = /^(\d)$/.exec(params.get("chord") ?? "");
  if (chord && Number(chord[1]) >= 1) {
    result.chordDegree = Number(chord[1]) - 1;
    result.chordSize = params.get("chord7") === "1" ? "seventh" : "triad";
  } else if (params.has("root") || params.has("scale")) {
    result.chordDegree = null;
  }

  // Older links may still contain "mode=practice" (practice mode was removed); it is simply ignored.
  return result;
}
