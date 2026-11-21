/**
 * Metronome: rock-steady timing with the Web Audio clock.
 *
 * Browser timers (setInterval) can drift or stall by tens of milliseconds, so
 * they are only used to *look ahead*: every ~25 ms the scheduler books every
 * click that falls in the next ~120 ms at an exact time on the audio clock.
 * The audio hardware then plays each click precisely on time.
 * (Technique from Chris Wilson's "A Tale of Two Clocks".)
 */

export type Subdivision = 1 | 2 | 3 | 4;
export type TickKind = "accent" | "beat" | "sub";

export interface MetronomeSettings {
  bpm: number;
  beatsPerBar: number;
  /** Clicks per beat: 1 = quarter notes, 2 = eighths, 3 = triplets, 4 = sixteenths. */
  subdivision: Subdivision;
  /** Emphasise the first beat of every bar. */
  accent: boolean;
  /** 0–1 */
  volume: number;
}

export interface ScheduledTick {
  /** Audio-clock time in seconds. */
  time: number;
  /** 0-based beat within the bar. */
  beat: number;
  /** 0-based subdivision within the beat (0 = on the beat). */
  sub: number;
  kind: TickKind;
}

export const BPM_MIN = 30;
export const BPM_MAX = 260;

export const DEFAULT_METRONOME: MetronomeSettings = {
  bpm: 80,
  beatsPerBar: 4,
  subdivision: 1,
  accent: true,
  volume: 0.8,
};

export function clampBpm(bpm: number): number {
  if (!Number.isFinite(bpm)) return DEFAULT_METRONOME.bpm;
  return Math.round(Math.min(BPM_MAX, Math.max(BPM_MIN, bpm)));
}

export function secondsPerTick(settings: Pick<MetronomeSettings, "bpm" | "subdivision">): number {
  return 60 / settings.bpm / settings.subdivision;
}

export function tickKind(tickInBar: number, settings: Pick<MetronomeSettings, "subdivision" | "accent">): TickKind {
  if (tickInBar % settings.subdivision !== 0) return "sub";
  return tickInBar === 0 && settings.accent ? "accent" : "beat";
}

/** Traditional Italian tempo name for a BPM value. */
export function tempoMarking(bpm: number): string {
  if (bpm < 40) return "Grave";
  if (bpm < 60) return "Largo";
  if (bpm < 66) return "Larghetto";
  if (bpm < 76) return "Adagio";
  if (bpm < 108) return "Andante";
  if (bpm < 120) return "Moderato";
  if (bpm < 168) return "Allegro";
  if (bpm < 200) return "Presto";
  return "Prestissimo";
}

/**
 * Tap tempo: the average gap between the most recent taps (in milliseconds).
 * A pause of more than 2 seconds starts a new tapping sequence.
 */
export function tapTempo(tapTimesMs: readonly number[]): number | null {
  const recent: number[] = [];
  for (let i = tapTimesMs.length - 1; i >= 0; i--) {
    if (recent.length && recent[recent.length - 1] - tapTimesMs[i] > 2000) break;
    recent.push(tapTimesMs[i]);
  }
  if (recent.length < 2) return null;
  const taps = recent.slice(0, 6).reverse();
  const average = (taps[taps.length - 1] - taps[0]) / (taps.length - 1);
  return average > 0 ? clampBpm(60000 / average) : null;
}

export interface SchedulerOptions {
  /** Current time on the audio clock, in seconds. */
  now: () => number;
  /** Called once for every click, ahead of time, so it can be booked on the audio clock. */
  onSchedule: (tick: ScheduledTick, settings: MetronomeSettings) => void;
  /** How far ahead to book clicks, in seconds. */
  lookahead?: number;
}

/** Books metronome clicks ahead of time. Pure timing logic — no audio code — so it can be tested. */
export class MetronomeScheduler {
  private settings: MetronomeSettings = DEFAULT_METRONOME;
  private nextTime = 0;
  private tickInBar = 0;
  private queue: ScheduledTick[] = [];
  private running = false;
  lookahead: number;

  constructor(private readonly options: SchedulerOptions) {
    this.lookahead = options.lookahead ?? 0.12;
  }

  get isRunning(): boolean {
    return this.running;
  }

  start(settings: MetronomeSettings, startDelay = 0.05): void {
    this.settings = settings;
    this.running = true;
    this.tickInBar = 0;
    this.queue = [];
    this.nextTime = this.options.now() + startDelay;
    this.pump();
  }

  stop(): void {
    this.running = false;
    this.queue = [];
  }

  /** New settings take effect from the next click (tempo changes are seamless). */
  update(settings: MetronomeSettings): void {
    const previous = this.settings;
    this.settings = settings;
    if (!this.running) return;
    const ticksPerBar = settings.beatsPerBar * settings.subdivision;
    if (settings.subdivision !== previous.subdivision) {
      // Continue on the next beat with the new subdivision.
      const beat = Math.ceil(this.tickInBar / previous.subdivision);
      this.tickInBar = (beat * settings.subdivision) % ticksPerBar;
    } else {
      this.tickInBar %= ticksPerBar;
    }
  }

  /** Books every click that falls inside the look-ahead window. */
  pump(): void {
    if (!this.running) return;
    const horizon = this.options.now() + this.lookahead;
    while (this.nextTime < horizon) {
      const s = this.settings;
      const tick: ScheduledTick = {
        time: this.nextTime,
        beat: Math.floor(this.tickInBar / s.subdivision),
        sub: this.tickInBar % s.subdivision,
        kind: tickKind(this.tickInBar, s),
      };
      this.queue.push(tick);
      this.options.onSchedule(tick, s);
      this.nextTime += secondsPerTick(s);
      this.tickInBar = (this.tickInBar + 1) % (s.beatsPerBar * s.subdivision);
    }
  }

  /** The most recent click that has started playing (for the visual beat indicator). */
  takeDue(now: number): ScheduledTick | null {
    let latest: ScheduledTick | null = null;
    while (this.queue.length && this.queue[0].time <= now) latest = this.queue.shift()!;
    return latest;
  }
}

/** A short, woody click. Accents are higher and louder than beats; subdivisions are softer. */
export function playClick(ctx: BaseAudioContext, destination: AudioNode, time: number, kind: TickKind, volume: number): void {
  const frequency = kind === "accent" ? 1650 : kind === "beat" ? 1180 : 880;
  const level = Math.max(0.0001, volume * (kind === "accent" ? 1 : kind === "beat" ? 0.7 : 0.38));
  const length = kind === "accent" ? 0.07 : 0.05;

  const osc = ctx.createOscillator();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(frequency, time);
  osc.frequency.exponentialRampToValueAtTime(frequency * 0.78, time + length);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(level, time + 0.0015);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + length);

  osc.connect(gain).connect(destination);
  osc.start(time);
  osc.stop(time + length + 0.02);
  osc.onended = () => {
    osc.disconnect();
    gain.disconnect();
  };
}
