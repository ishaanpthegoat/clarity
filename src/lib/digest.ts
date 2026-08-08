// Clarity — the daily digest.
//
// Two stages, deliberately kept apart:
//
//   1. The DAILY JOB (`runDailyJob`) pulls the newest articles per category and
//      summarises each one ONCE. Per category, not per user — that is what
//      keeps the model spend flat as the user count grows.
//   2. The PER-USER DIGEST (`buildUserDigest`) does no generation at all. It
//      reads whichever of the day's summaries match the person's interests and
//      stitches them into one screen.
//
// On a server the first stage is a cron ("0 5 * * *"), the second is a cheap
// read. Here there is no cron — nothing runs while the tab is closed — so the
// job runs lazily the first time someone opens the app on a new day, and the
// result is cached under that day's key. Same two stages, same call counts;
// only the trigger differs, and only stage one's storage line changes when a
// real backend arrives.

import { generateDigestSummary, type UserProfile } from "./aiService";
import { apiDigest } from "./api";
import { orderedInterests } from "./personalize";
import { fetchArticles, categoryLabel, type FeedArticle } from "./feeds";

export interface CategoryDigest {
  category: string;
  label: string;
  summary: string;
  /** Kept so the card can show what fed the summary, and rank it per person. */
  headlines: { title: string; source: string; url?: string }[];
}

export interface DailyDigest {
  /** ISO day, e.g. "2026-08-07" */
  day: string;
  entries: CategoryDigest[];
  /** Roughly how long the whole thing takes to read. */
  readMins: number;
}

const CACHE_KEY = "clarity.digest.v1";

/** Everything the job has produced, keyed day → category → summary. */
type Cache = Record<string, Record<string, CategoryDigest>>;

function readCache(): Cache {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) ?? "{}") as Cache;
  } catch {
    return {};
  }
}

function writeCache(cache: Cache): void {
  try {
    // Yesterday's digest is never shown, so it is dropped rather than grown.
    const days = Object.keys(cache).sort().slice(-2);
    const trimmed: Cache = {};
    for (const d of days) trimmed[d] = cache[d];
    localStorage.setItem(CACHE_KEY, JSON.stringify(trimmed));
  } catch {
    /* private mode — the digest just gets rebuilt next open */
  }
}

export function todayKey(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/**
 * Stage one. Summarise any of `categories` that today's cache is missing.
 *
 * Already-summarised categories are skipped, so this is safe to call on every
 * app open — it is a no-op once the day's work is done.
 */
export async function runDailyJob(
  categories: string[],
  interests: string[],
  day = todayKey(),
): Promise<Record<string, CategoryDigest>> {
  const cache = readCache();
  const forDay = cache[day] ?? {};
  const missing = categories.filter((c) => !forDay[c]);

  if (missing.length) {
    const built = await Promise.all(
      missing.map(async (category): Promise<CategoryDigest> => {
        const articles: FeedArticle[] = await fetchArticles(category);
        // The one generation call. Once per category, once per day.
        const summary = await generateDigestSummary(articles, interests);
        return {
          category,
          label: categoryLabel(category),
          summary,
          // Six rather than three: the per-user layer ranks these against what
          // the person said they follow, and three leaves it nothing to work
          // with once the avoid-list has taken a couple out.
          headlines: articles.slice(0, 6).map((a) => ({ title: a.title, source: a.source })),
        };
      }),
    );

    for (const entry of built) forDay[entry.category] = entry;
    cache[day] = forDay;
    writeCache(cache);
  }

  return forDay;
}

/**
 * Stage two. One person's digest, assembled from work already done.
 *
 * No AI call happens here — by the time this runs the summaries exist.
 */
export async function buildUserDigest(
  profile: UserProfile,
  day = todayKey(),
): Promise<DailyDigest> {
  // With a backend configured this is where real RSS and a real model come
  // from. The local job below is the fallback, and the only path on a static
  // deploy — both produce the same `DailyDigest`.
  // Following nothing means an empty digest, not a default one. Substituting
  // categories they never chose hands them a feed they didn't ask for — the
  // exact thing this app exists to stop — and it hid the empty state that
  // tells them how to fix it.
  if (!profile.interests.length) return { day, entries: [], readMins: 0 };

  const remote = await apiDigest(profile);
  if (remote?.entries?.length) return remote;

  // Categories they were specific about lead — being specific is the clearest
  // signal of what someone actually came for.
  const categories = orderedInterests(profile);
  const summaries = await runDailyJob(categories, profile.interests, day);

  const entries = categories.map((c) => summaries[c]).filter(Boolean);

  // ~40 words a sentence-heavy paragraph, ~200 wpm. Deliberately conservative:
  // the promise on the card is "under two minutes" and it should hold.
  const words = entries.reduce((n, e) => n + e.summary.split(/\s+/).length, 0);

  return {
    day,
    entries,
    readMins: Math.max(1, Math.round(words / 200)),
  };
}

/** True once today's digest has been read end to end. */
export function digestKeyFor(day: string): string {
  return `digest-${day}`;
}
