<div align="center">
  <img src="public/clarity/icon.png" width="112" alt="Clarity" style="border-radius:24px" />
  <h1>Clarity</h1>
  <p><strong>Lock in. Get clear.</strong></p>
  <p>A focus &amp; app-locking app that puts your distractions behind a lock, so you can give one thing your full attention.</p>
</div>

---

## What it is

Clarity is a dark, violet-accented mobile app for reclaiming your attention. Set a single focus for the day, lock away the apps that pull at you, run focus sessions to earn time back, and close the day with a reflective check-in.

### Features

- **Splash + cinematic intro** — animated LED wordmark, WebGL aurora, and a multi-scene onboarding that explains the app (with generated ambient video).
- **Home** — a scroll-collapsing header, switchable progress rings (Clarity Score / Tasks / Productivity), today's task, quote of the day, weekly deep-work chart, and locked-app grid.
- **Focus sessions** — an animated timer ring with pause/resume and a confetti finish.
- **App locking + block screen** — open a locked app and Clarity gently redirects you to your focus.
- **Springboard** — a faux home screen showing your locked apps.
- **Projects** — pick 3 to protect each week, with trending ideas and a community feed.
- **To-do** — a simple daily task list.
- **AI Review** — snap your work and get a quick, honest read on where it stands.
- **Daily Read** — four articles a week: read one, then record a short video explaining your understanding.
- **Evening check-in** — mood, reflection, and what you made time for.
- **Clarity Pro** — a paywall + subscription state for the full toolkit.

## Tech

- **Vite** + **React 18** + **TypeScript**
- **Tailwind CSS** + **shadcn/ui** primitives
- **framer-motion** / **GSAP** / CSS + **canvas-confetti** for motion
- **Capacitor** for native iOS/Android packaging
- Self-contained Clarity state store (`src/lib/clarityStore.tsx`) with `localStorage` persistence

Brand imagery (icon, aurora, onboarding heroes, ambient video) was generated and lives in `public/clarity/`.

## Getting started

```bash
npm install
npm run dev      # start the dev server
npm run build    # production build
npm run test     # vitest
npm run lint     # eslint
```

Then open the local URL Vite prints.

## Project layout

```
src/
  components/clarity/     # the Clarity app: shell, screens, shared UI
    screens/             # Splash, Intro, Home, Focus, Block, SetTask,
                         # Settings, Projects, Todos, Review, Checkin,
                         # Springboard, Paywall, Articles
    ClarityApp.tsx       # device frame + view router + chrome
    ...
  lib/
    clarityStore.tsx     # central state machine (views, focus timer, pro, articles…)
    clarityData.ts       # seed data & article content
public/clarity/          # generated brand assets (icon, aurora, heroes, video)
```

---

<div align="center"><sub>Built with Claude Code.</sub></div>
