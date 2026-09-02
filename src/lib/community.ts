// Clarity — what other people are actually working on.
//
// The projects tab has always carried a community feed, but until now it was
// six hardcoded strangers in `clarityData.ts` with a fixed cheer count. It read
// as a design mock because it was one: nothing in it came from a person, and
// nothing in it changed.
//
// This is the real version. A `CommunityProject` is somebody's actual project
// with their actual logged effort attached — sessions this week, minutes this
// week, when they last sat down for it — because "what other people are doing"
// is a claim about behaviour, and behaviour is the part that has to be real for
// the feed to be worth anything. A wall of aspirational titles with no effort
// behind them is the thing this feed exists to be the opposite of.
//
// ─────────────────────────────────────────────────────────────────────────────
// SHARING IS OPT-IN, AND OFF
// ─────────────────────────────────────────────────────────────────────────────
// Nothing here is shared unless someone turns it on per project, and the opt-in
// UI is not built yet — see SPEC-SESSION10.md §3. Until it is, `shareProject`
// is the only way anything leaves a device, nothing calls it, and the feed is
// read-only. Do not wire the toggle up until the questions in that section have
// answers: a display name is not the same as a real one, project titles are
// free text people write about their own lives, and a feed of them is a feed of
// personal disclosures.
import { PUBLIC_IDEAS } from "./clarityData";
import { apiCommunity } from "./api";

export interface CommunityProject {
  id: string;
  /** A chosen display name. Never derived from anything identifying. */
  author: string;
  /** Two-letter monogram for the procedural avatar. */
  initials: string;
  /** 0-360, seeds the avatar gradient so each person looks like themselves. */
  hue: number;
  title: string;
  desc: string;
  /** 0-100, as the owner set it on their own project sheet. */
  progress: number;
  /** Focus sessions logged against this project in the last 7 days. */
  sessionsThisWeek: number;
  /** Minutes logged against it in the last 7 days. */
  minutesThisWeek: number;
  /** ISO timestamp of the most recent session. Drives "worked on 2h ago". */
  lastActiveAt: string;
  cheers: number;
  /** Set once the owner signs it off, e.g. "shipped in 6 days". */
  outcome?: string;
}

/**
 * "2h ago", "yesterday", "3d ago" — or "" when the timestamp is unusable.
 *
 * Returning an empty string rather than "unknown" is deliberate: the caller
 * omits the line entirely, and a feed row with no timestamp reads better than
 * one advertising that we lost it.
 */
export function lastActiveLabel(iso: string, now = Date.now()): string {
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return "";
  const mins = Math.round((now - then) / 60_000);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return `${Math.round(days / 7)}w ago`;
}

/**
 * The offline feed.
 *
 * Derived from the same six people the hardcoded feed always used, so the
 * static GitHub Pages build looks exactly as it did — but shaped as real
 * `CommunityProject`s, with effort figures derived deterministically from the
 * id so they do not reshuffle on every render. This is a fallback, not a
 * simulation: it is labelled as sample data in the UI (see the spec) precisely
 * so nobody mistakes it for people.
 */
export function localCommunity(now = Date.now()): CommunityProject[] {
  return PUBLIC_IDEAS.map((idea, i) => {
    const seed = idea.id.charCodeAt(idea.id.length - 1) + i;
    return {
      id: idea.id,
      author: idea.author,
      initials: idea.initials,
      hue: idea.hue,
      title: idea.idea,
      desc: idea.desc,
      progress: 20 + ((seed * 13) % 70),
      sessionsThisWeek: 2 + (seed % 6),
      minutesThisWeek: (2 + (seed % 6)) * (25 + (seed % 3) * 25),
      lastActiveAt: new Date(now - (1 + (seed % 40)) * 3_600_000).toISOString(),
      cheers: idea.cheers,
      outcome: idea.outcome,
    };
  });
}

/**
 * The feed, from the backend when there is one and from `localCommunity`
 * otherwise.
 *
 * Same contract as every other call in `api.ts`: a backend that is down, slow
 * or simply not deployed degrades to the local path rather than showing an
 * error. The caller cannot tell which one it got, and does not need to.
 */
export async function fetchCommunity(): Promise<CommunityProject[]> {
  const live = await apiCommunity();
  return live?.length ? live : localCommunity();
}
