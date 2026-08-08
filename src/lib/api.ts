// Clarity — the backend client.
//
// Set VITE_API_URL and the app talks to `server/`: real RSS, real Claude, and
// profiles stored off the device. Leave it unset — as the GitHub Pages build
// does — and every call below short-circuits, so the app runs entirely on the
// local templates in `aiService.ts` exactly as before.
//
// That is the whole contract. Nothing above this file knows which mode it is
// in, and both modes are supported paths rather than one being a degraded
// version of the other.
//
//   .env.local  →  VITE_API_URL=http://localhost:8787
import type { ChatTurn, UserProfile } from "./aiService";
import type { DailyDigest } from "./digest";

const BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, "");

export const hasBackend = Boolean(BASE);

const USER_KEY = "clarity.userId";

/**
 * A stable, opaque id for this install.
 *
 * Random and meaningless on purpose: it is the key a profile is stored under,
 * so it must not be derived from anything about the person. No email, no
 * device fingerprint, nothing that survives a reinstall or identifies anyone.
 */
export function userId(): string {
  try {
    const existing = localStorage.getItem(USER_KEY);
    if (existing) return existing;
    const fresh = `u_${crypto.randomUUID()}`;
    localStorage.setItem(USER_KEY, fresh);
    return fresh;
  } catch {
    return "u_anonymous"; // private mode — the profile just won't persist
  }
}

/**
 * A request that is allowed to fail.
 *
 * Every backend call in this app has a local fallback, so a server that is
 * down, slow or simply not deployed should degrade the experience rather than
 * break it. Callers treat `null` as "use the local path".
 */
async function request<T>(path: string, init?: RequestInit): Promise<T | null> {
  if (!BASE) return null;
  try {
    const response = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { "content-type": "application/json", ...init?.headers },
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) {
      console.warn(`[api] ${path} responded ${response.status}`);
      return null;
    }
    return (await response.json()) as T;
  } catch (error) {
    console.warn(`[api] ${path} unreachable, falling back locally:`, error);
    return null;
  }
}

export function apiChatReply(
  history: ChatTurn[],
  message: string,
): Promise<{ message: string } | null> {
  return request("/api/chat-reply", {
    method: "POST",
    body: JSON.stringify({ history, message }),
  });
}

export function apiDigest(profile: UserProfile): Promise<DailyDigest | null> {
  return request("/api/digest", { method: "POST", body: JSON.stringify(profile) });
}

export function apiSaveProfile(profile: UserProfile): Promise<{ ok: boolean } | null> {
  return request(`/api/profile/${userId()}`, {
    method: "POST",
    body: JSON.stringify(profile),
  });
}

export function apiGetProfile(): Promise<UserProfile | null> {
  return request(`/api/profile/${userId()}`);
}
