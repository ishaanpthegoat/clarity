import { describe, it, expect } from "vitest";
import {
  avoidTerms,
  goalPhrase,
  greet,
  orderedInterests,
  rankHeadlines,
  score,
  specificFor,
  specificTerms,
} from "@/lib/personalize";
import type { UserProfile } from "@/lib/aiService";

const profile = (over: Partial<UserProfile> = {}): UserProfile => ({
  name: "Sam",
  interests: ["tech", "sports"],
  specifics: { sports: "Arsenal transfers" },
  goal: "finally learn to cook properly",
  avoid: "politics",
  purpose: "stop losing evenings to my phone",
  goals: ["finally learn to cook properly"],
  distractions: "instagram and youtube",
  focusSpan: 50,
  ...over,
});

describe("greet", () => {
  const at = (h: number) => new Date(2026, 0, 1, h, 0, 0);

  it("matches the time of day", () => {
    expect(greet("Sam", at(3))).toBe("Still up, Sam");
    expect(greet("Sam", at(9))).toBe("Good morning, Sam");
    expect(greet("Sam", at(14))).toBe("Good afternoon, Sam");
    expect(greet("Sam", at(20))).toBe("Good evening, Sam");
  });

  it("drops the comma when there is no name", () => {
    expect(greet("", at(9))).toBe("Good morning");
  });
});

describe("goalPhrase", () => {
  it("strips the leading clause people actually type", () => {
    expect(goalPhrase("I want to learn guitar")).toBe("learn guitar");
    expect(goalPhrase("to read more")).toBe("read more");
    expect(goalPhrase("finally learn to cook properly")).toBe("learn to cook properly");
    expect(goalPhrase("I'd like to run a marathon")).toBe("run a marathon");
  });

  it("drops trailing punctuation", () => {
    expect(goalPhrase("write every day!")).toBe("write every day");
  });

  it("leaves casing past the first word alone", () => {
    expect(goalPhrase("I want to learn Rust and AI")).toBe("learn Rust and AI");
  });

  it("never returns empty for a non-empty goal", () => {
    expect(goalPhrase("to")).toBe("to");
    expect(goalPhrase("  cook  ")).toBe("cook");
  });
});

describe("terms", () => {
  it("keeps meaningful words, drops stopwords and short ones", () => {
    const t = specificTerms(profile({ specifics: { tech: "the new AI research" } }));
    expect(t).toContain("research");
    expect(t).not.toContain("the");
    expect(t).not.toContain("new"); // stopword
    expect(t).not.toContain("ai"); // under three characters
  });

  it("de-duplicates across categories", () => {
    const t = specificTerms(
      profile({ specifics: { tech: "arsenal", sports: "arsenal" } }),
    );
    expect(t.filter((x) => x === "arsenal")).toHaveLength(1);
  });

  it("handles a profile with nothing specific", () => {
    expect(specificTerms(profile({ specifics: {} }))).toEqual([]);
    expect(avoidTerms(profile({ avoid: "" }))).toEqual([]);
  });
});

describe("score", () => {
  it("counts how many terms appear", () => {
    expect(score("Arsenal sign a striker", ["arsenal", "striker"])).toBe(2);
    expect(score("Arsenal sign a striker", ["chelsea"])).toBe(0);
  });

  it("is zero against an empty list", () => {
    expect(score("anything", [])).toBe(0);
  });
});

describe("rankHeadlines", () => {
  const headlines = [
    { title: "Market rally continues", source: "CNBC" },
    { title: "Arsenal transfers: three names in the frame", source: "BBC" },
    { title: "Politics dominates the week", source: "BBC" },
  ];

  it("pulls what they follow to the front", () => {
    const { matched, rest } = rankHeadlines(headlines, profile());
    expect(matched.map((h) => h.title)).toEqual([
      "Arsenal transfers: three names in the frame",
    ]);
    expect(rest.map((h) => h.title)).toContain("Market rally continues");
  });

  it("hides what they asked for less of, and says how many", () => {
    const { hidden, matched, rest } = rankHeadlines(headlines, profile());
    expect(hidden).toBe(1);
    expect([...matched, ...rest].map((h) => h.title)).not.toContain(
      "Politics dominates the week",
    );
  });

  it("keeps a story they follow even when it also trips the avoid list", () => {
    // "less politics" must not bin a story about the thing they explicitly
    // asked to follow — the positive signal wins.
    const clash = [{ title: "Arsenal caught up in stadium politics", source: "BBC" }];
    const { matched, hidden } = rankHeadlines(clash, profile());
    expect(hidden).toBe(0);
    expect(matched).toHaveLength(1);
  });

  it("passes everything through when the profile says nothing", () => {
    const blank = profile({ specifics: {}, avoid: "" });
    const { matched, rest, hidden } = rankHeadlines(headlines, blank);
    expect(hidden).toBe(0);
    expect(matched).toHaveLength(0);
    expect(rest).toHaveLength(3);
  });
});

describe("orderedInterests", () => {
  it("leads with the categories they were specific about", () => {
    const p = profile({
      interests: ["tech", "sports", "culture"],
      specifics: { culture: "new albums" },
    });
    expect(orderedInterests(p)).toEqual(["culture", "tech", "sports"]);
  });

  it("keeps the original order when nothing is specific", () => {
    const p = profile({ interests: ["tech", "sports"], specifics: {} });
    expect(orderedInterests(p)).toEqual(["tech", "sports"]);
  });
});

describe("specificFor", () => {
  it("returns null rather than an empty string", () => {
    expect(specificFor(profile({ specifics: { tech: "   " } }), "tech")).toBeNull();
    expect(specificFor(profile(), "tech")).toBeNull();
    expect(specificFor(profile(), "sports")).toBe("Arsenal transfers");
  });
});
