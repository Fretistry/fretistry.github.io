import { describe, expect, it } from "vitest";
import { midiToFrequency } from "./audio-engine";
import { decayTime, pluckTuning, synthesizePluck } from "./pluck";
import { ascendingScale, chordVoicing, upAndDown } from "./sequence";

const SAMPLE_RATE = 48000;

/** Estimates the pitch of a signal with autocorrelation + parabolic interpolation. */
function estimateFrequency(samples: Float32Array, sampleRate: number, expected: number): number {
  const start = Math.floor(sampleRate * 0.05);
  const windowSize = Math.floor(sampleRate * 0.2);
  const expectedLag = sampleRate / expected;
  const minLag = Math.floor(expectedLag * 0.7);
  const maxLag = Math.ceil(expectedLag * 1.3);
  const corr = (lag: number) => {
    let sum = 0;
    for (let i = start; i < start + windowSize; i++) sum += samples[i] * samples[i + lag];
    return sum;
  };
  let bestLag = minLag;
  let best = -Infinity;
  for (let lag = minLag; lag <= maxLag; lag++) {
    const c = corr(lag);
    if (c > best) {
      best = c;
      bestLag = lag;
    }
  }
  const [a, b, c] = [corr(bestLag - 1), corr(bestLag), corr(bestLag + 1)];
  const shift = (a - c) / (2 * (a - 2 * b + c));
  return sampleRate / (bestLag + shift);
}

describe("note frequencies", () => {
  it("uses equal temperament with A4 = 440 Hz", () => {
    expect(midiToFrequency(69)).toBe(440);
    expect(midiToFrequency(81)).toBeCloseTo(880, 6);
    expect(midiToFrequency(40)).toBeCloseTo(82.407, 3); // low E string
    expect(midiToFrequency(64)).toBeCloseTo(329.628, 3); // high E string
  });
});

describe("plucked-string synthesis", () => {
  it("retunes the delay line so the pitch is exact", () => {
    for (const midi of [28, 40, 45, 52, 64, 76, 88]) {
      const f = midiToFrequency(midi);
      const { period, playbackRate } = pluckTuning(f, SAMPLE_RATE);
      expect((SAMPLE_RATE / (period + 0.5)) * playbackRate).toBeCloseTo(f, 9);
      // The delay line is rounded down, so the correction only ever slows playback slightly.
      expect(playbackRate).toBeLessThanOrEqual(1);
      expect(playbackRate).toBeGreaterThan(0.95);
    }
  });

  it.each([40, 45, 55, 64, 76, 88])("sounds at the right pitch (MIDI %i)", (midi) => {
    const f = midiToFrequency(midi);
    const { samples, playbackRate } = synthesizePluck(f, SAMPLE_RATE);
    const heard = estimateFrequency(samples, SAMPLE_RATE, f / playbackRate) * playbackRate;
    const cents = 1200 * Math.log2(heard / f);
    expect(Math.abs(cents)).toBeLessThan(5); // well below what the ear can notice
  });

  it("produces a clean, decaying sound", () => {
    const { samples } = synthesizePluck(midiToFrequency(45), SAMPLE_RATE);
    expect(samples.every((s) => Number.isFinite(s) && Math.abs(s) <= 0.9001)).toBe(true);
    const rms = (from: number, to: number) => {
      let sum = 0;
      for (let i = from; i < to; i++) sum += samples[i] ** 2;
      return Math.sqrt(sum / (to - from));
    };
    const early = rms(0, SAMPLE_RATE * 0.2);
    const late = rms(SAMPLE_RATE * 1.5, SAMPLE_RATE * 1.7);
    expect(late).toBeLessThan(early * 0.5);
    expect(Math.abs(samples[samples.length - 1])).toBeLessThan(1e-3); // fades out, no click
  });

  it("lets low notes ring longer than high notes", () => {
    expect(decayTime(82)).toBeGreaterThan(decayTime(330));
    expect(decayTime(330)).toBeGreaterThan(decayTime(1300));
  });

  it("is deterministic", () => {
    const a = synthesizePluck(220, SAMPLE_RATE, { seed: 7 }).samples;
    const b = synthesizePluck(220, SAMPLE_RATE, { seed: 7 }).samples;
    expect(a).toEqual(b);
  });
});

describe("scale playback sequences", () => {
  it("plays C major from C3 up to the octave", () => {
    const steps = ascendingScale(0, [0, 2, 4, 5, 7, 9, 11]);
    expect(steps.map((s) => s.midi)).toEqual([48, 50, 52, 53, 55, 57, 59, 60]);
    expect(steps.map((s) => s.scaleIndex)).toEqual([0, 1, 2, 3, 4, 5, 6, 0]);
  });

  it("starts A minor pentatonic on A2 (the open A string)", () => {
    expect(ascendingScale(9, [0, 3, 5, 7, 10]).map((s) => s.midi)).toEqual([45, 48, 50, 52, 55, 57]);
  });

  it("voices chords from a guitar-friendly register, with the root doubled", () => {
    expect(chordVoicing(7, [0, 4, 7, 10])).toEqual([43, 47, 50, 53, 55]); // G7: G2 B2 D3 F3 G3
    expect(chordVoicing(0, [0, 4, 7])).toEqual([48, 52, 55, 60]); // C: C3 E3 G3 C4
  });

  it("goes up and back down without repeating the top note", () => {
    const up = ascendingScale(9, [0, 3, 5, 7, 10]);
    expect(upAndDown(up).map((s) => s.midi)).toEqual([45, 48, 50, 52, 55, 57, 55, 52, 50, 48, 45]);
  });
});
