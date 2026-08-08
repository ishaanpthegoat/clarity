// Clarity server — the daily job and the per-user assembly.
//
// The split that keeps this affordable:
//
//   runDailyJob   — fetches RSS and calls Claude ONCE PER CATEGORY. Runs on a
//                   schedule, six times a day total regardless of user count.
//   buildDigest   — assembles one person's digest from summaries that already
//                   exist. Zero model calls, so it stays free at any scale.
//
// Ten users or ten thousand, the model bill is the same.
import { generateDigestSummary, type UserProfile } from "./ai.js";
import { CATEGORIES, fetchArticles } from "./feeds.js";
import { store, type CategoryDigest } from "./store.js";

export function todayKey(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export interface JobResult {
  day: string;
  generated: string[];
  skipped: string[];
  failed: string[];
}

/**
 * Summarise every category that today's cache is missing.
 *
 * Idempotent: already-summarised categories are skipped, so running it twice
 * costs nothing and a crashed run can simply be re-run.
 */
export async function runDailyJob(
  categories: string[] = CATEGORIES,
  day = todayKey(),
): Promise<JobResult> {
  const existing = await store.getDigests(day);
  const result: JobResult = { day, generated: [], skipped: [], failed: [] };

  for (const category of categories) {
    if (existing[category]) {
      result.skipped.push(category);
      continue;
    }

    try {
      const articles = await fetchArticles(category);
      if (!articles.length) {
        result.failed.push(category);
        console.warn(`[job] ${category}: no articles, skipping`);
        continue;
      }

      const summary = await generateDigestSummary(articles, [category]);

      await store.saveDigest(day, {
        category,
        summary,
        // Six rather than three — the client ranks these per user.
        headlines: articles.slice(0, 6).map((a) => ({
          title: a.title,
          source: a.source,
          url: a.url,
        })),
        generatedAt: new Date().toISOString(),
      });

      result.generated.push(category);
      console.log(`[job] ${category}: summarised ${articles.length} articles`);
    } catch (error) {
      result.failed.push(category);
      console.error(`[job] ${category} failed:`, error);
    }
  }

  return result;
}

export interface UserDigest {
  day: string;
  entries: CategoryDigest[];
  readMins: number;
}

/**
 * One person's digest. No generation happens here.
 *
 * If the job has not run for a category yet (a cold start, or a new interest
 * added mid-day) it is generated on demand — once — and cached for everyone
 * else who follows it.
 */
export async function buildDigest(
  profile: UserProfile,
  day = todayKey(),
): Promise<UserDigest> {
  // Following nothing means an empty digest, not a default one — handing
  // someone categories they never chose is the behaviour this app exists to
  // replace. Mirrors src/lib/digest.ts.
  if (!profile.interests.length) return { day, entries: [], readMins: 0 };

  const categories = profile.interests;

  let available = await store.getDigests(day);
  const missing = categories.filter((c) => !available[c]);
  if (missing.length) {
    await runDailyJob(missing, day);
    available = await store.getDigests(day);
  }

  const entries = categories.map((c) => available[c]).filter(Boolean);
  const words = entries.reduce((n, e) => n + e.summary.split(/\s+/).length, 0);

  return { day, entries, readMins: Math.max(1, Math.round(words / 200)) };
}
