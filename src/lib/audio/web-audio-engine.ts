import { getAudioEngine, midiToFrequency, setAudioEngine, type AudioEngine, type PlayNoteOptions } from "./audio-engine";
import { getAudioContextClass, getSharedAudio } from "./audio-context";
import { synthesizePluck } from "./pluck";

interface Voice {
  source: AudioBufferSourceNode;
  gain: GainNode;
}

interface CachedSample {
  buffer: AudioBuffer;
  playbackRate: number;
}

/**
 * Plays guitar-like plucked notes with the Web Audio API, through the shared
 * audio context (created lazily on the first note — browsers only allow sound
 * after a user interaction, such as a click).
 */
export function createWebAudioEngine(): AudioEngine {
  let ctx: AudioContext | null = null;
  let output: GainNode | null = null;
  const samples = new Map<number, CachedSample>();
  const activeVoices = new Set<Voice>();
  const namedVoices = new Map<string, Voice>();

  function ensureContext(): AudioContext | null {
    const audio = getSharedAudio();
    if (!audio) return null;
    if (!ctx) {
      ctx = audio.ctx;
      // Gentle "guitar body" colouring before the shared limiter.
      const body = ctx.createBiquadFilter();
      body.type = "peaking";
      body.frequency.value = 220;
      body.Q.value = 0.9;
      body.gain.value = 3;
      const tone = ctx.createBiquadFilter();
      tone.type = "lowpass";
      tone.frequency.value = 5200;
      output = ctx.createGain();
      output.gain.value = 0.55;
      output.connect(body).connect(tone).connect(audio.master);
    }
    return ctx;
  }

  function sampleFor(context: AudioContext, midi: number): CachedSample {
    const cached = samples.get(midi);
    if (cached) return cached;
    const { samples: data, playbackRate } = synthesizePluck(midiToFrequency(midi), context.sampleRate, { seed: midi });
    const buffer = context.createBuffer(1, data.length, context.sampleRate);
    buffer.getChannelData(0).set(data);
    const sample = { buffer, playbackRate };
    samples.set(midi, sample);
    return sample;
  }

  function release(voice: Voice, at: number, fade = 0.04) {
    try {
      voice.gain.gain.cancelScheduledValues(at);
      voice.gain.gain.setValueAtTime(voice.gain.gain.value, at);
      voice.gain.gain.linearRampToValueAtTime(0, at + fade);
      voice.source.stop(at + fade + 0.01);
    } catch {
      // The note may already have finished.
    }
  }

  return {
    enabled: true,

    playNote(midi: number, options: PlayNoteOptions = {}) {
      const context = ensureContext();
      if (!context || !output) return;
      const start = context.currentTime + Math.max(0, options.delay ?? 0) + 0.005;
      const { buffer, playbackRate } = sampleFor(context, midi);

      if (options.voice) {
        const previous = namedVoices.get(options.voice);
        if (previous) release(previous, start, 0.03);
      }

      const source = context.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = playbackRate;
      const gain = context.createGain();
      gain.gain.value = Math.min(1, Math.max(0, options.velocity ?? 0.9));
      source.connect(gain).connect(output);
      source.start(start);

      const voice: Voice = { source, gain };
      activeVoices.add(voice);
      if (options.voice) namedVoices.set(options.voice, voice);
      if (options.durationMs) release(voice, start + options.durationMs / 1000, 0.12);

      source.onended = () => {
        activeVoices.delete(voice);
        if (options.voice && namedVoices.get(options.voice) === voice) namedVoices.delete(options.voice);
        source.disconnect();
        gain.disconnect();
      };
    },

    stopAll() {
      if (!ctx) return;
      const now = ctx.currentTime;
      for (const voice of activeVoices) release(voice, now, 0.05);
      namedVoices.clear();
    },
  };
}

/** Installs the Web Audio engine once, if the browser supports it. */
export function installWebAudioEngine(): void {
  if (getAudioEngine().enabled || !getAudioContextClass()) return;
  setAudioEngine(createWebAudioEngine());
}
