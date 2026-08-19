// Clarity — pure derivations over the logged history.
// Nothing in here touches React or storage, so every number the app shows
// can be reasoned about (and tested) on its own.

export interface Session {
  id: string;
  /** epoch ms the session began */
  startedAt: number;
  /** minutes the user committed to */
  planned: number;
  /** seconds actually spent focused */
  focusedSeconds: number;
  task: string;
  /** reached zero rather than being abandoned */
  completed: boolean;
  /** ran in Commit Mode — no pause, no early exit */
  strict: boolean;
  /** what the user said they did, captured on finish */
  note?: string;
}

export interface DayLog {
  /** YYYY-MM-DD, local */
  date: string;
  focusedSeconds: number;
  sessions: number;
  completedSessions: number;
  /** times a locked app was opened */
  pulls: number;
  /** times the user backed off at the block screen */
  holds: number;
  todosDone: number;
  todosTotal: number;
}

export type DayMap = Record<string, DayLog>;

// ── dates ────────────────────────────────────────────────────────────

/** Local YYYY-MM-DD. Never use toISOString here — it shifts the day in most timezones. */
export function dateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: string, delta: number): string {
  const d = parseKey(key);
  d.setDate(d.getDate() + delta);
  return dateKey(d);
}

export function isToday(key: string): boolean {
  return key === dateKey();
}

export function isFuture(key: string): boolean {
  return parseKey(key).getTime() > parseKey(dateKey()).getTime();
}

const DAY_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Wed, Jul 22" — or "Today" / "Yesterday" when that reads better. */
export function formatDayLabel(key: string): string {
  if (isToday(key)) return "Today";
  if (key === addDays(dateKey(), -1)) return "Yesterday";
  const d = parseKey(key);
  return `${DAY_LONG[d.getDay()].slice(0, 3)}, ${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`;
}

export function dayInitial(key: string): string {
  return DAY_LONG[parseKey(key).getDay()][0];
}

/** Days from today to `key`. Negative once the date has passed. */
export function daysUntil(key: string, from: string = dateKey()): number {
  return Math.round((parseKey(key).getTime() - parseKey(from).getTime()) / 86_400_000);
}

/**
 * A deadline, said the way a person would.
 *
 * Deliberately relative near the date and absolute past a week out — "in 34
 * days" is a number you have to decode, "Sep 10" is one you can act on.
 */
export function formatDue(key: string, from: string = dateKey()): string {
  const n = daysUntil(key, from);
  if (n === 0) return "Due today";
  if (n === 1) return "Due tomorrow";
  if (n === -1) return "1 day late";
  if (n < 0) return `${Math.abs(n)} days late`;
  if (n <= 7) return `Due in ${n} days`;
  const d = parseKey(key);
  return `Due ${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`;
}

/** The 7 day-keys ending at `end`, oldest first. */
export function lastSevenDays(end: string = dateKey()): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(end, i - 6));
}

/** Monday-first week containing `key`, oldest first. */
export function weekOf(key: string = dateKey()): string[] {
  const d = parseKey(key);
  const shift = (d.getDay() + 6) % 7; // Mon = 0
  const monday = addDays(key, -shift);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

// ── day logs ─────────────────────────────────────────────────────────

export function emptyDay(date: string): DayLog {
  return {
    date,
    focusedSeconds: 0,
    sessions: 0,
    completedSessions: 0,
    pulls: 0,
    holds: 0,
    todosDone: 0,
    todosTotal: 0,
  };
}

export function getDay(days: DayMap, key: string): DayLog {
  return days[key] ?? emptyDay(key);
}

// ── streak ───────────────────────────────────────────────────────────

/**
 * A day counts toward the streak once it clears `thresholdMinutes` of focus.
 * Today is never streak-breaking — it is still in progress — so the walk
 * starts at yesterday unless today has already qualified.
 *
 * `frozen` holds day-keys the user spent a streak freeze on. A frozen day
 * bridges the gap but does not itself add to the count: missing a day and
 * paying for it should never look identical to having shown up.
 */
export function computeStreak(
  days: DayMap,
  thresholdMinutes = 10,
  frozen: ReadonlySet<string> = new Set(),
): number {
  const need = thresholdMinutes * 60;
  const earned = (k: string) => getDay(days, k).focusedSeconds >= need;
  const survives = (k: string) => earned(k) || frozen.has(k);

  let cursor = dateKey();
  let streak = earned(cursor) ? 1 : 0;
  cursor = addDays(cursor, -1);

  while (survives(cursor)) {
    if (earned(cursor)) streak += 1;
    cursor = addDays(cursor, -1);
    if (streak > 3650) break; // paranoia against a corrupt map
  }
  return streak;
}

/** The streak the user would lose by not focusing today. 0 when today already counts. */
export function streakAtRisk(
  days: DayMap,
  thresholdMinutes = 10,
  frozen: ReadonlySet<string> = new Set(),
): number {
  const need = thresholdMinutes * 60;
  if (getDay(days, dateKey()).focusedSeconds >= need) return 0;
  return computeStreak(days, thresholdMinutes, frozen);
}

// ── scores ───────────────────────────────────────────────────────────

export interface ClarityScore {
  /** 0–100 */
  score: number;
  focusPct: number;
  taskPct: number;
  holdPct: number;
  /** The floor this day opened on, carried from yesterday. */
  carryover: number;
  /** What today's own activity has earned, ignoring the floor. */
  earned: number;
}

/**
 * A new day never opens at zero.
 *
 * Yesterday's earned score maps onto a 5–25 floor for today: a day you gave
 * everything to starts the next one at 25, a day you gave nothing to still
 * starts at 5. The floor is deliberately small — a running start, not a free
 * ride, and today still has to be earned on its own.
 *
 * Note this reads yesterday's *earned* figure, not its displayed one. Feeding
 * the displayed score back in would let the floor compound on itself, and a
 * week of doing nothing would drift upward on its own inertia.
 */
export const CARRYOVER_MIN = 5;
export const CARRYOVER_MAX = 25;

export function carryoverFrom(yesterday: DayLog | undefined, goalMinutes: number): number {
  if (!yesterday) return CARRYOVER_MIN;
  const earned = earnedScore(yesterday, goalMinutes);
  return Math.round(CARRYOVER_MIN + (earned / 100) * (CARRYOVER_MAX - CARRYOVER_MIN));
}

/** Today's score on its own merits, before any carried floor is applied. */
function earnedScore(day: DayLog, goalMinutes: number): number {
  const goalSeconds = Math.max(1, goalMinutes * 60);
  const focusPct = Math.min(1, day.focusedSeconds / goalSeconds);
  const taskPct = day.todosTotal ? day.todosDone / day.todosTotal : 0;
  const holdPct = day.pulls ? day.holds / day.pulls : 1;

  const parts: [number, number][] = [[focusPct, 0.6]];
  if (day.todosTotal > 0) parts.push([taskPct, 0.25]);
  if (day.pulls > 0) parts.push([holdPct, 0.15]);

  const totalWeight = parts.reduce((sum, [, w]) => sum + w, 0);
  const weighted = parts.reduce((sum, [v, w]) => sum + v * w, 0);
  return Math.max(0, Math.min(100, Math.round((weighted / totalWeight) * 100)));
}

/**
 * One honest number for the day, weighted toward the thing the app is for.
 *   60% — focus minutes against the daily goal
 *   25% — tasks finished
 *   15% — how often you held when a locked app pulled at you
 *
 * Only components that actually apply are counted, and the weights are
 * renormalised over those. A day with no list and no pulls is scored purely on
 * focus — otherwise doing nothing would award free credit for the tasks you
 * never wrote down and the temptations that never came, and the score would
 * open at 15% on an untouched morning.
 */
export function clarityScore(day: DayLog, goalMinutes: number, carryover = 0): ClarityScore {
  const goalSeconds = Math.max(1, goalMinutes * 60);
  const focusPct = Math.min(1, day.focusedSeconds / goalSeconds);
  const taskPct = day.todosTotal ? day.todosDone / day.todosTotal : 0;
  const holdPct = day.pulls ? day.holds / day.pulls : 1;

  const earned = earnedScore(day, goalMinutes);
  // The floor lifts a quiet morning off zero; it never caps a good day.
  const score = Math.max(0, Math.min(100, Math.max(earned, carryover)));

  return { score, focusPct, taskPct, holdPct, carryover, earned };
}

// ── aggregates ───────────────────────────────────────────────────────

export interface WeekTotals {
  focusedSeconds: number;
  sessions: number;
  completedSessions: number;
  pulls: number;
  holds: number;
  bestDayKey: string | null;
}

export function totalsFor(days: DayMap, keys: string[]): WeekTotals {
  let focusedSeconds = 0;
  let sessions = 0;
  let completedSessions = 0;
  let pulls = 0;
  let holds = 0;
  let bestDayKey: string | null = null;
  let best = 0;

  for (const k of keys) {
    const d = getDay(days, k);
    focusedSeconds += d.focusedSeconds;
    sessions += d.sessions;
    completedSessions += d.completedSessions;
    pulls += d.pulls;
    holds += d.holds;
    if (d.focusedSeconds > best) {
      best = d.focusedSeconds;
      bestDayKey = k;
    }
  }
  return { focusedSeconds, sessions, completedSessions, pulls, holds, bestDayKey };
}

/** Percentage change in focus time vs the previous 7 days. null when there is no baseline. */
export function weekOverWeekDelta(days: DayMap, end: string = dateKey()): number | null {
  const thisWeek = totalsFor(days, lastSevenDays(end)).focusedSeconds;
  const prevWeek = totalsFor(days, lastSevenDays(addDays(end, -7))).focusedSeconds;
  if (!prevWeek) return null;
  return Math.round(((thisWeek - prevWeek) / prevWeek) * 100);
}

// ── formatting ───────────────────────────────────────────────────────

/** "2h 40m", "40m", "0m" — the shape the UI wants everywhere. */
export function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds / 60));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (!h) return `${m}m`;
  if (!m) return `${h}h`;
  return `${h}h ${m}m`;
}

/** "25:00" for the timer readout. */
export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

// ── milestones ───────────────────────────────────────────────────────

export interface Milestone {
  id: string;
  name: string;
  detail: string;
  /** 0–1 */
  progress: number;
  earned: boolean;
}

export function milestones(days: DayMap, sessions: Session[]): Milestone[] {
  const allKeys = Object.keys(days);
  const totals = totalsFor(days, allKeys);
  const streak = computeStreak(days);
  const totalHours = totals.focusedSeconds / 3600;
  const strictDone = sessions.filter((s) => s.strict && s.completed).length;
  const longest = sessions.reduce((m, s) => Math.max(m, s.focusedSeconds), 0) / 60;
  const cleanDays = allKeys.filter((k) => {
    const d = days[k];
    return d.pulls > 0 && d.holds === d.pulls;
  }).length;

  const make = (id: string, name: string, detail: string, value: number, target: number): Milestone => ({
    id,
    name,
    detail,
    progress: Math.min(1, value / target),
    earned: value >= target,
  });

  return [
    make("first-block", "First block", "Finish one focus session", totals.completedSessions, 1),
    make("ten-hours", "Ten hours deep", "Focus for 10 hours in total", totalHours, 10),
    make("week-streak", "Seven straight", "Hold a 7-day streak", streak, 7),
    make("commit", "Committed", "Finish 5 sessions in Commit Mode", strictDone, 5),
    make("long-haul", "Long haul", "Focus for 90 minutes in one sitting", longest, 90),
    make("unmoved", "Unmoved", "Hold every pull on 5 separate days", cleanDays, 5),
  ];
}
