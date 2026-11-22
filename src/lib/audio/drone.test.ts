import { describe, expect, it } from "vitest";
import { DEFAULT_DRONE, droneBaseMidi, droneVoices, parseDroneSettings, roomImpulse } from "./drone";

const A = 9;
const C = 0;
const E = 4;
const G_SHARP = 8;

describe("drone", () => {
  it("plays the root in a comfortable register under the guitar (A2 to G♯3)", () => {
    expect(droneBaseMidi(A)).toBe(45); // A2
    expect(droneBaseMidi(C)).toBe(48); // C3
    expect(droneBaseMidi(E)).toBe(52); // E3
    expect(droneBaseMidi(G_SHARP)).toBe(56); // G♯3
  });

  it("holds the root and octave, and adds the fifth when asked", () => {
    const notes = (sound: "pad" | "harmonium", fifth: boolean) => droneVoices(sound, A, fifth).map((v) => v.midi).sort((a, b) => a - b);
    expect(notes("harmonium", false)).toEqual([45, 57]); // A2 A3
    expect(notes("harmonium", true)).toEqual([45, 52, 57]); // + E3
    expect(notes("pad", false)).toEqual([33, 45, 57]); // the pad adds a soft A1 underneath
    expect(notes("pad", true)).toEqual([33, 45, 52, 57]);
    // every note of the drone is the root or its fifth
    for (const v of droneVoices("pad", C, true)) expect([0, 7]).toContain(v.midi % 12);
  });

  it("reads saved settings, with safe defaults", () => {
    expect(parseDroneSettings(null)).toEqual(DEFAULT_DRONE);
    expect(parseDroneSettings({ sound: "harmonium", fifth: false, volume: 0.3 })).toEqual({ sound: "harmonium", fifth: false, volume: 0.3 });
    expect(parseDroneSettings({ sound: "tanpura", fifth: "yes", volume: 7 })).toEqual({ ...DEFAULT_DRONE, volume: 1 });
  });

  it("makes a room that fades away to silence", () => {
    const [left, right] = roomImpulse(8000, 1, 3);
    expect(left).toHaveLength(8000);
    expect(right).toHaveLength(8000);
    const level = (from: number, to: number) => Math.max(...left.slice(from, to).map(Math.abs));
    expect(level(0, 800)).toBeGreaterThan(0.05);
    expect(level(7600, 8000)).toBeLessThan(0.001);
    expect(left).not.toEqual(right); // a little width between the two channels
  });
});
