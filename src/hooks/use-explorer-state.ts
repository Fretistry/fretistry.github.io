"use client";

import { useCallback, useEffect, useReducer, useState } from "react";
import { DEFAULT_ROOT, ROOT_NAMES, rootNote, type RootName } from "@/lib/data/roots";
import { DEFAULT_SCALE_ID } from "@/lib/data/scales";
import { CUSTOM_TUNING_ID, DEFAULT_TUNING_ID, getTuningPreset } from "@/lib/data/tunings";
import type { Locale } from "@/lib/i18n";
import { parseScalePagePath, scalePagePath } from "@/lib/pages";
import { pageSearchParams, parseSearchParams, type PositionChoice } from "@/lib/share";
import { BASE_PATH } from "@/lib/site";
import { noteToAscii, parsePitch, pitchClassOf, type ChordSize, type Pitch, type SpelledNote } from "@/lib/theory";
import { FRET_RANGES, type FretRange } from "@/components/fretboard/geometry";

export type LabelMode = "note" | "interval" | "degree" | "none";
export type Visibility = "all" | "scale" | "roots";
export type { FretRange };
/** "auto" = frets 0–12 on phones, the whole neck (0–24) on larger screens. */
export type FretRangeSetting = FretRange | "auto";
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
  fretRange: FretRangeSetting;
  /** Play a plucked-string sound when notes are clicked. */
  soundEnabled: boolean;
  /** "all" = whole neck, otherwise highlight one position of that system. */
  positionSystem: PositionChoice;
  /** Which positions are shown (several CAGED shapes / boxes at once are allowed). */
  positionIndices: number[];
  /** Highlighted chord (0-based scale degree), or null. */
  chordDegree: number | null;
  chordSize: ChordSize;
  leftHanded: boolean;
  /** "auto" draws the neck vertically on phones and horizontally elsewhere. */
  orientation: Orientation;
  /** Music theory panel folded away. */
  theoryCollapsed: boolean;
  /** On a key change, show the shape nearest the frets you were on (instead of the same shape letter). */
  keepArea: boolean;
  /** The metronome & drone bar at the neck: "auto" (= shown) until hidden with its × or the header button. */
  metronomeBar: MetronomeBarSetting;
}

export type MetronomeBarSetting = "auto" | "shown" | "hidden";

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
/**
 * Version 2 added the "auto" fret range. Version 1 always saved "all" (its only
 * default), so a saved "all" without a version is read as "auto".
 */
const STORAGE_VERSION = 2;

export const DEFAULT_SETTINGS: ExplorerSettings = {
  rootName: DEFAULT_ROOT,
  scaleId: DEFAULT_SCALE_ID,
  tuningId: DEFAULT_TUNING_ID,
  customTuning: [...getTuningPreset(DEFAULT_TUNING_ID)!.strings],
  labelMode: "note",
  visibility: "scale",
  showFretNumbers: true,
  spacing: "realistic",
  fretRange: "auto",
  soundEnabled: true,
  positionSystem: "all",
  positionIndices: [0],
  chordDegree: null,
  chordSize: "triad",
  leftHanded: false,
  orientation: "auto",
  theoryCollapsed: false,
  keepArea: false,
  metronomeBar: "auto",
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
  "keepArea",
  "metronomeBar",
] as const satisfies readonly (keyof ExplorerSettings)[];

function oneOf<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === "string" && (options as readonly string[]).includes(value) ? (value as T) : fallback;
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

/** The fret range to draw: "auto" picks 0–12 on phones and the whole neck elsewhere. */
export function effectiveFretRange(setting: FretRangeSetting, isPhone: boolean): FretRange {
  return setting === "auto" ? (isPhone ? "low" : "all") : setting;
}

/** Reads saved preferences defensively — anything invalid falls back to defaults. */
function loadSavedSettings(): ExplorerSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return settingsFromSaved(JSON.parse(raw) as Record<string, unknown>);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/** Turns saved preferences back into settings (exported for the tests). */
export function settingsFromSaved(data: Record<string, unknown>): ExplorerSettings {
  try {
    const fretRange = oneOf(data.fretRange, ["auto", ...FRET_RANGES], DEFAULT_SETTINGS.fretRange);
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
      fretRange: data.version !== STORAGE_VERSION && fretRange === "all" ? "auto" : fretRange,
      soundEnabled: bool(data.soundEnabled, true),
      chordSize: oneOf(data.chordSize, ["triad", "seventh"], DEFAULT_SETTINGS.chordSize),
      leftHanded: bool(data.leftHanded, false),
      orientation: oneOf(data.orientation, ["auto", "horizontal", "vertical"], DEFAULT_SETTINGS.orientation),
      theoryCollapsed: bool(data.theoryCollapsed, false),
      keepArea: bool(data.keepArea, false),
      metronomeBar: oneOf(data.metronomeBar, ["auto", "shown", "hidden"], DEFAULT_SETTINGS.metronomeBar),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/** Saved settings, overridden by the page's key and scale (/nl/a-minor-pentatonic) and anything after the "?". */
function loadInitialSettings(): ExplorerSettings {
  const saved = loadSavedSettings();
  if (typeof window === "undefined") return saved;
  const page = parseScalePagePath(window.location.pathname, BASE_PATH);
  return {
    ...saved,
    ...parseSearchParams(new URLSearchParams(window.location.search)),
    ...(page ? { rootName: page.rootName, scaleId: page.scaleId } : {}),
  };
}

function saveSettings(settings: ExplorerSettings): void {
  try {
    const preferences: Record<string, unknown> = {};
    for (const key of PREFERENCE_KEYS) preferences[key] = settings[key];
    preferences.customTuning = settings.customTuning.map((p) => `${noteToAscii(p.note)}${p.octave}`);
    preferences.version = STORAGE_VERSION;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // Storage unavailable — settings simply aren't remembered.
  }
}

/**
 * Keeps the address bar on the page of what you're looking at
 * (/nl/a-minor-pentatonic?tuning=drop-d), so the view can always be shared or
 * bookmarked — and reloading it opens exactly that page.
 */
function syncUrl(settings: ExplorerSettings, locale: Locale): void {
  try {
    const query = pageSearchParams(settings).toString();
    const path = `${BASE_PATH}${scalePagePath({ locale, rootName: settings.rootName, scaleId: settings.scaleId })}`;
    const url = `${path}${query ? `?${query}` : ""}${window.location.hash}`;
    if (url !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
      window.history.replaceState(window.history.state, "", url);
    }
  } catch {
    // Some embedded browsers block history changes; sharing still works via the share button.
  }
}

/** A plain visit to the home page (no scale page, nothing after the "?") — its address stays as it is until you change something. */
function isUntouchedHome(): boolean {
  return !parseScalePagePath(window.location.pathname, BASE_PATH) && window.location.search === "";
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
export function useExplorerState(locale: Locale) {
  const [state, dispatch] = useReducer(explorerReducer, undefined, () => ({
    settings: loadInitialSettings(),
    selection: null,
  }));
  const [initialSettings] = useState(state.settings);
  const [homeUntouched] = useState(isUntouchedHome);

  useEffect(() => {
    saveSettings(state.settings);
  }, [state.settings]);

  // The address follows the key, scale and language — except on a plain home-page visit where nothing changed yet.
  useEffect(() => {
    if (homeUntouched && state.settings === initialSettings) return;
    syncUrl(state.settings, locale);
  }, [state.settings, locale, homeUntouched, initialSettings]);

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
