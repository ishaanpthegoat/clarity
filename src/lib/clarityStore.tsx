// Clarity — central state machine (React context port of the design's DCLogic)
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
  | "articles";

export type SubmitStage = "camera" | "analyzing" | "result";
export type ArticleStage = "read" | "record" | "analyzing" | "done";

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
  checkinDone: boolean;
  locking: boolean;
  task: string;
  taskDraft: string;
  blockedApp: AppIcon | null;
  focusTotal: number;
  focusLeft: number;
  running: boolean;
  focusDone: boolean;
  earnBack: boolean;
  apps: AppIcon[];
  projects: Project[];
  selProj: string[];
  todos: Todo[];
  todoDraft: string;
  name: string;
  startMinutes: number;
  introSeen: boolean;
  // Pro / paywall
  isPro: boolean;
  // Daily Read
  articleStage: ArticleStage;
  currentArticleId: string | null;
  articlesDone: string[];
}

const STORAGE_KEY = "clarity.state.v1";

// only a durable subset is persisted — transient view/timer state is not
type Persisted = Pick<
  ClarityState,
  "locking" | "task" | "apps" | "projects" | "selProj" | "todos" | "name" | "checkinDone" | "mood" | "dayGo" | "activities" | "checkinNote" | "startMinutes" | "introSeen" | "isPro" | "articlesDone"
>;

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
  return {
    view: "splash",
    blockedReturn: "home",
    ringIndex: 0,
    quoteIndex: 0,
    submitStage: "camera",
    submitScore: null,
    mood: saved.mood ?? null,
    dayGo: saved.dayGo ?? null,
    activities: saved.activities ?? [],
    checkinNote: saved.checkinNote ?? "",
    checkinDone: saved.checkinDone ?? false,
    locking: saved.locking ?? true,
    task: saved.task ?? "Finish the Q3 deck",
    taskDraft: saved.task ?? "Finish the Q3 deck",
    blockedApp: null,
    focusTotal: 25 * 60,
    focusLeft: 25 * 60,
    running: false,
    focusDone: false,
    earnBack: false,
    apps: saved.apps ?? SEED_APPS,
    projects: saved.projects ?? SEED_PROJECTS,
    selProj: saved.selProj ?? [],
    todos: saved.todos ?? SEED_TODOS,
    todoDraft: "",
    name: saved.name ?? "Ishaan",
    startMinutes: saved.startMinutes ?? 25,
    introSeen: saved.introSeen ?? false,
    isPro: saved.isPro ?? false,
    articleStage: "read",
    currentArticleId: null,
    articlesDone: saved.articlesDone ?? [],
  };
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
  blockDismiss: () => void;
  toggleAppLock: (id: string) => void;
  startFocus: (mins?: number, earnBack?: boolean) => void;
  toggleRun: () => void;
  skipToEnd: () => void;
  finishFocus: () => void;
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
  setTodoDraft: (v: string) => void;
  setTaskDraft: (v: string) => void;
  saveTask: () => void;
  openTask: () => void;
}

interface ClarityContextValue {
  state: ClarityState;
  actions: ClarityActions;
}

const ClarityContext = createContext<ClarityContextValue | null>(null);

export function ClarityProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ClarityState>(makeInitial);
  // stable functional updater
  const update = useCallback((fn: (s: ClarityState) => Partial<ClarityState>) => {
    setState((s) => ({ ...s, ...fn(s) }));
  }, []);
  const patch = useCallback((p: Partial<ClarityState>) => {
    setState((s) => ({ ...s, ...p }));
  }, []);

  // ---- persistence ----
  useEffect(() => {
    const persisted: Persisted = {
      locking: state.locking,
      task: state.task,
      apps: state.apps,
      projects: state.projects,
      selProj: state.selProj,
      todos: state.todos,
      name: state.name,
      checkinDone: state.checkinDone,
      mood: state.mood,
      dayGo: state.dayGo,
      activities: state.activities,
      checkinNote: state.checkinNote,
      startMinutes: state.startMinutes,
      introSeen: state.introSeen,
      isPro: state.isPro,
      articlesDone: state.articlesDone,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
    } catch {
      /* ignore quota / private-mode errors */
    }
  }, [
    state.locking, state.task, state.apps, state.projects, state.selProj,
    state.todos, state.name, state.checkinDone, state.mood, state.dayGo,
    state.activities, state.checkinNote, state.startMinutes, state.introSeen,
    state.isPro, state.articlesDone,
  ]);

  // ---- focus timer ----
  useEffect(() => {
    if (state.view !== "focus" || !state.running || state.focusDone) return;
    const id = window.setInterval(() => {
      setState((s) => {
        if (!s.running) return s;
        if (s.focusLeft <= 1) {
          return { ...s, focusLeft: 0, running: false, focusDone: true };
        }
        return { ...s, focusLeft: s.focusLeft - 1 };
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [state.view, state.running, state.focusDone]);

  // ---- analyzing → result timer for AI review ----
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

  // ---- article "reading your understanding" timer ----
  const articleRef = useRef<number | null>(null);
  useEffect(() => {
    if (state.articleStage !== "analyzing") return;
    articleRef.current = window.setTimeout(() => {
      setState((s) => ({
        ...s,
        articleStage: "done",
        articlesDone: s.currentArticleId && !s.articlesDone.includes(s.currentArticleId)
          ? [...s.articlesDone, s.currentArticleId]
          : s.articlesDone,
      }));
      cheer("Understanding logged", "Nice — that one's counted for the week.");
    }, 2200);
    return () => {
      if (articleRef.current) window.clearTimeout(articleRef.current);
    };
  }, [state.articleStage]);

  const actions = useMemo<ClarityActions>(
    () => ({
      go: (v) => patch({ view: v }),
      toggleLock: () =>
        update((s) => {
          haptic(14);
          note(!s.locking ? "Locking on" : "Locking off", !s.locking ? "Distractions are locked away." : "Apps are open.");
          return { locking: !s.locking };
        }),
      cycleRing: (d) => update((s) => ({ ringIndex: (s.ringIndex + d + 3) % 3 })),
      setRing: (i) => patch({ ringIndex: i }),
      nextQuote: () => update((s) => ({ quoteIndex: (s.quoteIndex + 1) % 5 })),
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
      saveCheckin: () => {
        cheer("Checked in", "That's the day closed out. Rest well.");
        patch({ checkinDone: true, view: "home" });
      },
      openApp: (app) =>
        update((s) =>
          s.locking && app.locked
            ? { view: "blocked", blockedApp: app, blockedReturn: s.view }
            : {},
        ),
      blockDismiss: () => update((s) => ({ view: s.blockedReturn || "home" })),
      toggleAppLock: (id) =>
        update((s) => ({
          apps: s.apps.map((a) => (a.id === id ? { ...a, locked: !a.locked } : a)),
        })),
      startFocus: (mins, earnBack) =>
        setState((s) => {
          const t = (mins ?? s.startMinutes) * 60;
          return {
            ...s,
            view: "focus",
            focusTotal: t,
            focusLeft: t,
            running: true,
            focusDone: false,
            earnBack: !!earnBack,
          };
        }),
      toggleRun: () => update((s) => ({ running: !s.running })),
      skipToEnd: () => patch({ focusLeft: 0, running: false, focusDone: true }),
      finishFocus: () => patch({ view: "home", running: false }),
      enterApp: () => update((s) => ({ view: s.introSeen ? "home" : "intro" })),
      finishIntro: () =>
        update((s) => ({ view: s.isPro ? "home" : "paywall", introSeen: true })),
      // paywall
      goPaywall: () => patch({ view: "paywall" }),
      subscribe: () => {
        cheer("Welcome to Clarity Pro", "Everything's unlocked. Go build the day.");
        patch({ isPro: true, view: "home" });
      },
      dismissPaywall: () => patch({ view: "home" }),
      // daily read
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
            .map((t, i) => ({ id: "pt" + Date.now() + i, text: t, done: false }));
          cheer("Week locked in", "Your 3 projects are set. Protect them.");
          return { ...s, todos: [...s.todos, ...add], view: "home" };
        }),
      toggleTodo: (id) =>
        update((s) => ({
          todos: s.todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
        })),
      addTodo: () =>
        setState((s) => {
          const v = (s.todoDraft || "").trim();
          if (!v) return s;
          return {
            ...s,
            todos: [...s.todos, { id: "t" + Date.now(), text: v, done: false }],
            todoDraft: "",
          };
        }),
      setTodoDraft: (v) => patch({ todoDraft: v }),
      setTaskDraft: (v) => patch({ taskDraft: v }),
      saveTask: () =>
        update((s) => {
          note("Focus set", "Everything you lock away is protecting this.");
          return { task: s.taskDraft || s.task, view: "home" };
        }),
      openTask: () => update((s) => ({ view: "task", taskDraft: s.task })),
    }),
    [patch, update],
  );

  const value = useMemo(() => ({ state, actions }), [state, actions]);
  return <ClarityContext.Provider value={value}>{children}</ClarityContext.Provider>;
}

export function useClarity(): ClarityContextValue {
  const ctx = useContext(ClarityContext);
  if (!ctx) throw new Error("useClarity must be used inside <ClarityProvider>");
  return ctx;
}

// ---- derived helpers ----
export function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const ss = sec % 60;
  return m + ":" + String(ss).padStart(2, "0");
}
