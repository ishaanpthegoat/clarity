// One-shot job runner — `npm run job`.
//
// The same work the schedule does, without starting a server. This is what an
// external scheduler (a platform cron, a CI workflow, a systemd timer) should
// invoke on a host where nothing stays running.
import { runDailyJob } from "./digest.js";

const result = await runDailyJob();
console.log(JSON.stringify(result, null, 2));
process.exit(result.failed.length && !result.generated.length ? 1 : 0);
