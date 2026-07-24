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
  SEED_APPS,
  SEED_PROJECTS,
  SEED_TODOS,
  type AppIcon,
  type Project,
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
import { cheer, note, haptic } from "./feedback";

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
  | "milestones";

export type SubmitStage = "camera" | "analyzing" | "result";
export type ArticleStage = "read" | "record" | "analyzing" | "done";
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

  // ── daily read ──
  articleStage: ArticleStage;
  currentArticleId: string | null;
  articlesDone: string[];

  // ── transient UI ──
  paletteOpen: boolean;
}

const STORAGE_KEY = "clarity.state.v2";

type Persisted = Pick<
  ClarityState,
  | "locking" | "task" | "apps" | "projects" | "selProj" | "todos" | "name"
  | "sessionMinutes" | "goalMinutes" | "soundscape" | "theme" | "schedule" | "strictDefault"
  | "introSeen" | "isPro" | "articlesDone" | "days" | "sessions"
>;

const DEFAULT_SCHEDULE: LockSchedule = {
  enabled: false,
  start: "09:00",
  end: "12:00",
  days: [1, 2, 3, 4, 5],
};

function loadPersisted(): Partial<Persisted> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<Persisted>;
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

    apps: saved.apps ?? SEED_APPS,
    projects: saved.projects ?? SEED_PROJECTS,
    selProj: saved.selProj ?? [],
    todos,
    todoDraft: "",
    name: saved.name ?? "",

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
  openArticles: () => void;
  openArticle: (id: string) => void;
  startArticleRecord: () => void;
  submitArticleVideo: () => void;
  finishArticle: () => void;
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
}

interface ClarityContextValue {
  state: ClarityState;
  actions: ClarityActions;
  derived: ClarityDerived;
}

const ClarityContext = createContext<ClarityContextValue | null>(null);

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

      openArticles: () => patch({ view: "articles", articleStage: "read" }),
      openArticle: (id) => patch({ view: "articles", currentArticleId: id, articleStage: "read" }),
      startArticleRecord: () => patch({ articleStage: "record" }),
      submitArticleVideo: () => patch({ articleStage: "analyzing" }),
      finishArticle: () => patch({ view: "home", articleStage: "read" }),

      toggleProject: (id) =>
        update((s) => {
          if (s.selProj.includes(id)) return { selProj: s.selProj.filter((x) => x !== id) };
          if (s.selProj.length >= 3) return {};
          return { selProj: [...s.selProj, id] };
        }),

      confirmProjects: () =>
        setState((s) => {
          if (s.selProj.length !== 3) return s;
          const titles = s.projects.filter((p) => s.selProj.includes(p.id)).map((p) => p.title);
          const have = new Set(s.todos.map((t) => t.text));
          const add = titles
            .filter((t) => !have.has(t))
            .map((t, i) => ({ id: `pt${Date.now()}${i}`, text: t, done: false }));
          const todos = [...s.todos, ...add];
          cheer("Week locked in", "Your 3 projects are set. Protect them.");
          return {
            ...s,
            todos,
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
          const mins = Math.max(5, Math.min(180, Math.round(m)));
          const idle = s.view !== "focus";
          return {
            sessionMinutes: mins,
            ...(idle ? { focusTotal: mins * 60, focusLeft: mins * 60 } : {}),
          };
        }),
      setGoalMinutes: (m) => patch({ goalMinutes: Math.max(15, Math.min(720, Math.round(m))) }),
      setSoundscape: (s) => patch({ soundscape: s }),
      setTheme: (t) => patch({ theme: t }),
      setSchedule: (p) => update((s) => ({ schedule: { ...s.schedule, ...p } })),
      setStrictDefault: (v) => patch({ strictDefault: v }),

      resetAllData: () => {
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {
          /* nothing to clear */
        }
        setState({ ...makeInitial(), view: "home", introSeen: true });
        note("Data cleared", "Your history is gone. Starting fresh.");
      },

      exportData: () =>
        setState((s) => {
          try {
            const blob = new Blob([JSON.stringify({ days: s.days, sessions: s.sessions }, null, 2)], {
              type: "application/json",
            });
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

  const derived = useMemo<ClarityDerived>(() => {
    const today = getDay(state.days, dateKey());
    const viewedDay = getDay(state.days, state.viewDate);
    return {
      today,
      viewedDay,
      streak: computeStreak(state.days),
      score: clarityScore(viewedDay, state.goalMinutes),
      scheduleOn: scheduleActive(state.schedule),
    };
  }, [state.days, state.viewDate, state.goalMinutes, state.schedule]);

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
