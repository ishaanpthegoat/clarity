# Spec — the seven changes Ishaan asked for

> **Written:** 2 September 2026
> **Branch:** `claude/push-vik-minlock-updates-sic6wu`
> **Read [`HANDOFF.md`](HANDOFF.md) first** if you have not seen this repo. It
> covers what the two codebases are, how to run them, and what not to touch.

This is a request list turned into a spec. Some of it is built on this branch
and needs verifying; some of it is scaffolded and needs finishing; one item is
not started. Each section says which, up front, so nothing gets rebuilt twice.

---

## 0. Read this before you plan anything

**Four of the seven were already built and are sitting unmerged.** `origin/main`
is nine commits behind this branch, and `main` is what GitHub Pages deploys.
So the deployed app does not have the conversational onboarding, the digest, the
sliders on Home, or the paywall fix — which is almost certainly why they were
asked for again.

```
a0d4dfa  (this branch)
...
5aaeafd  (origin/main)  ← what is actually deployed
```

**Do not merge to `main` to fix this.** `HANDOFF.md` §7 says main does not move
without Ishaan asking, and that still stands. Raise it with him; the fix is a
decision, not a commit.

---

## 1. Onboarding as a conversation — **built, verify it**

Onboarding has been a chat since `d1324c4`. What it was *not* doing is the part
of the request that mattered: it learned four things and then configured
nothing, so you answered every question and landed on stock defaults.

It now captures six and applies four of them.

| Answer | Field | What it changes |
|---|---|---|
| What you want out of the app | `profile.purpose` | Tone, and the description on seeded projects |
| What you're trying to get to | `profile.goals[]` | One project created per goal |
| What pulls you away | `profile.distractions` | Those apps get locked; nothing else does |
| How long you can focus | `profile.focusSpan` | Becomes `sessionMinutes` |
| What you follow | `profile.interests[]` | The digest, as before |
| Anything specific inside it | `profile.specifics` | Digest ranking, as before |

Parsing lives in [`src/lib/onboarding.ts`](src/lib/onboarding.ts) with unit
tests in `src/test/onboarding.test.ts`; the application step is
`finishOnboarding` in [`src/lib/clarityStore.tsx`](src/lib/clarityStore.tsx).

**What is left for you:**

- The bot's acknowledgements come from `chatReply`, so they are template text
  until a real key is behind them. §7 is the check that tells you which you are
  looking at.
- Nothing re-asks any of this later. If someone's focus span changes there is no
  prompt — only the Settings field. Probably fine; worth raising.
- `profile.avoid` ("less of") is still only settable in Settings. It was left
  out of the conversation deliberately — seven questions is already long — but
  if the digest starts feeling noisy, that is the question to add.

---

## 2. Settings — **built, verify it**

The complaint was that it was messy. It was: five section headings over about
eight actual settings, so the headings outnumbered the things they organised.

There are now exactly two sections, and the split is meaningful:

- **What Clarity knows** — everything the setup conversation learned, still
  editable. Content.
- **Settings** — everything the app *does*: locking, commit mode, the focus
  window, locked apps (folded behind an Edit row, since it is the longest and
  least-touched thing on the screen), appearance, export, reset. Machinery.

**What is left for you:** it is long. If it still reads badly on a small screen,
the next cut is the focus-window day picker, which is the only control here that
really wants its own sheet.

---

## 3. What other people are actually doing — **scaffolded, needs finishing**

This is the one with real work left, and the one to be careful with.

The projects tab already had a community feed, but it was six hardcoded people
in `clarityData.ts` with fixed cheer counts. It read as a mock because it was
one. The request was for what people are *actually* doing, and "actually" is the
whole feature: a wall of aspirational titles with no effort behind them is
exactly what this feed exists to be the opposite of.

**Built:**

- [`src/lib/community.ts`](src/lib/community.ts) — the `CommunityProject` type,
  which carries `sessionsThisWeek`, `minutesThisWeek` and `lastActiveAt`
  alongside the title. Effort is the payload.
- `fetchCommunity()`, with the same fallback contract as everything else in
  `api.ts`: real feed with a backend, local sample without one.
- The feed renders it. The line under each name is now "4 sessions, 3h this
  week · 2h ago" rather than a static subtitle.
- `GET /api/community` and `POST /api/community/:userId`, backed by
  `store.listShared` / `store.shareProject`.
- The header says **"sample feed — no one is sharing yet"** whenever the list is
  local. Do not remove that. Presenting six fictional people as the app's users
  is the single worst outcome available here.

**Not built, and blocking:**

1. **The opt-in.** Nothing calls `apiShareProject`. There is no toggle, because
   the questions below need answers first. Sharing must be per project and off
   by default.
2. **Display names.** The client sends an `author` string and the server
   believes it. There is no name-picking UI and no uniqueness. A project title
   is free text someone wrote about their own life; attaching a name to it and
   publishing it is a disclosure, so the name must be something they chose for
   this purpose and can change.
3. **Un-sharing.** There is no delete route. Someone who shares a project cannot
   currently take it back. Build this before the toggle, not after.
4. **Moderation.** `title` and `desc` are free text other users read. Nothing
   inspects either.
5. **Rate limiting.** `POST /api/community/:userId` is unauthenticated and
   writes to disk.
6. **`store.listShared` is a full scan** across every user on every request.
   Fine at this size, wrong at any real size.

Items 1–4 are not polish. Do not ship the toggle without them.

---

## 4. Session-length slider on the main page — **built, verify only**

It has been on Home since `d1324c4` (`src/components/clarity/screens/Home.tsx`,
the "session dials" card), along with the daily-goal slider, and both were
removed from Settings at the same time. The Settings row that remains is a
signpost pointing at Home.

Nothing to build. If it looks missing when you run it, you are on `main` — see
§0.

---

## 5. The paywall on open — **built, verify only**

Also fixed in `d1324c4`. `finishOnboarding` goes straight to `home`; the paywall
is reachable only from the card at the top of Settings. There is an e2e test
guarding it — "does not ask anyone to buy anything on the way in" in
`e2e/digest.spec.ts` — so if it comes back, that test fails.

Again: if you see a paywall on open, you are running `main`.

---

## 6. The daily digest — **built, needs a live backend to be real**

One digest a day, composed per person from categories they follow. The
architecture is already right and worth not undoing:

**One model call per category per day, shared across all users.** Personalising
happens *after* generation, by ordering and filtering — never by putting the
user's profile in the prompt. This is what keeps the cost flat as users are
added, and it is why the digest is not the route that needs a rate limiter.

- `server/src/digest.ts` — the daily job, on cron (`JOB_HOUR`, default 05:00).
- `src/lib/digest.ts` + `src/lib/personalize.ts` — assembly and ordering.
- `src/components/clarity/screens/Digest.tsx` — the screen.

**What is left for you:**

- It runs on template summaries until a key is set. Real prose over real
  headlines is the deliverable; see §7.
- Deploy `server/` somewhere real. On a host that sleeps idle instances, use the
  platform scheduler against `POST /api/job/run` with `JOB_TOKEN` and set
  `DISABLE_CRON=1`.
- Feed failures are currently invisible — a category that fetched nothing just
  produces a thinner digest. Worth surfacing.

---

## 7. The Anthropic API key

**Ishaan has a Claude API key for this and it is yours to use.**

It is not in this repo and must not end up in it. Ask him for it directly; it
should reach you over something that is not a git commit, a PR description, or a
message in an issue.

Where it goes — this is the only correct place:

```bash
cd server
cp .env.example .env
```

```
ANTHROPIC_API_KEY=sk-ant-...        # the key Ishaan gives you
ALLOWED_ORIGIN=http://localhost:5173
JOB_TOKEN=<any long random string>
PORT=8787
```

**Never** put it in `.env.local`, in anything prefixed `VITE_`, or in any file
the frontend imports. The frontend is a static bundle: a key inside one is
readable by anyone who opens devtools. That is a published secret, not a
configured one, and it is why `server/` exists at all.

Confirm which mode you are in before debugging anything downstream:

```bash
curl http://localhost:8787/api/health
```

- `"model": "claude-haiku-4-5-20251001"` → live.
- `"model": "templates (no ANTHROPIC_API_KEY set)"` → not live. Everything will
  still appear to work, which is exactly the trap.

Then point the frontend at it and restart — Vite bakes `VITE_*` in at build
time:

```bash
echo 'VITE_API_URL=http://localhost:8787' >> .env.local
npm run dev
```

**Before that key is on a public server**, `HANDOFF.md` §6 lists five gaps that
all become real the moment it is: `POST /api/chat-reply` has no rate limit, no
auth and no input cap, so anyone who finds the URL can drain the balance in a
loop. CORS does not help — it is a browser rule, not a server one. That route is
where a limiter belongs, and §3 above adds a second one.

---

## 8. Checks

Everything on this branch passes:

```bash
npm run typecheck     # clean
npm run test          # 84 passing
npm run lint          # 0 errors in src/ and server/
npm run build         # clean
npx playwright test   # 35 of 36 — see below
```

### One pre-existing failure, and it is a real bug

`e2e/digest.spec.ts › daily digest › Home reflects whether today's has been
read` fails, and it failed the same way at `a0d4dfa` — before any of this work.
It is not a broken test. Closing out the digest opens the "What's today about?"
sheet, which covers the tab bar while its own confirm button is disabled until
you type something, so there is a moment where the only way out is a swipe the
test cannot make. A modal with no dismissable state is worth fixing before it
reaches a user, not just before it reaches the suite.

**Run the e2e suite with no `VITE_API_URL`.** Several tests assert the console
is clean, and a `.env.local` pointing at a server that is not running fills it
with `ERR_CONNECTION_REFUSED` — the fallback path works, but the browser still
logs the failed request. Either start `server/` first or move `.env.local`
aside. This bites on a machine that has been set up for §7 and is not obvious
from the failure message.

`npm run lint` across the whole repo reports 118 errors. **All of them are in
`MindLock-Expo/`** and all predate this work — the root ESLint config sweeps up
the Expo app, which has its own conventions. Lint `src server/src` to see the
number that reflects this codebase.
