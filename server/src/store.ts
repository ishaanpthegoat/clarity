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

interface Data {
  /** Opaque user id → their profile. Never keyed by anything personal. */
  profiles: Record<string, UserProfile>;
  digests: DigestCache;
}

const FILE = resolve(process.env.DATA_FILE ?? "./data/clarity.json");
const EMPTY: Data = { profiles: {}, digests: {} };

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

  /** Test hook — drops the in-memory copy so the next read hits disk. */
  reset(): void {
    cache = null;
  },
};
