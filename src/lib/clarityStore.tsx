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
  PUBLIC_IDEAS,
  SEED_APPS,
  SEED_PROJECTS,
  SEED_TODOS,
  type AppIcon,
  type Project,
  type ProjectGrade,
  type ProjectStatus,
  type Todo,
} from "./clarityData";
import {
  addDays,
  clarityScore,
  computeStreak,
  dateKey,
  emptyDay,
  getDay,
  type Checkin,
  type ClarityScore,
  type DayLog,
  type DayMap,
  type Session,
} from "./clarityStats";
import { gradeProject } from "./grader";
import { cheer, note, haptic } from "./feedback";
import { simulateWrite } from "./optimistic";

export type ClarityView =
  | "splash"
  | "intro"
  | "home"
  | "focus"
  | "blocked"
  | "task"
  | "settings"
  | "projects"
  | "todos"
  | "submit"
  | "checkin"
  | "spring"
  | "paywall"
  | "articles"
  | "insights"
  | "milestones"
  | "grade";

export type SubmitStage = "camera" | "analyzing" | "result";
export type ArticleStage = "read" | "record" | "analyzing" | "done";
export type GradeStage = "intro" | "camera" | "grading" | "result";
export type SoundscapeId = "none" | "wind" | "drone" | "rain";
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

/** Bounds for the two duration sliders, shared by Settings and the store clamp. */
export const SESSION_BOUNDS = { min: 5, max: 420, step: 5 } as const;
export const GOAL_BOUNDS = { min: 10, max: 720, step: 10 } as const;

/** One freeze per rolling 7 days. Enough to survive a bad week, not to coast. */
export const FREEZE_WINDOW_DAYS = 7;

export interface ClarityState {
  view: ClarityView;
  blockedReturn: ClarityView;
  ringIndex: number;
  quoteIndex: number;
  submitStage: SubmitStage;
  submitScore: number | null;
  mood: number | null;
  dayGo: string | null;
  activities: string[];
  checkinNote: string;
  locking: boolean;
  task: string;
  taskDraft: string;
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
  name: string;

  // ── projects workspace ──
  /** The project whose detail sheet is open. */
  openProjectId: string | null;
  /** Community ideas already cheered / taken on. */
  cheered: string[];
  adopted: string[];
  /** False until the ideas feed has "arrived" — drives its skeleton. */
  ideasLoaded: boolean;

  // ── project grader ──
  gradeStage: GradeStage;
  gradeProjectId: string | null;
  gradePhoto: string | null;
  gradeResult: ProjectGrade | null;

  // ── preferences ──
  /** minutes a new session runs for */
  sessionMinutes: number;
  /** daily deep-work target, in minutes */
  goalMinutes: number;
  soundscape: SoundscapeId;
  theme: ThemeMode;
  schedule: LockSchedule;
  strictDefault: boolean;

  introSeen: boolean;
  isPro: boolean;

  // ── history ──
  days: DayMap;
  sessions: Session[];
  /** the day the Home screen is currently showing */
  viewDate: string;
  /** day-keys the user spent a streak freeze on */
  freezeDays: string[];

  // ── daily read ──
  articleStage: ArticleStage;
  currentArticleId: string | null;
  articlesDone: string[];

  // ── transient UI ──
  paletteOpen: boolean;
}

const STORAGE_KEY = "clarity.state.v3";
const LEGACY_KEY = "clarity.state.v2";

type Persisted = Pick<
  ClarityState,
  | "locking" | "task" | "apps" | "projects" | "selProj" | "todos" | "name"
  | "sessionMinutes" | "goalMinutes" | "soundscape" | "theme" | "schedule" | "strictDefault"
  | "introSeen" | "isPro" | "articlesDone" | "days" | "sessions"
  | "cheered" | "adopted" | "freezeDays"
>;

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
      grades: Array.isArray(raw.grades) ? raw.grades : [],
      adoptedFrom: raw.adoptedFrom,
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
    submitStage: "camera",
    submitScore: null,
    mood: todayLog.checkin?.mood ?? null,
    dayGo: todayLog.checkin?.dayGo ?? null,
    activities: todayLog.checkin?.activities ?? [],
    checkinNote: todayLog.checkin?.note ?? "",
    locking: saved.locking ?? true,
    task: saved.task ?? "",
    taskDraft: saved.task ?? "",
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
    name: saved.name ?? "",

    openProjectId: null,
    cheered: saved.cheered ?? [],
    adopted: saved.adopted ?? [],
    ideasLoaded: false,

    gradeStage: "intro",
    gradeProjectId: null,
    gradePhoto: null,
    gradeResult: null,

    sessionMinutes: saved.sessionMinutes ?? 25,
    goalMinutes: saved.goalMinutes ?? 180,
    soundscape: saved.soundscape ?? "none",
    theme: saved.theme ?? "dark",
    schedule: { ...DEFAULT_SCHEDULE, ...(saved.schedule ?? {}) },
    strictDefault: saved.strictDefault ?? false,

    introSeen: saved.introSeen ?? false,
    isPro: saved.isPro ?? false,

    days: { ...days, [today]: todayLog },
    sessions: saved.sessions ?? [],
    viewDate: today,
    freezeDays: saved.freezeDays ?? [],

    articleStage: "read",
    currentArticleId: null,
    articlesDone: saved.articlesDone ?? [],

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
  setMood: (i: number) => void;
  toggleActivity: (k: string) => void;
  setDayGo: (v: string) => void;
  setCheckinNote: (v: string) => void;
  capturePhoto: () => void;
  resetSubmit: () => void;
  saveCheckin: () => void;
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
  finishIntro: () => void;
  goPaywall: () => void;
  subscribe: () => void;
  dismissPaywall: () => void;

  // ── daily read ──
  openArticles: () => void;
  openArticle: (id: string) => void;
  startArticleRecord: (id?: string) => void;
  submitArticleVideo: () => void;
  finishArticle: () => void;

  // ── projects workspace ──
  openProject: (id: string | null) => void;
  createProject: (title: string, desc?: string) => void;
  setProjectStatus: (id: string, status: ProjectStatus) => void;
  setProjectProgress: (id: string, progress: number) => void;
  setProjectNotes: (id: string, notes: string) => void;
  deleteProject: (id: string) => void;
  cheerIdea: (id: string) => void;
  adoptIdea: (id: string) => void;
  loadIdeas: () => void;

  // ── grader ──
  openGrader: (projectId: string) => void;
  setGradePhoto: (dataUrl: string) => void;
  runGrade: () => void;
  resetGrade: () => void;
  closeGrade: () => void;

  toggleTodo: (id: string) => void;
  addTodo: () => void;
  removeTodo: (id: string) => void;
  setTodoDraft: (v: string) => void;
  setTaskDraft: (v: string) => void;
  saveTask: () => void;
  openTask: () => void;

  // preferences
  setName: (v: string) => void;
  setSessionMinutes: (m: number) => void;
  setGoalMinutes: (m: number) => void;
  setSoundscape: (s: SoundscapeId) => void;
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
  freezeAvailable: boolean;
  /** screens that own the whole frame hide the tab bar */
  tabBarHidden: boolean;
}

interface ClarityContextValue {
  state: ClarityState;
  actions: ClarityActions;
  derived: ClarityDerived;
}

const ClarityContext = createContext<ClarityContextValue | null>(null);

/** Views that take the whole frame — no tab bar over them. */
const FULLSCREEN_VIEWS: ClarityView[] = [
  "splash", "intro", "focus", "blocked", "task", "spring", "paywall", "grade",
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
      task: state.task,
      apps: state.apps,
      projects: state.projects,
      selProj: state.selProj,
      todos: state.todos,
      name: state.name,
      sessionMinutes: state.sessionMinutes,
      goalMinutes: state.goalMinutes,
      soundscape: state.soundscape,
      theme: state.theme,
      schedule: state.schedule,
      strictDefault: state.strictDefault,
      introSeen: state.introSeen,
      isPro: state.isPro,
      articlesDone: state.articlesDone,
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
    state.locking, state.task, state.apps, state.projects, state.selProj,
    state.todos, state.name, state.sessionMinutes, state.goalMinutes,
    state.soundscape, state.theme, state.schedule, state.strictDefault,
    state.introSeen, state.isPro, state.articlesDone, state.days, state.sessions,
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

  // ── AI review: analyzing → result ──
  const analyzeRef = useRef<number | null>(null);
  useEffect(() => {
    if (state.submitStage !== "analyzing") return;
    analyzeRef.current = window.setTimeout(() => {
      patch({ submitStage: "result", submitScore: 87 });
    }, 1700);
    return () => {
      if (analyzeRef.current) window.clearTimeout(analyzeRef.current);
    };
  }, [state.submitStage, patch]);

  // ── daily read: analyzing → done ──
  const articleRef = useRef<number | null>(null);
  useEffect(() => {
    if (state.articleStage !== "analyzing") return;
    articleRef.current = window.setTimeout(() => {
      setState((s) => ({
        ...s,
        articleStage: "done",
        articlesDone:
          s.currentArticleId && !s.articlesDone.includes(s.currentArticleId)
            ? [...s.articlesDone, s.currentArticleId]
            : s.articlesDone,
      }));
      cheer("Understanding logged", "That one's counted for the week.");
    }, 2200);
    return () => {
      if (articleRef.current) window.clearTimeout(articleRef.current);
    };
  }, [state.articleStage]);

  /** Close out the running session and write it to history. */
  const commitSession = useCallback(
    (s: ClarityState, completed: boolean): Partial<ClarityState> => {
      if (!s.sessionStartedAt) return {};
      const focusedSeconds = Math.max(0, s.focusTotal - s.focusLeft);
      const key = dateKey();
      const day = getDay(s.days, key);
      const session: Session = {
        id: `s${s.sessionStartedAt}`,
        startedAt: s.sessionStartedAt,
        planned: Math.round(s.focusTotal / 60),
        focusedSeconds,
        task: s.task,
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
      setMood: (i) => patch({ mood: i }),
      toggleActivity: (k) =>
        update((s) => ({
          activities: s.activities.includes(k)
            ? s.activities.filter((x) => x !== k)
            : [...s.activities, k],
        })),
      setDayGo: (v) => patch({ dayGo: v }),
      setCheckinNote: (v) => patch({ checkinNote: v }),
      capturePhoto: () => patch({ submitStage: "analyzing" }),
      resetSubmit: () => patch({ submitStage: "camera", submitScore: null }),

      saveCheckin: () =>
        setState((s) => {
          const checkin: Checkin = {
            mood: s.mood ?? 2,
            dayGo: s.dayGo ?? "",
            activities: s.activities,
            note: s.checkinNote,
          };
          cheer("Checked in", "That's the day closed out. Rest well.");
          return { ...s, days: withDay(s, dateKey(), { checkin }), view: "home" };
        }),

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
          return {
            ...s,
            view: "focus",
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

      enterApp: () => update((s) => ({ view: s.introSeen ? "home" : "intro" })),
      finishIntro: () =>
        update((s) => ({ view: s.isPro ? "home" : "paywall", introSeen: true })),

      goPaywall: () => patch({ view: "paywall" }),
      subscribe: () => {
        cheer("Welcome to Clarity Pro", "Everything's unlocked. Go build the day.");
        patch({ isPro: true, view: "home" });
      },
      dismissPaywall: () => patch({ view: "home" }),

      // ── daily read ──
      // The Read tab always lands on something readable: `currentArticleId` is
      // resolved by the screen, so opening the tab never shows an empty state.
      openArticles: () => patch({ view: "articles", articleStage: "read" }),
      openArticle: (id) => patch({ view: "articles", currentArticleId: id, articleStage: "read" }),
      /** From Home's card straight into recording — the hand-off into the tab. */
      startArticleRecord: (id) =>
        update((s) => ({
          view: "articles",
          currentArticleId: id ?? s.currentArticleId,
          articleStage: "record",
        })),
      submitArticleVideo: () => patch({ articleStage: "analyzing" }),
      finishArticle: () => patch({ articleStage: "read" }),

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
            grades: [],
          };
          cheer("Project added", "Pick it for the week when you're ready.");
          return { ...s, projects: [project, ...s.projects] };
        }),

      setProjectStatus: (id, status) =>
        update((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, status, progress: status === "done" ? 100 : p.progress } : p,
          ),
        })),

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
          const idea = PUBLIC_IDEAS.find((i) => i.id === id);
          if (!idea) return s;
          const project: Project = {
            id: `p${Date.now()}`,
            title: idea.idea,
            desc: idea.desc,
            status: "idea",
            progress: 0,
            notes: "",
            grades: [],
            adoptedFrom: idea.author,
          };
          cheer(`Added "${idea.idea}"`, `From ${idea.author}. It's in your projects now.`);
          return { ...s, adopted: [...s.adopted, id], projects: [project, ...s.projects] };
        }),

      loadIdeas: () => patch({ ideasLoaded: true }),

      // ── grader ──
      openGrader: (projectId) =>
        patch({
          view: "grade",
          gradeProjectId: projectId,
          gradeStage: "intro",
          gradePhoto: null,
          gradeResult: null,
        }),
      setGradePhoto: (dataUrl) => patch({ gradePhoto: dataUrl, gradeStage: "camera" }),
      runGrade: () => patch({ gradeStage: "grading" }),
      resetGrade: () => patch({ gradeStage: "camera", gradePhoto: null, gradeResult: null }),
      closeGrade: () =>
        patch({ view: "projects", gradeStage: "intro", gradePhoto: null, gradeResult: null }),

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
      setTaskDraft: (v) => patch({ taskDraft: v }),
      saveTask: () =>
        update((s) => {
          const task = s.taskDraft.trim();
          if (!task) return { view: "home" };
          note("Focus set", "Everything you lock away is protecting this.");
          return { task, view: "home" };
        }),
      openTask: () => update((s) => ({ view: "task", taskDraft: s.task })),

      // ── preferences ──
      setName: (v) => patch({ name: v }),
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
      setSoundscape: (s) => patch({ soundscape: s }),
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
        setState({ ...makeInitial(), view: "home", introSeen: true });
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

  // ── grading: photo → score ──
  // Lives here rather than in the screen so navigating away mid-grade does not
  // cancel it; the result is waiting when you come back.
  useEffect(() => {
    if (state.gradeStage !== "grading" || !state.gradePhoto) return;
    let alive = true;
    const project = state.projects.find((p) => p.id === state.gradeProjectId);

    gradeProject({
      image: state.gradePhoto,
      projectTitle: project?.title ?? "Untitled project",
      projectDesc: project?.desc ?? "",
      progress: project?.progress ?? 0,
    })
      .then((grade) => {
        if (!alive) return;
        setState((s) => ({
          ...s,
          gradeStage: "result",
          gradeResult: grade,
          projects: s.projects.map((p) =>
            p.id === s.gradeProjectId ? { ...p, grades: [grade, ...p.grades].slice(0, 12) } : p,
          ),
        }));
        cheer(`Graded ${grade.score}/100`, grade.headline);
      })
      .catch(() => {
        if (!alive) return;
        setState((s) => ({ ...s, gradeStage: "camera" }));
        note("Grading failed", "Have another go — the photo didn't get through.");
      });

    return () => {
      alive = false;
    };
  }, [state.gradeStage, state.gradePhoto, state.gradeProjectId, state.projects]);

  // ── ideas feed: a real fetch in everything but name ──
  useEffect(() => {
    if (state.view !== "projects" || state.ideasLoaded) return;
    let alive = true;
    simulateWrite(650).then(() => {
      if (alive) setState((s) => ({ ...s, ideasLoaded: true }));
    });
    return () => {
      alive = false;
    };
  }, [state.view, state.ideasLoaded]);

  const derived = useMemo<ClarityDerived>(() => {
    const today = getDay(state.days, dateKey());
    const viewedDay = getDay(state.days, state.viewDate);
    const frozen = new Set(state.freezeDays);
    // Recording is a full-attention moment — the tab bar would only offer a
    // way to lose the take.
    const readingBusy =
      state.view === "articles" && state.articleStage !== "read";
    return {
      today,
      viewedDay,
      streak: computeStreak(state.days, 10, frozen),
      score: clarityScore(viewedDay, state.goalMinutes),
      scheduleOn: scheduleActive(state.schedule),
      openProject: state.projects.find((p) => p.id === state.openProjectId) ?? null,
      freezeAvailable: freezeAvailableFrom(state.freezeDays),
      tabBarHidden: FULLSCREEN_VIEWS.includes(state.view) || readingBusy,
    };
  }, [
    state.days, state.viewDate, state.goalMinutes, state.schedule, state.freezeDays,
    state.projects, state.openProjectId, state.view, state.articleStage,
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
