// Clarity server — persistence.
//
// A JSON file behind an interface, deliberately. The interface is the point:
// every route talks to `store`, so swapping the file for Postgres, SQLite or
// Redis later is one implementation, not a refactor.
//
// ⚠️ A single JSON file is fine for one process and a handful of users. It
// is NOT fine for production: writes are last-write-wins with no locking, and
// the whole file is held in memory. Move to a real database before this has
// users you would be upset to lose.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { UserProfile } from "./ai.js";

export interface CategoryDigest {
  category: string;
  summary: string;
  headlines: { title: string; source: string; url: string }[];
  generatedAt: string;
}

/** day (ISO) → category → the one summary generated for it that day. */
export type DigestCache = Record<string, Record<string, CategoryDigest>>;

/**
 * One project somebody chose to publish.
 *
 * Mirrors `CommunityProject` in the frontend's `src/lib/community.ts`; the two
 * are kept in sync by hand, the same arrangement `UserProfile` already has.
 * `cheers` is server-owned — the client sends everything but that.
 */
export interface SharedProject {
  id: string;
  author: string;
  initials: string;
  hue: number;
  title: string;
  desc: string;
  progress: number;
  sessionsThisWeek: number;
  minutesThisWeek: number;
  lastActiveAt: string;
  cheers: number;
  outcome?: string;
}

interface Data {
  /** Opaque user id → their profile. Never keyed by anything personal. */
  profiles: Record<string, UserProfile>;
  digests: DigestCache;
  /** Opaque user id → the projects that user has published. */
  shared: Record<string, SharedProject[]>;
}

const FILE = resolve(process.env.DATA_FILE ?? "./data/clarity.json");
const EMPTY: Data = { profiles: {}, digests: {}, shared: {} };

let cache: Data | null = null;
/** Serialises writes so two concurrent requests can't clobber the file. */
let writing: Promise<void> = Promise.resolve();

async function load(): Promise<Data> {
  if (cache) return cache;
  let loaded: Data;
  try {
    loaded = { ...EMPTY, ...JSON.parse(await readFile(FILE, "utf8")) };
  } catch {
    loaded = structuredClone(EMPTY); // first run, or the file was removed
  }
  cache = loaded;
  return loaded;
}

function persist(): Promise<void> {
  writing = writing.then(async () => {
    await mkdir(dirname(FILE), { recursive: true });
    await writeFile(FILE, JSON.stringify(cache, null, 2));
  });
  return writing;
}

/** Keeps the file from growing forever — only today and yesterday are read. */
function prune(digests: DigestCache): DigestCache {
  const keep = Object.keys(digests).sort().slice(-2);
  return Object.fromEntries(keep.map((d) => [d, digests[d]]));
}

export const store = {
  async getProfile(userId: string): Promise<UserProfile | null> {
    return (await load()).profiles[userId] ?? null;
  },

  async saveProfile(userId: string, profile: UserProfile): Promise<void> {
    const data = await load();
    data.profiles[userId] = profile;
    await persist();
  },

  async getDigests(day: string): Promise<Record<string, CategoryDigest>> {
    return (await load()).digests[day] ?? {};
  },

  async saveDigest(day: string, entry: CategoryDigest): Promise<void> {
    const data = await load();
    data.digests[day] = { ...(data.digests[day] ?? {}), [entry.category]: entry };
    data.digests = prune(data.digests);
    await persist();
  },

  /**
   * Every published project, newest activity first.
   *
   * Flattened across users on read rather than kept as one list, so revoking a
   * share is a delete from one user's array and cannot miss a copy elsewhere.
   * Fine at this size; it is a full scan, so it needs an index before the
   * shared set is large. See SPEC-SESSION10.md §3 for what else is missing —
   * this route has no moderation, no rate limit and no abuse story yet.
   */
  async listShared(limit = 50): Promise<SharedProject[]> {
    const data = await load();
    return Object.values(data.shared)
      .flat()
      .sort((a, b) => Date.parse(b.lastActiveAt) - Date.parse(a.lastActiveAt))
      .slice(0, limit);
  },

  /** Publishes, or replaces the caller's earlier copy of the same project. */
  async shareProject(userId: string, project: SharedProject): Promise<void> {
    const data = await load();
    const mine = data.shared[userId] ?? [];
    const existing = mine.find((p) => p.id === project.id);
    data.shared[userId] = [
      ...mine.filter((p) => p.id !== project.id),
      // Cheers belong to the readers, not the author — carry them across a
      // republish rather than letting an update reset someone's count.
      { ...project, cheers: existing?.cheers ?? 0 },
    ];
    await persist();
  },

  /** Test hook — drops the in-memory copy so the next read hits disk. */
  reset(): void {
    cache = null;
  },
};
