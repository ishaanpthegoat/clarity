// Clarity server — HTTP surface.
//
// Eight routes, one scheduled job. The frontend's `src/lib/api.ts` speaks to
// exactly these; if VITE_API_URL is unset it never calls them and runs on its
// local templates instead, so the two halves ship independently.
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { chatReply, usingRealModel, type ChatTurn, type UserProfile } from "./ai.js";
import { buildDigest, runDailyJob, todayKey } from "./digest.js";
import { CATEGORIES } from "./feeds.js";
import { store, type SharedProject } from "./store.js";
import { startCron } from "./cron.js";

const app = new Hono();

// The frontend is served from a different origin (GitHub Pages, or :5173 in
// dev), so it is cross-origin by definition. Lock this to your real origins
// before this is public — `*` here is a development convenience.
app.use(
  "/api/*",
  cors({
    origin: process.env.ALLOWED_ORIGIN?.split(",") ?? "*",
    allowMethods: ["GET", "POST", "OPTIONS"],
  }),
);

app.get("/api/health", (c) =>
  c.json({
    ok: true,
    model: usingRealModel ? "claude-haiku-4-5-20251001" : "templates (no ANTHROPIC_API_KEY set)",
    categories: CATEGORIES,
    day: todayKey(),
  }),
);

// ── profiles: the server-side half of "not stored on the device" ────────────
//
// Keyed by an opaque id the client generates once. Worth being honest about
// what this does and does not buy you: it keeps a profile off the device and
// out of reach of *other* users, and it means a lost phone loses nothing. It
// cannot hide the profile from the person it belongs to — the app displays it,
// so their browser necessarily receives it. Anyone promising otherwise is
// describing something impossible.
app.get("/api/profile/:userId", async (c) => {
  const profile = await store.getProfile(c.req.param("userId"));
  return profile ? c.json(profile) : c.json({ error: "not found" }, 404);
});

app.post("/api/profile/:userId", async (c) => {
  const profile = (await c.req.json()) as UserProfile;
  if (!profile || !Array.isArray(profile.interests)) {
    return c.json({ error: "interests[] required" }, 400);
  }
  await store.saveProfile(c.req.param("userId"), profile);
  return c.json({ ok: true });
});

// ── digest ──────────────────────────────────────────────────────────────────

/** Today's summaries for whatever the caller follows. No model call. */
app.post("/api/digest", async (c) => {
  const profile = (await c.req.json()) as UserProfile;
  return c.json(await buildDigest(profile));
});

/** Everything generated for a day — handy for debugging the job. */
app.get("/api/digest/:day", async (c) => {
  const day = c.req.param("day");
  return c.json({ day, entries: Object.values(await store.getDigests(day)) });
});

// ── onboarding chat ─────────────────────────────────────────────────────────

app.post("/api/chat-reply", async (c) => {
  const body = (await c.req.json()) as { history?: ChatTurn[]; message?: string };
  if (!body.message) return c.json({ error: "message required" }, 400);
  return c.json({ message: await chatReply(body.history ?? [], body.message) });
});

// ── community: what other people are working on ─────────────────────────────
//
// ⚠️ SCAFFOLD. These two routes are complete enough to develop against and are
// NOT ready to be public. Before the app has real users, all of the following
// has to exist — see SPEC-SESSION10.md §3:
//
//   * moderation. `title` and `desc` are free text that other users read, and
//     nothing here inspects either.
//   * a rate limit on POST. It is unauthenticated and writes to disk.
//   * an owner check on the delete path, which does not exist yet at all — a
//     user cannot currently un-share a project.
//   * a real `author`. The client sends a display name it was given; nothing
//     verifies it, so two people can be the same name.
//
// Nothing in the frontend calls the POST route today. The GET is safe to serve
// because an empty list is the honest answer until someone shares something.

app.get("/api/community", async (c) => {
  const limit = Math.min(Number(c.req.query("limit")) || 50, 100);
  return c.json(await store.listShared(limit));
});

app.post("/api/community/:userId", async (c) => {
  const project = (await c.req.json()) as SharedProject;
  if (!project?.id || !project.title?.trim()) {
    return c.json({ error: "id and title required" }, 400);
  }
  await store.shareProject(c.req.param("userId"), project);
  return c.json({ ok: true });
});

// ── the job, on demand ──────────────────────────────────────────────────────
//
// Protected because it is the only route that costs money. Without JOB_TOKEN
// set it stays open, which is fine locally and wrong anywhere else.
app.post("/api/job/run", async (c) => {
  const token = process.env.JOB_TOKEN;
  if (token && c.req.header("authorization") !== `Bearer ${token}`) {
    return c.json({ error: "unauthorized" }, 401);
  }
  return c.json(await runDailyJob());
});

const port = Number(process.env.PORT) || 8787;

serve({ fetch: app.fetch, port }, () => {
  console.log(`[clarity] listening on http://localhost:${port}`);
  console.log(
    usingRealModel
      ? "[clarity] ANTHROPIC_API_KEY found — using claude-haiku-4-5-20251001"
      : "[clarity] no ANTHROPIC_API_KEY — using templates (everything still works)",
  );
  startCron();
});

export default app;
