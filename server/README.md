# Clarity server

The half of Clarity that can't run in a browser: the RSS fetching, the Claude
calls, and profile storage that isn't on the user's device.

## Why it exists

Three things forced it, and each is worth knowing because each rules out the
"just do it in the frontend" shortcut:

| Problem | Why the browser can't |
|---|---|
| **RSS** | None of the feeds send CORS headers. A `fetch` from the page fails before it reads a byte. |
| **The API key** | Anything in a frontend bundle is public. An `ANTHROPIC_API_KEY` there is a published secret. |
| **Storage off-device** | GitHub Pages serves static files. There's nowhere to put a profile except `localStorage`. |

## Running it

```bash
cd server
npm install
npm run dev
```

That's it — **no API key needed**. Without `ANTHROPIC_API_KEY` the server uses
the same templates the frontend falls back to, so every route works and you can
exercise the whole system, real RSS included, for free.

Add a key when you want real summaries:

```bash
cp .env.example .env   # then fill in ANTHROPIC_API_KEY
```

Point the frontend at it from the repo root:

```bash
echo 'VITE_API_URL=http://localhost:8787' > .env.local
npm run dev
```

With `VITE_API_URL` unset the frontend ignores the server completely — that's
how the GitHub Pages build keeps working.

## Routes

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/health` | Which model is in use, known categories, today's date |
| `GET` | `/api/profile/:userId` | The profile for an opaque, client-generated id |
| `POST` | `/api/profile/:userId` | Save a profile |
| `POST` | `/api/digest` | A user's digest. No model call — reads what the job made |
| `GET` | `/api/digest/:day` | Everything generated for a day. Debugging |
| `POST` | `/api/chat-reply` | The onboarding bot's acknowledgement |
| `POST` | `/api/job/run` | Runs the daily job now. Guarded by `JOB_TOKEN` if set |

## The cost model

This is the part worth protecting when changing anything here.

`runDailyJob` calls Claude **once per category per day** — six calls, total,
whether you have ten users or ten thousand. `buildDigest` assembles a person's
digest from summaries that already exist and makes **zero** model calls.

Summarising per user instead would multiply the bill by your user count for
output almost identical between people who follow the same things. If you touch
`digest.ts`, keep that split.

The job is idempotent: categories already summarised today are skipped, so
re-running it is free and a crashed run can simply be re-run.

## Scheduling

`src/cron.ts` is a plain `setTimeout` loop, which assumes a process that stays
alive (a VM, a container, `npm start`). It runs the job at `JOB_HOUR` (default
05:00 local) and once at boot to cover a cold start mid-day.

On serverless, the process doesn't survive between requests. Disable the
internal timer with `DISABLE_CRON=1` and use the platform's scheduler against
`POST /api/job/run`:

```jsonc
// vercel.json
{ "crons": [{ "path": "/api/job/run", "schedule": "0 5 * * *" }] }
```

```toml
# wrangler.toml
[triggers]
crons = ["0 5 * * *"]
```

Or `npm run job` from any external scheduler — same work, no server.

## Storage

`src/store.ts` is a JSON file behind an interface. The interface is the point:
swapping in Postgres or SQLite is one implementation, not a refactor.

**Don't ship the JSON file to production.** Writes are last-write-wins with no
locking and the whole file sits in memory. It's fine for one process and a
handful of users, and nothing more.

## What "server-side storage" does and doesn't buy you

It keeps profiles off the device, out of reach of other users, and safe from a
lost phone. It protects the API key.

It **cannot** hide a profile from the person it belongs to. The app displays it,
so their browser receives it, so devtools shows it. That's true of every web
app ever written. If a requirement depends on hiding a user's own data from
them, the requirement is impossible and needs rewording — usually to "other
users can't see it", which this does deliver.

## Before this is public

- [ ] Set `ALLOWED_ORIGIN` — it defaults to `*`
- [ ] Set `JOB_TOKEN` — `/api/job/run` is the only route that costs money
- [ ] Replace the JSON store with a real database
- [ ] Add auth. Right now anyone who guesses a `userId` can read that profile
- [ ] Rate-limit `/api/chat-reply`
