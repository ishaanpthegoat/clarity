import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Bookmark, Share2, Sparkles, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getState, setState, todayStr } from "@/lib/store";
import type { SavedContent } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ShareCard from "@/components/ShareCard";

const CATEGORIES = [
  { id: "discipline", label: "Discipline", emoji: "⚔️", color: "from-orange-500/15 to-orange-500/5 border-orange-500/20", query: "discipline consistency hard work" },
  { id: "resilience", label: "Resilience", emoji: "🛡️", color: "from-blue-500/15 to-blue-500/5 border-blue-500/20", query: "resilience adversity overcome struggle" },
  { id: "self-worth", label: "Self-Worth", emoji: "💎", color: "from-purple-500/15 to-purple-500/5 border-purple-500/20", query: "self-worth confidence self-love value" },
  { id: "focus", label: "Focus", emoji: "🎯", color: "from-green-500/15 to-green-500/5 border-green-500/20", query: "focus concentration clarity deep work" },
  { id: "calm", label: "Calm", emoji: "🧘", color: "from-teal-500/15 to-teal-500/5 border-teal-500/20", query: "calm peace anxiety stress relief" },
  { id: "career", label: "Career", emoji: "🚀", color: "from-indigo-500/15 to-indigo-500/5 border-indigo-500/20", query: "career ambition success professional growth" },
  { id: "fitness", label: "Fitness", emoji: "💪", color: "from-red-500/15 to-red-500/5 border-red-500/20", query: "fitness body health exercise strength" },
  { id: "relationships", label: "Relationships", emoji: "❤️", color: "from-pink-500/15 to-pink-500/5 border-pink-500/20", query: "relationships love connection empathy" },
  { id: "mindset", label: "Mindset", emoji: "🧠", color: "from-amber-500/15 to-amber-500/5 border-amber-500/20", query: "mindset growth positive thinking mental" },
  { id: "creativity", label: "Creativity", emoji: "🎨", color: "from-violet-500/15 to-violet-500/5 border-violet-500/20", query: "creativity innovation ideas expression" },
];

// Curated fallback content per category when Supabase is unavailable
const FALLBACK_CONTENT: Record<string, { type: string; content: string; author?: string }[]> = {
  discipline: [
    { type: "quote", content: "We don't rise to the level of our expectations, we fall to the level of our training.", author: "Archilochus" },
    { type: "affirmation", content: "I am building unshakeable discipline, one small action at a time." },
    { type: "challenge", content: "Do the thing you've been avoiding for the last 48 hours. Right now. Just start." },
  ],
  resilience: [
    { type: "quote", content: "The oak fought the wind and was broken, the willow bent when it must and survived.", author: "Robert Jordan" },
    { type: "affirmation", content: "Every setback I face is sharpening me into something stronger." },
    { type: "reflection", content: "What's one difficulty from your past that ultimately made you better?" },
  ],
  "self-worth": [
    { type: "quote", content: "You alone are enough. You have nothing to prove to anybody.", author: "Maya Angelou" },
    { type: "affirmation", content: "I deserve the same compassion I freely give to others." },
    { type: "affirmation", content: "My value isn't determined by my productivity. I am worthy as I am." },
  ],
  focus: [
    { type: "quote", content: "The successful warrior is the average man, with laser-like focus.", author: "Bruce Lee" },
    { type: "challenge", content: "Set a timer for 25 minutes. One task. No phone. No tabs. Go." },
    { type: "affirmation", content: "I choose depth over distraction. My attention is my most valuable asset." },
  ],
  calm: [
    { type: "breathwork", content: "Close your eyes. Breathe in for 4 counts. Hold for 7. Out for 8. Repeat 3 times." },
    { type: "reflection", content: "What would this moment feel like if you let go of the need to control the outcome?" },
    { type: "affirmation", content: "Peace is not the absence of chaos — it is my response to it." },
  ],
  career: [
    { type: "quote", content: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { type: "challenge", content: "Reach out to one person in your industry today. A DM, a comment, an email." },
    { type: "affirmation", content: "I am building skills and creating value that compounds over time." },
  ],
  fitness: [
    { type: "quote", content: "Take care of your body. It's the only place you have to live.", author: "Jim Rohn" },
    { type: "challenge", content: "Drop and do 20 pushups right now. Your body is ready even if your mind resists." },
    { type: "affirmation", content: "I honor my body by moving it. Every workout is an investment in my future self." },
  ],
  relationships: [
    { type: "quote", content: "The quality of your life is the quality of your relationships.", author: "Tony Robbins" },
    { type: "challenge", content: "Send an unexpected message of gratitude to someone who's impacted your life." },
    { type: "affirmation", content: "I attract genuine connections by being authentically myself." },
  ],
  mindset: [
    { type: "quote", content: "Whether you think you can, or you think you can't — you're right.", author: "Henry Ford" },
    { type: "affirmation", content: "My thoughts shape my reality. I choose thoughts that empower me." },
    { type: "reflection", content: "What story are you telling yourself that's holding you back? Is it actually true?" },
  ],
  creativity: [
    { type: "quote", content: "Creativity is intelligence having fun.", author: "Albert Einstein" },
    { type: "challenge", content: "Spend 10 minutes creating something with no goal — just play." },
    { type: "affirmation", content: "I trust my creative instincts. My unique perspective is my superpower." },
  ],
};

interface ContentItem {
  type: string;
  content: string;
  author?: string;
}

const ExplorePage = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryContent, setCategoryContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [shareItem, setShareItem] = useState<ContentItem | null>(null);

  const loadCategory = useCallback(async (catId: string) => {
    setSelectedCategory(catId);
    setLoading(true);
    setCategoryContent([]);

    const cat = CATEGORIES.find((c) => c.id === catId);
    if (!cat) return;

    try {
      // Fetch a larger pool so we can rotate daily
      const { data, error } = await supabase.functions.invoke("search-content", {
        body: { query: cat.query, limit: 20, exclude_types: ["transcript_chunk"] },
      });

      if (error) throw error;

      if (data?.results?.length > 0) {
        const items = data.results.map((r: any) => {
          const type = r.type || "quote";
          let displayAuthor: string | undefined;
          if (type === "quote" && r.author) {
            displayAuthor = r.author;
          } else if (type === "affirmation") {
            displayAuthor = "MindLock Coach";
          }
          return { type, content: r.content || "", author: displayAuthor };
        });
        // Deduplicate: remove items with similar content (first 60 chars match)
        const seen = new Set<string>();
        const deduped = items.filter((item: ContentItem) => {
          const key = item.content.slice(0, 60).toLowerCase().trim();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        // Daily rotation: use date as seed to pick a different set of 6 each day
        const today = new Date();
        const daySeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
        const offset = daySeed % Math.max(1, deduped.length - 6);
        const rotated = [...deduped.slice(offset), ...deduped.slice(0, offset)].slice(0, 6);
        setCategoryContent(rotated);
      } else {
        throw new Error("No results");
      }
    } catch {
      setCategoryContent(FALLBACK_CONTENT[catId] || FALLBACK_CONTENT.discipline);
    }

    setLoading(false);
  }, []);

  const saveItem = (item: ContentItem) => {
    const state = getState();
    const newItem: SavedContent = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      date: todayStr(),
      type: item.type,
      content: item.content,
      author: item.author,
    };
    setState({ savedContent: [...state.savedContent, newItem] });
    toast("Saved to your collection 🔖");
  };

  return (
    <div className="mobile-container bg-background flex flex-col min-h-[100dvh]">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 pt-14 pb-4">
        <button
          onClick={() => (selectedCategory ? (setSelectedCategory(null), setCategoryContent([])) : navigate("/home"))}
          className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center hover:border-muted-foreground/30 transition-colors"
        >
          {selectedCategory ? <ArrowLeft className="w-5 h-5 text-foreground" /> : <ChevronLeft className="w-5 h-5 text-foreground" />}
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">
            {selectedCategory ? CATEGORIES.find((c) => c.id === selectedCategory)?.label : "Explore"}
          </h1>
          <p className="text-muted-foreground text-xs font-medium">
            {selectedCategory ? "Curated content for you" : "Discover content by theme"}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pb-8 overflow-y-auto">
        <AnimatePresence mode="wait">
          {!selectedCategory ? (
            <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-2 gap-3 pt-2">
              {CATEGORIES.map((cat, i) => (
                <motion.button
                  key={cat.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => loadCategory(cat.id)}
                  className={`bg-gradient-to-br ${cat.color} rounded-2xl p-5 text-left border hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 card-lift`}
                >
                  <span className="text-3xl mb-3 block">{cat.emoji}</span>
                  <p className="text-foreground font-bold text-sm tracking-tight">{cat.label}</p>
                </motion.button>
              ))}
            </motion.div>
          ) : (
            <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {loading ? (
                <div className="flex flex-col items-center justify-center pt-20 gap-4">
                  <div className="orbital-loader">
                    <div className="dot" />
                    <div className="dot" />
                    <div className="dot" />
                  </div>
                  <p className="text-muted-foreground text-sm">Loading content…</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3 pt-2">
                  {categoryContent.map((item, i) => {
                    const isQuote = item.type === "quote" || item.type === "reflection";
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="premium-card p-5"
                      >
                        {/* Type badge */}
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[10px] text-primary font-bold uppercase tracking-[0.15em]">
                            {item.type === "quote" ? "💬 Quote" : item.type === "affirmation" ? "💛 Affirmation" : item.type === "challenge" ? "🔥 Challenge" : item.type === "breathwork" ? "🌬️ Breathwork" : item.type === "principle" ? "📐 Principle" : item.type === "technique" ? "⚡ Technique" : item.type === "insight" ? "💡 Insight" : "💭 Reflection"}
                          </span>
                          <div className="flex items-center gap-1">
                            <button onClick={() => setShareItem(item)} className="w-7 h-7 rounded-lg hover:bg-white/5 flex items-center justify-center transition-colors">
                              <Share2 className="w-3.5 h-3.5 text-muted-foreground/50 hover:text-primary transition-colors" />
                            </button>
                            <button onClick={() => saveItem(item)} className="w-7 h-7 rounded-lg hover:bg-white/5 flex items-center justify-center transition-colors">
                              <Bookmark className="w-3.5 h-3.5 text-muted-foreground/50 hover:text-primary transition-colors" />
                            </button>
                          </div>
                        </div>

                        {/* Content */}
                        <p className={`text-foreground text-sm leading-relaxed ${isQuote ? "italic font-serif-quote" : "font-medium"}`}>
                          {isQuote ? `"${item.content}"` : item.content}
                        </p>
                        {item.author && (
                          <p className="text-muted-foreground/50 text-xs mt-2 font-medium">— {item.author}</p>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Share Card Modal */}
      {shareItem && (
        <ShareCard
          contentType={shareItem.type}
          content={shareItem.content}
          author={shareItem.author}
          streak={getState().streak}
          onClose={() => setShareItem(null)}
        />
      )}
    </div>
  );
};

export default ExplorePage;
