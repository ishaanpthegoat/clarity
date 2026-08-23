# Handoff — Clarity / MindLock

Written for whoever picks this up next (including another Claude session). It
assumes you have GitHub access to `ishaanpthegoat/clarity`, an Apple Developer
account with the TestFlight app already created, and whatever Expo setup is in
play. It does not assume you have seen this repo before.

---

## 1. Where the work is

**Repo:** `github.com/ishaanpthegoat/clarity`
**Branch:** `claude/push-vik-minlock-updates-sic6wu`

```
c07575a  Move the profile editor back into Settings
d01176c  Add the Knows tab, project sign-off, and score carryover
f48a06c  Update bundle ID to com.vikd.mindlock
1cef710  Add native iOS project for TestFlight builds
d1324c4  Replace the feed with a personalised daily digest   ← Ishaan's own work
5aaeafd  (origin/main)
```

`d1324c4` is Ishaan's — the conversational onboarding, the RSS digest, the
`server/`, the Settings rework, project due dates. **Do not rewrite it.** The
three commits on top of it fill gaps and carry the iOS project across.

`origin/main` is five commits behind and does not reflect the app. Everything
below refers to the branch.

---

## 2. This repo is a prototype, not the shipping app

**MindLock-Expo is the shipping repo.** This Vite/Capacitor app is a web
prototype. Anything built here has to be ported by hand — see
[`PORT-TO-EXPO.md`](PORT-TO-EXPO.md) for what is outstanding and how.

Consequences, so nobody loses a day to them:

- **Do not build or upload `ios/`.** It is a Capacitor scaffold for the
  prototype. `eas.json` at the root is a dead leftover; nothing reads it.
- The bundle id here is `com.ishaan.clarity`. It was briefly
  `com.vikd.mindlock`, which is the **live** App Store record (6761637023)
  carrying the Family Controls entitlement — a build under that id collides
  with the real app. Do not set it back.

Everything below is about running and developing the prototype. §5 (TestFlight)
applies only if you have deliberately decided to ship this repo, which as of
this writing nobody has.

## 3. Get it running (5 minutes, no key needed)

```bash
git clone https://github.com/ishaanpthegoat/clarity.git
cd clarity
git checkout claude/push-vik-minlock-updates-sic6wu
npm install
npm run dev
```

The app works with no backend and no API key — onboarding runs a scripted
conversation and the digest is composed from local templates. That is the
designed fallback, not a broken state. Verify before changing anything:

```bash
npm run typecheck     # clean
npm run test          # 65 passing
npm run lint          # 0 errors (6 pre-existing react-refresh warnings)
npm run build         # clean
```

---

## 4. Make the bot real, end to end

The model key lives in `server/` and never in the frontend bundle. This is the
whole reason that service exists — anything in `VITE_*` is readable by anyone
who opens devtools.

### 4a. Start the server

```bash
cd server
npm install
cp .env.example .env
```

Edit `server/.env`:

```
ANTHROPIC_API_KEY=sk-ant-...        # the real key
ALLOWED_ORIGIN=http://localhost:5173
JOB_TOKEN=<any long random string>  # protects POST /api/job/run
PORT=8787
```

```bash
npm run dev
curl http://localhost:8787/api/health
```

Health is the check that matters. It reports which mode you are in:

- `"model": "claude-haiku-4-5-20251001"` → the key is live.
- `"model": "templates (no ANTHROPIC_API_KEY set)"` → it is not. Fix the key
  before going further; everything downstream will look like it works.

### 4b. Point the frontend at it

From the repo root:

```bash
echo 'VITE_API_URL=http://localhost:8787' >> .env.local
npm run dev
```

`.env.local` is gitignored. Vite bakes `VITE_*` in at **build** time, so any
change here needs a restart in dev and a fresh `npm run build` for a real build.

### 4c. Prove it end to end

1. Open the app, clear storage (`localStorage.clear()`), reload.
2. Onboarding: answer in a way a template could not have anticipated — a
   sentence with an unusual detail in it. A real model reflects that detail
   back. A template gives you a generic acknowledgement. That is the tell.
3. Finish onboarding, land on Home.
4. Force the daily job rather than waiting for cron:
   ```bash
   curl -X POST http://localhost:8787/api/job/run \
     -H "Authorization: Bearer $JOB_TOKEN"
   ```
5. Open the Digest tab. Summaries should be written prose over real headlines
   from real feeds, not the template phrasing.
6. Close the digest out — it asks what the day is about, offering your weekly
   projects as one tap each.

### 4d. Deploy the server

TestFlight builds cannot reach `localhost`. Deploy `server/` anywhere that runs
Node (Railway, Render, Fly), set the same env vars there, and put the public URL
in `VITE_API_URL` **before** the build you upload.

The daily job runs on cron inside the server (`JOB_HOUR`, default 05:00). On a
platform that sleeps idle instances, use that platform's scheduler to hit
`POST /api/job/run` with the `JOB_TOKEN` instead, and set `DISABLE_CRON=1`.

---

## 5. TestFlight (Capacitor path)

Needs macOS with Xcode. Nothing here can be done from Linux or CI without a Mac
runner.

```bash
npm run build          # .env.local must already point at the deployed server
npx cap sync ios
open ios/App/App.xcworkspace     # the workspace, not the .xcodeproj — it uses SPM
```

In Xcode:

1. **Signing & Capabilities** → select the team that owns the App Store Connect
   record.
2. Confirm the bundle id matches App Store Connect.
3. Bump **Build** (`CURRENT_PROJECT_VERSION`) — Apple rejects a duplicate build
   number, and this repo still says `1`.
4. Destination: **Any iOS Device (arm64)**, not a simulator.
5. **Product → Archive** → **Distribute App** → **App Store Connect** → Upload.
6. Processing takes 10–30 min, then the build appears under TestFlight.

App icon is at `ios/App/App/Assets.xcassets/AppIcon.appiconset/` — 1024×1024, no
alpha. Worth a glance before archiving.

---

## 6. Known gaps — real, and worth fixing before this is public

These are accurate as of `c07575a`. None of them matter for local testing; all
of them matter the day the server is public with a live key.

1. **No rate limiting anywhere.** `POST /api/chat-reply` is open and costs money
   per call. Someone who finds the URL can drain the Anthropic balance in a
   loop. CORS does not prevent this — it is a browser rule, not a server one.
2. **No auth on the chat route**, and no cap on input length, so a single
   enormous message is billed as one call.
3. **`ALLOWED_ORIGIN` defaults to `*`.** Set it to the real origins.
4. **No scope guard.** The system prompt shapes tone but never tells the model
   to decline off-topic input, and nothing checks server-side. Ask it to write
   code and it will probably oblige, in a friendly onboarding voice.
5. `POST /api/job/run` is open unless `JOB_TOKEN` is set. Set it.

The digest itself is safe by design — one model call per category per day,
shared across all users — so chat is the only route whose cost scales with
traffic. That is where a limiter belongs.

---

## 7. Things not to do

- **Do not force-push over `d1324c4`** or rebase it away. It is Ishaan's work and
  it is the foundation everything else sits on.
- **Do not merge to `main` without asking.** `main` is five commits behind and
  nobody has said it should move.
- **Do not put `ANTHROPIC_API_KEY` in `.env.local`, `VITE_*`, or anything the
  frontend imports.** It belongs in `server/.env` only.
- **Do not commit `.env` or `.env.local`.** Both are gitignored; keep it that way.
- If TestFlight turns out to build from `MindLock-Expo` rather than this repo,
  stop and say so rather than porting things on assumption.

---

## 8. If you change code

```bash
npm run typecheck && npm run test && npm run lint && npm run build
```

Then commit to the same branch and push:

```bash
git push -u origin claude/push-vik-minlock-updates-sic6wu
```

Do not open a PR unless Ishaan asks for one.
