/**
 * Audio playback abstraction.
 *
 * UI code only talks to this interface. The real sound comes from the Web
 * Audio implementation in `web-audio-engine.ts`, installed when the app
 * starts; until then (and on the server) a silent engine is used.
 */

export interface PlayNoteOptions {
  /** Start this many seconds from now (used to schedule scales precisely). */
  delay?: number;
  /** 0–1 loudness. Default 0.9. */
  velocity?: number;
  /** Let the note ring for at most this long. */
  durationMs?: number;
  /**
   * Notes sharing a voice cut each other off, like playing a new note on the
   * same guitar string.
   */
  voice?: string;
}

export interface AudioEngine {
  /** Whether this engine actually produces sound. */
  readonly enabled: boolean;
  playNote(midi: number, options?: PlayNoteOptions): void;
  stopAll(): void;
}

/** Frequency in Hz of a MIDI note in equal temperament (A4 = MIDI 69 = 440 Hz). */
export function midiToFrequency(midi: number, a4 = 440): number {
  return a4 * 2 ** ((midi - 69) / 12);
}

/** Default engine: does nothing. */
export const silentAudioEngine: AudioEngine = {
  enabled: false,
  playNote() {},
  stopAll() {},
};

let current: AudioEngine = silentAudioEngine;

export function getAudioEngine(): AudioEngine {
  return current;
}

export function setAudioEngine(engine: AudioEngine): void {
  current = engine;
}
