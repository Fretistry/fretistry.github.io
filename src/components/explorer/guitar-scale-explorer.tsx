"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Target } from "lucide-react";
import { Fretboard, POSITION_TINT, type PositionArea } from "@/components/fretboard/fretboard";
import type { FretboardImageInput, LegendEntry } from "@/components/fretboard/fretboard-image";
import { fretRangeBounds } from "@/components/fretboard/geometry";
import { shapeColor } from "@/components/fretboard/shape-colors";
import {
  computeMarker,
  computeTrainerMarker,
  type ChordDisplay,
  type MarkerModel,
  type MarkerText,
} from "@/components/fretboard/marker-model";
import { I18nProvider, useI18n } from "@/components/i18n/i18n-provider";
import { NoteStrip } from "@/components/inspector/note-summary";
import { MetronomeBar } from "@/components/metronome/metronome-control";
import { MetronomeProvider, useSharedMetronome } from "@/components/metronome/metronome-provider";
import { TheoryPanel } from "@/components/theory/theory-panel";
import { Button } from "@/components/ui/button";
import { effectiveFretRange, useExplorerState } from "@/hooks/use-explorer-state";
import { useFavourites } from "@/hooks/use-favourites";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useScalePlayer, type PlayStep } from "@/hooks/use-scale-player";
import { useTrainer } from "@/hooks/use-trainer";
import { getAudioEngine } from "@/lib/audio/audio-engine";
import { getSharedAudio } from "@/lib/audio/audio-context";
import { secondsPerTick } from "@/lib/audio/metronome";
import { ascendingScale, chordVoicing, upAndDown } from "@/lib/audio/sequence";
import { installWebAudioEngine } from "@/lib/audio/web-audio-engine";
import { ROOT_NAMES, rootNote, type RootName } from "@/lib/data/roots";
import { SCALES, getScale } from "@/lib/data/scales";
import { CUSTOM_TUNING_ID, DEFAULT_TUNING_ID, getTuningPreset, makeCustomTuning } from "@/lib/data/tunings";
import { isFavourite } from "@/lib/favourites";
import { imageFileName } from "@/lib/file-name";
import { alternativeScaleTitle } from "@/lib/i18n/spoken";
import { parseScalePagePath } from "@/lib/pages";
import { BASE_PATH, CREATOR, SITE_NAME, SITE_URL } from "@/lib/site";
import { keyBelongsToFocus, nextInFourths, shortcutAllowed, stepRoot } from "@/lib/shortcuts";
import { cagedIndex, pentatonicBox, shapeOfBox, type StartingPoint } from "@/lib/start-here";
import { inTrainerArea, pickTarget, trainerTargets } from "@/lib/trainer";
import { cn } from "@/lib/utils";
import {
  buildScaleFretboard,
  choosePlayShape,
  explainScale,
  intervalDisplayLabel,
  mod12,
  pitchClassOf,
  nearestPosition,
  positionKey,
  positionStartFret,
  hasCagedShapes,
  positionSystemsFor,
  scaleChords,
  scalePositions,
  shapePath,
  spellScale,
  type ChordSize,
  type FretboardNote,
  type ScaleChord,
  type ScalePosition,
  type Tuning,
} from "@/lib/theory";
import { AppHeader } from "./app-header";
import { ChordBar, ChordSummary, ChordsButton } from "./chord-bar";
import { DisplayToolbar } from "./display-toolbar";
import { FavouriteButton, FavouritesBar, StartHereBar, StarterShapeBar } from "./favourites";
import { Legend } from "./legend";
import { PositionPicker } from "./position-picker";
import { SiteFooter } from "./privacy-note";
import { RootNotePicker } from "./root-note-picker";
import { ScaleHeader } from "./scale-header";
import { ShareMenu } from "./share-button";
import { KeySteps, ShortcutsDialog } from "./shortcuts-dialog";
import { ScaleSelect } from "./scale-select";
import { TrainerBar } from "./trainer-bar";
import { TuningSelect } from "./tuning-select";

function Field({
  label,
  extra,
  children,
  className,
}: {
  label: string;
  /** Small buttons at the end of the label line (larger screens). */
  extra?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {/* phones: key, scale and tuning share one row without labels (still read out by screen readers) */}
      <div className="mb-1.5 flex items-center justify-between gap-2 max-sm:sr-only">
        <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">{label}</p>
        {/* negative margins: the buttons don't make the label line taller (the neck stays where it is) */}
        {extra && <div className="-my-2 max-sm:hidden">{extra}</div>}
      </div>
      {children}
    </div>
  );
}

/** The published site's address for the corner of saved pictures ("fretistry.com"), or null while running locally. */
function publicSiteLabel(): string | null {
  try {
    const url = new URL(SITE_URL);
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return null;
    return `${url.host}${BASE_PATH}`;
  } catch {
    return null;
  }
}

/** The five-note scale that is easier to start with than a seven-note one (same root). */
const EASIER_SCALE: Record<string, string> = { major: "major-pentatonic", "natural-minor": "minor-pentatonic" };

/** Every spot within the fret span each shape covers on each string (also spots between its notes). */
function shapeSpanKeys(positions: readonly ScalePosition[]): Set<string> {
  const keys = new Set<string>();
  for (const occurrence of positions.flatMap((p) => p.occurrences)) {
    const ranges = new Map<number, [number, number]>();
    for (const n of occurrence) {
      const r = ranges.get(n.stringIndex);
      ranges.set(n.stringIndex, r ? [Math.min(r[0], n.fret), Math.max(r[1], n.fret)] : [n.fret, n.fret]);
    }
    for (const [s, [lo, hi]] of ranges) for (let f = lo; f <= hi; f++) keys.add(positionKey(s, f));
  }
  return keys;
}

/** Entry point: the explorer inside its language and metronome providers. */
export function GuitarScaleExplorer() {
  return (
    <I18nProvider>
      <MetronomeProvider>
        <ExplorerApp />
      </MetronomeProvider>
    </I18nProvider>
  );
}

/**
 * The application shell. It owns the state, asks the theory engine for the
 * calculated fretboard, positions, chords and explanations, and hands the
 * results to the presentational components.
 */
function ExplorerApp() {
  const i18n = useI18n();
  const { ui, theory } = i18n;
  const { settings, selection, update, select, goToScale } = useExplorerState(i18n.locale);
  const favourites = useFavourites();
  const metronome = useSharedMetronome();
  const currentFavourite = useMemo(() => ({ rootName: settings.rootName, scaleId: settings.scaleId }), [settings.rootName, settings.scaleId]);
  const isPhone = useMediaQuery("(max-width: 639px)");
  const orientation = settings.orientation === "auto" ? (isPhone ? "vertical" : "horizontal") : settings.orientation;
  const [neckOverflows, setNeckOverflows] = useState(false);
  const fretRange = effectiveFretRange(settings.fretRange, isPhone);
  const [firstFret, lastFret] = fretRangeBounds(fretRange);

  // ── Music theory (pure calculations, memoised) ────────────────────────────
  const scale = getScale(settings.scaleId);
  const tuning: Tuning = useMemo(
    () =>
      settings.tuningId === CUSTOM_TUNING_ID
        ? makeCustomTuning(settings.customTuning)
        : (getTuningPreset(settings.tuningId) ?? getTuningPreset(DEFAULT_TUNING_ID)!),
    [settings.tuningId, settings.customTuning],
  );
  const spelled = useMemo(() => spellScale(rootNote(settings.rootName), scale), [settings.rootName, scale]);
  const board = useMemo(() => buildScaleFretboard(tuning, spelled), [tuning, spelled]);
  const explanation = useMemo(() => explainScale(spelled, SCALES, theory), [spelled, theory]);
  const caged = hasCagedShapes(tuning);
  const tuningKey = board.map((row) => row[0]?.midi).join(",");

  // The browser tab names the scale (the same title search engines see on the scale's page).
  useEffect(() => {
    const apply = () => {
      const onScalePage = parseScalePagePath(window.location.pathname, BASE_PATH) !== null;
      document.title = onScalePage
        ? `${ui.seo.pageTitle(explanation.title, alternativeScaleTitle(i18n, spelled))} · ${SITE_NAME}`
        : ui.documentTitle;
    };
    apply();
    // Right after start-up Next.js may put the page's original title back once; apply ours again after that.
    const again = window.setTimeout(apply, 300);
    return () => window.clearTimeout(again);
  }, [ui, i18n, spelled, explanation.title, settings]);

  // ── Scale positions (box shapes) ─────────────────────────────────────────
  const availableSystems = useMemo(() => positionSystemsFor(spelled), [spelled]);
  const positionSystem =
    settings.positionSystem === "3nps" && !availableSystems.includes("3nps") ? "boxes" : settings.positionSystem;
  const positions = useMemo(
    () => (positionSystem === "all" ? [] : scalePositions(spelled, tuning, positionSystem)),
    [spelled, tuning, positionSystem],
  );
  // Any combination of CAGED shapes / boxes (also none); 3-per-string shows one pattern at a time.
  const positionIndices = useMemo(() => {
    if (positions.length === 0) return [];
    const valid = [...new Set(settings.positionIndices.filter((i) => i >= 0 && i < positions.length))].sort((a, b) => a - b);
    return positionSystem === "3nps" ? (valid.length > 0 ? valid.slice(0, 1) : [0]) : valid;
  }, [positions.length, settings.positionIndices, positionSystem]);
  const activePositions = useMemo(() => positionIndices.map((i) => positions[i]).filter(Boolean), [positionIndices, positions]);
  const activePosition = activePositions[0] ?? null;
  const shapeContext = `${positionSystem}:${positionIndices.join("-")}`;

  // "Stay in this area": with one shape shown, a new key or scale shows the shape nearest the
  // frets you were on (D Dorian's C shape at frets 2–5 → G Mixolydian's E shape, same frets),
  // instead of the same shape letter somewhere else on the neck.
  const withArea = useCallback(
    (patch: { rootName?: RootName; scaleId?: string }) => {
      if (!settings.keepArea || positionSystem === "all" || activePositions.length !== 1) return patch;
      const from = positionStartFret(activePositions[0]);
      if (from === null) return patch;
      const next = spellScale(rootNote(patch.rootName ?? settings.rootName), getScale(patch.scaleId ?? settings.scaleId));
      const system = positionSystem === "3nps" && !positionSystemsFor(next).includes("3nps") ? "boxes" : positionSystem;
      const index = nearestPosition(scalePositions(next, tuning, system), from);
      return index === null ? patch : { ...patch, positionIndices: [index] };
    },
    [settings.keepArea, settings.rootName, settings.scaleId, positionSystem, activePositions, tuning],
  );
  // Each CAGED shape / box keeps its own colour (C, A, G, E, D); 3-per-string uses the neutral tint.
  const positionAreas: PositionArea[] | null = useMemo(
    () =>
      activePositions.length === 0
        ? null
        : activePositions.map((p) =>
            positionSystem === "boxes"
              ? { occurrences: p.occurrences, color: shapeColor(p.index), label: p.cagedShape ?? String(p.index + 1) }
              : { occurrences: p.occurrences, color: POSITION_TINT, label: null },
          ),
    [activePositions, positionSystem],
  );

  // ── Chords in the key ────────────────────────────────────────────────────
  const triads = useMemo(() => scaleChords(spelled, "triad", SCALES, theory), [spelled, theory]);
  const sevenths = useMemo(() => scaleChords(spelled, "seventh", SCALES, theory), [spelled, theory]);
  const chordSet = settings.chordSize === "seventh" && sevenths.seventhsAvailable ? sevenths : triads;
  const activeChord: ScaleChord | null =
    settings.chordDegree !== null ? (chordSet.chords[settings.chordDegree] ?? null) : null;

  // Which fretboard spots count as "inside" the selected position. For scale notes that is the
  // pattern itself; for chord tones (which may not belong to a pentatonic scale) it is the
  // fret area the pattern covers on each string.
  const positionKeys = useMemo(() => {
    if (activePositions.length === 0) return null;
    if (activeChord) return shapeSpanKeys(activePositions);
    const keys = new Set<string>();
    for (const occurrence of activePositions.flatMap((p) => p.occurrences)) {
      for (const n of occurrence) keys.add(positionKey(n.stringIndex, n.fret));
    }
    return keys;
  }, [activePositions, activeChord]);
  const chordDisplay: ChordDisplay | null = useMemo(
    () =>
      activeChord
        ? {
            rootPitchClass: pitchClassOf(activeChord.root),
            tones: new Map(activeChord.tones.map((t) => [pitchClassOf(t.note), t.interval])),
            names: new Map(activeChord.tones.map((t) => [pitchClassOf(t.note), t.note])),
          }
        : null,
    [activeChord],
  );

  // ── Sound ────────────────────────────────────────────────────────────────
  useEffect(() => installWebAudioEngine(), []);
  const { soundEnabled } = settings;
  const playNote = useCallback(
    (note: FretboardNote) => {
      // Notes on the same string cut each other off, like on a real guitar.
      if (soundEnabled) getAudioEngine().playNote(note.midi, { voice: `string-${note.stringIndex}` });
    },
    [soundEnabled],
  );

  // "Play scale": one shape on the neck — the chosen one, or the one nearest the nut — lit up note
  // by note, one note per metronome click, starting on the next beat when the metronome runs.
  const scalePlayer = useScalePlayer(`${settings.rootName}|${settings.scaleId}|${tuningKey}|${fretRange}|${shapeContext}`);
  const { play: playSequence, stop: stopScale } = scalePlayer;
  const { settings: metronomeSettings, running: metronomeRunning, nextBeatTime } = metronome;
  const playScale = useCallback(() => {
    const rootPc = pitchClassOf(spelled.root);
    const intervals = spelled.scale.intervals;
    const candidates = activePositions.length > 0 ? activePositions : scalePositions(spelled, tuning, "boxes");
    const shape = choosePlayShape(candidates, firstFret, lastFret);
    const steps: PlayStep[] = shape
      ? shapePath(shape, rootPc, intervals).map((s) => ({
          midi: s.midi,
          scaleIndex: s.scaleIndex,
          key: positionKey(s.stringIndex, s.fret),
        }))
      : upAndDown(ascendingScale(rootPc, intervals));
    let startDelay = 0.05;
    const audio = metronomeRunning ? getSharedAudio() : null;
    if (audio) {
      const now = audio.ctx.currentTime;
      const beat = nextBeatTime(now + 0.05);
      if (beat !== null) startDelay = beat - now;
    }
    playSequence(steps, { stepSeconds: secondsPerTick(metronomeSettings), startDelay });
  }, [playSequence, spelled, tuning, activePositions, firstFret, lastFret, metronomeRunning, nextBeatTime, metronomeSettings]);
  const playChord = useCallback(
    (chord: ScaleChord) => {
      if (!soundEnabled) return;
      const rootPc = pitchClassOf(chord.root);
      const semitones = chord.tones.map((t) => mod12(pitchClassOf(t.note) - rootPc));
      const engine = getAudioEngine();
      // A quick downward strum: low to high, a few milliseconds apart.
      chordVoicing(rootPc, semitones).forEach((midi, i) =>
        engine.playNote(midi, { delay: i * 0.035, voice: `chord-${i}`, velocity: 0.75 }),
      );
    },
    [soundEnabled],
  );
  const setSoundEnabled = useCallback(
    (enabled: boolean) => {
      if (!enabled) stopScale();
      update({ soundEnabled: enabled });
    },
    [stopScale, update],
  );

  // ── Fretboard trainer ("find every G") ───────────────────────────────────
  const trainer = useTrainer(`${settings.rootName}|${settings.scaleId}|${tuningKey}|${fretRange}|${shapeContext}`);
  const training = trainer.state.active;
  const trainerSetup = useMemo(() => {
    if (!training) return null;
    // The quiz area: the visible frets, narrowed to the chosen shapes when any are shown.
    let area: Set<string> | null = activePositions.length > 0 ? shapeSpanKeys(activePositions) : null;
    const notesIn = (a: Set<string> | null) =>
      spelled.notes
        .map((n) => ({ pitchClass: pitchClassOf(n.note), name: i18n.note(n.note) }))
        .filter((n) => trainerTargets(board, n.pitchClass, firstFret, lastFret, a).size > 0);
    let candidates = notesIn(area);
    if (candidates.length === 0) {
      area = null;
      candidates = notesIn(null);
    }
    if (candidates.length === 0) return null;
    const target =
      candidates[pickTarget(candidates.map((c) => c.pitchClass), trainer.state.context, trainer.state.round, trainer.state.previous)];
    return { area, target, targets: trainerTargets(board, target.pitchClass, firstFret, lastFret, area) };
  }, [training, activePositions, spelled, i18n, board, firstFret, lastFret, trainer.state.context, trainer.state.round, trainer.state.previous]);

  const { start: startTrainerRound, stop: stopTrainer, tap: trainerTap, next: trainerNext } = trainer;
  const startTrainer = useCallback(() => {
    stopScale();
    select(null);
    startTrainerRound();
  }, [stopScale, select, startTrainerRound]);

  // ── Marker models ────────────────────────────────────────────────────────
  const markerText: MarkerText = useMemo(
    () => ({
      note: i18n.note,
      rootLabel: theory.rootLabel,
      intervalName: theory.intervalName,
      where: ui.fretboard.where,
      root: ui.fretboard.root,
      notInScale: ui.fretboard.notInScale,
      chordRole: ui.fretboard.chordRole,
    }),
    [i18n.note, theory, ui],
  );
  const selectedNote = !training && selection ? (board[selection.stringIndex]?.[selection.fret] ?? null) : null;
  // What the neck normally shows (also what a saved picture shows).
  const markers = useMemo(() => {
    const map = new Map<string, MarkerModel>();
    for (const row of board) {
      for (const note of row) {
        map.set(
          note.key,
          computeMarker(note, {
            text: markerText,
            labelMode: settings.labelMode,
            visibility: settings.visibility,
            chord: chordDisplay,
            positionKeys,
            selectedKey: selectedNote?.key ?? null,
            selectedPitchClass: selectedNote?.pitchClass ?? null,
            selectedMidi: selectedNote?.midi ?? null,
            playingKey: scalePlayer.playingKey,
          }),
        );
      }
    }
    return map;
  }, [board, markerText, settings.labelMode, settings.visibility, chordDisplay, positionKeys, selectedNote, scalePlayer.playingKey]);
  // While training: only the spots you have found are shown, everything else is a blank dot.
  const neckMarkers = useMemo(() => {
    if (!trainerSetup) return markers;
    const found = new Set(trainer.state.found);
    const map = new Map<string, MarkerModel>();
    for (const row of board) {
      for (const note of row) {
        map.set(
          note.key,
          computeTrainerMarker(note, {
            text: markerText,
            inArea: inTrainerArea(note, firstFret, lastFret, trainerSetup.area),
            found: found.has(note.key),
            wrong: trainer.state.wrongKey === note.key,
          }),
        );
      }
    }
    return map;
  }, [trainerSetup, markers, trainer.state.found, trainer.state.wrongKey, board, markerText, firstFret, lastFret]);

  // ── Interaction ──────────────────────────────────────────────────────────
  const handleActivate = useCallback(
    (note: FretboardNote) => {
      playNote(note);
      if (trainerSetup) {
        trainerTap(note.key, trainerSetup.targets);
        return;
      }
      select({ stringIndex: note.stringIndex, fret: note.fret });
    },
    [select, playNote, trainerSetup, trainerTap],
  );

  // Is the tapped pitch also playable elsewhere in the visible frets (dashed rings)?
  const hasSamePitch = useMemo(
    () =>
      selectedNote
        ? board.some((row) =>
            row.some((n) => n.midi === selectedNote.midi && n.key !== selectedNote.key && n.fret >= firstFret && n.fret <= lastFret),
          )
        : false,
    [board, selectedNote, firstFret, lastFret],
  );

  // Colour key entries for the shown shapes ("C shape" in coral, "A shape" in blue…).
  const shapeKey = useMemo(
    () =>
      activePositions.map((p, i) => ({
        label: p.cagedShape ? ui.positions.shape(p.cagedShape) : ui.positions.positionAria(p.index + 1, null),
        color: positionAreas?.[i]?.color ?? POSITION_TINT,
      })),
    [activePositions, positionAreas, ui],
  );

  // ── Metronome & drone bar: shown on every screen until hidden with its × or the header button ──
  const metronomeBarVisible = settings.metronomeBar !== "hidden";
  const toggleMetronomeBar = useCallback(
    () => update({ metronomeBar: metronomeBarVisible ? "hidden" : "shown" }),
    [update, metronomeBarVisible],
  );

  // On a vertical neck the bars above it stay pinned under the header while scrolling down the
  // neck; the neck's string names then pin just below them.
  const showBars = metronomeBarVisible || Boolean(trainerSetup);
  const pinBars = orientation === "vertical" && showBars;
  const barsRef = useRef<HTMLDivElement>(null);
  const [barsHeight, setBarsHeight] = useState(0);
  useEffect(() => {
    const el = barsRef.current;
    if (!el || !pinBars) return;
    const observer = new ResizeObserver(() => setBarsHeight(el.offsetHeight));
    observer.observe(el);
    return () => observer.disconnect();
  }, [pinBars]);

  // ── Bring the neck into view ─────────────────────────────────────────────
  // After a tap whose result shows on the neck (Start here, a shape, Play scale, Train, a chord's
  // "Show"), scroll just enough to show it — on phones the neck starts below the controls. On a
  // vertical neck (taller than the screen) it aims at the chosen shape. Nothing moves when the
  // result is already in view.
  const neckRef = useRef<HTMLDivElement>(null);
  const revealNeck = useCallback(() => {
    window.setTimeout(() => {
      const neck = neckRef.current;
      if (!neck) return;
      const headerBottom = document.querySelector("header")?.getBoundingClientRect().bottom ?? 56;
      const bars = pinBars ? (barsRef.current?.offsetHeight ?? 0) : 0;
      const neckRect = neck.getBoundingClientRect();
      const areas =
        orientation === "vertical" ? [...neck.querySelectorAll("[data-shape-area]")].map((a) => a.getBoundingClientRect()) : [];
      const target = areas.length > 0 ? areas.reduce((a, b) => (b.top < a.top ? b : a)) : neckRect;
      // Below the header, the pinned bars and (inside a vertical neck) the pinned string names.
      const top = headerBottom + bars + (target === neckRect ? 0 : 32) + 8;
      const bottom = window.innerHeight - 8;
      const visible = Math.min(target.bottom, bottom) - Math.max(target.top, top);
      if (visible >= Math.min(target.height, bottom - top) * 0.9) return;
      const delta = target.top < top ? target.top - top : Math.min(target.top - top, target.bottom - bottom);
      const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollBy({ top: delta, behavior: smooth ? "smooth" : "auto" });
    }, 60);
  }, [orientation, pinBars]);

  // ── "Start here": first scales for someone new (until there are favourites) ──
  const isStartingPoint = useCallback(
    (point: StartingPoint) =>
      settings.rootName === point.rootName &&
      settings.scaleId === point.scaleId &&
      (caged ? positionSystem === "boxes" && positionIndices.length === 1 && positionIndices[0] === cagedIndex(point.shape) : positionSystem === "all"),
    [settings.rootName, settings.scaleId, caged, positionSystem, positionIndices],
  );
  const goToStartingPoint = useCallback(
    (point: StartingPoint) => {
      update({
        rootName: point.rootName,
        scaleId: point.scaleId,
        positionSystem: caged ? "boxes" : "all",
        positionIndices: caged ? [cagedIndex(point.shape)] : [0],
        chordDegree: null,
      });
      revealNeck();
    },
    [update, caged, revealNeck],
  );

  // On a scale's own page (reached from a search, a link or a bookmark) the visitor already chose
  // the scale, so "Start here" offers one good first shape for it instead of four other scales.
  const [landedOnHome] = useState(() => parseScalePagePath(window.location.pathname, BASE_PATH) === null);
  const starterShape = useMemo(() => {
    if (!caged) return null;
    const boxes = scalePositions(spelled, tuning, "boxes");
    const start = (p: ScalePosition) => positionStartFret(p) ?? Infinity;
    // Root on the low E string (the E shape: box 1 of the pentatonic), else root on the A string.
    const playable = (letter: string) => boxes.find((p) => p.cagedShape === letter && start(p) <= 8);
    return playable("E") ?? playable("A") ?? [...boxes].sort((a, b) => start(a) - start(b))[0] ?? null;
  }, [caged, spelled, tuning]);
  // "E shape · box 1" (the trainer's tip names it too) and, for the chip, "… · from the 5th fret"
  const starterName = useMemo(() => {
    if (!starterShape?.cagedShape) return null;
    const box = pentatonicBox(settings.scaleId, starterShape.cagedShape);
    return [ui.positions.shape(starterShape.cagedShape), box ? ui.startHere.box(box) : null].filter(Boolean).join(" · ");
  }, [starterShape, settings.scaleId, ui]);
  const starterLabel = useMemo(() => {
    if (!starterShape || !starterName) return null;
    const startFret = positionStartFret(starterShape);
    const where = startFret === 0 ? ui.positions.openPosition : startFret !== null ? ui.positions.fromFret(startFret) : null;
    return where ? `${starterName} · ${where}` : starterName;
  }, [starterShape, starterName, ui]);
  const starterActive =
    starterShape !== null && positionSystem === "boxes" && positionIndices.length === 1 && positionIndices[0] === starterShape.index;
  const goToStarterShape = useCallback(() => {
    if (!starterShape) return;
    update({ positionSystem: "boxes", positionIndices: [starterShape.index], chordDegree: null });
    revealNeck();
  }, [starterShape, update, revealNeck]);
  // Like the home page's suggestions: until there are favourites, and not while training.
  const showStarter = !landedOnHome && favourites.favourites.length === 0 && !training;
  // On a major or natural minor page, "Start here" also offers the pentatonic: five notes, easier to begin with.
  const easierScaleId = EASIER_SCALE[settings.scaleId];
  const easierStart = useMemo(() => {
    if (!easierScaleId) return null;
    const scale = getScale(easierScaleId);
    const title = theory.title(i18n.note(spellScale(rootNote(settings.rootName), scale).root), theory.scaleName(scale));
    return { label: ui.startHere.easier(title), onSelect: () => update({ scaleId: easierScaleId, chordDegree: null }) };
  }, [easierScaleId, settings.rootName, theory, i18n, ui, update]);

  // The drone's ⓘ names this scale's own 3rd and 7th: "C (the ♭3) sounds sad, and G (the ♭7) …".
  const droneListen = useMemo(() => {
    const find = (degree: number, semitones: number) =>
      spelled.notes.find((n) => n.interval.degree === degree && n.semitones === semitones);
    const third = find(3, 4) ?? find(3, 3);
    const seventh = find(7, 11) ?? find(7, 10);
    return ui.drone.listen({
      third: third ? { note: i18n.note(third.note), minor: third.semitones === 3 } : null,
      seventh: seventh ? { note: i18n.note(seventh.note), major: seventh.semitones === 11 } : null,
    });
  }, [spelled, ui, i18n]);

  // ── Next key / random key, and keyboard shortcuts (practising with the guitar in your hands) ──
  const goNextKey = useCallback(
    () => update(withArea({ rootName: nextInFourths(ROOT_NAMES, settings.rootName) })),
    [update, withArea, settings.rootName],
  );
  const goRandomKey = useCallback(() => {
    const others = ROOT_NAMES.filter((r) => r !== settings.rootName);
    update(withArea({ rootName: others[Math.floor(Math.random() * others.length)] }));
  }, [update, withArea, settings.rootName]);

  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const { toggle: toggleMetronome, update: updateMetronome } = metronome;
  const bpm = metronomeSettings.bpm;
  const boxed = pentatonicBox(settings.scaleId, "E") !== null;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!shortcutAllowed(e)) return;
      const act = (action: () => void) => {
        e.preventDefault();
        action();
      };
      const key = e.key;
      if (key === " " || key === "ArrowLeft" || key === "ArrowRight") {
        if (keyBelongsToFocus(e)) return; // a tabbed-to button or button group uses these keys itself
        if (key === " ") return act(toggleMetronome);
        const step = key === "ArrowRight" ? 1 : -1;
        return act(() => update(withArea({ rootName: stepRoot(ROOT_NAMES, settings.rootName, step) })));
      }
      switch (key.toLowerCase()) {
        case "n":
          return act(goNextKey);
        case "r":
          return act(goRandomKey);
        case "p":
          if (!soundEnabled || training) return;
          return act(() => (scalePlayer.isPlaying ? stopScale() : playScale()));
        case "+":
        case "=":
          return act(() => updateMetronome({ bpm: bpm + (bpm >= 100 ? 5 : 2) }));
        case "-":
        case "_":
          return act(() => updateMetronome({ bpm: bpm - (bpm > 100 ? 5 : 2) }));
        case "?":
          return act(() => setShortcutsOpen(true));
      }
      if (/^[0-7]$/.test(key)) {
        const n = Number(key);
        if (n === 0) return act(() => update({ positionSystem: "all", positionIndices: [0] }));
        if (positionSystem === "3nps") {
          if (n <= positions.length) act(() => update({ positionIndices: [n - 1] }));
          return;
        }
        if (n > 5) return;
        // pentatonic and blues: "1" is box 1 (the E shape); otherwise the CAGED order (1 = C shape)
        const shape = boxed && caged ? shapeOfBox(n) : null;
        act(() => update({ positionSystem: "boxes", positionIndices: [shape ? cagedIndex(shape) : n - 1] }));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    toggleMetronome,
    updateMetronome,
    bpm,
    update,
    withArea,
    settings.rootName,
    goNextKey,
    goRandomKey,
    soundEnabled,
    training,
    scalePlayer.isPlaying,
    stopScale,
    playScale,
    positionSystem,
    positions.length,
    boxed,
    caged,
  ]);

  const chordBarProps = {
    chordSet,
    size: settings.chordSize,
    selected: activeChord,
    soundEnabled,
    onSizeChange: (chordSize: ChordSize) => update({ chordSize }),
    onSelect: (chordDegree: number | null) => {
      update({ chordDegree });
      // phones: the chord list is a menu above the neck; show the neck once a chord is picked
      if (chordDegree !== null && isPhone) revealNeck();
    },
    onPlay: playChord,
  };

  // ── "Save image": the picture shows exactly what is on the neck now ──────
  const { tuningName } = i18n;
  const imageInput: FretboardImageInput = useMemo(() => {
    const rows = explanation.intervalRows;
    const details = [ui.image.tuning(tuningName(tuning), tuning.strings.map((p) => i18n.note(p.note)).join(" "))];
    if (activePosition) {
      const allCaged = activePositions.every((p) => p.cagedShape);
      const label =
        positionSystem === "3nps"
          ? `${ui.positions.threePerString} · ${ui.positions.positionAria(activePosition.index + 1, null)}`
          : allCaged
            ? `CAGED · ${activePositions.length === 1 ? ui.positions.shape(activePosition.cagedShape!) : activePositions.map((p) => p.cagedShape).join(", ")}`
            : activePositions.length === 1
              ? ui.positions.positionAria(activePosition.index + 1, null)
              : `${ui.positions.positions} ${activePositions.map((p) => p.index + 1).join(", ")}`;
      details.push(label);
    }
    if (activeChord) details.push(ui.image.chord(activeChord.symbol));
    const legend: LegendEntry[] = [
      { variant: "root", label: activeChord ? ui.legend.rootOf(activeChord.symbol) : ui.legend.root },
      { variant: "scale", label: activeChord ? ui.legend.chordTone : ui.legend.scaleNote },
    ];
    if (activeChord) legend.push({ variant: "home", label: ui.legend.scaleRoot(i18n.note(spelled.root)) });
    if (activeChord || activePosition) {
      legend.push({ variant: "scale", dimmed: true, label: activeChord ? ui.legend.otherDimmed : ui.legend.outsidePosition });
    }
    for (const shape of shapeKey) legend.push({ variant: "position", color: shape.color, label: shape.label });
    if (settings.visibility === "all" && !activeChord) legend.push({ variant: "outside", label: ui.legend.notInScale });
    return {
      notes: board,
      markers,
      tuning,
      stringNames: tuning.strings.map((p) => i18n.note(p.note)),
      spacing: settings.spacing,
      fretRange,
      showFretNumbers: settings.showFretNumbers,
      leftHanded: settings.leftHanded,
      positionAreas,
      title: explanation.title,
      lines: [
        // (SVG collapses repeated spaces, so parts are separated with "·")
        `${ui.theory.notes}: ${rows.map((r) => r.note).join(" ")} · ${ui.theory.formula}: ${rows.map((r) => r.formulaLabel).join(" ")}`,
        details.join(" · "),
      ],
      legend,
      siteLabel: publicSiteLabel(),
    };
  }, [
    explanation,
    spelled,
    ui,
    tuningName,
    tuning,
    i18n,
    activePosition,
    activePositions,
    positionAreas,
    shapeKey,
    positionSystem,
    activeChord,
    settings.visibility,
    settings.spacing,
    fretRange,
    settings.showFretNumbers,
    settings.leftHanded,
    board,
    markers,
  ]);
  const imageName = imageFileName(explanation.shortTitle, settings.tuningId === DEFAULT_TUNING_ID ? null : tuningName(tuning));

  const selectedChordInterval = selectedNote && chordDisplay ? chordDisplay.tones.get(selectedNote.pitchClass) : undefined;
  const chordRole =
    activeChord && selectedChordInterval
      ? {
          chord: activeChord.symbol,
          interval: `${intervalDisplayLabel(selectedChordInterval, theory.rootLabel)} · ${theory.intervalName(selectedChordInterval)}`,
        }
      : null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader
        soundEnabled={soundEnabled}
        onSoundChange={setSoundEnabled}
        settings={settings}
        onSettingsChange={update}
        metronomeBarVisible={metronomeBarVisible}
        onToggleMetronomeBar={toggleMetronomeBar}
        onShowShortcuts={() => setShortcutsOpen(true)}
      />

      <main className="mx-auto w-full max-w-[1600px] min-[1760px]:max-w-[112rem] flex-1 space-y-5 px-[max(1rem,env(safe-area-inset-left))] py-5 sm:px-6 sm:py-6 lg:py-4">
        {/* Main controls */}
        <section
          aria-label={`${ui.controls.rootNote} · ${ui.controls.scale} · ${ui.controls.tuning}`}
          className="grid grid-cols-[auto_minmax(0,1fr)_minmax(0,auto)] gap-x-2 gap-y-3 rounded-2xl border border-border/70 bg-surface p-3 sm:grid-cols-2 sm:gap-4 sm:p-4 lg:p-3 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_minmax(0,1.1fr)]"
        >
          <Field
            label={ui.controls.rootNote}
            extra={<KeySteps onNext={goNextKey} onRandom={goRandomKey} />}
            className="sm:col-span-2 lg:col-span-1"
          >
            <RootNotePicker
              value={settings.rootName}
              onChange={(rootName) => update(withArea({ rootName }))}
              extra={<KeySteps onNext={goNextKey} onRandom={goRandomKey} className="justify-center" />}
            />
          </Field>
          <Field label={ui.controls.scale} className="min-w-0">
            <ScaleSelect value={settings.scaleId} onChange={(scaleId) => update(withArea({ scaleId }))} />
          </Field>
          <Field label={ui.controls.tuning} className="min-w-0">
            <TuningSelect
              tuningId={settings.tuningId}
              activeTuning={tuning}
              onPresetChange={(tuningId) => update({ tuningId })}
              onCustomChange={(customTuning) => update({ tuningId: CUSTOM_TUNING_ID, customTuning })}
            />
          </Field>
          {/* Favourites once there are any; before that, on the home page, four first scales to try.
              (On a scale's own page "Start here" offers a first shape, next to the Shapes picker.) */}
          {(favourites.favourites.length > 0 || landedOnHome) && (
            <div className="col-span-full border-t border-border/50 pt-3">
              {favourites.favourites.length > 0 ? (
                <FavouritesBar
                  favourites={favourites.favourites}
                  current={currentFavourite}
                  onSelect={({ rootName, scaleId }) => update(withArea({ rootName, scaleId }))}
                  onRemove={favourites.remove}
                />
              ) : (
                <StartHereBar caged={caged} isCurrent={isStartingPoint} onSelect={goToStartingPoint} />
              )}
            </div>
          )}
        </section>

        {/* Fretboard */}
        <section
          aria-label={ui.fretboard.section}
          // slightly tighter on tablets and laptops, so the whole neck fits on a 768–800 px tall screen
          className="space-y-4 rounded-2xl border border-border/70 bg-card/60 p-3 sm:p-5 lg:space-y-3 lg:p-4"
          style={pinBars ? ({ "--neck-sticky-offset": `${barsHeight}px` } as React.CSSProperties) : undefined}
        >
          <ScaleHeader
            explanation={explanation}
            titleAddon={
              <FavouriteButton
                active={isFavourite(favourites.favourites, currentFavourite)}
                onToggle={() => favourites.toggle(currentFavourite)}
              />
            }
            actions={
              <>
                <ShareMenu title={explanation.shortTitle} imageInput={imageInput} imageFileName={imageName} />
                <Button
                  variant={training ? "default" : "outline"}
                  size="sm"
                  className="rounded-full"
                  aria-pressed={training}
                  title={ui.trainer.buttonTitle}
                  onClick={
                    training
                      ? stopTrainer
                      : () => {
                          startTrainer();
                          revealNeck();
                        }
                  }
                >
                  <Target />
                  {ui.trainer.button}
                </Button>
              </>
            }
            soundEnabled={soundEnabled}
            playTitle={ui.scaleHeader.playTitle(metronomeSettings.bpm)}
            playDisabled={training}
            tempo={metronomeSettings.bpm}
            isPlaying={scalePlayer.isPlaying}
            playingIndex={scalePlayer.playingIndex}
            onPlay={() => {
              playScale();
              revealNeck();
            }}
            onStop={stopScale}
          />
          {/* Phones: [Display ▾] [Chords ▾] side by side; larger screens: the row of display options */}
          <div className="flex items-center gap-2 sm:block">
            <DisplayToolbar settings={settings} fretRange={fretRange} onChange={update} />
            {!training && (
              <div className="shrink-0 sm:hidden">
                <ChordsButton {...chordBarProps} />
              </div>
            )}
          </div>
          <div className="space-y-3 border-t border-border/50 pt-3">
            {/* Shapes, "Start here" (a first shape for this scale) and — on larger screens — the chords,
                sharing lines where they fit, so the whole neck fits on a laptop screen */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <PositionPicker
                system={positionSystem}
                available={availableSystems}
                positions={positions}
                selected={positionIndices}
                caged={caged}
                scaleId={settings.scaleId}
                keepArea={settings.keepArea}
                onKeepAreaChange={(keepArea) => update({ keepArea })}
                onChange={(patch) => {
                  update(patch);
                  if (patch.positionSystem !== "all" && (patch.positionIndices?.length ?? 0) > 0) revealNeck();
                }}
              />
              {showStarter && starterLabel && (
                <StarterShapeBar label={starterLabel} active={starterActive} onSelect={goToStarterShape} easier={easierStart} />
              )}
              {!training && (
                <div className="max-sm:hidden">
                  <ChordBar {...chordBarProps} />
                </div>
              )}
            </div>
            {!training && activeChord && (
              <ChordSummary chord={activeChord} soundEnabled={soundEnabled} onPlay={playChord} onClear={() => update({ chordDegree: null })} />
            )}
          </div>
          {showBars && (
            <div
              ref={barsRef}
              className={cn(
                "space-y-2",
                pinBars &&
                  "sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-20 -mx-3 bg-background/90 px-3 py-1.5 backdrop-blur-sm sm:-mx-5 sm:px-5",
              )}
            >
              {metronomeBarVisible && (
                <MetronomeBar
                  rootPitchClass={pitchClassOf(spelled.root)}
                  rootName={i18n.note(spelled.root)}
                  droneListen={droneListen}
                  onClose={() => update({ metronomeBar: "hidden" })}
                />
              )}
              {trainerSetup && (
                <TrainerBar
                  state={trainer.state}
                  noteName={trainerSetup.target.name}
                  total={trainerSetup.targets.size}
                  onNext={() => trainerNext(trainerSetup.target.pitchClass)}
                  onStop={stopTrainer}
                  // whole neck, first round: "Tip: learn one shape at a time. [Only E shape · box 1]"
                  shapeTip={
                    trainerSetup.area === null && trainer.state.round === 0 && trainer.state.completed === 0 && starterName
                      ? { shape: starterName, onPick: goToStarterShape }
                      : null
                  }
                />
              )}
            </div>
          )}
          <div ref={neckRef}>
          <Fretboard
            notes={board}
            markers={neckMarkers}
            tuning={tuning}
            spacing={settings.spacing}
            fretRange={fretRange}
            showFretNumbers={settings.showFretNumbers}
            orientation={orientation}
            leftHanded={settings.leftHanded}
            positionAreas={positionAreas}
            reserveLabelLane={positionSystem === "boxes"}
            onNoteActivate={handleActivate}
            onOverflowChange={setNeckOverflows}
          />
          </div>
          <div className="flex min-h-9 flex-wrap items-center justify-between gap-2">
            <Legend
              showOutside={settings.visibility === "all"}
              chordSymbol={activeChord?.symbol ?? null}
              scaleRoot={activeChord ? i18n.note(spelled.root) : null}
              shapes={shapeKey}
              showSelected={Boolean(selectedNote)}
              showSamePitch={hasSamePitch}
              trainer={Boolean(trainerSetup)}
            />
            {selectedNote && !isPhone ? (
              <NoteStrip
                note={selectedNote}
                chordRole={chordRole}
                onPlay={soundEnabled ? () => playNote(selectedNote) : undefined}
                onClear={() => select(null)}
              />
            ) : (
              <p className="text-xs text-muted-foreground">
                {!training && (isPhone ? ui.hints.explorePhone : ui.hints.explore)}
                {neckOverflows && <span> {ui.hints.swipe}</span>}
              </p>
            )}
          </div>
        </section>

        {/* Explanations */}
        <TheoryPanel
          explanation={explanation}
          onGoTo={goToScale}
          collapsed={settings.theoryCollapsed}
          onCollapsedChange={(theoryCollapsed) => update({ theoryCollapsed })}
          triads={triads}
          sevenths={sevenths}
          selectedDegree={activeChord?.degreeIndex ?? null}
          onShowChord={(chordDegree) => {
            update({ chordDegree });
            const chord = chordSet.chords[chordDegree];
            if (chord) playChord(chord);
            revealNeck();
          }}
        />
      </main>

      <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      <SiteFooter creator={CREATOR} />
    </div>
  );
}
