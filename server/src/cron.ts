// Clarity server — the daily schedule.
//
// A plain timer rather than a cron dependency: there is exactly one job, it
// runs once a day, and `setTimeout` models that in twenty lines with nothing
// to keep updated.
//
// This assumes a long-lived process (a VM, a container, `npm start`). On a
// serverless host the process does not stay alive between requests, so use
// that platform's scheduler instead and point it at `POST /api/job/run`:
//
//   Vercel      — vercel.json  { "crons": [{ "path": "/api/job/run", "schedule": "0 5 * * *" }] }
//   Cloudflare  — wrangler.toml  [triggers] crons = ["0 5 * * *"]
//   GitHub      — a workflow on: schedule that curls the route with JOB_TOKEN
import { runDailyJob } from "./digest.js";

/** Local hour to run at. Early enough that the digest is waiting at breakfast. */
const HOUR = Number(process.env.JOB_HOUR ?? 5);

function msUntilNextRun(now = new Date()): number {
  const next = new Date(now);
  next.setHours(HOUR, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next.getTime() - now.getTime();
}

async function run(): Promise<void> {
  console.log("[cron] starting daily job");
  try {
    const result = await runDailyJob();
    console.log(
      `[cron] done — generated ${result.generated.length}, skipped ${result.skipped.length}, failed ${result.failed.length}`,
    );
  } catch (error) {
    // Never let a bad run kill the process; tomorrow's is already scheduled.
    console.error("[cron] job threw:", error);
  }
}

export function startCron(): void {
  if (process.env.DISABLE_CRON === "1") {
    console.log("[cron] disabled");
    return;
  }

  const schedule = () => {
    const wait = msUntilNextRun();
    console.log(`[cron] next run in ${Math.round(wait / 60_000)} min`);
    setTimeout(() => {
      void run().finally(schedule);
    }, wait).unref?.(); // don't hold the process open on its own
  };

  // A cold start midway through the day would otherwise leave people with no
  // digest until tomorrow. The job is idempotent, so this is free when the
  // day's work is already done.
  void run().finally(schedule);
}
