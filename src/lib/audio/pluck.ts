/**
 * Plucked-string synthesis (Karplus–Strong), pure maths with no browser APIs.
 *
 * A short burst of noise is fed through a delay line whose length equals one
 * period of the note. Every pass through the loop averages neighbouring
 * samples, which gently removes high frequencies — exactly how a real string
 * loses its brightness after being plucked.
 *
 * The averaging filter adds half a sample of delay, so the loop period is
 * (N + 0.5) samples. Because N must be a whole number, the result is retuned
 * precisely with a playback-rate correction, which keeps every note in tune.
 */

export interface PluckTuning {
  /** Delay-line length in samples. */
  period: number;
  /** Playback-rate correction that makes the pitch exact. */
  playbackRate: number;
}

export function pluckTuning(frequency: number, sampleRate: number): PluckTuning {
  const period = Math.max(2, Math.floor(sampleRate / frequency - 0.5));
  const naturalFrequency = sampleRate / (period + 0.5);
  return { period, playbackRate: frequency / naturalFrequency };
}

/** Ring time (seconds to fade by 60 dB): low strings ring longer than high ones. */
export function decayTime(frequency: number): number {
  const low = { f: 80, t: 3.2 };
  const high = { f: 1320, t: 1.1 };
  const x = (Math.log(frequency) - Math.log(low.f)) / (Math.log(high.f) - Math.log(low.f));
  const clamped = Math.min(1, Math.max(0, x));
  return low.t + (high.t - low.t) * clamped;
}

/** Small deterministic random generator so the sound (and tests) are repeatable. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface PluckOptions {
  /** 0 = soft (thumb), 1 = bright (pick). Default 0.55. */
  brightness?: number;
  /** Maximum length of the generated sound in seconds. Default 3.5. */
  maxDuration?: number;
  seed?: number;
}

export interface PluckResult {
  samples: Float32Array;
  playbackRate: number;
}

/** Generates a mono plucked-string sample at the given frequency. */
export function synthesizePluck(frequency: number, sampleRate: number, options: PluckOptions = {}): PluckResult {
  const { brightness = 0.55, maxDuration = 3.5, seed = 1 } = options;
  const { period, playbackRate } = pluckTuning(frequency, sampleRate);
  const effectiveFrequency = sampleRate / (period + 0.5);
  const ringTime = decayTime(frequency);
  // Extra loss per period so the note fades in `ringTime` seconds.
  const loss = Math.exp(-6.91 / (effectiveFrequency * ringTime));
  const length = Math.ceil(sampleRate * Math.min(maxDuration, ringTime + 0.15));
  const out = new Float32Array(length);

  // Excitation: smoothed noise (smoother = softer pluck), with DC removed.
  const random = mulberry32(seed);
  const smoothing = 0.85 - 0.75 * Math.min(1, Math.max(0, brightness));
  const burst = new Float32Array(period);
  let previous = 0;
  for (let i = 0; i < period; i++) {
    previous = smoothing * previous + (1 - smoothing) * (random() * 2 - 1);
    burst[i] = previous;
  }
  const mean = burst.reduce((s, v) => s + v, 0) / period;
  for (let i = 0; i < period && i < length; i++) out[i] = burst[i] - mean;

  // Karplus–Strong loop: y[n] = loss · ½ (y[n−N] + y[n−N−1])
  for (let n = period; n < length; n++) {
    const a = out[n - period];
    const b = n - period - 1 >= 0 ? out[n - period - 1] : a;
    out[n] = loss * 0.5 * (a + b);
  }

  // Short fade-out at the end to avoid a click, then normalise.
  const fade = Math.min(length, Math.floor(sampleRate * 0.06));
  for (let i = 0; i < fade; i++) out[length - 1 - i] *= i / fade;
  let peak = 0;
  for (let i = 0; i < length; i++) peak = Math.max(peak, Math.abs(out[i]));
  if (peak > 0) {
    const gain = 0.9 / peak;
    for (let i = 0; i < length; i++) out[i] *= gain;
  }

  return { samples: out, playbackRate };
}
