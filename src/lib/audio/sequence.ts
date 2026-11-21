/** Pure helpers for turning a scale into a playable sequence of notes. */

export interface SequenceStep {
  midi: number;
  /** Index of the scale note (0 = root; the top octave is also the root). */
  scaleIndex: number;
}

/**
 * The scale from its root up to the octave, starting at the first root at or
 * above `lowestMidi` (default A2 = MIDI 45, a comfortable guitar register).
 */
export function ascendingScale(rootPitchClass: number, intervals: readonly number[], lowestMidi = 45): SequenceStep[] {
  const offset = (((rootPitchClass - lowestMidi) % 12) + 12) % 12;
  const rootMidi = lowestMidi + offset;
  return [
    ...intervals.map((semitones, scaleIndex) => ({ midi: rootMidi + semitones, scaleIndex })),
    { midi: rootMidi + 12, scaleIndex: 0 },
  ];
}

/**
 * A strummable voicing of a chord: the chord tones stacked upwards from the
 * first chord root at or above `lowestMidi` (default G2 = MIDI 43, so chords
 * sit in the warm middle of the guitar's range).
 */
export function chordVoicing(rootPitchClass: number, chordSemitones: readonly number[], lowestMidi = 43): number[] {
  const offset = (((rootPitchClass - lowestMidi) % 12) + 12) % 12;
  const rootMidi = lowestMidi + offset;
  const tones = chordSemitones.map((s) => rootMidi + s);
  // Double the root an octave up for a fuller, guitar-like sound.
  return [...tones, rootMidi + 12].sort((a, b) => a - b);
}

/** Up and back down again, without repeating the top note. */
export function upAndDown(steps: readonly SequenceStep[]): SequenceStep[] {
  return [...steps, ...steps.slice(0, -1).reverse()];
}
