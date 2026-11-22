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
import { rootNote } from "@/lib/data/roots";
import { SCALES, getScale } from "@/lib/data/scales";
import { CUSTOM_TUNING_ID, DEFAULT_TUNING_ID, getTuningPreset, makeCustomTuning } from "@/lib/data/tunings";
import { isFavourite } from "@/lib/favourites";
import { imageFileName } from "@/lib/file-name";
import { parseScalePagePath } from "@/lib/pages";
import { BASE_PATH, CREATOR, SITE_NAME, SITE_URL } from "@/lib/site";
import { cagedIndex, type StartingPoint } from "@/lib/start-here";
import { inTrainerArea, pickTarget, trainerTargets } from "@/lib/trainer";
import { cn } from "@/lib/utils";
import {
  buildScaleFretboard,
  choosePlayShape,
  explainScale,
  intervalDisplayLabel,
  mod12,
  pitchClassOf,
  positionKey,
  hasCagedShapes,
  positionSystemsFor,
  scaleChords,
  scalePositions,
  shapePath,
  spellScale,
  type FretboardNote,
  type ScaleChord,
  type ScalePosition,
  type Tuning,
} from "@/lib/theory";
import { AppHeader } from "./app-header";
import { ChordBar } from "./chord-bar";
import { DisplayToolbar } from "./display-toolbar";
import { FavouriteButton, FavouritesBar, StartHereBar } from "./favourites";
import { Legend } from "./legend";
import { PositionPicker } from "./position-picker";
import { SiteFooter } from "./privacy-note";
import { RootNotePicker } from "./root-note-picker";
import { ScaleHeader } from "./scale-header";
import { ShareMenu } from "./share-button";
import { ScaleSelect } from "./scale-select";
import { TrainerBar } from "./trainer-bar";
import { TuningSelect } from "./tuning-select";

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <p className="mb-1.5 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">{label}</p>
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
      document.title = onScalePage ? `${ui.seo.pageTitle(explanation.title)} · ${SITE_NAME}` : ui.documentTitle;
    };
    apply();
    // Right after start-up Next.js may put the page's original title back once; apply ours again after that.
    const again = window.setTimeout(apply, 300);
    return () => window.clearTimeout(again);
  }, [ui, explanation.title, settings]);

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

  // ── "Start here": first scales for someone new (until there are favourites) ──
  const isStartingPoint = useCallback(
    (point: StartingPoint) =>
      settings.rootName === point.rootName &&
      settings.scaleId === point.scaleId &&
      (caged ? positionSystem === "boxes" && positionIndices.length === 1 && positionIndices[0] === cagedIndex(point.shape) : positionSystem === "all"),
    [settings.rootName, settings.scaleId, caged, positionSystem, positionIndices],
  );
  const goToStartingPoint = useCallback(
    (point: StartingPoint) =>
      update({
        rootName: point.rootName,
        scaleId: point.scaleId,
        positionSystem: caged ? "boxes" : "all",
        positionIndices: caged ? [cagedIndex(point.shape)] : [0],
        chordDegree: null,
      }),
    [update, caged],
  );

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
      />

      <main className="mx-auto w-full max-w-[1600px] min-[1760px]:max-w-[112rem] flex-1 space-y-5 px-[max(1rem,env(safe-area-inset-left))] py-5 sm:px-6 sm:py-6">
        {/* Main controls */}
        <section
          aria-label={`${ui.controls.rootNote} · ${ui.controls.scale} · ${ui.controls.tuning}`}
          className="grid grid-cols-2 gap-x-3 gap-y-3 rounded-2xl border border-border/70 bg-surface p-3 sm:gap-4 sm:p-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_minmax(0,1.1fr)]"
        >
          <Field label={ui.controls.rootNote} className="col-span-2 lg:col-span-1">
            <RootNotePicker value={settings.rootName} onChange={(rootName) => update({ rootName })} />
          </Field>
          <Field label={ui.controls.scale} className="min-w-0">
            <ScaleSelect value={settings.scaleId} onChange={(scaleId) => update({ scaleId })} />
          </Field>
          <Field label={ui.controls.tuning} className="min-w-0">
            <TuningSelect
              tuningId={settings.tuningId}
              activeTuning={tuning}
              onPresetChange={(tuningId) => update({ tuningId })}
              onCustomChange={(customTuning) => update({ tuningId: CUSTOM_TUNING_ID, customTuning })}
            />
          </Field>
          <div className="col-span-2 border-t border-border/50 pt-3 lg:col-span-3">
            {favourites.favourites.length > 0 ? (
              <FavouritesBar
                favourites={favourites.favourites}
                current={currentFavourite}
                onSelect={({ rootName, scaleId }) => update({ rootName, scaleId })}
                onRemove={favourites.remove}
              />
            ) : (
              <StartHereBar caged={caged} isCurrent={isStartingPoint} onSelect={goToStartingPoint} />
            )}
          </div>
        </section>

        {/* Fretboard */}
        <section
          aria-label={ui.fretboard.section}
          className="space-y-4 rounded-2xl border border-border/70 bg-card/60 p-3 sm:p-5"
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
                  onClick={training ? stopTrainer : startTrainer}
                >
                  <Target />
                  {ui.trainer.button}
                </Button>
              </>
            }
            soundEnabled={soundEnabled}
            playTitle={ui.scaleHeader.playTitle(metronomeSettings.bpm)}
            playDisabled={training}
            isPlaying={scalePlayer.isPlaying}
            playingIndex={scalePlayer.playingIndex}
            onPlay={playScale}
            onStop={stopScale}
          />
          <DisplayToolbar settings={settings} fretRange={fretRange} onChange={update} />
          <div className="space-y-3 border-t border-border/50 pt-3">
            <PositionPicker
              system={positionSystem}
              available={availableSystems}
              positions={positions}
              selected={positionIndices}
              caged={caged}
              onChange={update}
            />
            {!training && (
              <ChordBar
                chordSet={chordSet}
                size={settings.chordSize}
                selected={activeChord}
                soundEnabled={soundEnabled}
                onSizeChange={(chordSize) => update({ chordSize })}
                onSelect={(chordDegree) => update({ chordDegree })}
                onPlay={playChord}
              />
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
                />
              )}
            </div>
          )}
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
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      </main>

      <SiteFooter creator={CREATOR} />
    </div>
  );
}
