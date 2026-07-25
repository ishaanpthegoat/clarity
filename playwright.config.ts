import { defineConfig, devices } from "@playwright/test";

// Point at an already-running dev server with CLARITY_URL. Two Claude sessions
// can hold different ports, so hard-coding 5173 makes the suite test whichever
// server happened to win the port rather than the one you just started.
const BASE_URL = process.env.CLARITY_URL ?? "http://localhost:5173";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    // Spread the device preset first — it carries its own viewport, and would
    // otherwise silently override the taller one the phone frame needs.
    ...devices["Desktop Chrome"],
    baseURL: BASE_URL,
    viewport: { width: 1180, height: 940 },
    deviceScaleFactor: 2,
  },
  // Only boot a server when we weren't handed one.
  webServer: process.env.CLARITY_URL
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:5173",
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
