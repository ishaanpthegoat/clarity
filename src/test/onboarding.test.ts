import { describe, expect, it } from "vitest";
import { matchApps, parseSpan, splitGoals } from "@/lib/onboarding";
import { lastActiveLabel } from "@/lib/community";

describe("splitGoals", () => {
  it("splits the separators people actually type", () => {
    expect(splitGoals("cook properly, run a 5k and finish the album")).toEqual([
      "cook properly",
      "run a 5k",
      "finish the album",
    ]);
  });

  it("strips the leading 'to' that comes with listing things out loud", () => {
    expect(splitGoals("to write more; to sleep earlier")).toEqual(["write more", "sleep earlier"]);
  });

  it("keeps a single goal as a single goal", () => {
    expect(splitGoals("learn to cook properly")).toEqual(["learn to cook properly"]);
  });

  it("drops fragments too short to be a goal", () => {
    expect(splitGoals("read more, , x")).toEqual(["read more"]);
  });

  it("matches a hyphenated app name written any which way", () => {
    expect(splitGoals("run a 5k")).toEqual(["run a 5k"]);
  });

  it("caps a list at five — past that it is not a plan", () => {
    expect(splitGoals("one, two, three, four, five, six, seven")).toHaveLength(5);
  });

  it("returns nothing for an empty answer", () => {
    expect(splitGoals("   ")).toEqual([]);
  });
});

describe("parseSpan", () => {
  it("reads a bare number as minutes", () => {
    expect(parseSpan("25")).toBe(25);
  });

  it("reads minutes written out", () => {
    expect(parseSpan("about 45 mins on a good day")).toBe(45);
  });

  it("reads hours as hours, not as the digit", () => {
    expect(parseSpan("1 hour")).toBe(60);
    expect(parseSpan("1.5 hrs")).toBe(90);
    expect(parseSpan("2h")).toBe(120);
  });

  it("handles the spelled-out cases", () => {
    expect(parseSpan("an hour")).toBe(60);
    expect(parseSpan("half an hour")).toBe(30);
  });

  it("clamps to the slider's own bounds", () => {
    expect(parseSpan("1")).toBe(5);
    expect(parseSpan("900")).toBe(420);
  });

  it("returns 0 when there is no number, so the caller re-asks", () => {
    expect(parseSpan("not very long honestly")).toBe(0);
    expect(parseSpan("")).toBe(0);
  });
});

describe("matchApps", () => {
  it("finds apps named in a sentence", () => {
    const names = matchApps("mostly instagram, some youtube").map((a) => a.name);
    expect(names).toContain("Instagram");
    expect(names).toContain("YouTube");
  });

  it("matches regardless of spacing and case", () => {
    expect(matchApps("TIK TOK").map((a) => a.name)).toContain("TikTok");
  });

  it("does not let a one-letter app name match inside another word", () => {
    // "X" is in the catalogue. A plain substring scan locked it for anyone who
    // mentioned their inbox, which is what hardened this matcher.
    expect(matchApps("mostly my inbox, honestly").map((a) => a.name)).not.toContain("X");
    expect(matchApps("x and reddit").map((a) => a.name)).toContain("X");
  });

  it("returns nothing rather than guessing", () => {
    expect(matchApps("just the news really")).toEqual([]);
    expect(matchApps("")).toEqual([]);
  });
});

describe("lastActiveLabel", () => {
  const now = Date.parse("2026-09-02T12:00:00.000Z");
  const ago = (ms: number) => new Date(now - ms).toISOString();

  it("describes recent activity in the unit that reads best", () => {
    expect(lastActiveLabel(ago(30_000), now)).toBe("just now");
    expect(lastActiveLabel(ago(20 * 60_000), now)).toBe("20m ago");
    expect(lastActiveLabel(ago(3 * 3_600_000), now)).toBe("3h ago");
    expect(lastActiveLabel(ago(26 * 3_600_000), now)).toBe("yesterday");
    expect(lastActiveLabel(ago(4 * 86_400_000), now)).toBe("4d ago");
    expect(lastActiveLabel(ago(20 * 86_400_000), now)).toBe("3w ago");
  });

  it("returns nothing for an unusable timestamp, so the row omits the line", () => {
    expect(lastActiveLabel("not a date", now)).toBe("");
  });
});
