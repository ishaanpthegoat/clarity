// Clarity — seed data & static content (ported from the imported design)

export interface AppIcon {
  id: string;
  name: string;
  emoji: string;
  color: string;
  locked: boolean;
}

export interface Project {
  id: string;
  title: string;
  desc: string;
}

export interface Todo {
  id: string;
  text: string;
  done: boolean;
}

export interface CommunityMember {
  id: string;
  name: string;
  color: string;
  focus: string;
  projects: string[];
  cheers: number;
}

export const SEED_APPS: AppIcon[] = [
  { id: "ig", name: "Instagram", emoji: "📸", color: "linear-gradient(135deg,#feda75,#fa7e1e,#d62976,#962fbf)", locked: true },
  { id: "tt", name: "TikTok", emoji: "🎵", color: "#0b0b0f", locked: true },
  { id: "yt", name: "YouTube", emoji: "▶️", color: "#ff0000", locked: true },
  { id: "sc", name: "Snapchat", emoji: "👻", color: "#FFFC00", locked: true },
];

export const SEED_PROJECTS: Project[] = [
  { id: "p1", title: "Finish the Q3 deck", desc: "Draft, design, and send it this week." },
  { id: "p2", title: "Launch your portfolio site", desc: "One page. Live by Friday." },
  { id: "p3", title: "Write three short posts", desc: "Publish your thinking out loud." },
  { id: "p4", title: "Read one book", desc: "Thirty focused minutes a day." },
  { id: "p5", title: "Set up a money tracker", desc: "Know where it actually goes." },
  { id: "p6", title: "Learn one new skill", desc: "Small reps, every day." },
  { id: "p7", title: "Clear the inbox", desc: "Get to zero and stay there." },
];

export const SEED_TODOS: Todo[] = [
  { id: "s1", text: "Outline the Q3 deck", done: true },
  { id: "s2", text: "Draft the slide copy", done: false },
  { id: "s3", text: "Design the title slide", done: false },
  { id: "s4", text: "Review with the team", done: false },
];

export const COMMUNITY: CommunityMember[] = [
  { id: "c1", name: "Maya", color: "linear-gradient(135deg,#ff9a6c,#ff5e8a)", focus: "Design portfolio revamp", projects: ["Portfolio site", "Case study writeup", "Three Dribbble shots"], cheers: 34 },
  { id: "c2", name: "Devin", color: "linear-gradient(135deg,#6cc7ff,#4b7bff)", focus: "Ship the side project", projects: ["MVP backend", "Landing page", "First 10 beta invites"], cheers: 28 },
  { id: "c3", name: "Aisha", color: "linear-gradient(135deg,#d6a4ff,#8b5cf6)", focus: "Study for the CFA", projects: ["Ethics module", "One practice exam", "Review weak spots"], cheers: 41 },
  { id: "c4", name: "Leo", color: "linear-gradient(135deg,#5ffc7b,#0fbb4d)", focus: "Write every day", projects: ["Morning pages", "Two short essays", "Send the newsletter"], cheers: 19 },
];

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

export const TRENDING = [
  "Read one book",
  "Launch a newsletter",
  "Learn 5 meals",
  "Run a 5k",
  "Build a budget",
  "Ship a portfolio",
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

// ---- Daily Read: 4 articles a week (Mon–Thu). Read it, then film your understanding. ----
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

// The week is Mon–Thu; the app's "today" is Wednesday, so ar-wed is today's read.
export const ARTICLE_DAYS = ["MON", "TUE", "WED", "THU"];

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
