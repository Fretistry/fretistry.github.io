"use client";

import { useCallback, useEffect, useReducer } from "react";
import { DEFAULT_ROOT, ROOT_NAMES, rootNote, type RootName } from "@/lib/data/roots";
import { DEFAULT_SCALE_ID } from "@/lib/data/scales";
import { CUSTOM_TUNING_ID, DEFAULT_TUNING_ID, getTuningPreset } from "@/lib/data/tunings";
import { parseSearchParams, stateToSearchParams, type PositionChoice } from "@/lib/share";
import { noteToAscii, parsePitch, pitchClassOf, type ChordSize, type Pitch, type SpelledNote } from "@/lib/theory";

export type LabelMode = "note" | "interval" | "degree" | "none";
export type Visibility = "all" | "scale" | "roots";
export type FretRange = "all" | "low" | "high";
export type Spacing = "realistic" | "even";
export type Orientation = "auto" | "horizontal" | "vertical";

export interface ExplorerSettings {
  rootName: RootName;
  scaleId: string;
  tuningId: string;
  /** Strings of the custom tuning (lowest first). */
  customTuning: Pitch[];
  labelMode: LabelMode;
  visibility: Visibility;
  showFretNumbers: boolean;
  spacing: Spacing;
  fretRange: FretRange;
  /** Play a plucked-string sound when notes are clicked. */
  soundEnabled: boolean;
  /** "all" = whole neck, otherwise highlight one position of that system. */
  positionSystem: PositionChoice;
  positionIndex: number;
  /** Highlighted chord (0-based scale degree), or null. */
  chordDegree: number | null;
  chordSize: ChordSize;
  leftHanded: boolean;
  /** "auto" draws the neck vertically on phones and horizontally elsewhere. */
  orientation: Orientation;
  /** Music theory panel folded away. */
  theoryCollapsed: boolean;
}

export interface Selection {
  stringIndex: number;
  fret: number;
}

export interface ExplorerState {
  settings: ExplorerSettings;
  selection: Selection | null;
}

export type ExplorerAction = { type: "update"; patch: Partial<ExplorerSettings> } | { type: "select"; selection: Selection | null };

const STORAGE_KEY = "gse-settings-v1";

export const DEFAULT_SETTINGS: ExplorerSettings = {
  rootName: DEFAULT_ROOT,
  scaleId: DEFAULT_SCALE_ID,
  tuningId: DEFAULT_TUNING_ID,
  customTuning: [...getTuningPreset(DEFAULT_TUNING_ID)!.strings],
  labelMode: "note",
  visibility: "scale",
  showFretNumbers: true,
  spacing: "realistic",
  fretRange: "all",
  soundEnabled: true,
  positionSystem: "all",
  positionIndex: 0,
  chordDegree: null,
  chordSize: "triad",
  leftHanded: false,
  orientation: "auto",
  theoryCollapsed: false,
};

/**
 * What a visit starts with. The musical selection (root, scale, position,
 * chord) always starts fresh on C Major — or on whatever a shared link
 * says. Personal preferences (tuning, labels, view, sound…) are remembered.
 */
const PREFERENCE_KEYS = [
  "tuningId",
  "customTuning",
  "labelMode",
  "visibility",
  "showFretNumbers",
  "spacing",
  "fretRange",
  "soundEnabled",
  "chordSize",
  "leftHanded",
  "orientation",
  "theoryCollapsed",
] as const satisfies readonly (keyof ExplorerSettings)[];

function oneOf<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === "string" && (options as readonly string[]).includes(value) ? (value as T) : fallback;
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

/** Reads saved preferences defensively — anything invalid falls back to defaults. */
function loadSavedSettings(): ExplorerSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const data = JSON.parse(raw) as Record<string, unknown>;
    let customTuning = DEFAULT_SETTINGS.customTuning;
    if (Array.isArray(data.customTuning) && data.customTuning.length >= 4 && data.customTuning.length <= 8) {
      customTuning = data.customTuning.map((p) => parsePitch(String(p)));
    }
    const tuningId =
      typeof data.tuningId === "string" && (data.tuningId === CUSTOM_TUNING_ID || getTuningPreset(data.tuningId))
        ? data.tuningId
        : DEFAULT_SETTINGS.tuningId;
    return {
      ...DEFAULT_SETTINGS,
      tuningId,
      customTuning,
      labelMode: oneOf(data.labelMode, ["note", "interval", "degree", "none"], DEFAULT_SETTINGS.labelMode),
      visibility: oneOf(data.visibility, ["all", "scale", "roots"], DEFAULT_SETTINGS.visibility),
      showFretNumbers: bool(data.showFretNumbers, true),
      spacing: oneOf(data.spacing, ["realistic", "even"], DEFAULT_SETTINGS.spacing),
      fretRange: oneOf(data.fretRange, ["all", "low", "high"], DEFAULT_SETTINGS.fretRange),
      soundEnabled: bool(data.soundEnabled, true),
      chordSize: oneOf(data.chordSize, ["triad", "seventh"], DEFAULT_SETTINGS.chordSize),
      leftHanded: bool(data.leftHanded, false),
      orientation: oneOf(data.orientation, ["auto", "horizontal", "vertical"], DEFAULT_SETTINGS.orientation),
      theoryCollapsed: bool(data.theoryCollapsed, false),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/** Saved settings, overridden by anything in a shared link. */
function loadInitialSettings(): ExplorerSettings {
  const saved = loadSavedSettings();
  if (typeof window === "undefined") return saved;
  return { ...saved, ...parseSearchParams(new URLSearchParams(window.location.search)) };
}

function saveSettings(settings: ExplorerSettings): void {
  try {
    const preferences: Record<string, unknown> = {};
    for (const key of PREFERENCE_KEYS) preferences[key] = settings[key];
    preferences.customTuning = settings.customTuning.map((p) => `${noteToAscii(p.note)}${p.octave}`);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // Storage unavailable — settings simply aren't remembered.
  }
}

/** Keeps the address bar in sync, so the current view can always be shared. */
function syncUrl(settings: ExplorerSettings): void {
  try {
    const query = stateToSearchParams(settings).toString();
    const url = `${window.location.pathname}?${query}${window.location.hash}`;
    if (url !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
      window.history.replaceState(window.history.state, "", url);
    }
  } catch {
    // Some embedded browsers block history changes; sharing still works via the share button.
  }
}

function stringCountOf(settings: ExplorerSettings): number {
  if (settings.tuningId === CUSTOM_TUNING_ID) return settings.customTuning.length;
  return (getTuningPreset(settings.tuningId) ?? getTuningPreset(DEFAULT_TUNING_ID)!).strings.length;
}

/**
 * State transitions. Selection rules:
 * - A highlighted chord belongs to one key, so it is cleared when the root or
 *   scale changes (unless the same update picks a new chord).
 * - Position choices ("box 2", "3 per string") describe a way of looking at
 *   any scale, so they carry over to the new key.
 * - The clicked note keeps its place on the neck; the inspector then shows
 *   what that same fret means in the new key.
 */
export function explorerReducer(state: ExplorerState, action: ExplorerAction): ExplorerState {
  switch (action.type) {
    case "update": {
      const { patch } = action;
      const settings = { ...state.settings, ...patch };
      const keyChanged =
        (patch.rootName !== undefined && patch.rootName !== state.settings.rootName) ||
        (patch.scaleId !== undefined && patch.scaleId !== state.settings.scaleId);
      if (keyChanged && !("chordDegree" in patch)) settings.chordDegree = null;
      let selection = state.selection;
      // A tuning with fewer strings (e.g. 7-string → 6-string) may invalidate the selection.
      if (selection && selection.stringIndex >= stringCountOf(settings)) selection = null;
      return { settings, selection };
    }
    case "select":
      return { ...state, selection: action.selection };
  }
}

/**
 * Central state for the explorer: what the user selected and how the
 * fretboard is displayed. Settings are remembered between visits, and the
 * musical part is mirrored in the URL for sharing.
 */
export function useExplorerState() {
  const [state, dispatch] = useReducer(explorerReducer, undefined, () => ({
    settings: loadInitialSettings(),
    selection: null,
  }));

  useEffect(() => {
    saveSettings(state.settings);
    syncUrl(state.settings);
  }, [state.settings]);

  const update = useCallback((patch: Partial<ExplorerSettings>) => dispatch({ type: "update", patch }), []);
  const select = useCallback((selection: Selection | null) => dispatch({ type: "select", selection }), []);

  /** Jump to a related scale (e.g. from the theory panel). Roots are matched by sound. */
  const goToScale = useCallback(
    (root: SpelledNote, scaleId: string) => {
      const pc = pitchClassOf(root);
      const exact = ROOT_NAMES.find((r) => r === noteToAscii(root));
      const byPitch = ROOT_NAMES.find((r) => pitchClassOf(rootNote(r)) === pc);
      update({ rootName: exact ?? byPitch ?? DEFAULT_ROOT, scaleId, chordDegree: null });
    },
    [update],
  );

  return { settings: state.settings, selection: state.selection, update, select, goToScale };
}
