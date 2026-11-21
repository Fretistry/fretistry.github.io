import { describe, expect, it } from "vitest";
import {
  DEFAULT_METRONOME,
  MetronomeScheduler,
  clampBpm,
  secondsPerTick,
  tapTempo,
  tempoMarking,
  tickKind,
  type MetronomeSettings,
  type ScheduledTick,
} from "./metronome";

/** A scheduler driven by a fake clock that we move forward by hand. */
function harness(settings: MetronomeSettings) {
  let clock = 0;
  const booked: ScheduledTick[] = [];
  const scheduler = new MetronomeScheduler({ now: () => clock, onSchedule: (t) => booked.push(t) });
  scheduler.start(settings, 0);
  return {
    scheduler,
    booked,
    advance(seconds: number) {
      // Like the real app: wake up every 25 ms and book ahead.
      for (let t = 0; t < seconds; t += 0.025) {
        clock += 0.025;
        scheduler.pump();
      }
    },
    get clock() {
      return clock;
    },
  };
}

const kinds = (ticks: ScheduledTick[]) => ticks.map((t) => t.kind[0]).join("");

describe("metronome basics", () => {
  it("computes click spacing from tempo and subdivision", () => {
    expect(secondsPerTick({ bpm: 60, subdivision: 1 })).toBe(1);
    expect(secondsPerTick({ bpm: 120, subdivision: 1 })).toBe(0.5);
    expect(secondsPerTick({ bpm: 120, subdivision: 2 })).toBe(0.25);
    expect(secondsPerTick({ bpm: 90, subdivision: 3 })).toBeCloseTo(60 / 270, 10);
  });

  it("accents the first beat and softens subdivisions", () => {
    const s = { subdivision: 2 as const, accent: true };
    expect([0, 1, 2, 3].map((t) => tickKind(t, s))).toEqual(["accent", "sub", "beat", "sub"]);
    expect(tickKind(0, { subdivision: 1, accent: false })).toBe("beat");
  });

  it("keeps the tempo within a playable range", () => {
    expect(clampBpm(10)).toBe(30);
    expect(clampBpm(999)).toBe(260);
    expect(clampBpm(99.6)).toBe(100);
    expect(clampBpm(Number.NaN)).toBe(DEFAULT_METRONOME.bpm);
  });

  it("names tempos", () => {
    expect(tempoMarking(50)).toBe("Largo");
    expect(tempoMarking(80)).toBe("Andante");
    expect(tempoMarking(112)).toBe("Moderato");
    expect(tempoMarking(140)).toBe("Allegro");
    expect(tempoMarking(180)).toBe("Presto");
  });

  it("calculates tap tempo from the most recent taps", () => {
    expect(tapTempo([1000])).toBeNull();
    expect(tapTempo([0, 500, 1000, 1500])).toBe(120);
    expect(tapTempo([0, 1000, 2000])).toBe(60);
    // A long pause starts a new sequence: only the last two taps count.
    expect(tapTempo([0, 300, 600, 5000, 5750])).toBe(80);
  });
});

describe("metronome scheduler", () => {
  it("books clicks at exact, evenly spaced times", () => {
    const h = harness({ ...DEFAULT_METRONOME, bpm: 120 });
    h.advance(2);
    const times = h.booked.map((t) => t.time);
    times.slice(1).forEach((t, i) => expect(t - times[i]).toBeCloseTo(0.5, 10));
    // Every click inside the look-ahead window is booked, and nothing beyond it.
    const last = times[times.length - 1];
    expect(last).toBeLessThanOrEqual(h.clock + 0.12 + 1e-9);
    expect(last + 0.5).toBeGreaterThanOrEqual(h.clock + 0.12 - 1e-9);
  });

  it("cycles through the bar with an accent on beat one", () => {
    const h = harness({ ...DEFAULT_METRONOME, bpm: 240, beatsPerBar: 3 });
    h.advance(2);
    expect(kinds(h.booked).slice(0, 9)).toBe("abbabbabb");
    expect(h.booked.slice(0, 4).map((t) => t.beat)).toEqual([0, 1, 2, 0]);
  });

  it("plays subdivisions between the beats", () => {
    const h = harness({ ...DEFAULT_METRONOME, bpm: 120, beatsPerBar: 2, subdivision: 3 });
    h.advance(1.5);
    expect(kinds(h.booked).slice(0, 6)).toBe("assbss");
    expect(h.booked[1].time - h.booked[0].time).toBeCloseTo(1 / 6, 10);
  });

  it("changes tempo smoothly from the next click", () => {
    const h = harness({ ...DEFAULT_METRONOME, bpm: 60 });
    h.advance(1.5);
    const before = h.booked.length;
    h.scheduler.update({ ...DEFAULT_METRONOME, bpm: 120 });
    h.advance(2);
    const after = h.booked.slice(before);
    after.slice(1).forEach((t, i) => expect(t.time - after[i].time).toBeCloseTo(0.5, 10));
  });

  it("switches subdivision on the next beat", () => {
    const h = harness({ ...DEFAULT_METRONOME, bpm: 60, beatsPerBar: 4, subdivision: 2 });
    h.advance(0.6); // booked beat 1 and its "and"
    h.scheduler.update({ ...DEFAULT_METRONOME, bpm: 60, beatsPerBar: 4, subdivision: 1 });
    h.advance(2);
    const next = h.booked.find((t, i) => i > 1)!;
    expect(next.sub).toBe(0);
  });

  it("reports the click that is currently sounding and stops cleanly", () => {
    const h = harness({ ...DEFAULT_METRONOME, bpm: 120 });
    h.advance(1.1);
    const due = h.scheduler.takeDue(h.clock);
    expect(due).not.toBeNull();
    expect(due!.time).toBeLessThanOrEqual(h.clock);
    h.scheduler.stop();
    const count = h.booked.length;
    h.advance(1);
    expect(h.booked.length).toBe(count);
    expect(h.scheduler.isRunning).toBe(false);
  });
});
