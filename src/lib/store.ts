// Local state management for MindLock onboarding + app state
// Uses localStorage for fast synchronous reads + Capacitor Preferences
// as a persistent native backup that survives WebView storage clears.

import { Preferences } from "@capacitor/preferences";

export interface CheckInSlot {
  id: string;
  time: string;   // HH:MM format
  label: string;
  enabled: boolean;
}

export interface DailyEntry {
  date: string;
  feeling: number;
  content: { type: string; content: string; author?: string };
  microAction: string;
  intention?: string;
}

export interface SavedContent {
  id: string;
  date: string;
  type: string;
  content: string;
  author?: string;
  microAction?: string;
}

export interface AppState {
  name: string;
  goals: string[];
  blockers: string[];
  lockedApps: string[];
  onboardingComplete: boolean;
  // New onboarding fields
  activityLevel: string;
  motivationLevel: string;
  commitmentLevel: string;
  deeperStruggles: string[];
  commitmentMade: boolean;
  lockTimes: { morning: string; afternoon: string; evening: string }; // legacy
  lockTimesEnabled: { morning: boolean; afternoon: boolean; evening: boolean }; // legacy
  checkInSchedule: CheckInSlot[];
  screenTimeConnected: boolean;
  // Existing streak/content fields
  streak: number;
  longestStreak: number;
  lastCheckInDate: string | null;
  unlockCount: number;
  todayContent: { type: string; content: string; author?: string } | null;
  todayMessage: string | null;
  todayMicroAction: string | null;
  moodHistory: { date: string; feeling: number }[];
  // New history
  dailyHistory: DailyEntry[];
  // Saved/bookmarked content
  savedContent: SavedContent[];
  // Content deduplication: track recently shown content IDs
  recentContentIds: { id: number; date: string }[];
  // Micro-action deduplication: track recent micro-action strings
  recentMicroActions: { text: string; date: string }[];
  // Theme customization
  accentColor: string;
  backgroundTheme: string;
  // Theme drops — collectible themes
  themeInventory: string[];
  activeThemeDrop: string | null;
}

const STORAGE_KEY = "mindlock_state";

const defaultState: AppState = {
  name: "",
  goals: [],
  blockers: [],
  lockedApps: [],
  onboardingComplete: false,
  activityLevel: "",
  motivationLevel: "",
  commitmentLevel: "",
  deeperStruggles: [],
  commitmentMade: false,
  lockTimes: { morning: "07:00", afternoon: "13:00", evening: "20:00" },
  lockTimesEnabled: { morning: true, afternoon: false, evening: false },
  checkInSchedule: [
    { id: "morning", time: "07:00", label: "Morning", enabled: true },
    { id: "afternoon", time: "13:00", label: "Afternoon", enabled: false },
    { id: "evening", time: "20:00", label: "Evening", enabled: false },
  ],
  screenTimeConnected: false,
  streak: 0,
  longestStreak: 0,
  lastCheckInDate: null,
  unlockCount: 0,
  todayContent: null,
  todayMessage: null,
  todayMicroAction: null,
  moodHistory: [],
  dailyHistory: [],
  savedContent: [],
  recentContentIds: [],
  recentMicroActions: [],
  accentColor: "gold",
  backgroundTheme: "dark",
  themeInventory: [],
  activeThemeDrop: null,
};

/** Parse raw JSON string into an AppState, applying migrations */
function parseState(raw: string): AppState {
  const parsed = { ...defaultState, ...JSON.parse(raw) };
  // Migrate legacy lockTimes to checkInSchedule if needed
  if (!parsed.checkInSchedule || parsed.checkInSchedule.length === 0) {
    const lt = parsed.lockTimes || defaultState.lockTimes;
    const lte = parsed.lockTimesEnabled || defaultState.lockTimesEnabled;
    parsed.checkInSchedule = [
      { id: "morning", time: lt.morning, label: "Morning", enabled: lte.morning },
      { id: "afternoon", time: lt.afternoon, label: "Afternoon", enabled: lte.afternoon },
      { id: "evening", time: lt.evening, label: "Evening", enabled: lte.evening },
    ];
  }
  return parsed;
}

/**
 * Initialize the store on app boot.
 * If localStorage was wiped (e.g. after a device restart), restore from
 * the Capacitor Preferences native backup so no user data is lost.
 * Call this once before any component reads state.
 */
export async function initStore(): Promise<void> {
  try {
    const local = localStorage.getItem(STORAGE_KEY);
    if (!local) {
      // localStorage is empty — try to restore from native backup
      const { value } = await Preferences.get({ key: STORAGE_KEY });
      if (value) {
        localStorage.setItem(STORAGE_KEY, value);
        console.log("[MindLock] Restored state from native backup");
      }
    } else {
      // localStorage exists — make sure native backup is in sync
      await Preferences.set({ key: STORAGE_KEY, value: local });
    }
  } catch (e) {
    // Preferences API not available (e.g. running in plain browser)
    // — that's fine, localStorage is the primary store on web.
    console.debug("[MindLock] Native Preferences unavailable, using localStorage only", e);
  }
}

export function getState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultState };
    return parseState(raw);
  } catch {
    return { ...defaultState };
  }
}

export function setState(partial: Partial<AppState>) {
  const current = getState();
  const next = { ...current, ...partial };
  const json = JSON.stringify(next);
  localStorage.setItem(STORAGE_KEY, json);
  // Async backup to native storage — fire-and-forget
  Preferences.set({ key: STORAGE_KEY, value: json }).catch(() => {});
  return next;
}

export function isToday(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const today = new Date().toISOString().split("T")[0];
  return dateStr === today;
}

export function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

/** Get content IDs shown in the last N days and prune old entries */
export function getRecentContentIds(days = 14): number[] {
  const state = getState();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split("T")[0];

  // Prune entries older than the window
  const fresh = (state.recentContentIds || []).filter(e => e.date >= cutoffStr);
  if (fresh.length !== (state.recentContentIds || []).length) {
    setState({ recentContentIds: fresh });
  }

  return fresh.map(e => e.id);
}

/** Record a content ID as recently shown */
export function trackContentId(id: number) {
  const state = getState();
  const today = todayStr();
  const existing = state.recentContentIds || [];
  // Don't duplicate
  if (existing.some(e => e.id === id && e.date === today)) return;
  setState({ recentContentIds: [...existing, { id, date: today }] });
}

/** Get recently shown micro-action strings (pruned to N days) */
export function getRecentMicroActions(days = 14): string[] {
  const state = getState();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split("T")[0];

  const fresh = (state.recentMicroActions || []).filter(e => e.date >= cutoffStr);
  if (fresh.length !== (state.recentMicroActions || []).length) {
    setState({ recentMicroActions: fresh });
  }

  return fresh.map(e => e.text);
}

/** Record a micro-action string as recently shown */
export function trackMicroAction(text: string) {
  const state = getState();
  const today = todayStr();
  const existing = state.recentMicroActions || [];
  // Don't duplicate same exact text same day
  if (existing.some(e => e.text === text && e.date === today)) return;
  // Keep only last 50 entries max (covers ~14 days of check-ins)
  const updated = [...existing, { text, date: today }].slice(-50);
  setState({ recentMicroActions: updated });
}

/** Remove a saved content item by ID */
export function removeSavedContent(id: string) {
  const state = getState();
  const updated = state.savedContent.filter((s) => s.id !== id);
  setState({ savedContent: updated });
  return updated;
}

/** Unlock a theme drop — returns true if newly added */
export function unlockThemeDrop(id: string): boolean {
  const state = getState();
  if (state.themeInventory.includes(id)) return false;
  setState({ themeInventory: [...state.themeInventory, id] });
  return true;
}

/** Equip or unequip a theme drop */
export function equipThemeDrop(id: string | null) {
  setState({ activeThemeDrop: id });
}

/** Get the next enabled check-in time after now, formatted for display */
export function getNextCheckInTime(): { display: string; raw: string } | null {
  const state = getState();
  const schedule = state.checkInSchedule.filter(s => s.enabled).sort((a, b) => a.time.localeCompare(b.time));
  if (schedule.length === 0) return null;

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  for (const slot of schedule) {
    const [h, m] = slot.time.split(":").map(Number);
    const slotMinutes = h * 60 + m;
    if (slotMinutes > nowMinutes) {
      // Format time for display
      const hour12 = h % 12 || 12;
      const ampm = h >= 12 ? "PM" : "AM";
      const minStr = m === 0 ? "" : `:${m.toString().padStart(2, "0")}`;
      return { display: `${hour12}${minStr} ${ampm}`, raw: slot.time };
    }
  }

  // All check-ins have passed today — return tomorrow's first
  const first = schedule[0];
  const [h, m] = first.time.split(":").map(Number);
  const hour12 = h % 12 || 12;
  const ampm = h >= 12 ? "PM" : "AM";
  const minStr = m === 0 ? "" : `:${m.toString().padStart(2, "0")}`;
  return { display: `${hour12}${minStr} ${ampm} tomorrow`, raw: first.time };
}
