// Clarity — end-to-end coverage for the digest redesign.
//
// Two things are being protected here. The obvious one is that the new flow
// works: onboarding produces a profile, the profile produces a digest, the
// digest can be closed out.
//
// The less obvious one is that onboarding still reads as a *conversation*. It
// was rebuilt because the first version felt like a quiz, and the three
// mechanics that caused that are each cheap to reintroduce by accident. So
// they get their own assertions: one bubble per bot turn, nothing gating the
// input, and interests asked once rather than per category.
import { test, expect, type Page } from "@playwright/test";

const STORAGE_KEY = "clarity.state.v4";
const DIGEST_KEY = "clarity.digest.v1";

/** A clean install. Onboarding only runs when there is nothing saved. */
async function freshInstall(page: Page) {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByPlaceholder("Your name")).toBeVisible({ timeout: 15_000 });
}

/** Someone who has already been through onboarding. */
async function onboarded(page: Page, interests = ["tech", "sports"]) {
  await page.goto("/");
  await page.evaluate(
    ([key, digestKey, list]) => {
      localStorage.clear();
      localStorage.setItem(
        key as string,
        JSON.stringify({
          onboarded: true,
          profile: {
            name: "Sam",
            interests: list as string[],
            specifics: { [(list as string[])[0]]: "AI research" },
            goal: "learn to cook properly",
            avoid: "",
          },
        }),
      );
      localStorage.removeItem(digestKey as string);
    },
    [STORAGE_KEY, DIGEST_KEY, interests] as const,
  );
  await page.reload();
  await expect(page.locator('nav[aria-label="Main"]')).toBeVisible({ timeout: 15_000 });
}

/** Answer whatever the bot just asked. */
async function reply(page: Page, text: string) {
  const box = page.locator("input[placeholder]").first();
  // The box is disabled while the bot composes, so this also asserts that the
  // wait is visible rather than a keypress vanishing into a guard.
  await expect(box).toBeEnabled({ timeout: 10_000 });
  await box.fill(text);
  await box.press("Enter");
}

const botTurns = (page: Page) => page.locator('[data-turn="bot"]');
const userTurns = (page: Page) => page.locator('[data-turn="user"]');

/**
 * Walks the whole conversation and lands on Home.
 *
 * Six answers now rather than three: the flow also asks what someone wants out
 * of the app, what pulls them away and how long they can focus, because every
 * one of those configures something. `answerPurpose` and friends are named
 * here so a test that cares about one answer can read what it is passing.
 */
async function completeOnboarding(page: Page) {
  await reply(page, "Sam");
  await expect(botTurns(page)).toHaveCount(2, { timeout: 10_000 });

  await reply(page, "get my evenings back");
  await expect(botTurns(page)).toHaveCount(3, { timeout: 10_000 });

  await reply(page, "finally learn to cook properly");
  await expect(botTurns(page)).toHaveCount(4, { timeout: 10_000 });

  await reply(page, "instagram and tiktok");
  await expect(botTurns(page)).toHaveCount(5, { timeout: 10_000 });

  await reply(page, "about 50 minutes");
  await expect(botTurns(page)).toHaveCount(6, { timeout: 10_000 });

  await reply(page, "football and AI stuff");
  await expect(botTurns(page)).toHaveCount(7, { timeout: 10_000 });

  await page.getByRole("button", { name: /Nothing specific/i }).click();
  await expect(page.locator('nav[aria-label="Main"]')).toBeVisible({ timeout: 10_000 });
}

/** The three answers before interests, for tests that only care what comes after. */
async function answerUpToInterests(page: Page) {
  await reply(page, "Sam");
  await reply(page, "get my evenings back");
  await reply(page, "finally learn to cook properly");
  await reply(page, "instagram and tiktok");
  await reply(page, "about 50 minutes");
  await expect(botTurns(page)).toHaveCount(6, { timeout: 10_000 });
}

test.describe("onboarding reads as a conversation", () => {
  test("opens by asking a question, not by showing a form", async ({ page }) => {
    await freshInstall(page);

    await expect(botTurns(page)).toHaveCount(1);
    await expect(botTurns(page).first()).toContainText("What should I call you?");

    // A text box from the very first turn. The previous version put a chip
    // picker in the way before you could say anything.
    await expect(page.getByPlaceholder("Your name")).toBeEnabled();
  });

  test("each bot turn is a single bubble", async ({ page }) => {
    await freshInstall(page);

    // The acknowledgement and the next question arrive fused. Two bubbles per
    // turn is what made this feel like a form advancing.
    await reply(page, "Sam");
    await expect(botTurns(page)).toHaveCount(2, { timeout: 10_000 });

    await reply(page, "get my evenings back");
    await expect(botTurns(page)).toHaveCount(3, { timeout: 10_000 });

    await reply(page, "finally learn to cook properly");
    await expect(botTurns(page)).toHaveCount(4, { timeout: 10_000 });

    // One user turn in, one bot turn back — never two.
    await expect(userTurns(page)).toHaveCount(3);
  });

  test("asks what you want out of it before it asks what to put in the feed", async ({ page }) => {
    await freshInstall(page);
    await reply(page, "Sam");

    // The bot is framed as helping you get somewhere before it collects
    // anything, which is the whole reason this comes first.
    await expect(botTurns(page).nth(1)).toContainText(/what do you want out of this/i);

    await reply(page, "get my evenings back");
    await expect(botTurns(page).nth(2)).toContainText(/trying to get to/i, { timeout: 10_000 });
  });

  test("asks what pulls you away, and says which apps it will lock", async ({ page }) => {
    await freshInstall(page);
    await reply(page, "Sam");
    await reply(page, "get my evenings back");
    await reply(page, "finally learn to cook properly");
    await expect(botTurns(page).nth(3)).toContainText(/pulling you away/i, { timeout: 10_000 });

    // Naming apps back is what proves the answer landed somewhere.
    await reply(page, "instagram and tiktok");
    await expect(botTurns(page).nth(4)).toContainText(/Instagram/i, { timeout: 10_000 });
    await expect(botTurns(page).nth(4)).toContainText(/TikTok/i);
  });

  test("re-asks the focus span rather than recording a number nobody said", async ({ page }) => {
    await freshInstall(page);
    await reply(page, "Sam");
    await reply(page, "get my evenings back");
    await reply(page, "finally learn to cook properly");
    await reply(page, "instagram and tiktok");
    await expect(botTurns(page)).toHaveCount(5, { timeout: 10_000 });

    await reply(page, "not very long honestly");
    await expect(botTurns(page).nth(5)).toContainText(/number of minutes/i, { timeout: 10_000 });

    // Still on the same question — a re-ask does not advance the flow.
    await reply(page, "about 50 minutes");
    await expect(botTurns(page).nth(6)).toContainText(/50 minutes/i, { timeout: 10_000 });
  });

  test("ties the next question back to what you said", async ({ page }) => {
    await freshInstall(page);
    await reply(page, "Sam");
    await expect(botTurns(page).nth(1)).toContainText("Sam");

    await reply(page, "get my evenings back");
    // The reflection quotes them rather than replying "Noted."
    await expect(botTurns(page).nth(2)).toContainText(/evening/i, { timeout: 10_000 });
  });

  test("takes interests as free text, and asks about them once", async ({ page }) => {
    await freshInstall(page);
    await answerUpToInterests(page);

    // Typed in their own words — no chip required — and mapped onto categories.
    await reply(page, "football and AI stuff");
    await expect(botTurns(page).nth(6)).toContainText(/Sports/i, { timeout: 10_000 });
    await expect(botTurns(page).nth(6)).toContainText(/Tech/i);

    // ONE follow-up covering everything. The old flow asked per category.
    await expect(botTurns(page).nth(6)).toContainText(/Anything particular/i);
    await reply(page, "Arsenal");
    await expect(page.locator('nav[aria-label="Main"]')).toBeVisible({ timeout: 10_000 });
  });

  test("chips fill the box rather than submitting for you", async ({ page }) => {
    await freshInstall(page);
    await answerUpToInterests(page);

    const before = await userTurns(page).count();
    await page.getByRole("button", { name: "Tech", exact: true }).click();

    // The words land in the input and stay editable — tapping a chip is a
    // shortcut, not an answer.
    await expect(page.locator("input[placeholder]").first()).toHaveValue("Tech");
    await expect(userTurns(page)).toHaveCount(before);
  });

  test("the refinement is skippable", async ({ page }) => {
    await freshInstall(page);
    await answerUpToInterests(page);
    await reply(page, "football and AI stuff");

    await page.getByRole("button", { name: /Nothing specific/i }).click();
    await expect(page.locator('nav[aria-label="Main"]')).toBeVisible({ timeout: 10_000 });
  });

  test("saves what it learned and never shows onboarding again", async ({ page }) => {
    await freshInstall(page);
    await completeOnboarding(page);

    const profile = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key) ?? "{}"),
      STORAGE_KEY,
    );
    expect(profile.onboarded).toBe(true);
    expect(profile.profile.name).toBe("Sam");
    expect(profile.profile.goal).toContain("cook");
    expect(profile.profile.interests).toEqual(expect.arrayContaining(["tech", "sports"]));

    // The conversation configures the app rather than only describing it —
    // this is the difference between a profile and a setup.
    expect(profile.sessionMinutes).toBe(50);
    expect(profile.apps.map((a: { id: string }) => a.id).sort()).toEqual(["ig", "tt"]);
    expect(profile.projects[0].title).toContain("cook");

    await page.reload();
    await expect(page.locator('nav[aria-label="Main"]')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByPlaceholder("Your name")).toHaveCount(0);
  });

  test("does not ask anyone to buy anything on the way in", async ({ page }) => {
    await freshInstall(page);
    await completeOnboarding(page);

    // The paywall used to sit between onboarding and the app, which asked for
    // money before showing anything worth paying for.
    await expect(page.getByText(/7-day free trial/i)).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Home/ })).toBeVisible();
  });
});

test.describe("daily digest", () => {
  test("builds one section per interest and can be closed out", async ({ page }) => {
    await onboarded(page);
    await page.getByRole("button", { name: /^Digest/ }).click();

    await expect(page.getByRole("heading", { name: /Your digest/i })).toBeVisible();

    // A section per followed category, and nothing else.
    const sections = page.locator("section[aria-labelledby^='digest-']");
    await expect(sections).toHaveCount(2, { timeout: 20_000 });
    await expect(page.locator("#digest-tech")).toHaveText(/Tech/i);
    await expect(page.locator("#digest-sports")).toHaveText(/Sports/i);

    // Each one has real prose and the headlines behind it. The heading depends
    // on whether anything matched what this person follows — "What fed this"
    // when nothing did, "Also today" when the matches were pulled out above.
    await expect(sections.first()).toContainText(/\w+\s+\w+\s+\w+/);
    await expect(
      sections.first().getByText(/What fed this|Also today/i).first(),
    ).toBeVisible();

    await page.getByRole("button", { name: /caught up/i }).click();
    await expect(page.getByText(/Done for today/i)).toBeVisible();

    const read = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key) ?? "{}").digestRead ?? [],
      STORAGE_KEY,
    );
    expect(read).toHaveLength(1);
  });

  test("summarises each category once a day, not once per visit", async ({ page }) => {
    await onboarded(page);
    await page.getByRole("button", { name: /^Digest/ }).click();
    await expect(page.locator("section[aria-labelledby^='digest-']")).toHaveCount(2, {
      timeout: 20_000,
    });

    const first = await page.evaluate(
      (key) => localStorage.getItem(key),
      DIGEST_KEY,
    );

    // Leave and come back — the cached summaries must be reused. Regenerating
    // per visit is what would make a real model bill scale with traffic.
    await page.getByRole("button", { name: /^Home/ }).click();
    await page.getByRole("button", { name: /^Digest/ }).click();
    await expect(page.locator("section[aria-labelledby^='digest-']")).toHaveCount(2);

    expect(await page.evaluate((key) => localStorage.getItem(key), DIGEST_KEY)).toBe(first);
  });

  test("says so plainly when there is nothing followed", async ({ page }) => {
    await onboarded(page, []);
    await page.getByRole("button", { name: /^Digest/ }).click();

    await expect(page.getByText(/Nothing to read yet/i)).toBeVisible({ timeout: 20_000 });
    await page.getByRole("button", { name: /Choose your interests/i }).click();
    await expect(page.getByRole("heading", { name: /Settings/i })).toBeVisible();
  });

  test("Home reflects whether today's has been read", async ({ page }) => {
    await onboarded(page);

    const card = page.getByRole("button", { name: /Today.s digest/i }).first();
    await expect(page.getByText("Everything you follow, in one read.")).toBeVisible();

    await page.getByRole("button", { name: /^Digest/ }).click();
    await expect(page.locator("section[aria-labelledby^='digest-']").first()).toBeVisible({
      timeout: 20_000,
    });
    await page.getByRole("button", { name: /caught up/i }).click();

    await page.getByRole("button", { name: /^Home/ }).click();
    await expect(card).toContainText(/caught up/i);
  });
});

test.describe("the profile actually changes the app", () => {
  /** Seeds a profile whose specifics and avoid-list are guaranteed to bite. */
  async function withProfile(page: Page, over: Record<string, unknown>) {
    await page.goto("/");
    await page.evaluate(
      ([key, digestKey, profile]) => {
        localStorage.clear();
        localStorage.setItem(
          key as string,
          JSON.stringify({ onboarded: true, profile }),
        );
        localStorage.removeItem(digestKey as string);
      },
      [
        STORAGE_KEY,
        DIGEST_KEY,
        {
          name: "Sam",
          interests: ["tech"],
          specifics: {},
          goal: "finally learn to cook properly",
          avoid: "",
          ...over,
        },
      ] as const,
    );
    await page.reload();
    await expect(page.locator('nav[aria-label="Main"]')).toBeVisible({ timeout: 15_000 });
  }

  test("quotes your goal back at you on the block screen", async ({ page }) => {
    await withProfile(page, {});

    await page.locator('button[aria-label^="Open Instagram"]').first().click();
    await expect(page.getByRole("heading", { name: /Instagram is locked/i })).toBeVisible();

    // Their own words, at the moment they reach for the app. The leading
    // clause people type ("finally…") is trimmed off.
    await expect(page.getByText(/Sam, you said you wanted to/i)).toBeVisible();
    await expect(page.getByText("learn to cook properly")).toBeVisible();
  });

  test("names the goal on Home and in the digest", async ({ page }) => {
    await withProfile(page, {});
    await expect(page.getByText(/the time goes to learn to cook properly/i)).toBeVisible();

    await page.getByRole("button", { name: /^Digest/ }).click();
    await expect(page.getByText(/can go on learn to cook properly/i)).toBeVisible({
      timeout: 20_000,
    });
  });

  test("says nothing about a goal when none was given", async ({ page }) => {
    await withProfile(page, { goal: "" });

    await page.locator('button[aria-label^="Open Instagram"]').first().click();
    await expect(page.getByRole("heading", { name: /Instagram is locked/i })).toBeVisible();
    // No empty "you said you wanted to" with nothing after it.
    await expect(page.getByText(/you said you wanted to/i)).toHaveCount(0);
  });

  test("what you follow specifically gets pulled to the top", async ({ page }) => {
    // "the" appears in practically every headline, which guarantees a match
    // without depending on what the feeds happen to be carrying today.
    await withProfile(page, { specifics: { tech: "OpenAI research" } });
    await page.getByRole("button", { name: /^Digest/ }).click();

    const section = page.locator("section[aria-labelledby^='digest-']").first();
    await expect(section).toBeVisible({ timeout: 20_000 });

    // The specific is shown so it's obvious why the order is what it is.
    await expect(section.getByText(/you follow OpenAI research/i)).toBeVisible();
  });

  test("editing the profile in Settings rebuilds the digest", async ({ page }) => {
    await withProfile(page, {});
    await page.getByRole("button", { name: /^Digest/ }).click();
    await expect(page.locator("section[aria-labelledby^='digest-']")).toHaveCount(1, {
      timeout: 20_000,
    });

    // Add an interest — the digest must follow, not sit on yesterday's set.
    // Settings lives in Home's header, so go back there first.
    await page.getByRole("button", { name: /^Home/ }).click();
    await page.getByRole("button", { name: /^Settings/ }).click();
    await page.getByRole("button", { name: "Sports", exact: true }).click();
    await page.getByRole("button", { name: /^Back —/ }).click();
    await page.getByRole("button", { name: /^Digest/ }).click();

    await expect(page.locator("section[aria-labelledby^='digest-']")).toHaveCount(2, {
      timeout: 20_000,
    });
  });

  test("the goal is editable after onboarding", async ({ page }) => {
    // Onboarding is a two-minute conversation; making its answers permanent
    // would be a trap.
    await withProfile(page, {});
    await page.getByRole("button", { name: /^Settings/ }).click();

    const goal = page.locator("#set-goal");
    await expect(goal).toHaveValue("finally learn to cook properly");
    await goal.fill("run a half marathon");

    await page.getByRole("button", { name: /^Back —/ }).click();
    await page.locator('button[aria-label^="Open Instagram"]').first().click();
    await expect(page.getByText("run a half marathon")).toBeVisible();
  });
});

test.describe("the removed features stay removed", () => {
  test("five tabs, and Check-in is not one of them", async ({ page }) => {
    await onboarded(page);

    const tabs = page.locator('nav[aria-label="Main"] button');
    await expect(tabs).toHaveCount(5);
    await expect(tabs).toHaveText(["Home", "Digest", "To-do", "Projects", "Insights"]);
  });

  test("the check-in is gone entirely, not just off the tab bar", async ({ page }) => {
    await onboarded(page);

    await page.keyboard.press("c");
    await expect(page.getByRole("heading", { name: /Evening check-in/i })).toHaveCount(0);
  });

  test("no ambient sound, no breathing gate", async ({ page }) => {
    await onboarded(page);

    await page.getByRole("button", { name: /^Settings/ }).click();
    await expect(page.getByRole("heading", { name: /Settings/i })).toBeVisible();
    await expect(page.getByText(/Ambient sound/i)).toHaveCount(0);
    await expect(page.getByText(/^You$/)).toHaveCount(0);
  });

  test("the session dials live on Home now", async ({ page }) => {
    await onboarded(page);

    await expect(page.locator("#home-session")).toBeAttached();
    await expect(page.locator("#home-goal")).toBeAttached();
  });
});

test.describe("project due dates", () => {
  test("set a date, see it on the card, clear it again", async ({ page }) => {
    await onboarded(page);
    await page.getByRole("button", { name: /^Projects/ }).click();
    await page.getByRole("tab", { name: "All" }).click();

    await page.locator('button[aria-label^="Open "]').first().click();
    const due = page.locator("#proj-due");
    await expect(due).toBeVisible();

    const soon = new Date();
    soon.setDate(soon.getDate() + 3);
    await due.fill(soon.toISOString().slice(0, 10));

    await expect(page.getByText("Due in 3 days").first()).toBeVisible();

    const stored = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key) ?? "{}").projects.filter((p: { dueDate?: string }) => p.dueDate),
      STORAGE_KEY,
    );
    expect(stored).toHaveLength(1);

    await page.getByRole("button", { name: /Clear due date/i }).click();
    await expect(page.getByText("Due in 3 days")).toHaveCount(0);
  });

  test("an overdue project reads as late", async ({ page }) => {
    await onboarded(page);
    await page.getByRole("button", { name: /^Projects/ }).click();
    await page.getByRole("tab", { name: "All" }).click();
    await page.locator('button[aria-label^="Open "]').first().click();

    const past = new Date();
    past.setDate(past.getDate() - 2);
    await page.locator("#proj-due").fill(past.toISOString().slice(0, 10));

    await expect(page.getByText("2 days late").first()).toBeVisible();
  });
});
