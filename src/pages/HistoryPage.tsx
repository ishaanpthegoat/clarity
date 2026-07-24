import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Heart, Flame, Quote, HelpCircle, Bookmark, Trash2, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getState, setState, type DailyEntry, type SavedContent } from "@/lib/store";

const moodEmojis: Record<number, string> = {
  1: "😔",
  2: "😕",
  3: "😊",
  4: "😤",
  5: "🔥",
};

const moodLabels: Record<number, string> = {
  1: "Struggling",
  2: "Low",
  3: "Good",
  4: "Driven",
  5: "On Fire",
};

const moodColors: Record<number, string> = {
  1: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  2: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  3: "bg-green-500/10 text-green-400 border-green-500/20",
  4: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  5: "bg-red-500/10 text-red-400 border-red-500/20",
};

const typeConfig: Record<string, { icon: typeof Quote; color: string; label: string }> = {
  quote: { icon: Quote, color: "text-primary", label: "Quote" },
  affirmation: { icon: Heart, color: "text-primary", label: "Affirmation" },
  reflection: { icon: HelpCircle, color: "text-blue-400", label: "Reflection" },
  challenge: { icon: Flame, color: "text-orange-400", label: "Challenge" },
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr + "T12:00:00");
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
};

const isEntryBookmarked = (entry: DailyEntry, savedItems: SavedContent[]): boolean => {
  return savedItems.some(
    (s) => s.content === entry.content?.content && s.date === entry.date
  );
};

const HistoryPage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"journey" | "saved">("journey");
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [savedItems, setSavedItems] = useState<SavedContent[]>([]);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  useEffect(() => {
    const state = getState();
    const history = [...(state.dailyHistory || [])].reverse();
    setEntries(history);
    setSavedItems([...(state.savedContent || [])].reverse());
    // Auto-expand the most recent date
    if (history.length > 0) {
      setExpandedDates(new Set([history[0].date]));
    }
  }, []);

  // Group entries by date
  const groupedEntries = entries.reduce<Record<string, DailyEntry[]>>((acc, entry) => {
    if (!acc[entry.date]) acc[entry.date] = [];
    acc[entry.date].push(entry);
    return acc;
  }, {});

  const toggleDate = (date: string) => {
    setExpandedDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  const removeSaved = (id: string) => {
    const state = getState();
    const updated = state.savedContent.filter((s) => s.id !== id);
    setState({ savedContent: updated });
    setSavedItems([...updated].reverse());
  };

  const bookmarkEntry = (entry: DailyEntry) => {
    if (!entry.content) return;
    const state = getState();
    // Check if already bookmarked
    const alreadySaved = state.savedContent.some(
      (s) => s.content === entry.content.content && s.date === entry.date
    );
    if (alreadySaved) {
      // Remove it
      const updated = state.savedContent.filter(
        (s) => !(s.content === entry.content.content && s.date === entry.date)
      );
      setState({ savedContent: updated });
      setSavedItems([...updated].reverse());
    } else {
      // Add it
      const newItem: SavedContent = {
        id: `saved_${Date.now()}`,
        date: entry.date,
        type: entry.content.type,
        content: entry.content.content,
        author: entry.content.author,
        microAction: entry.microAction,
      };
      const updated = [...state.savedContent, newItem];
      setState({ savedContent: updated });
      setSavedItems([...updated].reverse());
    }
  };

  const totalCheckIns = entries.length;
  const uniqueDays = Object.keys(groupedEntries).length;

  return (
    <div className="mobile-container bg-background flex flex-col min-h-[100dvh]">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 pt-14 pb-4">
        <button onClick={() => navigate("/home")} className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center hover:border-muted-foreground/30 transition-colors">
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Your Journey</h1>
          <p className="text-muted-foreground text-xs font-medium">
            {totalCheckIns} {totalCheckIns === 1 ? "check-in" : "check-ins"} · {uniqueDays} {uniqueDays === 1 ? "day" : "days"} · {savedItems.length} saved
          </p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 px-6 mb-4">
        <button
          onClick={() => setTab("journey")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
            tab === "journey"
              ? "bg-primary text-primary-foreground"
              : "bg-card border border-border text-muted-foreground hover:border-muted-foreground/40"
          }`}
        >
          📖 Journey
        </button>
        <button
          onClick={() => setTab("saved")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
            tab === "saved"
              ? "bg-primary text-primary-foreground"
              : "bg-card border border-border text-muted-foreground hover:border-muted-foreground/40"
          }`}
        >
          <Bookmark className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" />
          Saved ({savedItems.length})
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pb-8 overflow-y-auto">
        <AnimatePresence mode="wait">
          {tab === "journey" && (
            <motion.div key="journey" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {entries.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center pt-20">
                  <motion.p initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12 }} className="text-5xl mb-5">📖</motion.p>
                  <p className="text-foreground font-bold text-lg mb-2 tracking-tight">No entries yet</p>
                  <p className="text-muted-foreground text-sm max-w-[240px] leading-relaxed">Complete your first daily check-in to start building your journey.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3 pt-2">
                  {Object.entries(groupedEntries).map(([date, dayEntries], groupIdx) => {
                    const isExpanded = expandedDates.has(date);
                    const moods = dayEntries.map((e) => e.feeling);
                    const avgMood = Math.round(moods.reduce((s, m) => s + m, 0) / moods.length);
                    const moodColor = moodColors[avgMood] || moodColors[3];

                    return (
                      <motion.div
                        key={date}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: groupIdx * 0.08 }}
                      >
                        {/* Date header — clickable to expand/collapse */}
                        <button
                          onClick={() => toggleDate(date)}
                          className="w-full premium-card px-4 py-3.5 flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-foreground text-sm font-bold whitespace-nowrap">{formatDate(date)}</span>
                            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold whitespace-nowrap ${moodColor}`}>
                              <span>{moodEmojis[avgMood] || "😊"}</span>
                              <span>{moodLabels[avgMood] || "Good"}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className="text-muted-foreground/40 text-[10px] font-medium">
                              {dayEntries.length}
                            </span>
                            <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground/30 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                          </div>
                        </button>

                        {/* Expanded entries */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="flex flex-col gap-2 mt-2 ml-2 border-l-2 border-primary/10 pl-4">
                                {dayEntries.map((entry, entryIdx) => {
                                  const config = typeConfig[entry.content?.type] || typeConfig.affirmation;
                                  const Icon = config.icon;
                                  const isSaved = isEntryBookmarked(entry, savedItems);

                                  return (
                                    <motion.div
                                      key={`${date}-${entryIdx}`}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: entryIdx * 0.05 }}
                                      className="bg-card/50 border border-border/50 rounded-xl p-4"
                                    >
                                      {/* Entry header with time & bookmark */}
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                          <Icon className={`w-3 h-3 ${config.color}`} />
                                          <span className="text-[10px] text-muted-foreground/60 font-semibold uppercase tracking-widest">{config.label}</span>
                                          <span className={`text-xs ${moodColors[entry.feeling] ? '' : ''}`}>{moodEmojis[entry.feeling] || "😊"}</span>
                                        </div>
                                        <button
                                          onClick={() => bookmarkEntry(entry)}
                                          className="w-7 h-7 rounded-lg hover:bg-primary/10 flex items-center justify-center transition-colors"
                                        >
                                          <Bookmark className={`w-3.5 h-3.5 transition-colors ${isSaved ? "text-primary fill-primary" : "text-muted-foreground/30 hover:text-primary"}`} />
                                        </button>
                                      </div>

                                      {/* Content */}
                                      <p className={`text-sm text-foreground leading-relaxed ${entry.content?.type === "quote" || entry.content?.type === "reflection" ? "italic font-serif-quote" : "font-medium"}`}>
                                        {entry.content?.type === "quote" ? `"${entry.content.content}"` : entry.content?.content}
                                      </p>
                                      {entry.content?.author && (
                                        <p className="text-muted-foreground/50 text-xs mt-1.5 font-medium">— {entry.content.author}</p>
                                      )}

                                      {/* Micro-action */}
                                      {entry.microAction && (
                                        <div className="bg-accent/50 rounded-lg p-2.5 border border-primary/5 mt-3">
                                          <p className="text-[9px] text-primary font-bold uppercase tracking-[0.15em] mb-0.5">Action</p>
                                          <p className="text-foreground text-xs font-medium leading-relaxed">{entry.microAction}</p>
                                        </div>
                                      )}

                                      {/* Intention */}
                                      {entry.intention && (
                                        <div className="bg-primary/5 rounded-lg p-2.5 border border-primary/10 mt-2">
                                          <p className="text-[9px] text-primary font-bold uppercase tracking-[0.15em] mb-0.5">🎯 Intention</p>
                                          <p className="text-foreground text-xs font-medium leading-relaxed italic">{entry.intention}</p>
                                        </div>
                                      )}
                                    </motion.div>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {tab === "saved" && (
            <motion.div key="saved" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {savedItems.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center pt-20">
                  <motion.p initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12 }} className="text-5xl mb-5">🔖</motion.p>
                  <p className="text-foreground font-bold text-lg mb-2 tracking-tight">Nothing saved yet</p>
                  <p className="text-muted-foreground text-sm max-w-[240px] leading-relaxed">Tap the bookmark icon during your daily unlock or in your journal to save content here.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3 pt-2">
                  {savedItems.map((item, i) => {
                    const config = typeConfig[item.type] || typeConfig.affirmation;
                    const Icon = config.icon;
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="premium-card p-5"
                      >
                        {/* Date + remove */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Bookmark className="w-3 h-3 text-primary fill-primary" />
                            <span className="text-muted-foreground text-xs font-semibold">{formatDate(item.date)}</span>
                          </div>
                          <button onClick={() => removeSaved(item.id)} className="w-7 h-7 rounded-lg hover:bg-red-500/10 flex items-center justify-center transition-colors">
                            <Trash2 className="w-3.5 h-3.5 text-muted-foreground/40 hover:text-red-400 transition-colors" />
                          </button>
                        </div>

                        {/* Content */}
                        <div className="flex items-start gap-2.5 mb-3">
                          <Icon className={`w-3.5 h-3.5 mt-0.5 ${config.color} flex-shrink-0`} />
                          <div className="flex-1">
                            <p className={`text-sm text-foreground leading-relaxed ${item.type === "quote" || item.type === "reflection" ? "italic font-serif-quote" : "font-medium"}`}>
                              {item.type === "quote" ? `"${item.content}"` : item.content}
                            </p>
                            {item.author && (
                              <p className="text-muted-foreground/50 text-xs mt-1.5 font-medium">— {item.author}</p>
                            )}
                          </div>
                        </div>

                        {/* Micro-action */}
                        {item.microAction && (
                          <div className="bg-accent/50 rounded-xl p-3 border border-primary/5">
                            <p className="text-[9px] text-primary font-bold uppercase tracking-[0.15em] mb-0.5">Action</p>
                            <p className="text-foreground text-xs font-medium leading-relaxed">{item.microAction}</p>
                          </div>
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
    </div>
  );
};

export default HistoryPage;
