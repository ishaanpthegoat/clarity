// Clarity server — real RSS.
//
// This is the code the browser could never run. Every host below sends no
// CORS header, so a `fetch` from the frontend fails before it reads a byte;
// from Node there is no such restriction. Free, no sign-up, no key.
import Parser from "rss-parser";

export interface FeedArticle {
  id: string;
  title: string;
  source: string;
  category: string;
  summary: string;
  url: string;
  publishedAt: string;
}

export interface FeedSource {
  category: string;
  name: string;
  url: string;
}

export const FEED_SOURCES: FeedSource[] = [
  { category: "tech", name: "TechCrunch", url: "https://techcrunch.com/feed/" },
  { category: "tech", name: "The Verge", url: "https://www.theverge.com/rss/index.xml" },
  { category: "world", name: "BBC News", url: "https://feeds.bbci.co.uk/news/world/rss.xml" },
  { category: "world", name: "NPR World", url: "https://feeds.npr.org/1004/rss.xml" },
  { category: "sports", name: "ESPN", url: "https://www.espn.com/espn/rss/news" },
  { category: "sports", name: "BBC Sport", url: "https://feeds.bbci.co.uk/sport/rss.xml" },
  { category: "finance", name: "MarketWatch", url: "https://feeds.marketwatch.com/marketwatch/topstories/" },
  { category: "finance", name: "CNBC", url: "https://www.cnbc.com/id/100003114/device/rss/rss.html" },
  { category: "health", name: "NPR Health", url: "https://feeds.npr.org/1128/rss.xml" },
  { category: "health", name: "BBC Health", url: "https://feeds.bbci.co.uk/news/health/rss.xml" },
  { category: "culture", name: "NPR Culture", url: "https://feeds.npr.org/1008/rss.xml" },
  { category: "culture", name: "Guardian Culture", url: "https://www.theguardian.com/culture/rss" },
];

export const CATEGORIES = [...new Set(FEED_SOURCES.map((s) => s.category))];

const parser = new Parser({
  timeout: 10_000,
  headers: { "User-Agent": "Clarity/0.1 (+https://github.com/ishaanpthegoat/clarity)" },
});

/** Strips the HTML that most feeds put in their snippet field. */
function clean(text: string | undefined): string {
  if (!text) return "";
  return text
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 280);
}

async function fetchOne(source: FeedSource, limit: number): Promise<FeedArticle[]> {
  const feed = await parser.parseURL(source.url);
  return (feed.items ?? []).slice(0, limit).map((item, i) => ({
    id: item.guid ?? item.link ?? `${source.name}-${i}`,
    title: (item.title ?? "Untitled").trim(),
    source: source.name,
    category: source.category,
    summary: clean(item.contentSnippet ?? item.content),
    url: item.link ?? "",
    publishedAt: item.isoDate ?? new Date().toISOString(),
  }));
}

/**
 * The newest articles for one category, newest first.
 *
 * One dead feed must not take the category down with it, so sources are
 * fetched in parallel and failures are logged and dropped rather than thrown.
 * A category only errors if *every* one of its sources is down.
 */
export async function fetchArticles(category: string, limit = 8): Promise<FeedArticle[]> {
  const sources = FEED_SOURCES.filter((s) => s.category === category);
  if (!sources.length) return [];

  const results = await Promise.allSettled(sources.map((s) => fetchOne(s, limit)));

  const articles = results.flatMap((r, i) => {
    if (r.status === "fulfilled") return r.value;
    console.warn(`[feeds] ${sources[i].name} failed:`, r.reason?.message ?? r.reason);
    return [];
  });

  return articles
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, limit);
}
