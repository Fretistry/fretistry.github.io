import { describe, expect, it } from "vitest";
import { withPractice } from "@/lib/share";
import { droneLinkValue, parseDroneLink } from "./drone";
import { DEFAULT_METRONOME, MetronomeScheduler, isSilent, type ScheduledTick } from "./metronome";

/** Runs the scheduler on a fake clock and returns every booked click. */
function run(settings: Partial<typeof DEFAULT_METRONOME>, seconds: number): ScheduledTick[] {
  let now = 0;
  const ticks: ScheduledTick[] = [];
  const scheduler = new MetronomeScheduler({ now: () => now, onSchedule: (t) => ticks.push(t), lookahead: 0.1 });
  scheduler.start({ ...DEFAULT_METRONOME, bpm: 120, ...settings }, 0);
  for (; now < seconds; now += 0.025) scheduler.pump();
  return ticks;
}

describe("metronome practice options", () => {
  it("counts bars", () => {
    const ticks = run({}, 4.4); // 120 bpm in 4/4: a bar every 2 s
    expect(ticks.filter((t) => t.beat === 0).map((t) => t.bar)).toEqual([0, 1, 2]);
  });

  it("clicks only on beats 2 and 4 with the backbeat on", () => {
    const ticks = run({ backbeat: true }, 2);
    expect(ticks.slice(0, 4).map((t) => t.silent)).toEqual([true, false, true, false]);
    // subdivisions still click
    const eighths = run({ backbeat: true, subdivision: 2 }, 1);
    expect(eighths.slice(0, 4).map((t) => t.silent)).toEqual([true, false, false, false]);
  });

  it("leaves bars silent in the chosen pattern", () => {
    const ticks = run({ gap: 2 }, 16.4);
    const silentBars = [...new Set(ticks.filter((t) => t.silent).map((t) => t.bar))];
    expect(silentBars).toEqual([2, 3, 6, 7]); // two bars on, two off
    expect(isSilent({ beat: 1, sub: 0, bar: 1 }, { backbeat: false, gap: 1 })).toBe(true);
    expect(isSilent({ beat: 1, sub: 0, bar: 2 }, { backbeat: false, gap: 1 })).toBe(false);
    expect(run({}, 4).some((t) => t.silent)).toBe(false);
  });
});

describe("lesson links", () => {
  it("adds the tempo and drone that are playing, and only those", () => {
    const base = "https://fretistry.github.io/en/d-dorian/?pos=boxes4";
    expect(withPractice(base, { bpm: 80, drone: "pad5" })).toBe("https://fretistry.github.io/en/d-dorian/?pos=boxes4&bpm=80&drone=pad5");
    expect(withPractice(base, { bpm: null, drone: null })).toBe(base);
    expect(withPractice(`${base}&bpm=60`, { bpm: null, drone: "harmonium" })).toBe(`${base}&drone=harmonium`);
  });

  it("writes and reads the drone sound", () => {
    expect(droneLinkValue({ sound: "pad", fifth: true })).toBe("pad5");
    expect(droneLinkValue({ sound: "harmonium", fifth: false })).toBe("harmonium");
    expect(parseDroneLink("pad5")).toEqual({ sound: "pad", fifth: true });
    expect(parseDroneLink("harmonium")).toEqual({ sound: "harmonium", fifth: false });
    expect(parseDroneLink("tanpura")).toEqual({});
    expect(parseDroneLink(null)).toEqual({});
  });
});
