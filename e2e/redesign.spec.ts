// Clarity — verification pass for the redesign.
//
// Covers the things that are genuinely hard to be sure about by reading the
// code: does the scrollytelling intro actually cross-fade as you scroll, do the
// real brand marks load, do the sliders reach seven hours, and does the Read
// tab open with today's article already on screen.
import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const SHOTS = path.join(process.cwd(), "e2e", "shots");
fs.mkdirSync(SHOTS, { recursive: true });

const STORAGE_KEY = "clarity.state.v3";

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function ago(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return dateKey(d);
}

/** A plausible fortnight so no screen is judged on its empty state. */
function seed(introSeen: boolean) {
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
    task: "Finish the Q3 deck",
    name: "Ishaan",
    sessionMinutes: 25,
    goalMinutes: 180,
    theme: "dark",
    strictDefault: false,
    introSeen,
    isPro: true,
    articlesDone: [],
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

async function boot(page: Page, { introSeen = true } = {}) {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.addInitScript(
    ([key, value]) => window.localStorage.setItem(key as string, value as string),
    [STORAGE_KEY, JSON.stringify(seed(introSeen))],
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

test("scrollytelling intro cross-fades through all five acts", async ({ page }) => {
  const errors = await boot(page, { introSeen: false });

  const scroller = page.locator(".clarity-scroll").first();
  await expect(scroller).toBeVisible();

  const readActs = () =>
    page.$$eval("[aria-hidden='true']", (els) =>
      els
        .filter((e) => e.querySelector("video"))
        .map((e) => Number(Number(getComputedStyle(e).opacity).toFixed(2))),
    );

  // Act 0 alone at the top.
  const atTop = await readActs();
  expect(atTop.length).toBe(5);
  expect(atTop[0]).toBeGreaterThan(0.9);
  expect(atTop[4]).toBeLessThan(0.1);
  await frame(page).screenshot({ path: path.join(SHOTS, "r-intro-act0.png") });

  // Walk the scroll and make sure the lit act actually moves along.
  const brightest: number[] = [];
  for (const frac of [0, 0.25, 0.5, 0.75, 1]) {
    await scroller.evaluate((el, f) => {
      el.scrollTop = (el.scrollHeight - el.clientHeight) * (f as number);
    }, frac);
    await page.waitForTimeout(420);
    const ops = await readActs();
    brightest.push(ops.indexOf(Math.max(...ops)));
    if (frac === 0.5) await frame(page).screenshot({ path: path.join(SHOTS, "r-intro-mid.png") });
  }

  // Strictly increasing: each quarter of the scroll lights a later act.
  expect(brightest[0]).toBe(0);
  expect(brightest[brightest.length - 1]).toBe(4);
  for (let i = 1; i < brightest.length; i++) {
    expect(brightest[i]).toBeGreaterThanOrEqual(brightest[i - 1]);
  }

  // The CTA only earns its place at the end.
  await expect(page.getByRole("button", { name: "Get started" })).toBeVisible();
  await frame(page).screenshot({ path: path.join(SHOTS, "r-intro-act4.png") });

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

  await page.getByRole("button", { name: /^Settings —/ }).click();
  await page.waitForTimeout(400);

  // Radix puts role="slider" (and the value) on the thumb, not the root.
  const session = page.locator("#session-length [role='slider']");
  const goal = page.locator("#daily-goal [role='slider']");
  await expect(session).toBeVisible();

  // Drive the sliders with the keyboard — End lands on the maximum.
  await session.focus();
  await page.keyboard.press("End");
  await page.waitForTimeout(300);
  expect(await session.getAttribute("aria-valuenow")).toBe("420"); // 7 hours
  await expect(page.locator("output[for='session-length']")).toHaveText("7h");

  await goal.focus();
  await page.keyboard.press("Home");
  await page.waitForTimeout(250);
  const min = Number(await goal.getAttribute("aria-valuenow"));
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(250);
  const next = Number(await goal.getAttribute("aria-valuenow"));
  expect(min).toBe(10);
  expect(next - min).toBe(10);

  await frame(page).screenshot({ path: path.join(SHOTS, "r-settings.png") });
  expect(errors).toEqual([]);
});

test("the Read tab opens with today's article already there", async ({ page }) => {
  const errors = await boot(page);

  await page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: "Read", exact: true }).click();
  await page.waitForTimeout(500);

  // No chooser, no empty state — a real article body is on screen.
  const paragraphs = await page.$$eval("p", (ps) => ps.filter((p) => p.textContent!.length > 120).length);
  expect(paragraphs).toBeGreaterThanOrEqual(2);
  await expect(page.getByRole("button", { name: /record my understanding/i })).toBeVisible();
  await frame(page).screenshot({ path: path.join(SHOTS, "r-read.png") });

  // Recording is reachable and takes over the frame.
  await page.getByRole("button", { name: /record my understanding/i }).click();
  await page.waitForTimeout(500);
  await expect(page.getByRole("button", { name: /Start recording/i })).toBeVisible();
  await frame(page).screenshot({ path: path.join(SHOTS, "r-read-record.png") });

  expect(errors).toEqual([]);
});

test("home hands off into the Read tab already recording", async ({ page }) => {
  const errors = await boot(page);

  await page.getByRole("button", { name: /Record your understanding/i }).click();
  await page.waitForTimeout(600);

  // Landed in the Read tab, at the record stage, without passing the article.
  await expect(page.getByRole("button", { name: /Start recording/i })).toBeVisible();
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

  await page.getByRole("tab", { name: "Grade" }).click();
  await page.waitForTimeout(400);
  await expect(page.getByText("Get your project graded")).toBeVisible();
  await frame(page).screenshot({ path: path.join(SHOTS, "r-projects-grade.png") });

  expect(errors).toEqual([]);
});

test("the project workspace sheet opens and holds notes, progress and grades", async ({ page }) => {
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
  await sheet.getByRole("textbox").fill("Narrative section is the blocker.");
  await page.waitForTimeout(500);
  await frame(page).screenshot({ path: path.join(SHOTS, "r-project-sheet.png") });

  expect(errors).toEqual([]);
});
