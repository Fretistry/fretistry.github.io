import { midiOf, mod12, parsePitch, pitchClassOf, pitchFromMidi } from "@/lib/theory/notes";
import type { Pitch, Tuning } from "@/lib/theory/types";
import { ROOT_NAMES, rootNote } from "./roots";

/** Builds a tuning from a readable string of pitches, lowest string first. */
function tuning(id: string, name: string, pitches: string): Tuning {
  return { id, name, strings: pitches.split(/\s+/).map(parsePitch) };
}

/**
 * Preset tunings, stored as real pitches (note + octave), lowest string first.
 * Add a new preset by adding one line — any number of strings is supported —
 * then add it to a group below and give it a name in every `src/lib/i18n/ui` file.
 */
export const TUNING_PRESETS: readonly Tuning[] = [
  // Standard & drop
  tuning("standard", "Standard", "E2 A2 D3 G3 B3 E4"),
  tuning("eb-standard", "E♭ Standard", "Eb2 Ab2 Db3 Gb3 Bb3 Eb4"),
  tuning("d-standard", "D Standard", "D2 G2 C3 F3 A3 D4"),
  tuning("c-standard", "C Standard", "C2 F2 Bb2 Eb3 G3 C4"),
  tuning("drop-d", "Drop D", "D2 A2 D3 G3 B3 E4"),
  tuning("drop-c", "Drop C", "C2 G2 C3 F3 A3 D4"),
  tuning("drop-b", "Drop B", "B1 F#2 B2 E3 G#3 C#4"),
  // Open & alternate
  tuning("open-g", "Open G", "D2 G2 D3 G3 B3 D4"),
  tuning("open-d", "Open D", "D2 A2 D3 F#3 A3 D4"),
  tuning("open-e", "Open E", "E2 B2 E3 G#3 B3 E4"),
  tuning("open-a", "Open A", "E2 A2 E3 A3 C#4 E4"),
  tuning("open-c", "Open C", "C2 G2 C3 G3 C4 E4"),
  tuning("dadgad", "DADGAD", "D2 A2 D3 G3 A3 D4"),
  // 7-string guitars
  tuning("seven-standard", "7-string Standard", "B1 E2 A2 D3 G3 B3 E4"),
  tuning("seven-drop-a", "7-string Drop A", "A1 E2 A2 D3 G3 B3 E4"),
];

export type TuningGroupId = "standard" | "open" | "seven";

/** How the presets are grouped in the tuning menu. */
export const TUNING_GROUPS: readonly { id: TuningGroupId; tuningIds: readonly string[] }[] = [
  { id: "standard", tuningIds: ["standard", "eb-standard", "d-standard", "c-standard", "drop-d", "drop-c", "drop-b"] },
  { id: "open", tuningIds: ["open-g", "open-d", "open-e", "open-a", "open-c", "dadgad"] },
  { id: "seven", tuningIds: ["seven-standard", "seven-drop-a"] },
];

/** String counts the custom-tuning editor offers. */
export const CUSTOM_STRING_COUNTS = [6, 7] as const;

export const CUSTOM_TUNING_ID = "custom";
export const DEFAULT_TUNING_ID = "standard";

export function getTuningPreset(id: string): Tuning | undefined {
  return TUNING_PRESETS.find((t) => t.id === id);
}

export function makeCustomTuning(strings: readonly Pitch[]): Tuning {
  return { id: CUSTOM_TUNING_ID, name: "Custom", strings };
}

/** Lowest and highest MIDI notes allowed for a custom-tuned string (B0 – C6). */
export const CUSTOM_TUNING_MIDI_RANGE = { min: 23, max: 84 } as const;

export function clampMidi(midi: number): number {
  return Math.min(CUSTOM_TUNING_MIDI_RANGE.max, Math.max(CUSTOM_TUNING_MIDI_RANGE.min, midi));
}

/** Spells a MIDI note with the same note names used by the root picker (C♯, E♭, F♯, A♭, B♭). */
export function pitchWithFriendlyName(midi: number): Pitch {
  const name = ROOT_NAMES.find((r) => pitchClassOf(rootNote(r)) === mod12(midi))!;
  return pitchFromMidi(midi, rootNote(name));
}

/**
 * Adds or removes low strings: a new low string is tuned a 4th below the
 * current lowest one (E → B, as on a 7-string guitar); removing takes the
 * lowest string away.
 */
export function withStringCount(strings: readonly Pitch[], count: number): Pitch[] {
  const next = [...strings];
  while (next.length > count) next.shift();
  while (next.length < count) next.unshift(pitchWithFriendlyName(clampMidi(midiOf(next[0]) - 5)));
  return next;
}
