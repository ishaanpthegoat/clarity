<div align="center">
  <img src="public/clarity/icon.png" width="112" alt="Clarity" style="border-radius:24px" />
  <h1>Clarity</h1>
  <p><strong>Get back your clarity.</strong></p>
  <p>A focus &amp; app-locking app that puts your distractions behind a lock, so you can give one thing your full attention.</p>
</div>

---

## What it is

Clarity is a mobile app for reclaiming your attention. It opens with a short conversation rather than a form, gives you one personalised digest a day in place of the endless scroll, then asks what the day is actually about — and locks away everything that would stop you getting there.

Every number the app shows you comes out of your own logged history. There are no placeholder stats.

### The design

Arrakis at night. Spice orange and second-sun yellow on a warm near-black, with sand-toned surfaces cut from one stone colour.

- **Barlow** (self-hosted, `public/fonts/`) carries the whole UI
- **Barlow Condensed** carries display: monumental, tracked-out uppercase
- **Cormorant Garamond** italic is reserved for epigraphs — quotes and the block screen, nowhere else

The repeated form is the **spice ring**: the distance you've covered is a solid gradient arc, the distance still ahead is a dotted sand track. An unfinished ring reads as ground left to cross, not a gauge that's low.

### Features

- **Focus sessions** — spice-ring timer and a session note captured on finish. Starting one locks the apps whether or not the toggle was set
- **Commit Mode** — opt in and the pause and exit are gone; quitting costs a confirmation and is logged honestly as unfinished
- **App locking + block screen** — a different line each time, and a running count of pulls held
- **Focus windows** — recurring hours where locking turns itself on
- **Clarity score** — opens each day on a 5–25 floor carried from yesterday, never a flat zero
- **Insights** — real deep-work totals, week-over-week delta, hold rate, and the full session log
- **Milestones** — earned from the log, never granted for opening the app
- **Command palette** — `⌘K` reaches every screen and action
- **Date navigation** — step back through any logged day
- **Springboard** — a faux home screen showing your locked apps
- **Projects** — pick 3 to protect each week
- **To-do** — checking items moves the Tasks ring
- **The daily digest** — one summary per thing you follow, built from real RSS, personalised by what you said you wanted
- **What Clarity knows** — in Settings: your name, goal, follows, specifics and avoid-list, all editable, all forgettable
- **Today's focus** — named right after the digest, when you have just spent two minutes on everyone else's priorities
- **Light and dark** — Arrakis at night, or midday glare

### Added in the second pass

- **Scrollytelling first run** — five cinematic acts on one pinned stage, cross-faded by scroll position rather than paged through
- **Real brand marks** — every lockable app carries its authentic icon, so the block screen shows exactly what you reached for
- **App catalogue** — add or drop which apps Clarity watches, from nine real ones
- **Session length up to 7 hours** — a slider with detents and haptics, replacing four preset chips that capped out at 90 minutes
- **Daily goal in ten-minute steps** — 10 minutes to 12 hours
- **Sectioned Projects tab** — *This week* and *All*, with the public ideas feed deliberately kept on the main page
- **Project sign-off** — a due date per project, closed out by typing your own name
- **Project workspace** — status, progress, working notes, deadline and linked to-dos, in a drag-dismissible sheet
- **Public ideas** — procedural avatars, cheers, and adopting someone else's idea straight into your own projects
- **Swipe past the bottom to sync** — pull-to-refresh upside down, since the top of every screen already owns the downward drag
- **Streak freeze** — one grace day per rolling week, offered only when the streak is actually at risk
- **Skeletons** — a warm sweep in reading order wherever there is genuinely something to wait for
- **Optimistic writes** — cheers and notes commit on the tap and roll back visibly if the write fails
- **A word on every control** — no naked icons; every button carries a label and a tooltip
- **One motion system** — `src/lib/motion.ts` holds every curve, duration and spring, following Emil Kowalski's rules

### Keyboard

| Key | Action |
|-----|--------|
| `⌘K` / `Ctrl+K` | Command palette |
| `H` | Home |
| `F` | Start a focus session |
| `L` | Toggle locking |
| `I` | Insights |
| `R` | Digest |
| `P` | Projects |
| `,` | Settings |
| `Esc` | Back to home |

## Tech

- **Vite** + **React 18** + **TypeScript**
- **Tailwind CSS**, with the palette and type roles as CSS variables in `src/index.css`
- **Motion** (Framer Motion 12) for springs, shared-layout transitions and the scroll-driven intro
- A **Hono** service in `server/` holds the model key, fetches RSS the browser cannot, and stores profiles off-device
- **Capacitor** for native iOS/Android packaging
- Self-contained state store (`src/lib/clarityStore.tsx`) with `localStorage` persistence
- Pure derivations live in `src/lib/clarityStats.ts` and are unit-tested

### The bot, and what runs without it

`server/` holds the Anthropic key and does two jobs: it runs the onboarding
conversation, and once a day it writes one summary per category — shared by
everyone who follows it, which is what keeps the model spend flat as users are
added. Personalisation happens after generation, on the shared result, where it
costs nothing.

Both halves ship independently. With `VITE_API_URL` unset the frontend never
calls the server and runs on local templates instead, so the static build works
with no backend at all. With the server up but no `ANTHROPIC_API_KEY`, it serves
the same templates — so you can run the whole system before spending anything.

```bash
cd server && npm install
cp .env.example .env      # add ANTHROPIC_API_KEY, set ALLOWED_ORIGIN
npm run dev
```

Then point the frontend at it:

```bash
echo 'VITE_API_URL=http://localhost:8787' >> .env.local
```

See `server/README.md` for the routes and the scheduled job.

## Getting started

```bash
npm install
```

```bash
npm run dev
```

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start the dev server on :5173 |
| `npm run build` | Production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run test` | Vitest unit tests |
| `npx playwright test` | Screenshot walkthrough + touch-target audit |

## Project layout

```
src/
  components/clarity/     # the app: shell, screens, shared UI
    screens/              # Splash, Onboarding, Home, Focus, Block, Settings,
                          # Projects, Todos, Digest, Springboard, Paywall,
                          # Insights, Milestones
    SignoffSheet.tsx      # typing your name to close a project out
    FocusPrompt.tsx       # "what's today about?", after the digest
    SpiceRing.tsx         # the app's one repeated form
    CommandPalette.tsx    # ⌘K
    ClarityApp.tsx        # device frame + view router + shortcuts
  lib/
    clarityStore.tsx      # state machine, persistence, derived values
    clarityStats.ts       # pure derivations — streaks, scores, aggregates
    digest.ts             # the two-stage digest: daily job, per-user assembly
    personalize.ts        # turning a profile into the words on screen
    feeds.ts              # the category catalogue and RSS parsing
    useSwipeUpSync.ts     # swipe past the end to sync
    clarityData.ts        # seed data
server/                   # Hono service: the model key, RSS, profile storage
e2e/                      # Playwright walkthrough + a11y audit
public/fonts/             # Barlow (OFL, see Barlow-OFL.txt)
public/clarity/           # brand assets (icon, aurora, onboarding heroes)
```

## Notes

`supabase/` holds a Deno edge function from an earlier version of this app. Nothing in the current frontend calls it — it is kept only because it may still be deployed. Safe to delete once you've confirmed otherwise.

The onboarding chat and the digest have **no rate limiting and no auth** on the server yet, and `ALLOWED_ORIGIN` defaults to `*`. Set that before anything is public, and put a limiter in front of `/api/chat-reply` — it is the one route that costs money per call.

---

<div align="center"><sub>Built with Claude Code.</sub></div>
