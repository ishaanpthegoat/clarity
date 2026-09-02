// Clarity — central state machine.
// Everything the app displays about your behaviour is derived from `days` and
// `sessions`; no screen invents a number of its own.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  APP_CATALOG,
  SEED_APPS,
  SEED_PROJECTS,
  SEED_TODOS,
  type AppIcon,
  type Project,
  type ProjectStatus,
  type Todo,
} from "./clarityData";
import {
  addDays,
  carryoverFrom,
  clarityScore,
  computeStreak,
  dateKey,
  emptyDay,
  getDay,
  type ClarityScore,
  type DayLog,
  type DayMap,
  type Session,
} from "./clarityStats";
import { cheer, note, haptic } from "./feedback";
import type { UserProfile } from "./aiService";
import { buildUserDigest, todayKey, type DailyDigest } from "./digest";
import { apiSaveProfile, hasBackend } from "./api";
import { orderedInterests } from "./personalize";
import { fetchCommunity, localCommunity, type CommunityProject } from "./community";
import { GOAL_BOUNDS, SESSION_BOUNDS } from "./sessionBounds";
import { matchApps } from "./onboarding";

export type ClarityView =
  | "splash"
  | "onboarding"
  | "home"
  | "focus"
  | "blocked"
  | "settings"
  | "projects"
  | "todos"
  | "spring"
  | "paywall"
  | "digest"
  | "insights"
  | "milestones";

export type ThemeMode = "dark" | "light";

export interface LockSchedule {
  enabled: boolean;
  /** "09:00" */
  start: string;
  /** "12:00" */
  end: string;
  /** 0 = Sunday */
  days: number[];
}

/**
 * Bounds for the two duration sliders, shared by Home and the store clamp.
 * Defined in `sessionBounds.ts` and re-exported here so the many existing
 * imports from this module keep working.
 */
export { SESSION_BOUNDS, GOAL_BOUNDS } from "./sessionBounds";

/** One freeze per rolling 7 days. Enough to survive a bad week, not to coast. */
export const FREEZE_WINDOW_DAYS = 7;

export interface ClarityState {
  view: ClarityView;
  blockedReturn: ClarityView;
  ringIndex: number;
  quoteIndex: number;
  locking: boolean;
  blockedApp: AppIcon | null;

  // ── focus session ──
  focusTotal: number;
  focusLeft: number;
  running: boolean;
  focusDone: boolean;
  earnBack: boolean;
  /** Commit Mode: no pause, no early exit without friction */
  strict: boolean;
  sessionStartedAt: number | null;
  sessionNote: string;

  apps: AppIcon[];
  projects: Project[];
  selProj: string[];
  todos: Todo[];
  todoDraft: string;
  /** Everything onboarding learned. `name` lives here now, not on its own. */
  profile: UserProfile;

  // ── projects workspace ──
  /** The project whose detail sheet is open. */
  openProjectId: string | null;
  /** Community ideas already cheered / taken on. */
  cheered: string[];
  adopted: string[];
  /** False until the ideas feed has "arrived" — drives its skeleton. */
  ideasLoaded: boolean;
  /**
   * What other people are working on. Fetched on first visit to the projects
   * tab, from the backend when there is one and from the local sample feed
   * otherwise — `community.ts` decides which, and nothing here can tell.
   */
  community: CommunityProject[];
  /** True when the list above is the local sample rather than real people. */
  communityIsSample: boolean;
  /** The project whose sign-off sheet is open, if any. */
  signingProjectId: string | null;

  // ── preferences ──
  /** minutes a new session runs for */
  sessionMinutes: number;
  /** daily deep-work target, in minutes */
  goalMinutes: number;
  theme: ThemeMode;
  schedule: LockSchedule;
  strictDefault: boolean;

  onboarded: boolean;
  isPro: boolean;

  // ── history ──
  days: DayMap;
  sessions: Session[];
  /** the day the Home screen is currently showing */
  viewDate: string;
  /** day-keys the user spent a streak freeze on */
  freezeDays: string[];

  // ── daily digest ──
  digest: DailyDigest | null;
  digestLoading: boolean;
  /** Day-keys whose digest has been marked read. */
  digestRead: string[];
  /** What the user said today is about, asked for right after the digest. */
  dayFocus: string;
  /** The day `dayFocus` belongs to — it expires rather than carrying over. */
  dayFocusDay: string;
  /** True while the "what's today about?" sheet is up. */
  focusPromptOpen: boolean;

  // ── transient UI ──
  paletteOpen: boolean;
}

const STORAGE_KEY = "clarity.state.v4";
const LEGACY_KEY = "clarity.state.v3";

type Persisted = Pick<
  ClarityState,
  | "locking" | "apps" | "projects" | "selProj" | "todos" | "profile"
  | "sessionMinutes" | "goalMinutes" | "theme" | "schedule" | "strictDefault"
  | "onboarded" | "isPro" | "digestRead" | "dayFocus" | "dayFocusDay" | "days" | "sessions"
  | "cheered" | "adopted" | "freezeDays"
>;

const EMPTY_PROFILE: UserProfile = {
  name: "",
  interests: [],
  specifics: {},
  goal: "",
  avoid: "",
  purpose: "",
  goals: [],
  distractions: "",
  focusSpan: 0,
};

const DEFAULT_SCHEDULE: LockSchedule = {
  enabled: false,
  start: "09:00",
  end: "12:00",
  days: [1, 2, 3, 4, 5],
};

/**
 * Saved apps carry only an id and a lock flag forward. Everything visual — the
 * mark, the tile, how it is padded — is re-read from the catalogue, so a brand
 * refresh ships without rewriting anyone's stored state.
 */
function normalizeApps(saved: unknown): AppIcon[] {
  if (!Array.isArray(saved)) return SEED_APPS;
  const apps = saved
    .map((a) => {
      const id = (a as { id?: string })?.id;
      const entry = APP_CATALOG.find((c) => c.id === id);
      if (!entry) return null;
      return { ...entry, locked: (a as { locked?: boolean })?.locked ?? true };
    })
    .filter((a): a is AppIcon => a !== null);
  return apps.length ? apps : SEED_APPS;
}

/** Fills in fields added after a user's state was written. */
function normalizeProjects(saved: unknown): Project[] {
  if (!Array.isArray(saved)) return SEED_PROJECTS;
  const projects = saved.map((p) => {
    const raw = p as Partial<Project> & { id?: string; title?: string };
    return {
      id: raw.id ?? `p${Math.random().toString(36).slice(2, 8)}`,
      title: raw.title ?? "Untitled",
      desc: raw.desc ?? "",
      status: raw.status ?? "idea",
      progress: typeof raw.progress === "number" ? raw.progress : 0,
      notes: raw.notes ?? "",
      adoptedFrom: raw.adoptedFrom,
      dueDate: raw.dueDate,
      signature: raw.signature,
      signedOn: raw.signedOn,
    } satisfies Project;
  });
  return projects.length ? projects : SEED_PROJECTS;
}

function loadPersisted(): Partial<Persisted> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Partial<Persisted>;
    // First run after the shape change — carry the history over, since that is
    // the only part a user cannot recreate by clicking around.
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const old = JSON.parse(legacy) as Partial<Persisted>;
      return { ...old, apps: undefined, projects: undefined } as Partial<Persisted>;
    }
    return {};
  } catch {
    return {};
  }
}

function makeInitial(): ClarityState {
  const saved = loadPersisted();
  const todos = saved.todos ?? SEED_TODOS;
  const today = dateKey();
  const days: DayMap = saved.days ?? {};

  // Keep today's todo tallies honest even across a reload.
  const todayLog: DayLog = {
    ...(days[today] ?? emptyDay(today)),
    todosDone: todos.filter((t) => t.done).length,
    todosTotal: todos.length,
  };

  return {
    view: "splash",
    blockedReturn: "home",
    ringIndex: 0,
    quoteIndex: 0,
    locking: saved.locking ?? true,
    blockedApp: null,

    focusTotal: (saved.sessionMinutes ?? 25) * 60,
    focusLeft: (saved.sessionMinutes ?? 25) * 60,
    running: false,
    focusDone: false,
    earnBack: false,
    strict: false,
    sessionStartedAt: null,
    sessionNote: "",

    apps: normalizeApps(saved.apps),
    projects: normalizeProjects(saved.projects),
    selProj: saved.selProj ?? [],
    todos,
    todoDraft: "",
    profile: { ...EMPTY_PROFILE, ...(saved.profile ?? {}) },

    openProjectId: null,
    cheered: saved.cheered ?? [],
    adopted: saved.adopted ?? [],
    ideasLoaded: false,
    community: [],
    communityIsSample: true,
    signingProjectId: null,

    sessionMinutes: saved.sessionMinutes ?? 25,
    goalMinutes: saved.goalMinutes ?? 180,
    theme: saved.theme ?? "dark",
    schedule: { ...DEFAULT_SCHEDULE, ...(saved.schedule ?? {}) },
    strictDefault: saved.strictDefault ?? false,

    onboarded: saved.onboarded ?? false,
    isPro: saved.isPro ?? false,

    days: { ...days, [today]: todayLog },
    sessions: saved.sessions ?? [],
    viewDate: today,
    freezeDays: saved.freezeDays ?? [],

    digest: null,
    digestLoading: false,
    digestRead: saved.digestRead ?? [],
    // Yesterday's answer is not today's. It expires with the day rather than
    // sitting there looking current.
    dayFocus: saved.dayFocusDay === today ? (saved.dayFocus ?? "") : "",
    dayFocusDay: saved.dayFocusDay ?? "",
    focusPromptOpen: false,

    paletteOpen: false,
  };
}

/** Apply a patch to one day's log, creating it if needed. */
function withDay(s: ClarityState, key: string, patch: Partial<DayLog>): DayMap {
  const current = getDay(s.days, key);
  return { ...s.days, [key]: { ...current, ...patch } };
}

/** "09:00" → minutes since midnight */
function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function scheduleActive(schedule: LockSchedule, now = new Date()): boolean {
  if (!schedule.enabled) return false;
  if (!schedule.days.includes(now.getDay())) return false;
  const mins = now.getHours() * 60 + now.getMinutes();
  const start = toMinutes(schedule.start);
  const end = toMinutes(schedule.end);
  // A window that ends before it starts wraps past midnight.
  return end >= start ? mins >= start && mins < end : mins >= start || mins < end;
}

/** A freeze is available once the last one is `FREEZE_WINDOW_DAYS` old. */
export function freezeAvailableFrom(freezeDays: string[]): boolean {
  if (!freezeDays.length) return true;
  const cutoff = addDays(dateKey(), -FREEZE_WINDOW_DAYS);
  return !freezeDays.some((d) => d > cutoff);
}

export interface ClarityActions {
  go: (v: ClarityView) => void;
  toggleLock: () => void;
  cycleRing: (d: number) => void;
  setRing: (i: number) => void;
  nextQuote: () => void;
  openApp: (app: AppIcon) => void;
  /** the user backed off at the block screen — the outcome we want */
  blockHold: () => void;
  /** the user went through the gate and opened the app anyway */
  blockDismissAnyway: () => void;
  toggleAppLock: (id: string) => void;
  /** add / drop apps from the catalogue */
  addApp: (id: string) => void;
  removeApp: (id: string) => void;

  startFocus: (opts?: { minutes?: number; earnBack?: boolean; strict?: boolean }) => void;
  toggleRun: () => void;
  abandonFocus: () => void;
  finishFocus: () => void;
  setSessionNote: (v: string) => void;

  enterApp: () => void;
  toggleProject: (id: string) => void;
  confirmProjects: () => void;
  /** Onboarding chat is done — save what it learned and open the app. */
  finishOnboarding: (profile: UserProfile) => void;
  goPaywall: () => void;
  subscribe: () => void;
  dismissPaywall: () => void;

  // ── daily digest ──
  openDigest: () => void;
  markDigestRead: () => void;
  setDayFocus: (text: string) => void;
  dismissFocusPrompt: () => void;
  openFocusPrompt: () => void;

  // ── projects workspace ──
  openProject: (id: string | null) => void;
  createProject: (title: string, desc?: string) => void;
  setProjectStatus: (id: string, status: ProjectStatus) => void;
  setProjectProgress: (id: string, progress: number) => void;
  setProjectNotes: (id: string, notes: string) => void;
  /** ISO day, or "" to clear the date. */
  setProjectDueDate: (id: string, dueDate: string) => void;
  deleteProject: (id: string) => void;
  openSignoff: (id: string) => void;
  signProject: (id: string, signature: string) => void;
  dismissSignoff: () => void;
  cheerIdea: (id: string) => void;
  adoptIdea: (id: string) => void;
  loadIdeas: () => void;

  toggleTodo: (id: string) => void;
  addTodo: () => void;
  removeTodo: (id: string) => void;
  setTodoDraft: (v: string) => void;

  // preferences
  setProfile: (patch: Partial<UserProfile>) => void;
  /** Replace the followed-category list outright — a merge could not remove. */
  setInterests: (interests: string[]) => void;
  /** Wipe everything Clarity knows and send them back through onboarding. */
  forgetProfile: () => void;
  /** Re-read what is on disk and rebuild anything derived from it. */
  syncNow: () => void;
  setSessionMinutes: (m: number) => void;
  setGoalMinutes: (m: number) => void;
  setTheme: (t: ThemeMode) => void;
  setSchedule: (patch: Partial<LockSchedule>) => void;
  setStrictDefault: (v: boolean) => void;
  spendFreeze: () => void;
  resetAllData: () => void;
  exportData: () => void;

  // navigation
  stepViewDate: (delta: number) => void;
  setViewDate: (key: string) => void;
  setPaletteOpen: (open: boolean) => void;
}

export interface ClarityDerived {
  today: DayLog;
  viewedDay: DayLog;
  streak: number;
  score: ClarityScore;
  scheduleOn: boolean;
  /** the project whose sheet is open, if any */
  openProject: Project | null;
  /** the project whose sign-off sheet is open, if any */
  signingProject: Project | null;
  /** finished-or-due projects still waiting for a name on them */
  awaitingSignature: Project[];
  freezeAvailable: boolean;
  /** screens that own the whole frame hide the tab bar */
  tabBarHidden: boolean;
  /** today's digest has been read */
  digestDone: boolean;
  /** projects with a due date, soonest first */
  upcoming: Project[];
}

interface ClarityContextValue {
  state: ClarityState;
  actions: ClarityActions;
  derived: ClarityDerived;
}

const ClarityContext = createContext<ClarityContextValue | null>(null);

/** Views that take the whole frame — no tab bar over them. */
const FULLSCREEN_VIEWS: ClarityView[] = [
  "splash", "onboarding", "focus", "blocked", "spring", "paywall",
];

export function ClarityProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ClarityState>(makeInitial);

  const update = useCallback((fn: (s: ClarityState) => Partial<ClarityState>) => {
    setState((s) => ({ ...s, ...fn(s) }));
  }, []);
  const patch = useCallback((p: Partial<ClarityState>) => {
    setState((s) => ({ ...s, ...p }));
  }, []);

  // ── persistence ──
  useEffect(() => {
    const persisted: Persisted = {
      locking: state.locking,
      apps: state.apps,
      projects: state.projects,
      selProj: state.selProj,
      todos: state.todos,
      profile: state.profile,
      sessionMinutes: state.sessionMinutes,
      goalMinutes: state.goalMinutes,
      theme: state.theme,
      schedule: state.schedule,
      strictDefault: state.strictDefault,
      onboarded: state.onboarded,
      isPro: state.isPro,
      digestRead: state.digestRead,
      dayFocus: state.dayFocus,
      dayFocusDay: state.dayFocusDay,
      days: state.days,
      sessions: state.sessions,
      cheered: state.cheered,
      adopted: state.adopted,
      freezeDays: state.freezeDays,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
    } catch {
      /* quota / private mode — the app still works, it just forgets */
    }
  }, [
    state.locking, state.apps, state.projects, state.selProj,
    state.todos, state.profile, state.sessionMinutes, state.goalMinutes,
    state.theme, state.schedule, state.strictDefault,
    state.onboarded, state.isPro, state.digestRead, state.dayFocus, state.dayFocusDay,
    state.days, state.sessions,
    state.cheered, state.adopted, state.freezeDays,
  ]);

  // ── theme ──
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("light", state.theme === "light");
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", state.theme === "light" ? "#f4ecdd" : "#080604");
  }, [state.theme]);

  // ── focus timer ──
  useEffect(() => {
    if (state.view !== "focus" || !state.running || state.focusDone) return;
    const id = window.setInterval(() => {
      setState((s) => {
        if (!s.running) return s;
        const key = dateKey();
        if (s.focusLeft <= 1) {
          return {
            ...s,
            focusLeft: 0,
            running: false,
            focusDone: true,
            days: withDay(s, key, { focusedSeconds: getDay(s.days, key).focusedSeconds + 1 }),
          };
        }
        return {
          ...s,
          focusLeft: s.focusLeft - 1,
          days: withDay(s, key, { focusedSeconds: getDay(s.days, key).focusedSeconds + 1 }),
        };
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [state.view, state.running, state.focusDone]);

  // ── lock schedule: force locking on inside the window ──
  useEffect(() => {
    if (!state.schedule.enabled) return;
    const tick = () => {
      const active = scheduleActive(state.schedule);
      setState((s) => (active && !s.locking ? { ...s, locking: true } : s));
    };
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [state.schedule]);

  // ── daily digest ──
  // Built once per day. The heavy half (summarising each category) is cached by
  // the digest module, so re-opening the tab is a read, not a regeneration.
  useEffect(() => {
    if (state.view !== "digest") return;

    // Stale on a new day, and also when the interests behind it change —
    // editing them in Settings otherwise left yesterday's set on screen with
    // no way to refresh short of reloading.
    const wanted = orderedInterests(state.profile).join(",");
    const built = state.digest?.entries.map((e) => e.category).join(",") ?? null;
    const fresh = state.digest?.day === todayKey() && built === wanted;
    if (fresh) return;
    let alive = true;
    setState((s) => ({ ...s, digestLoading: true }));

    buildUserDigest(state.profile)
      .then((digest) => {
        if (alive) setState((s) => ({ ...s, digest, digestLoading: false }));
      })
      .catch(() => {
        if (!alive) return;
        setState((s) => ({ ...s, digestLoading: false }));
        note("Digest unavailable", "Couldn't put today's together. Try again shortly.");
      });

    return () => {
      alive = false;
    };
  }, [state.view, state.digest, state.profile]);

  // ── profile → backend ──
  // Debounced: Settings edits the profile on every keystroke, and each one
  // would otherwise be its own request. Fire-and-forget — the local copy is
  // authoritative for the UI, and a server that is down must not block typing.
  const firstProfileSync = useRef(true);
  useEffect(() => {
    if (firstProfileSync.current) {
      firstProfileSync.current = false;
      return;
    }
    const id = window.setTimeout(() => void apiSaveProfile(state.profile), 800);
    return () => window.clearTimeout(id);
  }, [state.profile]);

  /** Close out the running session and write it to history. */
  const commitSession = useCallback(
    (s: ClarityState, completed: boolean): Partial<ClarityState> => {
      if (!s.sessionStartedAt) return {};
      const focusedSeconds = Math.max(0, s.focusTotal - s.focusLeft);
      const key = dateKey();
      const day = getDay(s.days, key);
      // A session belongs to whatever you picked for the week, now that there
      // is no separate "today's task" to hang it on.
      const activeProject = s.projects.find((p) => s.selProj.includes(p.id));
      const session: Session = {
        id: `s${s.sessionStartedAt}`,
        startedAt: s.sessionStartedAt,
        planned: Math.round(s.focusTotal / 60),
        focusedSeconds,
        task: s.dayFocus || activeProject?.title || "",
        completed,
        strict: s.strict,
        note: s.sessionNote.trim() || undefined,
      };
      return {
        sessions: [...s.sessions, session],
        days: {
          ...s.days,
          [key]: {
            ...day,
            sessions: day.sessions + 1,
            completedSessions: day.completedSessions + (completed ? 1 : 0),
          },
        },
        sessionStartedAt: null,
        sessionNote: "",
      };
    },
    [],
  );

  const actions = useMemo<ClarityActions>(
    () => ({
      go: (v) => patch({ view: v }),

      toggleLock: () =>
        update((s) => {
          if (scheduleActive(s.schedule) && s.locking) {
            note("Held by your schedule", "Locking stays on until the window ends.");
            return {};
          }
          haptic(14);
          note(
            !s.locking ? "Locking on" : "Locking off",
            !s.locking ? "Distractions are locked away." : "Apps are open.",
          );
          return { locking: !s.locking };
        }),

      cycleRing: (d) => update((s) => ({ ringIndex: (s.ringIndex + d + 3) % 3 })),
      setRing: (i) => patch({ ringIndex: i }),
      nextQuote: () => update((s) => ({ quoteIndex: s.quoteIndex + 1 })),
      openApp: (app) =>
        update((s) => {
          if (!s.locking || !app.locked) return {};
          const key = dateKey();
          return {
            view: "blocked",
            blockedApp: app,
            blockedReturn: s.view,
            days: withDay(s, key, { pulls: getDay(s.days, key).pulls + 1 }),
          };
        }),

      blockHold: () =>
        update((s) => {
          const key = dateKey();
          return {
            view: s.blockedReturn || "home",
            days: withDay(s, key, { holds: getDay(s.days, key).holds + 1 }),
          };
        }),

      blockDismissAnyway: () =>
        update((s) => {
          note("Five minutes", "The lock comes back on after that.");
          return { view: s.blockedReturn || "home" };
        }),

      toggleAppLock: (id) =>
        update((s) => ({
          apps: s.apps.map((a) => (a.id === id ? { ...a, locked: !a.locked } : a)),
        })),

      addApp: (id) =>
        update((s) => {
          if (s.apps.some((a) => a.id === id)) return {};
          const entry = APP_CATALOG.find((c) => c.id === id);
          if (!entry) return {};
          haptic(10);
          note(`${entry.name} added`, "It's locked by default — switch it off any time.");
          return { apps: [...s.apps, { ...entry, locked: true }] };
        }),

      removeApp: (id) =>
        update((s) => {
          const app = s.apps.find((a) => a.id === id);
          if (!app) return {};
          note(`${app.name} removed`, "Clarity will stop watching it.");
          return { apps: s.apps.filter((a) => a.id !== id) };
        }),

      startFocus: (opts) =>
        setState((s) => {
          const mins = opts?.minutes ?? s.sessionMinutes;
          const t = Math.max(60, mins * 60);
          // Starting a session turns locking on whether or not the toggle was
          // set. Sitting down to focus with your distractions still reachable
          // is the exact failure the app exists to prevent, and asking people
          // to remember two switches instead of one was the bug.
          if (!s.locking) note("Apps locked", "Locking switched on for this session.");
          return {
            ...s,
            view: "focus",
            locking: true,
            focusTotal: t,
            focusLeft: t,
            running: true,
            focusDone: false,
            earnBack: !!opts?.earnBack,
            strict: opts?.strict ?? s.strictDefault,
            sessionStartedAt: Date.now(),
            sessionNote: "",
          };
        }),

      toggleRun: () =>
        update((s) => {
          if (s.strict && s.running) {
            note("Commit Mode is on", "You chose not to be able to pause this one.");
            return {};
          }
          return { running: !s.running };
        }),

      /** Quit early. The session is still recorded — honestly, as incomplete. */
      abandonFocus: () =>
        setState((s) => ({
          ...s,
          ...commitSession(s, false),
          view: "home",
          running: false,
          focusDone: false,
        })),

      finishFocus: () =>
        setState((s) => ({
          ...s,
          ...commitSession(s, true),
          view: "home",
          running: false,
          focusDone: false,
        })),

      setSessionNote: (v) => patch({ sessionNote: v }),

      enterApp: () => update((s) => ({ view: s.onboarded ? "home" : "onboarding" })),

      /**
       * Straight to Home. The paywall used to sit here, which meant every
       * fresh install was asked to buy before it had shown anything worth
       * buying — it is now reachable only from Settings.
       *
       * This is also where the conversation stops being a transcript and
       * becomes configuration. Onboarding used to write a profile and nothing
       * else, so you answered five questions and landed on stock defaults; now
       * every answer that maps to a setting is applied here, once, before the
       * home screen first paints. Nothing is applied twice — re-running
       * onboarding resets the profile first (see `redoOnboarding`).
       */
      finishOnboarding: (profile) => {
        // Fire-and-forget: a backend that is unreachable must not block anyone
        // getting into the app. The local copy is written either way.
        void apiSaveProfile(profile);
        cheer(
          profile.name ? `Good to meet you, ${profile.name}` : "You're set",
          "Your digest is ready on the Digest tab.",
        );

        setState((s) => {
          // 1. Session length. `focusSpan` is 0 when the question never got a
          //    usable answer, in which case the existing default stands.
          const sessionMinutes = profile.focusSpan
            ? Math.min(
                SESSION_BOUNDS.max,
                Math.max(SESSION_BOUNDS.min, Math.round(profile.focusSpan)),
              )
            : s.sessionMinutes;

          // 2. Locked apps. Naming apps replaces the seed list rather than
          //    adding to it — someone who said "instagram" does not also mean
          //    the four apps we guessed for them. Say nothing and the seeds
          //    stay, which is why this is guarded on a non-empty match.
          const named = matchApps(profile.distractions);
          const apps = named.length
            ? named.flatMap((match) => {
                const entry = APP_CATALOG.find((c) => c.id === match.id);
                return entry ? [{ ...entry, locked: true }] : [];
              })
            : s.apps;

          // 3. Projects. Each goal becomes one, ahead of the seeds, so the
          //    projects tab opens on their words instead of our examples.
          const seeded: Project[] = profile.goals.map((title, i) => ({
            id: `p_goal_${Date.now()}_${i}`,
            title,
            desc: profile.purpose
              ? `From setup — ${profile.purpose}`
              : "Named during setup.",
            status: "active" as ProjectStatus,
            progress: 0,
            notes: "",
          }));

          return {
            ...s,
            profile,
            onboarded: true,
            view: "home",
            sessionMinutes,
            apps,
            projects: [...seeded, ...s.projects],
          };
        });
      },

      goPaywall: () => patch({ view: "paywall" }),
      subscribe: () => {
        cheer("Welcome to Clarity Pro", "Everything's unlocked. Go build the day.");
        patch({ isPro: true, view: "home" });
      },
      dismissPaywall: () => patch({ view: "home" }),

      // ── daily digest ──
      openDigest: () => patch({ view: "digest" }),
      markDigestRead: () =>
        update((s) => {
          const key = s.digest?.day ?? todayKey();
          if (s.digestRead.includes(key)) return {};
          cheer("Caught up", "That's the news handled in under two minutes.");
          // Straight into naming the day. You have just spent two minutes on
          // everyone else's priorities; this is the moment to name your own.
          const askForFocus = !s.dayFocus;
          return { digestRead: [...s.digestRead, key], focusPromptOpen: askForFocus };
        }),

      setDayFocus: (text) =>
        update(() => {
          const clean = text.trim();
          if (!clean) return { focusPromptOpen: false };
          cheer("That's today", clean);
          return { dayFocus: clean, dayFocusDay: dateKey(), focusPromptOpen: false };
        }),

      dismissFocusPrompt: () => patch({ focusPromptOpen: false }),
      openFocusPrompt: () => patch({ focusPromptOpen: true }),

      // ── projects workspace ──
      openProject: (id) => patch({ openProjectId: id }),

      createProject: (title, desc = "") =>
        setState((s) => {
          const clean = title.trim();
          if (!clean) return s;
          const project: Project = {
            id: `p${Date.now()}`,
            title: clean,
            desc: desc.trim(),
            status: "idea",
            progress: 0,
            notes: "",
          };
          cheer("Project added", "Pick it for the week when you're ready.");
          return { ...s, projects: [project, ...s.projects] };
        }),

      setProjectStatus: (id, status) =>
        update((s) => {
          const target = s.projects.find((p) => p.id === id);
          // Finishing early is the same moment as finishing on time — both end
          // with you putting your name to it.
          const needsSigning = status === "done" && target && !target.signature;
          return {
            projects: s.projects.map((p) =>
              p.id === id ? { ...p, status, progress: status === "done" ? 100 : p.progress } : p,
            ),
            signingProjectId: needsSigning ? id : s.signingProjectId,
          };
        }),

      openSignoff: (id) => patch({ signingProjectId: id }),

      signProject: (id, signature) =>
        update((s) => {
          const clean = signature.trim();
          if (!clean) return {};
          cheer("Signed off", "That one's yours. On the record.");
          return {
            projects: s.projects.map((p) =>
              p.id === id
                ? { ...p, signature: clean, signedOn: dateKey(), status: "done", progress: 100 }
                : p,
            ),
            signingProjectId: null,
          };
        }),

      dismissSignoff: () => patch({ signingProjectId: null }),

      setProjectProgress: (id, progress) =>
        update((s) => ({
          projects: s.projects.map((p) =>
            p.id === id
              ? {
                  ...p,
                  progress: Math.max(0, Math.min(100, Math.round(progress))),
                  // Moving the bar off zero is the clearest signal it is live.
                  status: progress >= 100 ? "done" : progress > 0 ? "active" : p.status,
                }
              : p,
          ),
        })),

      setProjectNotes: (id, notes) =>
        update((s) => ({
          projects: s.projects.map((p) => (p.id === id ? { ...p, notes } : p)),
        })),

      setProjectDueDate: (id, dueDate) =>
        update((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, dueDate: dueDate || undefined } : p,
          ),
        })),

      deleteProject: (id) =>
        update((s) => ({
          projects: s.projects.filter((p) => p.id !== id),
          selProj: s.selProj.filter((x) => x !== id),
          openProjectId: s.openProjectId === id ? null : s.openProjectId,
        })),

      cheerIdea: (id) =>
        update((s) => {
          haptic(8);
          return {
            cheered: s.cheered.includes(id)
              ? s.cheered.filter((x) => x !== id)
              : [...s.cheered, id],
          };
        }),

      adoptIdea: (id) =>
        setState((s) => {
          if (s.adopted.includes(id)) return s;
          // Reads the loaded feed, not the constant — the feed is live now, so
          // the constant is only ever one possible source of it.
          const idea = s.community.find((i) => i.id === id);
          if (!idea) return s;
          const project: Project = {
            id: `p${Date.now()}`,
            title: idea.title,
            desc: idea.desc,
            status: "idea",
            progress: 0,
            notes: "",
            adoptedFrom: idea.author,
          };
          cheer(`Added "${idea.title}"`, `From ${idea.author}. It's in your projects now.`);
          return { ...s, adopted: [...s.adopted, id], projects: [project, ...s.projects] };
        }),

      /**
       * Load the community feed, once.
       *
       * `hasBackend` decides what the UI is allowed to claim: with a server
       * behind it these are real people and the feed says so, without one they
       * are the local sample and the feed says that instead. Getting this
       * backwards would have the app present six fictional strangers as its
       * users, which is the one thing this feature must never do.
       */
      loadIdeas: () => {
        void (async () => {
          const list = await fetchCommunity();
          patch({
            community: list.length ? list : localCommunity(),
            communityIsSample: !hasBackend || !list.length,
            ideasLoaded: true,
          });
        })();
      },

      // ── grader ──
      toggleProject: (id) =>
        update((s) => {
          if (s.selProj.includes(id)) return { selProj: s.selProj.filter((x) => x !== id) };
          if (s.selProj.length >= 3) {
            note("Three is the limit", "That's the point — drop one to add another.");
            return {};
          }
          return { selProj: [...s.selProj, id] };
        }),

      confirmProjects: () =>
        setState((s) => {
          if (s.selProj.length !== 3) return s;
          const picked = s.projects.filter((p) => s.selProj.includes(p.id));
          const have = new Set(s.todos.map((t) => t.text));
          const add = picked
            .filter((p) => !have.has(p.title))
            .map((p, i) => ({ id: `pt${Date.now()}${i}`, text: p.title, done: false, projectId: p.id }));
          const todos = [...s.todos, ...add];
          cheer("Week locked in", "Your 3 projects are set. Protect them.");
          return {
            ...s,
            todos,
            // Picking a project for the week is what makes it active.
            projects: s.projects.map((p) =>
              s.selProj.includes(p.id) && p.status === "idea" ? { ...p, status: "active" } : p,
            ),
            days: withDay(s, dateKey(), {
              todosDone: todos.filter((t) => t.done).length,
              todosTotal: todos.length,
            }),
            view: "home",
          };
        }),

      toggleTodo: (id) =>
        update((s) => {
          const todos = s.todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
          haptic(8);
          return {
            todos,
            days: withDay(s, dateKey(), {
              todosDone: todos.filter((t) => t.done).length,
              todosTotal: todos.length,
            }),
          };
        }),

      addTodo: () =>
        setState((s) => {
          const v = s.todoDraft.trim();
          if (!v) return s;
          const todos = [...s.todos, { id: `t${Date.now()}`, text: v, done: false }];
          return {
            ...s,
            todos,
            todoDraft: "",
            days: withDay(s, dateKey(), {
              todosDone: todos.filter((t) => t.done).length,
              todosTotal: todos.length,
            }),
          };
        }),

      removeTodo: (id) =>
        update((s) => {
          const todos = s.todos.filter((t) => t.id !== id);
          return {
            todos,
            days: withDay(s, dateKey(), {
              todosDone: todos.filter((t) => t.done).length,
              todosTotal: todos.length,
            }),
          };
        }),

      setTodoDraft: (v) => patch({ todoDraft: v }),

      // ── preferences ──
      setProfile: (p) => update((s) => ({ profile: { ...s.profile, ...p } })),

      setInterests: (interests) =>
        update((s) => {
          // Drop the specifics for anything no longer followed, so an interest
          // added back later asks again rather than silently reusing an answer
          // from before.
          const specifics: Record<string, string> = {};
          for (const id of interests) {
            if (s.profile.specifics[id]) specifics[id] = s.profile.specifics[id];
          }
          return { profile: { ...s.profile, interests, specifics } };
        }),

      // Swiping past the bottom of a page lands here. State lives in this tab,
      // so the useful part of a "reload" is picking up writes another tab made
      // and dropping anything cached on top of them — which means the digest,
      // the one thing the app holds that it did not just compute.
      syncNow: () =>
        update(() => {
          const disk = loadPersisted();
          haptic(12);
          cheer("Synced", "Up to date with everything on this device.");
          return {
            apps: normalizeApps(disk.apps),
            projects: normalizeProjects(disk.projects),
            todos: disk.todos ?? SEED_TODOS,
            selProj: disk.selProj ?? [],
            days: disk.days ?? {},
            sessions: disk.sessions ?? [],
            freezeDays: disk.freezeDays ?? [],
            cheered: disk.cheered ?? [],
            adopted: disk.adopted ?? [],
            profile: { ...EMPTY_PROFILE, ...(disk.profile ?? {}) },
            digest: null,
          };
        }),

      forgetProfile: () =>
        update(() => {
          note("Cleared", "Clarity has forgotten what it knew.");
          // The digest is written from the profile, so it goes too rather than
          // sitting there as a leftover of a person the app no longer knows.
          return { profile: EMPTY_PROFILE, digest: null, onboarded: false, view: "onboarding" };
        }),
      setSessionMinutes: (m) =>
        update((s) => {
          const mins = Math.max(
            SESSION_BOUNDS.min,
            Math.min(SESSION_BOUNDS.max, Math.round(m)),
          );
          const idle = s.view !== "focus";
          return {
            sessionMinutes: mins,
            ...(idle ? { focusTotal: mins * 60, focusLeft: mins * 60 } : {}),
          };
        }),
      setGoalMinutes: (m) =>
        patch({
          goalMinutes: Math.max(GOAL_BOUNDS.min, Math.min(GOAL_BOUNDS.max, Math.round(m))),
        }),
      setTheme: (t) => patch({ theme: t }),
      setSchedule: (p) => update((s) => ({ schedule: { ...s.schedule, ...p } })),
      setStrictDefault: (v) => patch({ strictDefault: v }),

      spendFreeze: () =>
        update((s) => {
          if (!freezeAvailableFrom(s.freezeDays)) {
            note("No freeze left", `One per ${FREEZE_WINDOW_DAYS} days. Yours is still cooling down.`);
            return {};
          }
          const key = dateKey();
          if (s.freezeDays.includes(key)) return {};
          cheer("Streak frozen", "Today won't break it. Come back tomorrow.");
          return { freezeDays: [...s.freezeDays, key] };
        }),

      resetAllData: () => {
        try {
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(LEGACY_KEY);
        } catch {
          /* nothing to clear */
        }
        setState({ ...makeInitial(), view: "home", onboarded: true });
        note("Data cleared", "Your history is gone. Starting fresh.");
      },

      exportData: () =>
        setState((s) => {
          try {
            const blob = new Blob(
              [JSON.stringify({ days: s.days, sessions: s.sessions, projects: s.projects }, null, 2)],
              { type: "application/json" },
            );
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `clarity-${dateKey()}.json`;
            a.click();
            URL.revokeObjectURL(url);
            note("Exported", "Your history is in your downloads.");
          } catch {
            note("Export failed", "Your browser blocked the download.");
          }
          return s;
        }),

      // ── navigation ──
      stepViewDate: (delta) =>
        update((s) => {
          const next = addDays(s.viewDate, delta);
          // The future has no history to show.
          if (next > dateKey()) return {};
          return { viewDate: next };
        }),
      setViewDate: (key) => patch({ viewDate: key }),
      setPaletteOpen: (open) => patch({ paletteOpen: open }),
    }),
    [patch, update, commitSession],
  );

  // ── community feed: a real fetch, now actually ──
  //
  // This used to be `simulateWrite(650)` flipping a flag, which was honest
  // enough while the feed was six hardcoded people. It is a network call now,
  // so it goes through the action rather than faking the wait.
  useEffect(() => {
    if (state.view !== "projects" || state.ideasLoaded) return;
    actions.loadIdeas();
  }, [state.view, state.ideasLoaded, actions]);

  const derived = useMemo<ClarityDerived>(() => {
    const today = getDay(state.days, dateKey());
    const viewedDay = getDay(state.days, state.viewDate);
    const frozen = new Set(state.freezeDays);
    // A day opens on a floor carried from the one before it, so the score is
    // never a flat zero staring back at you first thing in the morning.
    const carryover = carryoverFrom(state.days[addDays(state.viewDate, -1)], state.goalMinutes);
    return {
      today,
      viewedDay,
      streak: computeStreak(state.days, 10, frozen),
      score: clarityScore(viewedDay, state.goalMinutes, carryover),
      scheduleOn: scheduleActive(state.schedule),
      openProject: state.projects.find((p) => p.id === state.openProjectId) ?? null,
      signingProject: state.projects.find((p) => p.id === state.signingProjectId) ?? null,
      awaitingSignature: state.projects.filter(
        (p) => !p.signature && (p.status === "done" || (!!p.dueDate && p.dueDate <= dateKey())),
      ),
      freezeAvailable: freezeAvailableFrom(state.freezeDays),
      tabBarHidden: FULLSCREEN_VIEWS.includes(state.view),
      digestDone: state.digestRead.includes(todayKey()),
      upcoming: state.projects
        .filter((p) => p.dueDate && p.status !== "done")
        .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? "")),
    };
  }, [
    state.days, state.viewDate, state.goalMinutes, state.schedule, state.freezeDays,
    state.projects, state.openProjectId, state.signingProjectId, state.view, state.digestRead,
  ]);

  const value = useMemo(() => ({ state, actions, derived }), [state, actions, derived]);
  return <ClarityContext.Provider value={value}>{children}</ClarityContext.Provider>;
}

export function useClarity(): ClarityContextValue {
  const ctx = useContext(ClarityContext);
  if (!ctx) throw new Error("useClarity must be used inside <ClarityProvider>");
  return ctx;
}

/** Kept for the timer readout. */
export function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  return `${m}:${String(sec % 60).padStart(2, "0")}`;
}
