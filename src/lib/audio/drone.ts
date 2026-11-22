import { midiToFrequency } from "./audio-engine";
import { getSharedAudio, type SharedAudio } from "./audio-context";

/**
 * The drone: a note (the root, optionally with its fifth) that keeps sounding
 * under your playing, so you hear what every note does against the key.
 *
 * Two sounds, both synthesized, with a soft room around them:
 * - "pad": a warm, slowly moving synth pad (three gently detuned voices per note)
 * - "harmonium": a reed organ (two reeds per note beating very slightly, with a slow bellows swell)
 */

export type DroneSound = "pad" | "harmonium";

export interface DroneSettings {
  sound: DroneSound;
  /** Add the fifth above the root (fuller sound). */
  fifth: boolean;
  /** 0–1. */
  volume: number;
}

export const DEFAULT_DRONE: DroneSettings = { sound: "pad", fifth: true, volume: 0.55 };

/** Reads saved drone settings; anything missing or invalid falls back to the defaults. */
export function parseDroneSettings(data: unknown): DroneSettings {
  const d = (data && typeof data === "object" ? data : {}) as Partial<Record<keyof DroneSettings, unknown>>;
  return {
    sound: d.sound === "pad" || d.sound === "harmonium" ? d.sound : DEFAULT_DRONE.sound,
    fifth: typeof d.fifth === "boolean" ? d.fifth : DEFAULT_DRONE.fifth,
    volume: typeof d.volume === "number" && Number.isFinite(d.volume) ? Math.min(1, Math.max(0, d.volume)) : DEFAULT_DRONE.volume,
  };
}

/** The drone's root note: between A2 and G♯3, a comfortable register under a guitar. */
export function droneBaseMidi(rootPitchClass: number): number {
  return 45 + ((((rootPitchClass - 9) % 12) + 12) % 12);
}

export interface DroneVoice {
  midi: number;
  /** Relative loudness of this note within the sound. */
  level: number;
  wave: "sawtooth" | "sine" | "reed";
}

/** The notes a drone sound holds: root and octave (+ a soft sub-octave for the pad), plus the fifth if wanted. */
export function droneVoices(sound: DroneSound, rootPitchClass: number, fifth: boolean): DroneVoice[] {
  const root = droneBaseMidi(rootPitchClass);
  if (sound === "pad") {
    return [
      { midi: root - 12, level: 0.25, wave: "sine" },
      { midi: root, level: 0.5, wave: "sawtooth" },
      { midi: root + 12, level: 0.28, wave: "sawtooth" },
      ...(fifth ? [{ midi: root + 7, level: 0.32, wave: "sawtooth" as const }] : []),
    ];
  }
  return [
    { midi: root, level: 0.45, wave: "reed" },
    { midi: root + 12, level: 0.22, wave: "reed" },
    ...(fifth ? [{ midi: root + 7, level: 0.3, wave: "reed" as const }] : []),
  ];
}

/** Overall level and fade-in time of each sound (levels evened out with loudness measurements). */
const SOUND = {
  pad: { level: 0.34, attack: 1.8 },
  harmonium: { level: 0.2, attack: 0.4 },
} as const;

/** A soft room: decaying, lightly smoothed noise (one array per stereo channel). */
export function roomImpulse(sampleRate: number, seconds = 3.2, decay = 3.2): [Float32Array, Float32Array] {
  const length = Math.floor(sampleRate * seconds);
  const channels: [Float32Array, Float32Array] = [new Float32Array(length), new Float32Array(length)];
  channels.forEach((data, ch) => {
    let seed = 0x9e3779b9 ^ (ch + 7);
    let smooth = 0;
    for (let i = 0; i < length; i++) {
      // xorshift: repeatable noise
      seed ^= seed << 13;
      seed ^= seed >>> 17;
      seed ^= seed << 5;
      const noise = ((seed >>> 0) / 4294967296) * 2 - 1;
      smooth = 0.6 * smooth + 0.4 * noise;
      data[i] = smooth * Math.pow(1 - i / length, decay);
    }
  });
  return channels;
}

interface Playing {
  out: GainNode;
  stop: (at: number) => void;
  key: string;
}

/** Plays and crossfades the drone on the shared audio context. */
export class DronePlayer {
  private bus: GainNode | null = null;
  private reedWave: PeriodicWave | null = null;
  private current: Playing | null = null;
  private volume = DEFAULT_DRONE.volume;

  constructor(private readonly getAudio: () => SharedAudio | null = getSharedAudio) {}

  get playing(): boolean {
    return this.current !== null;
  }

  /** Starts the drone, or crossfades to a new root, sound or fifth setting. */
  play(rootPitchClass: number, settings: DroneSettings): void {
    const audio = this.getAudio();
    if (!audio) return;
    this.setVolume(settings.volume);
    const key = `${settings.sound}|${rootPitchClass}|${settings.fifth}`;
    if (this.current?.key === key) return;
    const crossfade = this.current !== null;
    this.fadeOut(audio.ctx, crossfade ? 0.9 : 1.2);
    this.current = this.start(audio, rootPitchClass, settings, key, crossfade ? 0.9 : SOUND[settings.sound].attack);
  }

  stop(): void {
    const audio = this.getAudio();
    if (audio) this.fadeOut(audio.ctx, 1.2);
    this.current = null;
  }

  setVolume(volume: number): void {
    this.volume = Math.min(1, Math.max(0, volume));
    const audio = this.bus ? this.getAudio() : null;
    if (audio && this.bus) this.bus.gain.setTargetAtTime(this.volume, audio.ctx.currentTime, 0.05);
  }

  private ensureBus(audio: SharedAudio): GainNode {
    if (this.bus) return this.bus;
    const { ctx, master } = audio;
    const bus = ctx.createGain();
    bus.gain.value = this.volume;
    bus.connect(master);
    const room = ctx.createConvolver();
    const [left, right] = roomImpulse(ctx.sampleRate);
    const impulse = ctx.createBuffer(2, left.length, ctx.sampleRate);
    impulse.getChannelData(0).set(left);
    impulse.getChannelData(1).set(right);
    room.buffer = impulse;
    const wet = ctx.createGain();
    wet.gain.value = 0.32;
    bus.connect(room).connect(wet).connect(master);
    this.bus = bus;
    return bus;
  }

  private start(audio: SharedAudio, rootPitchClass: number, settings: DroneSettings, key: string, fadeIn: number): Playing {
    const { ctx } = audio;
    const out = ctx.createGain();
    const now = ctx.currentTime;
    out.gain.setValueAtTime(0, now);
    out.gain.setTargetAtTime(SOUND[settings.sound].level, now, fadeIn / 3);
    out.connect(this.ensureBus(audio));
    const voices = droneVoices(settings.sound, rootPitchClass, settings.fifth);
    const stop = settings.sound === "pad" ? this.pad(ctx, out, voices) : this.harmonium(ctx, out, voices);
    return { out, stop, key };
  }

  private fadeOut(ctx: AudioContext, seconds: number): void {
    const playing = this.current;
    if (!playing) return;
    const now = ctx.currentTime;
    playing.out.gain.cancelScheduledValues(now);
    playing.out.gain.setValueAtTime(playing.out.gain.value, now);
    playing.out.gain.setTargetAtTime(0, now, seconds / 4);
    playing.stop(now + seconds + 0.3);
    window.setTimeout(() => playing.out.disconnect(), (seconds + 0.6) * 1000);
  }

  /** Warm pad: detuned saws through a slowly breathing low-pass filter (and a pure sine an octave down). */
  private pad(ctx: AudioContext, out: GainNode, voices: DroneVoice[]): (at: number) => void {
    const sources: OscillatorNode[] = [];
    for (const voice of voices) {
      const f = midiToFrequency(voice.midi);
      const level = ctx.createGain();
      level.gain.value = voice.level;
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = Math.min(1500, f * 5);
      filter.Q.value = 0.6;
      const detunes = voice.wave === "sine" ? [0] : [-9, 0, 9];
      for (const cents of detunes) {
        const osc = ctx.createOscillator();
        osc.type = voice.wave === "sine" ? "sine" : "sawtooth";
        osc.frequency.value = f;
        osc.detune.value = cents;
        const g = ctx.createGain();
        g.gain.value = 1 / detunes.length;
        osc.connect(g).connect(filter);
        sources.push(osc);
      }
      // the filter opens and closes very slowly, so the sound keeps moving
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.06 + Math.random() * 0.05;
      const depth = ctx.createGain();
      depth.gain.value = filter.frequency.value * 0.35;
      lfo.connect(depth).connect(filter.frequency);
      sources.push(lfo);
      filter.connect(level).connect(out);
    }
    sources.forEach((s) => s.start());
    return (at) => sources.forEach((s) => s.stop(at));
  }

  /** Harmonium: two reeds per note a hair apart (gentle beating), with a slow bellows swell. */
  private harmonium(ctx: AudioContext, out: GainNode, voices: DroneVoice[]): (at: number) => void {
    if (!this.reedWave) {
      // a reed's spectrum: many harmonics, slowly getting weaker
      const amps = [1, 0.8, 0.7, 0.55, 0.5, 0.38, 0.33, 0.26, 0.22, 0.17, 0.14, 0.11, 0.09, 0.07, 0.05, 0.04];
      const real = new Float32Array(amps.length + 1);
      const imag = new Float32Array(amps.length + 1);
      amps.forEach((a, i) => (imag[i + 1] = a));
      this.reedWave = ctx.createPeriodicWave(real, imag);
    }
    const bellows = ctx.createGain();
    bellows.connect(out);
    const swell = ctx.createOscillator();
    swell.frequency.value = 0.16;
    const depth = ctx.createGain();
    depth.gain.value = 0.1;
    swell.connect(depth).connect(bellows.gain);
    const sources: OscillatorNode[] = [swell];
    for (const voice of voices) {
      const level = ctx.createGain();
      level.gain.value = voice.level;
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 3000;
      filter.Q.value = 0.3;
      for (const cents of [-4, 4]) {
        const osc = ctx.createOscillator();
        osc.setPeriodicWave(this.reedWave);
        osc.frequency.value = midiToFrequency(voice.midi);
        osc.detune.value = cents;
        osc.connect(filter);
        sources.push(osc);
      }
      filter.connect(level).connect(bellows);
    }
    sources.forEach((s) => s.start());
    return (at) => sources.forEach((s) => s.stop(at));
  }
}
