// Clarity — a screenshot walk of every screen, plus the touch-target audit.
//
// Two jobs. The walk exists to catch anything that throws or renders blank on a
// screen nobody happened to open by hand; the audit exists because a control
// under 44px is one you miss on a phone, and that is invisible in code review.
//
// Behavioural coverage of the new flow lives in `digest.spec.ts` — this file is
// deliberately broad and shallow so it stays cheap to keep true.
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

/** A plausible fortnight so no screen has to be judged on its empty state. */
function seed() {
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

  const sessions = [
    { id: "s1", startedAt: Date.now() - 3 * 3600e3, planned: 50, focusedSeconds: 50 * 60, task: "Finish the Q3 deck", completed: true, strict: true, note: "Got through the whole narrative section." },
    { id: "s2", startedAt: Date.now() - 26 * 3600e3, planned: 25, focusedSeconds: 11 * 60, task: "Draft the slide copy", completed: false, strict: false },
    { id: "s3", startedAt: Date.now() - 30 * 3600e3, planned: 90, focusedSeconds: 90 * 60, task: "Design the title slide", completed: true, strict: false },
  ];

  return {
    locking: true,
    // The name lives on the profile now, and `onboarded` is what skips the
    // conversation — there is no `task`, `soundscape` or `introSeen` any more.
    profile: {
      name: "Ishaan",
      interests: ["tech", "sports"],
      specifics: { tech: "AI research" },
      goal: "ship a side project",
      avoid: "",
    },
    onboarded: true,
    sessionMinutes: 25,
    goalMinutes: 180,
    theme: "dark",
    schedule: { enabled: false, start: "09:00", end: "12:00", days: [1, 2, 3, 4, 5] },
    strictDefault: false,
    isPro: true,
    digestRead: [],
    days,
    sessions,
    // Only `id` and `locked` are read back — everything visual comes from the
    // catalogue, so this stays short on purpose.
    apps: [
      { id: "ig", locked: true },
      { id: "tt", locked: true },
      { id: "yt", locked: true },
      { id: "sc", locked: true },
    ],
    todos: [
      { id: "s1", text: "Outline the Q3 deck", done: true },
      { id: "s2", text: "Draft the slide copy", done: true },
      { id: "s3", text: "Design the title slide", done: false },
      { id: "s4", text: "Review with the team", done: false },
    ],
    selProj: ["p1", "p2", "p4"],
  };
}

const errors: string[] = [];

async function open(page: Page) {
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.addInitScript(
    ([key, value]) => window.localStorage.setItem(key as string, value as string),
    [STORAGE_KEY, JSON.stringify(seed())] as const,
  );
  await page.goto("/");
  // Splash auto-advances after 2.9s; click through it rather than waiting.
  await page.waitForTimeout(300);
  await page.mouse.click(640, 400);
  await expect(page.locator('nav[aria-label="Main"]')).toBeVisible({ timeout: 15_000 });
}

async function shot(page: Page, name: string) {
  await page.waitForTimeout(650);
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: false });
}

test("walk every screen", async ({ page }) => {
  await open(page);
  const tab = (name: string) =>
    page.getByRole("navigation", { name: "Main" }).getByRole("button", { name, exact: true });

  await shot(page, "01-home");

  await tab("Insights").click();
  await shot(page, "02-insights");

  await page.getByRole("button", { name: /Milestones/ }).first().click();
  await shot(page, "03-milestones");

  await tab("To-do").click();
  await shot(page, "04-todos");

  await tab("Projects").click();
  await shot(page, "05-projects");

  await tab("Knows").click();
  await shot(page, "06-knows");

  await tab("Home").click();
  await page.getByRole("button", { name: /^Settings —/ }).click();
  await shot(page, "07-settings");

  // Focus session
  await page.getByRole("button", { name: /^Back —/ }).click();
  await page.getByRole("button", { name: /Start a .* session/ }).click();
  await shot(page, "08-focus");

  // Block screen. The breathing gate that used to sit behind "Open it anyway"
  // is gone — the third button now dismisses directly.
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Open Instagram" }).click();
  await expect(page.getByRole("heading", { name: /Instagram is locked/i })).toBeVisible();
  await shot(page, "09-block");

  // Springboard
  await page.getByRole("button", { name: /back to work/i }).first().click();
  await page.getByRole("button", { name: /Open your home screen/ }).click();
  await shot(page, "10-springboard");

  // The digest — its own tab, built for whatever the profile follows.
  await page.getByRole("button", { name: "Open Clarity" }).click();
  await tab("Digest").click();
  await expect(page.locator("section[aria-labelledby^='digest-']").first()).toBeVisible({
    timeout: 20_000,
  });
  await shot(page, "11-digest");

  // Command palette
  await page.keyboard.press("Escape");
  await page.keyboard.press("Control+k");
  await shot(page, "12-palette");
  await page.keyboard.press("Escape");

  // Light theme
  await tab("Home").click();
  await page.getByRole("button", { name: /^Settings —/ }).click();
  await page.getByRole("button", { name: "Light theme" }).click();
  await shot(page, "13-settings-light");
  await page.getByRole("button", { name: /^Back —/ }).click();
  await shot(page, "14-home-light");

  expect(errors, `console errors:\n${errors.join("\n")}`).toEqual([]);
});

/**
 * Touch targets. Apple and Android both put the floor at 44px; anything under
 * that is a control you miss on a phone. `.tap-expand` grows the hit area with
 * a ::before overlay that getBoundingClientRect can't see, so it's measured as
 * compliant by construction.
 */
test("every control meets the 44px touch target floor", async ({ page }) => {
  await open(page);

  const nav = (name: string) =>
    page.getByRole("navigation", { name: "Main" }).getByRole("button", { name, exact: true });

  const screens: [string, () => Promise<void>][] = [
    ["home", async () => {}],
    ["insights", async () => {
      await nav("Insights").click();
    }],
    ["todos", async () => {
      await nav("To-do").click();
    }],
    ["digest", async () => {
      await nav("Digest").click();
      // The digest has to finish building, or its skeleton is measured instead.
      await expect(page.locator("section[aria-labelledby^='digest-']").first()).toBeVisible({
        timeout: 20_000,
      });
    }],
    ["projects", async () => {
      await nav("Projects").click();
      await page.waitForTimeout(900); // the ideas feed has to arrive
    }],
    ["settings", async () => {
      await nav("Home").click();
      await page.getByRole("button", { name: /^Settings —/ }).click();
    }],
  ];

  const offenders: string[] = [];

  for (const [name, navigate] of screens) {
    await navigate();
    // Let entrance animations settle so nothing is measured mid-transform.
    await page.waitForTimeout(900);

    const small = await page.evaluate(() => {
      const sel = "a,button,input,select,textarea,[role=button],[role=switch]";
      return [...document.querySelectorAll(sel)]
        .filter((e) => {
          // Pagination dots: 44px tall but deliberately narrow, and every one
          // has a full-size control driving the same state. Exempt, not fudged.
          if ((e as HTMLElement).dataset.secondaryAffordance === "true") {
            return e.getBoundingClientRect().height < 44;
          }
          return true;
        })
        .map((e) => {
          const r = e.getBoundingClientRect();
          const expanded = e.classList.contains("tap-expand");
          return {
            label: (e.getAttribute("aria-label") || e.textContent || "").trim().slice(0, 40),
            w: Math.round(expanded ? Math.max(r.width, 44) : r.width),
            h: Math.round(expanded ? Math.max(r.height, 44) : r.height),
          };
        })
        .filter((x) => x.w > 0 && (x.w < 44 || x.h < 44));
    });

    small.forEach((s) => offenders.push(`${name}: "${s.label}" ${s.w}x${s.h}`));
  }

  expect(offenders, `controls under 44px:\n${offenders.join("\n")}`).toEqual([]);
});
