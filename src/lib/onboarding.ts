// Clarity — parsing for the onboarding conversation.
//
// The setup chat asks for things in prose ("about 45 mins", "cook properly and
// run a 5k") and the app needs them as numbers, lists and app ids. That
// translation lives here rather than in the screen for two reasons: it is the
// part with edge cases worth testing, and a screen that exports helpers stops
// hot-reloading cleanly.
//
// Every function here is deliberately conservative. A miss costs a default —
// the seed apps stay, the session length stays at 25 — while a false positive
// locks an app someone never named or records a focus span they never said.
import { APP_CATALOG } from "./clarityData";
import { SESSION_BOUNDS } from "./sessionBounds";

/** Minutes offered as chips on the focus-span turn. */
export const SPAN_PRESETS = [15, 25, 50, 90] as const;

/**
 * "cook properly, run a 5k and finish the album" → three goals.
 *
 * Split on the separators people actually type when listing things out loud.
 * A bare " and " is included deliberately: it is how most people join two
 * goals, and treating the whole string as one goal produced projects nobody
 * would have named that way. Fragments under three characters are punctuation
 * noise rather than goals, and five is where a list stops being a plan.
 */
export function splitGoals(raw: string): string[] {
  return raw
    .split(/\s*(?:,|;|\/|\band\b|\bthen\b|\n)\s*/i)
    .map((g) => g.trim().replace(/^(?:to|and)\s+/i, "").replace(/[.\s]+$/, ""))
    .filter((g) => g.length > 2)
    .slice(0, 5);
}

function clampSpan(m: number): number {
  if (!Number.isFinite(m) || m < 1) return 0;
  return Math.min(Math.max(m, SESSION_BOUNDS.min), SESSION_BOUNDS.max);
}

/**
 * "about 45 mins", "an hour", "25" → minutes. 0 when there is no number in it.
 *
 * Returning 0 rather than a sensible default is the point: the caller re-asks,
 * instead of silently recording a number the user never gave. Hours are
 * checked before the bare-digit fallback so "1 hour" is 60 and not 1.
 */
export function parseSpan(raw: string): number {
  const text = raw.toLowerCase();
  const hours = text.match(/(\d+(?:\.\d+)?)\s*(?:h\b|hr|hour)/);
  if (hours) return clampSpan(Math.round(parseFloat(hours[1]) * 60));
  if (/\bhalf an hour\b/.test(text)) return 30;
  if (/\ban hour\b|\bone hour\b/.test(text)) return 60;
  const mins = text.match(/(\d+)/);
  return mins ? clampSpan(parseInt(mins[1], 10)) : 0;
}

/**
 * Which catalogue apps someone just named.
 *
 * Two things make this less naive than a substring scan, and both come from
 * the catalogue itself:
 *
 *   * Punctuation and spacing are flattened before matching, so "tik tok",
 *     "TikTok" and "tik-tok" all land on the same entry. People do not type
 *     brand names the way brands write them.
 *   * Names of one or two characters — "X" — match only as a whole word.
 *     A substring scan for "x" locks a social network for anyone who mentions
 *     their inbox, which is exactly the kind of miss that makes an app feel
 *     like it was not paying attention.
 *
 * Beyond that it stays dumb on purpose. It runs once, over a sentence someone
 * typed about their own phone; missing an app costs them one tap in Settings,
 * while inventing one locks something they never mentioned.
 */
export function matchApps(raw: string): { id: string; name: string }[] {
  const text = (raw ?? "").toLowerCase();
  if (!text.trim()) return [];
  const words = new Set(text.split(/[^a-z0-9]+/).filter(Boolean));
  const compact = text.replace(/[^a-z0-9]+/g, "");
  return APP_CATALOG.filter((app) => {
    const name = app.name.toLowerCase();
    if (name.length <= 2) return words.has(name);
    return compact.includes(name.replace(/[^a-z0-9]+/g, ""));
  }).map((app) => ({ id: app.id, name: app.name }));
}
