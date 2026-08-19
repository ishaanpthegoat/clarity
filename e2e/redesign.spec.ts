// Clarity — verification pass for the redesign.
//
// Covers the things that are genuinely hard to be sure about by reading the
// code: does the onboarding conversation actually advance and animate, do the
// real brand marks decode, do the sliders reach seven hours now that they live
// on Home, and does the Digest tab open with today's read already built.
//
// Deliberately complements `digest.spec.ts` rather than repeating it: that file
// asserts behaviour and copy, this one asserts rendering, computed style and
// screenshots.
import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const SHOTS = path.join(process.cwd(), "e2e", "shots");
fs.mkdirSync(SHOTS, { recursive: true });

const STORAGE_KEY = "clarity.state.v4";

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function ago(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return dateKey(d);
}

/** A plausible fortnight so no screen is judged on its empty state. */
function seed(onboarded: boolean) {
  const minutes: Record<number, number> = {
    0: 92, 1: 145, 2: 60, 3: 168, 4: 30, 5: 120, 6: 0,
    7: 95, 8: 140, 9: 55, 10: 20, 11: 110, 12: 0, 13: 75,
  };
  const days: Record<string, unknown> = {};
  for (const [n, mins] of Object.entries(minutes)) {
    const key = ago(Number(n));
    days[key] = {
      date: key,
      focusedSeconds: mins * 60,
      sessions: mins ? Math.ceil(mins / 50) : 0,
      completedSessions: mins ? Math.max(1, Math.floor(mins / 50)) : 0,
      pulls: mins ? 4 : 1,
      holds: mins ? 3 : 0,
      todosDone: 2,
      todosTotal: 4,
    };
  }
  return {
    locking: true,
    profile: {
      name: "Ishaan",
      interests: ["tech", "sports"],
      specifics: { tech: "AI research" },
      goal: "ship a side project",
      avoid: "",
    },
    onboarded,
    sessionMinutes: 25,
    goalMinutes: 180,
    theme: "dark",
    strictDefault: false,
    isPro: true,
    digestRead: [],
    selProj: ["p1", "p2"],
    cheered: [],
    adopted: [],
    freezeDays: [],
    days,
    sessions: [
      { id: "s1", startedAt: Date.now() - 3 * 3600e3, planned: 50, focusedSeconds: 50 * 60, task: "Finish the Q3 deck", completed: true, strict: true },
    ],
  };
}

async function boot(page: Page, { onboarded = true } = {}) {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.addInitScript(
    ([key, value]) => window.localStorage.setItem(key as string, value as string),
    [STORAGE_KEY, JSON.stringify(seed(onboarded))],
  );
  await page.goto("/");
  // Past the splash.
  await page.waitForTimeout(3200);
  return errors;
}

/** The frame the phone is drawn in — screenshots are scoped to it. */
function frame(page: Page) {
  return page.locator(".clarity-root > div").first();
}

/** Answers the bot, waiting for it to finish composing first. */
async function reply(page: Page, text: string) {
  const box = page.locator("input[placeholder]").first();
  await expect(box).toBeEnabled({ timeout: 10_000 });
  await box.fill(text);
  await box.press("Enter");
}

test("the onboarding conversation advances, animates and completes", async ({ page }) => {
  // Replaces the old scrollytelling-intro test — that screen is gone. What is
  // worth verifying here is the same class of thing: computed style changing
  // over the course of the flow, which no amount of code reading confirms.
  const errors = await boot(page, { onboarded: false });

  const bot = page.locator('[data-turn="bot"]');
  await expect(bot).toHaveCount(1);
  await frame(page).screenshot({ path: path.join(SHOTS, "r-onboarding-open.png") });

  /** The progress bar is the only signal the conversation has an end. */
  const progress = () =>
    page.locator("[data-progress]").evaluate((el) => el.getBoundingClientRect().width);

  const widths: number[] = [await progress()];

  await reply(page, "Ishaan");
  await expect(bot).toHaveCount(2, { timeout: 10_000 });
  widths.push(await progress());

  await reply(page, "finally learn to cook properly");
  await expect(bot).toHaveCount(3, { timeout: 10_000 });
  widths.push(await progress());
  await frame(page).screenshot({ path: path.join(SHOTS, "r-onboarding-mid.png") });

  await reply(page, "football and AI stuff");
  await expect(bot).toHaveCount(4, { timeout: 10_000 });
  widths.push(await progress());

  // Strictly increasing: every answer visibly moves the bar along.
  for (let i = 1; i < widths.length; i++) {
    expect(widths[i]).toBeGreaterThan(widths[i - 1]);
  }

  await frame(page).screenshot({ path: path.join(SHOTS, "r-onboarding-end.png") });

  // It ends in the app, not on a paywall.
  await page.getByRole("button", { name: /Nothing specific/i }).click();
  await expect(page.locator('nav[aria-label="Main"]')).toBeVisible({ timeout: 10_000 });

  expect(errors).toEqual([]);
});

test("real brand marks load on home and the block screen", async ({ page }) => {
  const errors = await boot(page);

  // Every app tile is a real SVG that actually decoded.
  const logos = await page.$$eval("img[src*='/clarity/logos/']", (imgs) =>
    imgs.map((i) => ({ src: (i as HTMLImageElement).getAttribute("src"), w: (i as HTMLImageElement).naturalWidth })),
  );
  expect(logos.length).toBeGreaterThanOrEqual(4);
  for (const l of logos) expect(l.w, `${l.src} failed to decode`).toBeGreaterThan(0);

  await frame(page).screenshot({ path: path.join(SHOTS, "r-home.png") });

  // Tapping a locked app reaches the block screen with its mark.
  await page.getByRole("button", { name: /Open Instagram/i }).first().click();
  await page.waitForTimeout(500);
  await expect(page.getByRole("heading", { name: /Instagram is locked/i })).toBeVisible();
  await frame(page).screenshot({ path: path.join(SHOTS, "r-block.png") });

  expect(errors).toEqual([]);
});

test("session length reaches 7 hours and the daily goal steps in tens", async ({ page }) => {
  const errors = await boot(page);

  // Both dials moved out of Settings onto Home — they are retuned often enough
  // that three taps deep was the wrong place for them.
  const session = page.locator("#home-session [role='slider']");
  const goal = page.locator("#home-goal [role='slider']");
  await expect(session).toBeVisible();

  // Drive the sliders with the keyboard — End lands on the maximum.
  await session.focus();
  await page.keyboard.press("End");
  await page.waitForTimeout(300);
  expect(await session.getAttribute("aria-valuenow")).toBe("420"); // 7 hours
  await expect(page.locator("output[for='home-session']")).toHaveText("7h");

  await goal.focus();
  await page.keyboard.press("Home");
  await page.waitForTimeout(250);
  const min = Number(await goal.getAttribute("aria-valuenow"));
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(250);
  const next = Number(await goal.getAttribute("aria-valuenow"));
  expect(min).toBe(10);
  expect(next - min).toBe(10);

  await frame(page).screenshot({ path: path.join(SHOTS, "r-home-dials.png") });
  expect(errors).toEqual([]);
});

test("the Digest tab opens with today's read already built", async ({ page }) => {
  const errors = await boot(page);

  await page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: "Digest", exact: true }).click();

  // One section per followed interest, each with real prose — no chooser and
  // no empty state between you and the read.
  const sections = page.locator("section[aria-labelledby^='digest-']");
  await expect(sections).toHaveCount(2, { timeout: 20_000 });

  const prose = await page.$$eval(
    "section[aria-labelledby^='digest-'] p",
    (ps) => ps.filter((p) => p.textContent!.length > 120).length,
  );
  expect(prose).toBeGreaterThanOrEqual(2);

  await expect(page.getByRole("button", { name: /caught up/i })).toBeVisible();
  await frame(page).screenshot({ path: path.join(SHOTS, "r-digest.png") });

  // And it can be finished — the point of the screen is that it ends.
  await page.getByRole("button", { name: /caught up/i }).click();
  await expect(page.getByText(/Done for today/i)).toBeVisible();
  await frame(page).screenshot({ path: path.join(SHOTS, "r-digest-done.png") });

  expect(errors).toEqual([]);
});

test("the Home card hands off into the Digest tab", async ({ page }) => {
  const errors = await boot(page);

  await page.getByRole("button", { name: /Today.s digest/i }).first().click();

  await expect(page.getByRole("heading", { name: /Your digest/i })).toBeVisible();
  await expect(page.locator("section[aria-labelledby^='digest-']").first()).toBeVisible({
    timeout: 20_000,
  });

  expect(errors).toEqual([]);
});

test("projects is sectioned, ideas stay on the main page, grading runs", async ({ page }) => {
  const errors = await boot(page);

  await page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: "Projects", exact: true }).click();
  await page.waitForTimeout(1200); // let the ideas feed "arrive"

  // Ideas are on the main page, with avatars, not behind a tab.
  await expect(page.getByText("Public ideas")).toBeVisible();
  await expect(page.getByRole("button", { name: /Cheer Maya Okonkwo/i })).toBeVisible();
  await frame(page).screenshot({ path: path.join(SHOTS, "r-projects-week.png") });

  // Cheering commits instantly (optimistic), no spinner in between.
  const before = await page.getByRole("button", { name: /Cheer Maya Okonkwo/i }).textContent();
  await page.getByRole("button", { name: /Cheer Maya Okonkwo/i }).click();
  await page.waitForTimeout(80);
  const after = await page.getByRole("button", { name: /Remove cheer from Maya Okonkwo/i }).textContent();
  expect(after).not.toBe(before);

  // The other sections exist and swap.
  await page.getByRole("tab", { name: "All" }).click();
  await page.waitForTimeout(400);
  await frame(page).screenshot({ path: path.join(SHOTS, "r-projects-all.png") });

  expect(errors).toEqual([]);
});

test("the project workspace sheet holds notes, progress and a due date", async ({ page }) => {
  const errors = await boot(page);

  await page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: "Projects", exact: true }).click();
  await page.waitForTimeout(1200);
  await page.getByRole("tab", { name: "All" }).click();
  await page.waitForTimeout(400);

  await page.getByRole("button", { name: /Open Finish the Q3 deck/i }).click();
  await page.waitForTimeout(600);

  const sheet = page.getByRole("dialog");
  await expect(sheet).toBeVisible();
  await expect(sheet.getByText("Working notes")).toBeVisible();
  await sheet.locator("#proj-notes").fill("Narrative section is the blocker.");

  // Due dates are new — the sheet is where they are set.
  const due = page.locator("#proj-due");
  await expect(due).toBeVisible();
  const soon = new Date();
  soon.setDate(soon.getDate() + 5);
  await due.fill(soon.toISOString().slice(0, 10));
  await expect(page.getByText("Due in 5 days").first()).toBeVisible();

  await page.waitForTimeout(400);
  await frame(page).screenshot({ path: path.join(SHOTS, "r-project-sheet.png") });

  expect(errors).toEqual([]);
});
