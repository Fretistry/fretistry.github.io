/**
 * One shared Web Audio context for everything that makes sound (notes,
 * chords, metronome). It is created lazily on the first user interaction —
 * browsers only allow audio after a click or tap.
 */

type AudioContextConstructor = typeof AudioContext;

export interface SharedAudio {
  ctx: AudioContext;
  /** Final stage before the speakers: a gentle limiter so nothing ever clips. */
  master: AudioNode;
}

let shared: SharedAudio | null = null;

export function getAudioContextClass(): AudioContextConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { AudioContext?: AudioContextConstructor; webkitAudioContext?: AudioContextConstructor };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

export function getSharedAudio(): SharedAudio | null {
  if (!shared) {
    const AudioContextClass = getAudioContextClass();
    if (!AudioContextClass) return null;
    // iPhone/iPad: treat this as music playback so the ring/silent switch doesn't mute it (Safari 16.4+).
    const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
    if (session) {
      try {
        session.type = "playback";
      } catch {
        // Not supported — sound still works when the phone isn't on silent.
      }
    }
    const ctx = new AudioContextClass();
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -8;
    limiter.ratio.value = 10;
    limiter.attack.value = 0.002;
    limiter.release.value = 0.12;
    limiter.connect(ctx.destination);
    shared = { ctx, master: limiter };
  }
  if (shared.ctx.state === "suspended") void shared.ctx.resume();
  return shared;
}
