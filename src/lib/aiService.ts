// Clarity — the one swappable AI layer.
//
// Every part of the app that wants generated text calls one of the two
// functions at the bottom of this file. Nothing else in the codebase knows
// whether the words came from a model or from the templates below, which is
// the whole point: when a real key exists, only this file changes.
//
// ─────────────────────────────────────────────────────────────────────────────
// WHERE THE REAL MODEL LIVES
// ─────────────────────────────────────────────────────────────────────────────
// It is NOT in this file, and it never can be. Clarity's frontend is a static
// bundle; an ANTHROPIC_API_KEY shipped inside one is readable by anyone who
// opens devtools — a published secret, not a configured one.
//
// So the real calls live in `server/src/ai.ts`, which holds the key in its own
// environment. This file reaches them through `api.ts` when VITE_API_URL is
// set, and falls back to the templates below when it is not:
//
//   VITE_API_URL set    → server/ answers: real RSS, claude-haiku-4-5-20251001
//   VITE_API_URL unset  → the templates below (the GitHub Pages build)
//
// Both are supported paths. The templates are not a broken mode — they are how
// the static deploy works, and how the whole system runs before you spend a
// cent. Nothing above this file can tell which one served a given call.
//
// The prompts stay here rather than on the server so they are versioned
// alongside the UI whose tone they set; `server/src/ai.ts` keeps its own copy
// in sync.

import type { FeedArticle } from "./feeds";
import { apiChatReply } from "./api";

/** What onboarding learns about someone. Drives the digest and its tone. */
export interface UserProfile {
  name: string;
  /** Broad category ids from the feed catalogue — what to pull. */
  interests: string[];
  /** category id → the exact thing they said they want inside it. */
  specifics: Record<string, string>;
  /** What they're trying to spend the reclaimed time on. The headline goal. */
  goal: string;
  /** What they want less of. */
  avoid: string;

  // ── the deeper capture (added session 10) ──────────────────────────────────
  // Onboarding used to learn four things and configure nothing. These four are
  // the difference between a profile that shapes a digest and one that shapes
  // the whole app: `purpose` sets the tone, `goals` become projects,
  // `distractions` decide which apps get locked, and `focusSpan` sets the
  // session length so the first slider someone sees is already their number.
  //
  // All four are optional in practice — a profile written before this existed
  // deserializes with them empty, and every consumer treats empty as "never
  // asked" rather than "answered nothing".

  /** Why they installed it, in their words. Steers tone, not content. */
  purpose: string;
  /** Everything they named, `goal` included as the first entry. */
  goals: string[];
  /** What pulls them away, verbatim — matched against the app catalogue. */
  distractions: string;
  /** Minutes they said they can hold focus for. 0 means never asked. */
  focusSpan: number;
}

export interface ChatTurn {
  role: "bot" | "user";
  text: string;
}

export interface ChatReply {
  message: string;
  /** Anything the reply managed to pull out of what they said. */
  extracted?: Partial<UserProfile>;
}

/** Kept next to the fake logic so the prompt ships with the UI it shapes. */
export const DIGEST_SYSTEM_PROMPT = `You write a daily news digest for someone trying to spend less time scrolling.
Write 3-5 sentences of plain, casual language. No jargon, no hype, no bullet
points, no preamble like "Here's your digest". Say what actually happened and
why it might matter to them. If the stories are unrelated, that is fine — do
not invent a connective theme.`;

export const CHAT_SYSTEM_PROMPT = `You are the onboarding voice of Clarity, an app that replaces endless feeds
with one short daily digest and locks the apps that eat someone's day. You are
warm, curious and brief — two sentences at most, and you never sound like a
form. Ask one thing at a time. When someone names an interest, get specific
about what inside it they actually care about.

You are gathering enough to configure the app for them: what they want out of
it, what they are working toward, what pulls them away, how long they can hold
focus, and what they want to keep up with. Acknowledge what they just said in a
way that proves you read it — reflect a specific detail back rather than saying
"got it" — and never restate the question you are about to be asked next.`;

// ── the fake implementations ────────────────────────────────────────────────

/** Deterministic per (day, category) so a digest doesn't reshuffle on re-render. */
function pick<T>(list: T[], seed: string): T {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return list[Math.abs(h) % list.length];
}

const OPENERS = [
  "Here's what actually moved today.",
  "The short version of today:",
  "Three things worth knowing, then you're done.",
  "Today came down to a few stories.",
];

const CLOSERS = [
  "That's the whole picture — nothing else needed your attention today.",
  "Nothing else today is worth the scroll.",
  "That's it. The rest was noise.",
  "You're caught up. Go do the thing you actually planned.",
];

/**
 * Turns a headline into something that reads mid-sentence.
 *
 * Only a trailing publication tag is stripped ("… — The Verge"), and only when
 * what remains is still a headline. Colons are left alone: news titles lead
 * with them constantly ("Coroner: X died of Y"), and treating that as a tag
 * reduced the whole headline to the word "Coroner".
 */
function clause(title: string): string {
  let t = title.trim();
  const tag = t.match(/^(.{25,})\s+[-–—|]\s+(.{2,30})$/);
  if (tag) t = tag[1].trim();
  return t.charAt(0).toLowerCase() + t.slice(1);
}

/**
 * One summary for one category's articles.
 *
 * Called ONCE PER CATEGORY PER DAY by the digest builder — never once per user
 * — so this stays cheap when a real model is behind it.
 */
export async function generateDigestSummary(
  articles: FeedArticle[],
  userInterests: string[],
): Promise<string> {
  await delay(180);

  if (!articles.length) {
    return "Nothing worth reporting in this one today. That happens more often than the feeds would have you believe.";
  }

  const seed = articles[0].id + userInterests.join(",");
  const top = articles.slice(0, 3);

  const sentences = [
    pick(OPENERS, seed),
    `The one people are actually talking about is ${clause(top[0].title)}.`,
    top[1] ? `Alongside that, ${clause(top[1].title)} — ${top[1].source} has the detail if you want it.` : "",
    top[2] ? `There's also ${clause(top[2].title)}, which is smaller but worth a glance.` : "",
    pick(CLOSERS, seed + "c"),
  ];

  return sentences.filter(Boolean).join(" ");
}

/**
 * The bot's next line in onboarding.
 *
 * Returns an *acknowledgement only* — the screen fuses it with whatever it
 * wants to ask next so each bot turn lands as one utterance. Two bubbles per
 * turn (a canned "Noted." then a question) is what made the first version of
 * this feel like a form advancing rather than someone talking.
 *
 * Structured answers come back on `extracted`, so the caller never parses prose.
 */
export async function chatReply(
  conversationHistory: ChatTurn[],
  userMessage: string,
): Promise<ChatReply> {
  // When a backend is configured this is a real model call; the templates
  // below stay as the fallback for a server that is down or not deployed.
  const remote = await apiChatReply(conversationHistory, userMessage);
  if (remote?.message) return { message: remote.message };

  await delay(400);

  const clean = userMessage.trim().replace(/[.!?]+$/, "");
  const seed = clean + conversationHistory.length;
  // Null on the goal turn itself, where the goal *is* what they just said —
  // reflecting it back produced "…without it costing you [the same sentence]".
  const goal = goalFrom(conversationHistory, clean);

  if (clean.length < 4) {
    return { message: pick(["Go on.", "Say a bit more?", "Tell me more."], seed) };
  }

  // Reflecting their own words back is the cheapest thing that reads as
  // listening. A real model does this far better; the shape is the same.
  const reflections = goal
    ? [
        `${lead(clean)} — and it fits around ${trim(goal)} rather than eating into it.`,
        `Good. ${lead(clean)}, without it costing you ${trim(goal)}.`,
        `That works. I'll keep ${trim(clean)} to one read a day so ${trim(goal)} still gets the time.`,
      ]
    : [
        `${lead(clean)} — that's a good one to build a day around.`,
        `Right — ${trim(clean)}. That's worth protecting time for.`,
        `${lead(clean)}. Plenty of people never get to that because the day disappears first.`,
      ];

  return { message: pick(reflections, seed) };
}

/**
 * The goal, if it has been given yet.
 *
 * Tied to the order the onboarding screen asks its questions: name, then goal,
 * then interests. So the goal is the *second* user turn — reading the first
 * one produced "without it costing you sam", which is the name.
 *
 * Positional, and only sound because one screen owns the question order. A
 * real model reads the transcript and needs none of this.
 */
function goalFrom(history: ChatTurn[], current: string): string | null {
  const answers = history.filter((t) => t.role === "user");
  const goal = answers[1]?.text.trim();
  if (!goal || goal === current) return null;
  return goal;
}

/**
 * Capitalises the first letter and touches nothing else.
 *
 * Deliberately not `.toLowerCase()` first — that turned "AI stuff" into
 * "Ai stuff" and every proper noun into a common one.
 */
function lead(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Keeps a reflected phrase short enough to sit mid-sentence, casing intact. */
function trim(s: string, words = 7): string {
  const parts = s.split(/\s+/);
  return parts.length <= words ? s : `${parts.slice(0, words).join(" ")}…`;
}

/** Stands in for network latency so the UI is built against the real shape. */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
