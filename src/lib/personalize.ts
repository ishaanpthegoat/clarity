// Clarity — turning a profile into the words on screen.
//
// Onboarding collects four things: a name, a goal, what you follow specifically
// inside each broad interest, and what you want less of. Most of that was being
// stored and never read, which is the worst of both worlds — you answer
// questions and the app behaves identically.
//
// ── Why none of this touches the generated prose ────────────────────────────
//
// The daily job writes ONE summary per category, shared by everyone who follows
// it. That is the whole reason the model bill stays flat as users are added.
// Feeding someone's specifics into that prompt would make each summary
// single-use and multiply the cost by the user count.
//
// So personalisation happens *after* generation, on the shared result, where it
// costs nothing: their specifics rank and surface the headlines that match,
// their avoid-list hides the ones they asked not to see, and their goal is
// quoted back at the moments it actually helps. Same summary for everyone;
// different digest.
import type { UserProfile } from "./aiService";

/** Time-of-day greeting. One definition, used everywhere it is shown. */
export function greet(name: string, now: Date = new Date()): string {
  const h = now.getHours();
  const part =
    h < 5 ? "Still up" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  return name ? `${part}, ${name}` : part;
}

/**
 * The goal, trimmed to sit inside another sentence.
 *
 * People answer this question with a full thought — "I want to finally learn to
 * cook properly" — and the leading clause reads badly mid-sentence. Casing is
 * left alone past the first word so "AI" and proper nouns survive.
 */
export function goalPhrase(goal: string): string {
  const clean = goal
    .trim()
    .replace(/[.!?]+$/, "")
    .replace(/^(i(?:'d| would)? (?:want|like|love) to|i want to|i'?d like to|want to|to)\s+/i, "")
    .replace(/^(finally|actually|really|just)\s+/i, "");
  return clean || goal.trim();
}

/** Splits a free-text answer into searchable terms, dropping filler. */
const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "of", "in", "on", "for", "to", "my", "me", "i",
  "stuff", "things", "thing", "news", "some", "any", "about", "with", "more",
  "less", "new", "what", "that", "this", "it", "its",
]);

function terms(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

/** Everything the person said they specifically want, across all interests. */
export function specificTerms(profile: UserProfile): string[] {
  return [...new Set(Object.values(profile.specifics ?? {}).flatMap(terms))];
}

/** Everything they said they want less of. */
export function avoidTerms(profile: UserProfile): string[] {
  return profile.avoid ? [...new Set(terms(profile.avoid))] : [];
}

/** How many of `list`'s terms appear in a headline. */
export function score(title: string, list: string[]): number {
  if (!list.length) return 0;
  const lower = title.toLowerCase();
  return list.filter((t) => lower.includes(t)).length;
}

export interface Headline {
  title: string;
  source: string;
  url?: string;
}

export interface RankedHeadlines {
  /** Matched their specifics — worth pulling out of the list. */
  matched: Headline[];
  /** Everything else, in the order the job produced it. */
  rest: Headline[];
  /** Hidden because they asked for less of this. */
  hidden: number;
}

/**
 * Reorders one category's headlines around what this person actually said.
 *
 * Pure, cheap, and runs per user on a shared summary — the whole point of doing
 * personalisation here rather than in the prompt.
 */
export function rankHeadlines(
  headlines: Headline[],
  profile: UserProfile,
): RankedHeadlines {
  const wanted = specificTerms(profile);
  const unwanted = avoidTerms(profile);

  const kept: Headline[] = [];
  let hidden = 0;

  for (const h of headlines) {
    // An avoid term only wins when nothing they asked for also matches —
    // otherwise "less politics" would bin a story they explicitly follow.
    const bad = score(h.title, unwanted);
    const good = score(h.title, wanted);
    if (bad > 0 && good === 0) {
      hidden++;
      continue;
    }
    kept.push(h);
  }

  const matched = kept.filter((h) => score(h.title, wanted) > 0);
  const rest = kept.filter((h) => score(h.title, wanted) === 0);

  return { matched, rest, hidden };
}

/** What they told us they follow inside one category, if anything. */
export function specificFor(profile: UserProfile, category: string): string | null {
  const value = profile.specifics?.[category]?.trim();
  return value || null;
}

/**
 * Interests, ordered so the one they were specific about leads.
 *
 * Being specific is the strongest signal of what someone actually cares about,
 * so those categories go first rather than sitting wherever the catalogue
 * happened to put them.
 */
export function orderedInterests(profile: UserProfile): string[] {
  const withSpecific = profile.interests.filter((c) => specificFor(profile, c));
  const without = profile.interests.filter((c) => !specificFor(profile, c));
  return [...withSpecific, ...without];
}
