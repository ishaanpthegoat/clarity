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

export const TASK_SUGGESTIONS = [
  "Finish the Q3 deck",
  "Write for 30 minutes",
  "Study for the exam",
  "Ship one small feature",
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

// ── Daily Read: 4 articles a week (Mon–Thu) ────────────────────────────────

export interface Article {
  id: string;
  day: string;        // e.g. "MON"
  category: string;
  title: string;
  source: string;
  readMins: number;
  excerpt: string;
  body: string[];     // paragraphs
}

export const ARTICLE_DAYS = ["MON", "TUE", "WED", "THU"];

/**
 * The read for today.
 *
 * The reading week is Mon–Thu; Friday through Sunday fall back to Monday's so
 * the Read tab is never empty. Home and the Read tab both call this — they used
 * to index the list two different ways and could disagree about what "today's
 * read" was.
 */
export function todaysArticle(now: Date = new Date()): Article {
  const i = now.getDay() - 1; // Mon = 0
  return ARTICLES[i >= 0 && i < ARTICLES.length ? i : 0];
}

export const ARTICLES: Article[] = [
  {
    id: "ar-mon", day: "MON", category: "FOCUS",
    title: "The myth of multitasking",
    source: "Clarity Reads", readMins: 4,
    excerpt: "Why doing two things at once means doing both worse — and the switching cost nobody budgets for.",
    body: [
      "We tell ourselves we are being efficient when we answer a message mid-task. In reality the brain does not run two streams at once — it drops one thread, picks up another, and pays a tax each time it switches back.",
      "Researchers call it the switching cost. Every jump between contexts leaves a residue: part of your attention stays stuck on the last thing while you try to start the next. Do it often enough and you spend the day busy but strangely unproductive.",
      "The fix is not willpower. It is design. Remove the option to switch — put the phone in another room, close the tabs, set one clear task — and the tax disappears. What is left is the quiet, continuous attention that real work needs.",
    ],
  },
  {
    id: "ar-tue", day: "TUE", category: "HABITS",
    title: "Small reps beat big bursts",
    source: "Clarity Reads", readMins: 5,
    excerpt: "The case for boring consistency over heroic all-nighters, and how momentum actually compounds.",
    body: [
      "The all-nighter feels productive because it is dramatic. But drama is not the same as progress. The people who ship, write, and build the most are rarely the ones pulling heroics — they are the ones who show up for a modest block every single day.",
      "Consistency compounds. A focused hour a day is thirty hours a month, and unlike the all-nighter, it does not wreck the next two days recovering. Momentum is the real asset, and momentum is fragile — one missed day is fine, two starts to feel like a pattern.",
      "So make the daily rep small enough that you cannot talk yourself out of it, and protect it fiercely. The size of the block matters less than the fact that it happens.",
    ],
  },
  {
    id: "ar-wed", day: "WED", category: "ATTENTION",
    title: "Your attention is the product",
    source: "Clarity Reads", readMins: 4,
    excerpt: "How the apps you lock away are engineered to hold you — and what reclaiming that time is worth.",
    body: [
      "The apps competing for your evening are not neutral. Teams of talented people are paid to make the next scroll irresistible, because your attention is what they sell. That is not a conspiracy — it is the business model, working exactly as designed.",
      "You do not lose hours to these apps because you are weak. You lose them because the apps are very, very good at their job. Recognising that is freeing: the answer is not to try harder in the moment, it is to change the moment so the pull never reaches you.",
      "That is what locking is for. Not punishment — protection. You are putting a wall between your best hours and the machine built to spend them. What you get back is not just time; it is the ability to decide what your own attention is for.",
    ],
  },
  {
    id: "ar-thu", day: "THU", category: "CLARITY",
    title: "Name the one thing",
    source: "Clarity Reads", readMins: 3,
    excerpt: "Why a single, specific focus outperforms a long to-do list every time.",
    body: [
      "A to-do list with fifteen items is not a plan — it is a list of anxieties. When everything is a priority, nothing is, and the day dissolves into shallow motion across too many fronts.",
      "Naming one thing does something quietly powerful: it decides in advance what today is about. Everything else can wait, get delegated, or fall away. The one thing is the anchor you keep returning to when the noise starts.",
      "It does not have to be big. It has to be clear. Finish the deck. Write the section. Have the conversation. One clear block, given your full attention, is how a day actually gets built.",
    ],
  },
];
