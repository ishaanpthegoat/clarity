# Porting the remaining Clarity work into MindLock-Expo

Written after the first pass, where the profile editor, the goal card on the
block screen, `goalPhrase()` and the "why" onboarding question landed. This
covers everything from the Vite branch that did **not** cross over and that
Ishaan wants in the app.

Context accepted up front, so nobody re-litigates it:

- **MindLock-Expo is the shipping repo.** The Vite app is a prototype. Nothing
  here is copy-paste; every item below is a spec plus reference implementation.
- **The digest is settled.** The Vite digest (RSS + shared per-category
  summaries) is not being ported. The Supabase/Pinecone/Gemini backend with
  1,218 curated items is the better system, and the retrieval experiment — state
  queries scoring 0.867, topic queries returning filler — is a good reason to
  personalise on the user's moment rather than their interests. Skip it.
- **The bundle-ID collision is fixed.** `com.vikd.mindlock` was wrong in commits
  `f48a06c` and `1cef710`; that is the live App Store record (6761637023) with
  the Family Controls entitlement. It is now `com.ishaan.clarity` on the Vite
  branch. The native `ios/` project there is a Capacitor scaffold for the web
  prototype and should not be built or uploaded — treat it as dead weight.

Reference branch: `ishaanpthegoat/clarity` @ `claude/push-vik-minlock-updates-sic6wu`.

Ordered by value-per-hour. Items 1–4 are pure state and ship over the air.
Item 5 is the only one that touches anything native.

---

## 1. Clarity score carries over from yesterday (5–25)

**Why.** Opening the app at 8am to a score of 0 reads as a verdict on a day that
has not happened yet. A floor makes the number feel continuous instead of
resetting to failure every midnight.

**Rule.** Yesterday's *earned* score maps linearly onto a 5–25 floor for today.
A day at goal starts you at 25; a day with nothing logged still starts at 5.
Today's own activity overtakes the floor as soon as it exceeds it.

**The one subtlety that matters.** The carryover reads yesterday's **earned**
figure, never its **displayed** one. If you feed the displayed score back in,
the floor compounds: a week of doing nothing drifts upward on its own inertia
and the number becomes a lie. This is the whole reason `earnedScore` is a
separate function from `clarityScore` rather than a parameter on it.

Reference: `src/lib/clarityStats.ts`.

```ts
export const CARRYOVER_MIN = 5;
export const CARRYOVER_MAX = 25;

export function carryoverFrom(yesterday: DayLog | undefined, goalMinutes: number): number {
  if (!yesterday) return CARRYOVER_MIN;
  const earned = earnedScore(yesterday, goalMinutes);
  return Math.round(CARRYOVER_MIN + (earned / 100) * (CARRYOVER_MAX - CARRYOVER_MIN));
}

// Today's score on its own merits, before any carried floor is applied.
function earnedScore(day: DayLog, goalMinutes: number): number { /* the existing weighting */ }

export function clarityScore(day: DayLog, goalMinutes: number, carryover = 0): ClarityScore {
  const earned = earnedScore(day, goalMinutes);
  // The floor lifts a quiet morning off zero; it never caps a good day.
  const score = Math.max(0, Math.min(100, Math.max(earned, carryover)));
  return { score, focusPct, taskPct, holdPct, carryover, earned };
}
```

`ClarityScore` gained `carryover` and `earned` so a UI can show "18, of which
you earned 3 today" rather than a single opaque number. Optional, but the data
is there.

The third parameter defaults to `0`, so every existing call site keeps working
unchanged — this can land without touching callers, then be wired where wanted.

**Tests:** 9 cases in `src/test/clarityStats.test.ts` under `describe("carryoverFrom")`.
The one worth copying first is *"reads yesterday's earned figure, so a carried
floor cannot compound"* — it is the regression that makes the rest safe.

---

## 2. Project sign-off

**Why.** A checkbox is too cheap for finishing something. Typing your own name
costs three seconds more and means something; that gap is the entire feature.

**Data.** Three optional fields on a project:

```ts
dueDate?: string;    // "YYYY-MM-DD", local
signature?: string;  // what they typed. Its presence means signed.
signedOn?: string;   // may be earlier than dueDate — finishing early is normal
```

**Triggers.** Two entry points, one flow:

1. Marking a project **done** opens the sheet immediately (finishing early).
2. A project whose `dueDate` has arrived and is unsigned surfaces a card on Home.

```ts
// setProjectStatus — finishing early is the same moment as finishing on time
const needsSigning = status === "done" && target && !target.signature;
return { projects: /* … */, signingProjectId: needsSigning ? id : s.signingProjectId };

// derived: everything still waiting for a name on it
awaitingSignature: state.projects.filter(
  (p) => !p.signature && (p.status === "done" || (!!p.dueDate && p.dueDate <= dateKey())),
),

// signing closes the project out in one move
signProject: (id, signature) => update((s) => {
  const clean = signature.trim();
  if (!clean) return {};
  return {
    projects: s.projects.map((p) =>
      p.id === id
        ? { ...p, signature: clean, signedOn: dateKey(), status: "done", progress: 100 }
        : p),
    signingProjectId: null,
  };
}),
```

**UI.** `src/components/clarity/SignoffSheet.tsx`. Copy reacts to timing —
early / on the day / late are three different sentences, because "this was due
Tuesday, late is still finished" lands differently from "finished ahead of the
deadline". The signature input uses the epigraph italic at 28px over a bottom
rule, so it reads as a signature rather than a text field. Prefilled from the
profile name but freely editable — a signature is theirs to give, not ours to
lock.

**On the date picker.** A hand-built wheel rather than a native module is the
right call for OTA — agreed. Worth knowing: **the deadline is optional and the
signature is not gated on it.** A project can be marked done and signed with no
`dueDate` at all. So sign-off can ship first, entirely OTA, and the date wheel
can follow whenever it is convenient. They are separable.

**The bug this points at.** In the Vite store, `normalizeProjects` rebuilt each
saved project field-by-field and silently dropped anything it did not name — so
`signature` and `signedOn` vanished on every reload until the fields were added
explicitly. Same shape of bug would have eaten `dueDate`. If MindLock-Expo has
an equivalent normaliser, check it before shipping these fields, not after.

---

## 3. Starting a session locks the apps

**Why.** Sitting down to focus with your distractions still reachable is the
exact failure the app exists to prevent. Asking someone to remember two
switches instead of one was the bug.

```ts
startFocus: (opts) => setState((s) => {
  if (!s.locking) note("Apps locked", "Locking switched on for this session.");
  return { ...s, view: "focus", locking: true, /* … */ };
}),
```

**This one is different in your app and you should not port it blindly.** In the
Vite prototype "locking" is a boolean in local state. In MindLock it is Screen
Time / Family Controls, where flipping a shield has real consequences and real
permission requirements. The *principle* — starting a session should not leave
distractions reachable — is what should carry over. Whether that means
activating the shield outright, or prompting once with a remembered preference,
is a call for whoever owns the Family Controls code. Say so if it needs to be a
prompt; do not silently shield someone's phone because a web prototype did.

The toast matters either way: never change a lock state without saying so.

---

## 4. Today's focus expires

Already found and fixed on your side — noting it so it is not lost. `dayFocus`
is stored with the day it belongs to and read back only if that day is today:

```ts
dayFocus: saved.dayFocusDay === today ? (saved.dayFocus ?? "") : "",
```

Same principle applies anywhere else a commitment is stored without a date
stamp. Worth a grep.

---

## 5. Swipe past the bottom of a page to sync

**Why.** Pull-to-refresh, upside down. The gesture sits at the *end* of a page
because the top of every screen already owns the downward drag for the
collapsing header — hanging a second meaning on it makes both worse.

Reference: `src/lib/useSwipeUpSync.ts` + `src/components/clarity/SyncHint.tsx`.

Two guards that make it feel deliberate rather than twitchy:

- It only arms when the scroll container is already at its bottom (2px slop).
- It needs 72px of continued pull past that, so a hard flick landing at the end
  is not mistaken for a request.

The indicator only becomes visible once the gesture is actually travelling, so a
page you never overscroll never shows an instruction you did not ask for.

**In React Native this is a rewrite, not a port.** The web version listens on
`touchstart`/`touchmove`/`wheel` against a DOM scroll container. In RN you would
build it from `ScrollView`'s `onScroll` + `onScrollEndDrag`, or reach for
Reanimated. The thresholds and the two guards are the part worth keeping; the
event plumbing is not.

Lowest value of the five. Ship it last, or not at all if the app already has a
refresh affordance.

---

## 6. Product decisions worth carrying, independent of code

Two things were **removed** in the Vite branch on Ishaan's instruction. They are
judgement calls, not features, and they port as decisions:

- **The project grader** — photograph what you built, get scored against a
  rubric. Cut entirely. "Just set a project and do it."
- **The evening check-in** — cut, including the Home card it had been demoted
  to. It asked for daily work the app did not need.

Also from the last pass, already shipped on your side: dropping a followed
category now forgets the specifics given for it, so re-adding it asks again
rather than silently reusing a stale answer.

---

## Suggested order

1. **Score carryover** — pure function, 9 tests come with it, no UI required to
   land it.
2. **Sign-off without the date wheel** — ships OTA, works on "mark done" alone.
3. **The date wheel** — unlocks the "due today" Home card.
4. **Session/lock behaviour** — needs a decision from whoever owns Family
   Controls before any code.
5. **Swipe-to-sync** — only if it earns its place.

---

## What to ignore in the Vite repo

- `ios/` — Capacitor scaffold for the prototype. Do not build or upload it.
- `eas.json` at the root — a dead leftover; nothing reads it.
- `supabase/functions/` — superseded by your backend.
- `src/lib/digest.ts`, `feeds.ts`, `aiService.ts`, `screens/Digest.tsx` — the
  digest system that is deliberately not being ported.
