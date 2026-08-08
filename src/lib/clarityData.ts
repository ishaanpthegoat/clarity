// Clarity — seed data & static content.

export interface AppIcon {
  id: string;
  name: string;
  /** Real brand mark, served from /clarity/logos. */
  logo: string;
  /** The tile the mark sits on — the brand's own colour, not ours. */
  tile: string;
  /** The mark already *is* the tile (Instagram), so don't pad or tint it. */
  bleed?: boolean;
  /** Silhouette marks that need flipping to white to read on their tile. */
  invert?: boolean;
  category: "Social" | "Video" | "Messaging" | "Community";
  locked: boolean;
}

/** Every app Clarity can lock. Users add and remove from this catalogue. */
export const APP_CATALOG: Omit<AppIcon, "locked">[] = [
  { id: "ig", name: "Instagram", logo: "/clarity/logos/instagram-icon.svg", tile: "transparent", bleed: true, category: "Social" },
  { id: "tt", name: "TikTok", logo: "/clarity/logos/tiktok-icon-dark.svg", tile: "#000000", category: "Video" },
  { id: "yt", name: "YouTube", logo: "/clarity/logos/youtube.svg", tile: "#FFFFFF", category: "Video" },
  // Snapchat's mark ships with its own yellow field, so it is a full tile like
  // Instagram — padding or tinting it would just put yellow on yellow.
  { id: "sc", name: "Snapchat", logo: "/clarity/logos/snapchat.svg", tile: "transparent", bleed: true, category: "Messaging" },
  { id: "x", name: "X", logo: "/clarity/logos/x_dark.svg", tile: "#000000", category: "Social" },
  { id: "rd", name: "Reddit", logo: "/clarity/logos/reddit.svg", tile: "#FFFFFF", category: "Community" },
  { id: "nf", name: "Netflix", logo: "/clarity/logos/netflix-icon.svg", tile: "#000000", category: "Video" },
  { id: "dc", name: "Discord", logo: "/clarity/logos/discord.svg", tile: "#FFFFFF", category: "Community" },
  { id: "wa", name: "WhatsApp", logo: "/clarity/logos/whatsapp-icon.svg", tile: "#FFFFFF", category: "Messaging" },
];

/** The four that ship locked on a fresh install. */
export const SEED_APPS: AppIcon[] = ["ig", "tt", "yt", "sc"].map((id) => ({
  ...APP_CATALOG.find((a) => a.id === id)!,
  locked: true,
}));

// ── Projects ────────────────────────────────────────────────────────────────

export type ProjectStatus = "idea" | "active" | "done";

export interface ProjectGrade {
  id: string;
  /** ISO day the shot was graded. */
  day: string;
  score: number;
  headline: string;
  /** Rubric name → 0-100. */
  rubric: Record<string, number>;
  strengths: string[];
  nextStep: string;
  /** Object URL of the photo. Not persisted — it dies with the tab. */
  photo?: string;
}

export interface Project {
  id: string;
  title: string;
  desc: string;
  status: ProjectStatus;
  /** 0-100, moved by hand on the project sheet. */
  progress: number;
  /** Free-text working notes. */
  notes: string;
  grades: ProjectGrade[];
  /** Set when adopted from the public feed, so credit is visible. */
  adoptedFrom?: string;
  /** ISO day it's due. Undefined means no deadline was set. */
  dueDate?: string;
}

const seedProject = (
  id: string,
  title: string,
  desc: string,
  status: ProjectStatus = "idea",
  progress = 0,
): Project => ({ id, title, desc, status, progress, notes: "", grades: [] });

export const SEED_PROJECTS: Project[] = [
  seedProject("p1", "Finish the Q3 deck", "Draft, design, and send it this week.", "active", 40),
  seedProject("p2", "Launch your portfolio site", "One page. Live by Friday.", "active", 15),
  seedProject("p3", "Write three short posts", "Publish your thinking out loud."),
  seedProject("p4", "Read one book", "Thirty focused minutes a day."),
  seedProject("p5", "Set up a money tracker", "Know where it actually goes."),
  seedProject("p6", "Learn one new skill", "Small reps, every day."),
  seedProject("p7", "Clear the inbox", "Get to zero and stay there."),
];

/** The rubric the grader scores against. Shown before you shoot, so the bar is known. */
export const GRADE_RUBRIC = [
  { key: "craft", label: "Craft", hint: "How finished does the execution look?" },
  { key: "clarity", label: "Clarity", hint: "Can a stranger tell what it is?" },
  { key: "progress", label: "Progress", hint: "How far from done?" },
  { key: "ambition", label: "Ambition", hint: "Is the scope worth the week?" },
];

// ── To-dos ──────────────────────────────────────────────────────────────────

export interface Todo {
  id: string;
  text: string;
  done: boolean;
  /** Ties a to-do back to the project that spawned it. */
  projectId?: string;
}

export const SEED_TODOS: Todo[] = [
  { id: "s1", text: "Outline the Q3 deck", done: true, projectId: "p1" },
  { id: "s2", text: "Draft the slide copy", done: false, projectId: "p1" },
  { id: "s3", text: "Design the title slide", done: false, projectId: "p1" },
  { id: "s4", text: "Review with the team", done: false },
];

// ── Public ideas (the community feed that stays on the front page) ──────────

export interface PublicIdea {
  id: string;
  author: string;
  /** Two-letter monogram for the procedural avatar. */
  initials: string;
  /** 0-360, seeds the avatar's gradient so each person is recognisably themselves. */
  hue: number;
  focus: string;
  idea: string;
  desc: string;
  cheers: number;
  /** Human-readable, e.g. "shipped in 6 days". */
  outcome: string;
}

export const PUBLIC_IDEAS: PublicIdea[] = [
  { id: "i1", author: "Maya Okonkwo", initials: "MO", hue: 18, focus: "Design portfolio revamp", idea: "Rebuild the portfolio in one weekend", desc: "Three case studies, one page, no CMS. Ship it before you polish it.", cheers: 134, outcome: "shipped in 6 days" },
  { id: "i2", author: "Devin Reyes", initials: "DR", hue: 205, focus: "Ship the side project", idea: "Get 10 real people using it", desc: "Stop building. Send it to ten humans and watch them use it.", cheers: 98, outcome: "8 of 10 replied" },
  { id: "i3", author: "Aisha Rahman", initials: "AR", hue: 276, focus: "Study for the CFA", idea: "One practice exam a week", desc: "Full timed paper every Saturday morning. Review the misses Sunday.", cheers: 211, outcome: "score up 14 points" },
  { id: "i4", author: "Leo Marchetti", initials: "LM", hue: 138, focus: "Write every day", idea: "500 words before the phone", desc: "The first hour is the only one nobody else has a claim on.", cheers: 76, outcome: "31-day streak" },
  { id: "i5", author: "Priya Nair", initials: "PN", hue: 340, focus: "Learn to cook properly", idea: "Five meals, made well", desc: "Not fifty recipes. Five you can cook without reading anything.", cheers: 64, outcome: "all five, twice" },
  { id: "i6", author: "Tomas Lindqvist", initials: "TL", hue: 42, focus: "Run a half marathon", idea: "Slow miles, four times a week", desc: "Nearly all of it should feel too easy. That is the whole trick.", cheers: 89, outcome: "race in 9 weeks" },
];

/** Chips under the picker — inspiration, not a commitment. */
export const TRENDING = [
  "Read one book",
  "Launch a newsletter",
  "Learn 5 meals",
  "Run a 5k",
  "Build a budget",
  "Ship a portfolio",
];

// ── Static copy ─────────────────────────────────────────────────────────────

export const QUOTES: { text: string; author: string }[] = [
  { text: "You do not have to see the whole staircase. Just take the first step.", author: "Martin Luther King Jr." },
  { text: "It is not that we have a short time to live, but that we waste a lot of it.", author: "Seneca" },
  { text: "The successful warrior is the average person, with laser-like focus.", author: "Bruce Lee" },
  { text: "What you stay focused on will grow.", author: "Roy T. Bennett" },
  { text: "Concentrate all your thoughts upon the work at hand.", author: "Alexander Graham Bell" },
];

// Shown on the block screen, one per pull, so it never becomes wallpaper.
export const BLOCK_LINES = [
  "The task feels heavier in your head than it will in your hands. Give it ten minutes and watch it shrink.",
  "Nothing in there changed in the last four minutes. The thing you were doing did.",
  "You did not open this because you wanted it. You opened it because the last thing got hard.",
  "The feed will still be there tonight. This block of attention will not.",
  "You are one small, boring step from the part where it starts to feel good.",
  "Whatever is waiting in there was designed by people who are paid for your evening.",
];

export const MOODS: { emoji: string; value: number }[] = [
  { emoji: "😞", value: 0 },
  { emoji: "😕", value: 1 },
  { emoji: "😐", value: 2 },
  { emoji: "🙂", value: 3 },
  { emoji: "😄", value: 4 },
];

export const DAY_GO_OPTIONS = ["On track", "Some progress", "Rough day"];
export const ACTIVITY_OPTIONS = ["Deep work", "Exercise", "Read", "Rested", "Connected"];
