// Clarity — where digest material comes from.
//
// `FEED_SOURCES` is the real thing: free RSS feeds, no sign-up, no key, no
// cost. It is not fetched from the browser, and cannot be — every one of these
// hosts blocks cross-origin requests, so a `fetch` from this file gets a CORS
// error rather than an article list. Pulling them is a server job.
//
// So `fetchArticles` below currently serves a bundled pool shaped exactly like
// parsed RSS. When a server exists, that function becomes a `fetch` to it and
// nothing else in the app changes — same signature, same `FeedArticle[]`.
//
// The server side of that is roughly:
//
//   import Parser from "rss-parser";
//   const parser = new Parser();
//   const feed = await parser.parseURL(source.url);
//   return feed.items.slice(0, 10).map((item) => ({
//     id: item.guid ?? item.link,
//     title: item.title,
//     source: source.name,
//     category: category.id,
//     summary: item.contentSnippet ?? "",
//     url: item.link,
//     publishedAt: item.isoDate,
//   }));

export interface FeedArticle {
  id: string;
  title: string;
  source: string;
  category: string;
  summary: string;
  url: string;
  /** ISO day the story ran. */
  publishedAt: string;
}

export interface InterestCategory {
  id: string;
  /** Deliberately broad — the specifics come from the user, not this list. */
  label: string;
  /** Shown under the chip during onboarding. */
  blurb: string;
  /** The prompt that asks them to narrow it down. */
  ask: string;
}

/**
 * The broad buckets. Picking one is not enough to build a good digest — every
 * chosen category also collects a free-text specific during onboarding, which
 * is what stops this becoming another generic feed.
 */
export const INTEREST_CATEGORIES: InterestCategory[] = [
  {
    id: "tech",
    label: "Tech",
    blurb: "Software, hardware, the companies behind both",
    ask: "What in tech, exactly? (\"AI research\", \"the iPhone\", \"indie apps\")",
  },
  {
    id: "world",
    label: "World news",
    blurb: "Politics, conflict, what's happening elsewhere",
    ask: "Which part of the world, or which story are you following?",
  },
  {
    id: "sports",
    label: "Sports",
    blurb: "Leagues, results, transfers",
    ask: "Which sport or team? Be specific — \"sports\" gets you everything.",
  },
  {
    id: "finance",
    label: "Money",
    blurb: "Markets, rates, the economy",
    ask: "What are you actually tracking? (\"my index funds\", \"mortgage rates\")",
  },
  {
    id: "health",
    label: "Health",
    blurb: "Fitness, nutrition, medicine",
    ask: "What's the goal here — training, sleep, eating, something else?",
  },
  {
    id: "culture",
    label: "Culture",
    blurb: "Film, music, books, the internet",
    ask: "What kind? (\"new albums\", \"film releases\", \"what I should read\")",
  },
];

export function categoryLabel(id: string): string {
  return INTEREST_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

/**
 * Words that map free text onto a category.
 *
 * This exists so onboarding can let people *say* what they follow instead of
 * making them tick boxes. It is intentionally shallow — a real model does this
 * properly through `chatReply`'s extraction once a key exists. Until then, the
 * cost of a miss is low: the follow-up turn asks them to confirm.
 */
const CATEGORY_HINTS: Record<string, string[]> = {
  tech: ["tech", "ai", "software", "startup", "apple", "iphone", "android", "code", "coding", "programming", "computer", "app", "apps", "gadget", "crypto", "space", "science"],
  world: ["world", "news", "politic", "election", "war", "climate", "global", "government", "ukraine", "middle east", "europe", "asia", "africa"],
  sports: ["sport", "football", "soccer", "basketball", "nba", "nfl", "baseball", "mlb", "tennis", "f1", "formula", "cricket", "rugby", "golf", "hockey", "arsenal", "united", "liverpool", "premier league", "running", "olympic"],
  finance: ["money", "financ", "market", "stock", "invest", "econom", "rate", "mortgage", "budget", "salary", "index fund", "business", "housing"],
  health: ["health", "fitness", "gym", "train", "workout", "nutrition", "diet", "sleep", "medicine", "medical", "mental", "wellness", "lift", "run", "yoga"],
  culture: ["culture", "film", "movie", "music", "album", "book", "read", "art", "tv", "show", "game", "gaming", "podcast", "design", "internet"],
};

/**
 * Best-guess categories for something a person typed.
 *
 * Returns them in the order the hints matched strength-wise, so the strongest
 * signal leads. An empty result means "we could not tell" — the caller should
 * ask rather than guess.
 */
export function matchCategories(text: string): string[] {
  const lower = ` ${text.toLowerCase()} `;
  const scored = Object.entries(CATEGORY_HINTS)
    .map(([id, words]) => [id, words.filter((w) => lower.includes(w)).length] as const)
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1]);
  return scored.map(([id]) => id);
}

/** Free RSS feeds, grouped by the category they feed. Used by the daily job. */
export const FEED_SOURCES: { category: string; name: string; url: string }[] = [
  { category: "tech", name: "TechCrunch", url: "https://techcrunch.com/feed/" },
  { category: "tech", name: "The Verge", url: "https://www.theverge.com/rss/index.xml" },
  { category: "world", name: "BBC News", url: "https://feeds.bbci.co.uk/news/world/rss.xml" },
  { category: "world", name: "Reuters", url: "https://www.reutersagency.com/feed/" },
  { category: "sports", name: "ESPN", url: "https://www.espn.com/espn/rss/news" },
  { category: "sports", name: "BBC Sport", url: "https://feeds.bbci.co.uk/sport/rss.xml" },
  { category: "finance", name: "MarketWatch", url: "https://feeds.marketwatch.com/marketwatch/topstories/" },
  { category: "finance", name: "CNBC", url: "https://www.cnbc.com/id/100003114/device/rss/rss.html" },
  { category: "health", name: "NPR Health", url: "https://feeds.npr.org/1128/rss.xml" },
  { category: "health", name: "BBC Health", url: "https://feeds.bbci.co.uk/news/health/rss.xml" },
  { category: "culture", name: "NPR Culture", url: "https://feeds.npr.org/1008/rss.xml" },
  { category: "culture", name: "The Guardian Culture", url: "https://www.theguardian.com/culture/rss" },
];

/**
 * Stand-in for the parsed feeds. Shaped exactly like what the RSS parser will
 * hand back, so the digest builder never learns which one it got.
 */
const POOL: Omit<FeedArticle, "publishedAt" | "url">[] = [
  // ── tech ──
  { id: "t1", category: "tech", source: "TechCrunch", title: "Small AI models are quietly eating the cheap end of the market", summary: "Cost per task fell far enough that the interesting work moved down-market." },
  { id: "t2", category: "tech", source: "The Verge", title: "The laptop refresh nobody asked for is actually good", summary: "Better battery, same price, and the keyboard finally got fixed." },
  { id: "t3", category: "tech", source: "TechCrunch", title: "Another browser startup takes aim at Chrome's default position", summary: "The pitch is privacy and speed. The obstacle is, as ever, distribution." },
  { id: "t4", category: "tech", source: "The Verge", title: "Open source maintainers are burning out faster than replacements arrive", summary: "A handful of unpaid people hold up a surprising share of the stack." },
  { id: "t5", category: "tech", source: "TechCrunch", title: "Chip supply loosened, and prices followed within a quarter", summary: "The shortage that shaped three years of roadmaps has mostly unwound." },
  { id: "t6", category: "tech", source: "The Verge", title: "Wearables pivot from step counts to sleep", summary: "The metric that actually predicts how your day goes turns out to be rest." },

  // ── world ──
  { id: "w1", category: "world", source: "BBC News", title: "Trade talks resume after a month of quiet diplomacy", summary: "Both sides describe progress; neither will say on what." },
  { id: "w2", category: "world", source: "Reuters", title: "Election result reshapes a long-standing regional alliance", summary: "The margin was narrow enough that the mandate is already contested." },
  { id: "w3", category: "world", source: "BBC News", title: "A drought year is forcing a rewrite of national water policy", summary: "Reservoirs are low enough that rationing moved from contingency to plan." },
  { id: "w4", category: "world", source: "Reuters", title: "Border crossing reopens after eighteen months closed", summary: "Trade in the region had rerouted entirely; some of it may not route back." },
  { id: "w5", category: "world", source: "BBC News", title: "Court ruling limits how far emergency powers can stretch", summary: "The decision sets a boundary that several other cases were waiting on." },
  { id: "w6", category: "world", source: "Reuters", title: "Aid convoys reach a region cut off since spring", summary: "First independent assessment of conditions there in months." },

  // ── sports ──
  { id: "s1", category: "sports", source: "ESPN", title: "The underdog run everyone stopped calling a fluke", summary: "Eleven games in, the defence is the story rather than the schedule." },
  { id: "s2", category: "sports", source: "BBC Sport", title: "Transfer window closes with one deal nobody predicted", summary: "A mid-table side spent big and may have solved its worst problem." },
  { id: "s3", category: "sports", source: "ESPN", title: "Injury report reshapes the playoff picture overnight", summary: "Two contenders lost starters in the same weekend." },
  { id: "s4", category: "sports", source: "BBC Sport", title: "A rule change is doing exactly what it was meant to", summary: "Scoring is up, game length is down, and the complaints have gone quiet." },
  { id: "s5", category: "sports", source: "ESPN", title: "Veteran signs a one-year deal to chase a title", summary: "Took a pay cut. Said the reason out loud, which is rare." },
  { id: "s6", category: "sports", source: "BBC Sport", title: "The record that stood for thirty years fell on a wet Tuesday", summary: "No crowd to speak of, which somehow made it better." },

  // ── finance ──
  { id: "f1", category: "finance", source: "MarketWatch", title: "Rates held steady, and the market read it as good news", summary: "The statement changed three words. Analysts wrote a thousand about them." },
  { id: "f2", category: "finance", source: "CNBC", title: "Earnings season is coming in ahead of lowered expectations", summary: "Which is less impressive once you remember who lowered them." },
  { id: "f3", category: "finance", source: "MarketWatch", title: "Housing market shows its first real softening in two years", summary: "Listings up, time-on-market up, prices only just starting to follow." },
  { id: "f4", category: "finance", source: "CNBC", title: "Index funds took in more money than active managers again", summary: "The gap widened. It has widened every year for a decade." },
  { id: "f5", category: "finance", source: "MarketWatch", title: "Energy prices slipped, dragging inflation with them", summary: "Core numbers are stickier, which is the part that matters." },
  { id: "f6", category: "finance", source: "CNBC", title: "A large merger clears its final regulatory hurdle", summary: "Two years of review ended with modest conditions attached." },

  // ── health ──
  { id: "h1", category: "health", source: "NPR Health", title: "Strength training keeps outperforming cardio for long-term health", summary: "Two sessions a week is where most of the benefit already lands." },
  { id: "h2", category: "health", source: "BBC Health", title: "Sleep consistency beats sleep duration in a large new study", summary: "Same bedtime nightly mattered more than the total hours logged." },
  { id: "h3", category: "health", source: "NPR Health", title: "The protein guidance most people follow is based on old numbers", summary: "Revised recommendations are meaningfully higher, especially past forty." },
  { id: "h4", category: "health", source: "BBC Health", title: "Walking pace turns out to predict more than walking volume", summary: "Brisk beats long, if you have to choose one." },
  { id: "h5", category: "health", source: "NPR Health", title: "Screen time before bed is worse than screen time in general", summary: "The timing does more damage than the total, researchers found." },
  { id: "h6", category: "health", source: "BBC Health", title: "A cheap generic drug shows promise well outside its original use", summary: "Trials are early but the safety record is already decades long." },

  // ── culture ──
  { id: "c1", category: "culture", source: "NPR Culture", title: "The debut album that came out of nowhere and stayed", summary: "Recorded in a bedroom. Sounds like it, in the way that works." },
  { id: "c2", category: "culture", source: "The Guardian Culture", title: "A quiet film is outlasting the blockbusters it opened against", summary: "Word of mouth did what a marketing budget could not." },
  { id: "c3", category: "culture", source: "NPR Culture", title: "Physical books had a better year than anyone forecast", summary: "Sales up, independent shops up, e-reader sales flat." },
  { id: "c4", category: "culture", source: "The Guardian Culture", title: "The sequel that justifies its own existence", summary: "Rare enough to be worth noting. It goes somewhere new." },
  { id: "c5", category: "culture", source: "NPR Culture", title: "A reissue is introducing a forgotten record to a new decade", summary: "It flopped in its time. The timing was the only thing wrong with it." },
  { id: "c6", category: "culture", source: "The Guardian Culture", title: "Long-form writing is finding an audience again", summary: "Subscriptions to independent writers grew for the fourth year running." },
];

/**
 * The newest articles for one category.
 *
 * Signature matches what the server route will expose, so swapping the body
 * for a `fetch` is the entire change.
 */
export async function fetchArticles(category: string, limit = 8): Promise<FeedArticle[]> {
  await new Promise((resolve) => setTimeout(resolve, 120));
  const today = new Date().toISOString().slice(0, 10);
  return POOL.filter((a) => a.category === category)
    .slice(0, limit)
    .map((a) => ({ ...a, publishedAt: today, url: "" }));
}
