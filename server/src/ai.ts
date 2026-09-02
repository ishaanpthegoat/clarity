// Clarity server — the Claude calls.
//
// This is the half of `src/lib/aiService.ts` that could never run in a browser,
// because it is the half that holds the API key. Same two functions, same
// shapes; the frontend reaches them over HTTP and cannot tell the difference.
//
// The key is optional on purpose. With ANTHROPIC_API_KEY unset the server still
// starts and still answers every route, using the same template logic the
// frontend falls back to — so you can run and test the whole system, RSS and
// all, before spending a cent. Set the key and the real model takes over with
// no other change.
import Anthropic from "@anthropic-ai/sdk";
import type { FeedArticle } from "./feeds.js";

/** Haiku 4.5: 200K context, 64K max output, cheapest model that writes well. */
const MODEL = "claude-haiku-4-5-20251001";

export interface UserProfile {
  name: string;
  interests: string[];
  specifics: Record<string, string>;
  goal: string;
  avoid: string;
  /** Why they installed it, in their words. Steers tone, not content. */
  purpose?: string;
  /** Everything they named, `goal` included as the first entry. */
  goals?: string[];
  /** What pulls them away, verbatim. */
  distractions?: string;
  /** Minutes they said they can hold focus for. 0 means never asked. */
  focusSpan?: number;
}

export interface ChatTurn {
  role: "bot" | "user";
  text: string;
}

const DIGEST_SYSTEM = `You write a daily news digest for someone trying to spend less time scrolling.
Write 3-5 sentences of plain, casual language. No jargon, no hype, no bullet
points, and no preamble like "Here's your digest". Say what actually happened
and why it might matter to them. If the stories are unrelated, that is fine —
do not invent a connective theme.`;

const CHAT_SYSTEM = `You are the onboarding voice of Clarity, an app that replaces endless feeds with
one short daily digest. You are warm, curious and brief. Reply with a single
acknowledgement of what the person just said — one or two sentences, no
questions, no lists. Where it fits, tie what they said back to the goal they
gave you earlier. Never sound like a form.`;

/**
 * One client, reused. Constructing per-request would throw away the connection
 * pool and, more importantly, re-read credentials on every call.
 *
 * `null` when no key is configured — every caller checks and falls back.
 */
const client: Anthropic | null = process.env.ANTHROPIC_API_KEY
  ? new Anthropic()
  : null;

export const usingRealModel = client !== null;

/** Pulls the text out of a response, guarding the refusal case first. */
function textOf(response: Anthropic.Message): string | null {
  // A refusal is a successful HTTP 200 with an empty or partial content array,
  // so indexing content[0] without this check is how you get a crash in prod.
  if (response.stop_reason === "refusal") return null;
  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
  return text || null;
}

/**
 * Summarise one category's articles.
 *
 * Called once per category per day by the daily job — never per user. That is
 * the whole reason the job and the per-user assembly are separate: this is the
 * only place that costs money, and it runs a fixed number of times a day no
 * matter how many people sign up.
 */
export async function generateDigestSummary(
  articles: FeedArticle[],
  userInterests: string[],
): Promise<string> {
  if (!articles.length) {
    return "Nothing worth reporting in this one today. That happens more often than the feeds would have you believe.";
  }

  if (!client) return templateSummary(articles);

  const list = articles
    .map((a) => `- ${a.title} (${a.source})${a.summary ? `: ${a.summary}` : ""}`)
    .join("\n");

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: DIGEST_SYSTEM,
      messages: [
        {
          role: "user",
          content: `Reader's interests: ${userInterests.join(", ") || "general"}.\n\nToday's stories:\n${list}`,
        },
      ],
    });
    return textOf(response) ?? templateSummary(articles);
  } catch (error) {
    // A digest that reads a little flatter beats a digest that 500s.
    console.error("[ai] digest summary failed, using template:", error);
    return templateSummary(articles);
  }
}

/** The bot's acknowledgement during onboarding. */
export async function chatReply(
  conversationHistory: ChatTurn[],
  userMessage: string,
): Promise<string> {
  if (!client) return templateReply(conversationHistory, userMessage);

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 256,
      system: CHAT_SYSTEM,
      messages: [
        ...conversationHistory.map((t) => ({
          role: (t.role === "bot" ? "assistant" : "user") as "assistant" | "user",
          content: t.text,
        })),
        { role: "user" as const, content: userMessage },
      ],
    });
    return textOf(response) ?? templateReply(conversationHistory, userMessage);
  } catch (error) {
    console.error("[ai] chat reply failed, using template:", error);
    return templateReply(conversationHistory, userMessage);
  }
}

// ── templates: the no-key path ──────────────────────────────────────────────
// Deliberately the same logic as src/lib/aiService.ts, so behaviour does not
// change when the frontend starts pointing at this server.

function pick<T>(list: T[], seed: string): T {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return list[Math.abs(h) % list.length];
}

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

function templateSummary(articles: FeedArticle[]): string {
  const seed = articles[0].id;
  const top = articles.slice(0, 3);
  return [
    pick(
      [
        "Here's what actually moved today.",
        "The short version of today:",
        "Three things worth knowing, then you're done.",
      ],
      seed,
    ),
    `The one people are actually talking about is ${clause(top[0].title)}.`,
    top[1] ? `Alongside that, ${clause(top[1].title)} — ${top[1].source} has the detail if you want it.` : "",
    top[2] ? `There's also ${clause(top[2].title)}, which is smaller but worth a glance.` : "",
    pick(
      [
        "That's the whole picture — nothing else needed your attention today.",
        "Nothing else today is worth the scroll.",
        "You're caught up. Go do the thing you actually planned.",
      ],
      seed + "c",
    ),
  ]
    .filter(Boolean)
    .join(" ");
}

function templateReply(history: ChatTurn[], message: string): string {
  const clean = message.trim().replace(/[.!?]+$/, "");

  // The goal is the *second* user turn — onboarding asks for the name first.
  // Reading the first produced "without it costing you sam". Mirrors the
  // client's `goalFrom`; both are positional only because one screen owns the
  // question order, and the real model path above needs neither.
  // Null on the goal turn itself, where the goal *is* the message — otherwise
  // the reflection reads "…without it costing you [the same sentence]".
  const prior = history.filter((t) => t.role === "user")[1]?.text.trim();
  const goal = prior && prior !== clean ? prior : null;

  // Capitalise the lead character only. Lowercasing first turned "AI stuff"
  // into "Ai stuff".
  const lead = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const trim = (s: string, n = 7) => {
    const p = s.split(/\s+/);
    return p.length <= n ? s : `${p.slice(0, n).join(" ")}…`;
  };

  if (clean.length < 4) return pick(["Go on.", "Say a bit more?"], clean);

  return goal
    ? pick(
        [
          `${lead(clean)} — and it fits around ${trim(goal)} rather than eating into it.`,
          `Good. ${lead(clean)}, without it costing you ${trim(goal)}.`,
        ],
        clean,
      )
    : pick(
        [
          `${lead(clean)} — that's a good one to build a day around.`,
          `Right — ${trim(clean)}. That's worth protecting time for.`,
        ],
        clean,
      );
}
