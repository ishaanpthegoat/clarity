import { describe, expect, it, vi, afterEach } from "vitest";
import {
  addDays,
  clarityScore,
  computeStreak,
  dateKey,
  emptyDay,
  formatDuration,
  formatClock,
  lastSevenDays,
  milestones,
  totalsFor,
  weekOverWeekDelta,
  type DayMap,
  type Session,
} from "@/lib/clarityStats";

/** Build a day map from {daysAgo: focusMinutes}. */
function history(minutesByDaysAgo: Record<number, number>): DayMap {
  const map: DayMap = {};
  for (const [ago, mins] of Object.entries(minutesByDaysAgo)) {
    const key = addDays(dateKey(), -Number(ago));
    map[key] = { ...emptyDay(key), focusedSeconds: mins * 60 };
  }
  return map;
}

afterEach(() => vi.useRealTimers());

describe("dateKey", () => {
  it("uses local time, not UTC", () => {
    // 1 Jan 2026 at 00:30 local — toISOString would roll this back to Dec 31
    // anywhere west of Greenwich.
    const d = new Date(2026, 0, 1, 0, 30);
    expect(dateKey(d)).toBe("2026-01-01");
  });

  it("pads single-digit months and days", () => {
    expect(dateKey(new Date(2026, 2, 5))).toBe("2026-03-05");
  });
});

describe("addDays", () => {
  it("crosses a month boundary", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
  });
  it("crosses a year boundary backwards", () => {
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
  });
  it("handles a leap day", () => {
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
  });
});

describe("lastSevenDays", () => {
  it("returns 7 keys, oldest first, ending today", () => {
    const keys = lastSevenDays();
    expect(keys).toHaveLength(7);
    expect(keys[6]).toBe(dateKey());
    expect(keys[0]).toBe(addDays(dateKey(), -6));
  });
});

describe("computeStreak", () => {
  it("is zero with no history", () => {
    expect(computeStreak({})).toBe(0);
  });

  it("counts consecutive qualifying days ending yesterday", () => {
    // Nothing today yet, but the three days before all cleared the bar.
    expect(computeStreak(history({ 1: 30, 2: 30, 3: 30 }))).toBe(3);
  });

  it("includes today once it qualifies", () => {
    expect(computeStreak(history({ 0: 30, 1: 30, 2: 30 }))).toBe(3);
  });

  it("does not break the streak just because today is still empty", () => {
    // The point: an untouched today is in progress, not a miss.
    expect(computeStreak(history({ 1: 60, 2: 60 }))).toBe(2);
  });

  it("stops at a gap", () => {
    expect(computeStreak(history({ 1: 30, 2: 30, 4: 30 }))).toBe(2);
  });

  it("ignores days under the threshold", () => {
    expect(computeStreak(history({ 1: 5, 2: 30 }))).toBe(0);
  });

  it("respects a custom threshold", () => {
    expect(computeStreak(history({ 1: 20, 2: 20 }), 30)).toBe(0);
    expect(computeStreak(history({ 1: 40, 2: 40 }), 30)).toBe(2);
  });
});

describe("clarityScore", () => {
  it("is zero for an untouched day", () => {
    expect(clarityScore(emptyDay("2026-07-24"), 180).score).toBe(0);
  });

  it("caps focus at the goal so overtime cannot inflate it", () => {
    const day = { ...emptyDay("d"), focusedSeconds: 999 * 60 };
    // Focus is the only applicable component, so a full goal is a full score.
    expect(clarityScore(day, 180).score).toBe(100);
  });

  it("does not award credit for a list you never wrote or pulls that never came", () => {
    // Half the goal, nothing else logged → 50, not 50 plus a free hold bonus.
    const day = { ...emptyDay("d"), focusedSeconds: 90 * 60 };
    expect(clarityScore(day, 180).score).toBe(50);
  });

  it("treats a day with no pulls as clean rather than penalised", () => {
    expect(clarityScore(emptyDay("d"), 180).holdPct).toBe(1);
  });

  it("weights focus, tasks and holds as documented", () => {
    const day = {
      ...emptyDay("d"),
      focusedSeconds: 90 * 60, // half of a 180m goal → .5 * 60 = 30
      todosDone: 2,
      todosTotal: 4, //                              → .5 * 25 = 12.5
      pulls: 4,
      holds: 2, //                                   → .5 * 15 = 7.5
    };
    expect(clarityScore(day, 180).score).toBe(50);
  });

  it("never exceeds 100 or drops below 0", () => {
    const perfect = {
      ...emptyDay("d"),
      focusedSeconds: 180 * 60,
      todosDone: 3,
      todosTotal: 3,
      pulls: 2,
      holds: 2,
    };
    expect(clarityScore(perfect, 180).score).toBe(100);
  });

  it("survives a zero goal without dividing by zero", () => {
    expect(Number.isFinite(clarityScore(emptyDay("d"), 0).score)).toBe(true);
  });
});

describe("totalsFor", () => {
  it("sums across days and finds the best one", () => {
    const days = history({ 0: 10, 1: 90, 2: 40 });
    const t = totalsFor(days, lastSevenDays());
    expect(t.focusedSeconds).toBe(140 * 60);
    expect(t.bestDayKey).toBe(addDays(dateKey(), -1));
  });

  it("returns zeroes for an empty range", () => {
    const t = totalsFor({}, lastSevenDays());
    expect(t.focusedSeconds).toBe(0);
    expect(t.bestDayKey).toBeNull();
  });
});

describe("weekOverWeekDelta", () => {
  it("is null without a prior week to compare against", () => {
    expect(weekOverWeekDelta(history({ 0: 60 }))).toBeNull();
  });

  it("reports a percentage rise", () => {
    // 100 min this week, 50 last week → +100%
    expect(weekOverWeekDelta(history({ 1: 100, 8: 50 }))).toBe(100);
  });

  it("reports a fall", () => {
    expect(weekOverWeekDelta(history({ 1: 50, 8: 100 }))).toBe(-50);
  });
});

describe("formatDuration", () => {
  it.each([
    [0, "0m"],
    [59, "0m"],
    [60, "1m"],
    [3600, "1h"],
    [3660, "1h 1m"],
    [9600, "2h 40m"],
  ])("formats %i seconds as %s", (secs, expected) => {
    expect(formatDuration(secs)).toBe(expected);
  });

  it("clamps negatives rather than printing them", () => {
    expect(formatDuration(-90)).toBe("0m");
  });
});

describe("formatClock", () => {
  it("pads seconds", () => {
    expect(formatClock(65)).toBe("1:05");
    expect(formatClock(0)).toBe("0:00");
  });
});

describe("milestones", () => {
  const noSessions: Session[] = [];

  it("marks everything unearned on a fresh install", () => {
    expect(milestones({}, noSessions).every((m) => !m.earned)).toBe(true);
  });

  it("earns 'first block' after one completed session", () => {
    const key = dateKey();
    const days: DayMap = { [key]: { ...emptyDay(key), completedSessions: 1 } };
    const first = milestones(days, noSessions).find((m) => m.id === "first-block");
    expect(first?.earned).toBe(true);
  });

  it("earns 'long haul' from a single 90-minute sitting", () => {
    const sessions: Session[] = [
      { id: "s1", startedAt: 0, planned: 90, focusedSeconds: 90 * 60, task: "x", completed: true, strict: false },
    ];
    expect(milestones({}, sessions).find((m) => m.id === "long-haul")?.earned).toBe(true);
  });

  it("reports partial progress rather than jumping to earned", () => {
    const sessions: Session[] = [
      { id: "s1", startedAt: 0, planned: 45, focusedSeconds: 45 * 60, task: "x", completed: true, strict: false },
    ];
    const m = milestones({}, sessions).find((x) => x.id === "long-haul");
    expect(m?.earned).toBe(false);
    expect(m?.progress).toBeCloseTo(0.5);
  });

  it("caps progress at 1", () => {
    const key = dateKey();
    const days: DayMap = { [key]: { ...emptyDay(key), completedSessions: 99 } };
    expect(milestones(days, noSessions).find((m) => m.id === "first-block")?.progress).toBe(1);
  });
});
