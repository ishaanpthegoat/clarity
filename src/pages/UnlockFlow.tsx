import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Bookmark, Flame, Sparkles, Heart, Wind, Share2 } from "lucide-react";
import { getState, setState, todayStr, isToday, getRecentContentIds, trackContentId, getRecentMicroActions, trackMicroAction, unlockThemeDrop } from "@/lib/store";
import type { SavedContent } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import ShareCard from "@/components/ShareCard";
import ThemeDropModal from "@/components/ThemeDropModal";
import { checkStreakDrops, checkHolidayDrops, getThemeDrop } from "@/lib/themeDrops";
import { applyThemeFromState } from "@/components/ThemeCustomizer";

/* ═══════════════════════════════════════════════════
   UNLOCK FLOW — Fully Agentic
   mood → AI content (type-adaptive) → journal → unlock
   ═══════════════════════════════════════════════════ */

const fireConfetti = () => {
  const gold = "#D4AF37";
  const warmWhite = "#FFF8E7";
  const amber = "#FFB300";
  confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors: [gold, warmWhite, amber, "#FFF"], scalar: 1.2, gravity: 0.8, ticks: 150 });
  setTimeout(() => confetti({ particleCount: 50, angle: 60, spread: 55, origin: { x: 0, y: 0.65 }, colors: [gold, warmWhite, amber], scalar: 1.1, gravity: 0.9, ticks: 120 }), 150);
  setTimeout(() => confetti({ particleCount: 50, angle: 120, spread: 55, origin: { x: 1, y: 0.65 }, colors: [gold, warmWhite, amber], scalar: 1.1, gravity: 0.9, ticks: 120 }), 300);
  setTimeout(() => confetti({ particleCount: 30, spread: 100, origin: { y: 0.5 }, colors: [gold, "#FFF"], scalar: 0.8, gravity: 0.6, ticks: 200, shapes: ["circle"] }), 500);
};

const MOODS = [
  { emoji: "😔", label: "Low", value: 1 },
  { emoji: "😐", label: "Meh", value: 2 },
  { emoji: "😊", label: "Good", value: 3 },
  { emoji: "😤", label: "Driven", value: 4 },
  { emoji: "🔥", label: "On Fire", value: 5 },
];

const FALLBACK_ACTIONS: Record<number, string[]> = {
  1: ["Write down 3 things that went right this week on paper", "Set a 2-minute timer and take slow, deep breaths with your eyes closed", "Text one person you care about and tell them you appreciate them"],
  2: ["Open your most important project and work on it for exactly 2 minutes", "Stand up and do 10 push-ups or a 60-second stretch right now", "Write one sentence about how you feel in your Notes app"],
  3: ["Set a 5-minute timer and tackle your hardest task first", "Open a book and read one full page without checking your phone", "Put your phone in another room and walk outside for 5 minutes"],
  4: ["Pick the hardest item on your to-do list and start it now", "Set a 25-minute Pomodoro timer and work with zero distractions", "Text a friend and share one win from this week"],
  5: ["Block 30 minutes on your calendar right now for deep work", "Do a full workout — you have the energy, use it", "Write down your top 3 goals for the next 90 days on paper"],
};

// ─── Agentic Content Card (Premium Glassmorphism) ───
const ContentCard = ({
  contentType,
  content,
  author,
  microAction,
  saved,
  onSave,
  onShare,
  hideMicroAction = false,
}: {
  contentType: string;
  content: string;
  author?: string;
  microAction: string;
  saved: boolean;
  onSave: () => void;
  onShare: () => void;
  hideMicroAction?: boolean;
}) => {
  const ActionButtons = () => (
    <div className="absolute top-5 right-5 flex items-center gap-1.5 z-20">
      <motion.button 
        whileHover={{ scale: 1.1 }} 
        whileTap={{ scale: 0.9 }} 
        onClick={onShare} 
        className="w-9 h-9 rounded-xl bg-white/5 backdrop-blur-sm flex items-center justify-center transition-colors hover:bg-white/10"
      >
        <Share2 className="w-4 h-4 text-muted-foreground" />
      </motion.button>
      <motion.button 
        whileHover={{ scale: 1.1 }} 
        whileTap={{ scale: 0.9 }} 
        onClick={onSave} 
        className="w-9 h-9 rounded-xl bg-white/5 backdrop-blur-sm flex items-center justify-center transition-colors hover:bg-white/10"
      >
        <Bookmark className={`w-4 h-4 transition-all duration-300 ${saved ? "fill-primary text-primary scale-110" : "text-muted-foreground"}`} />
      </motion.button>
    </div>
  );

  // Type-specific accent configs
  const typeConfig: Record<string, { icon: any; label: string; accentClass: string; glowColor: string; orbColor: string }> = {
    quote: { icon: null, label: "Today's Quote", accentClass: "text-primary", glowColor: "hsl(var(--primary) / 0.15)", orbColor: "bg-primary/8" },
    affirmation: { icon: Heart, label: "Affirmation", accentClass: "text-primary", glowColor: "hsl(var(--primary) / 0.12)", orbColor: "bg-primary/6" },
    challenge: { icon: Flame, label: "Challenge", accentClass: "text-orange-400", glowColor: "rgba(251, 146, 60, 0.12)", orbColor: "bg-orange-500/8" },
    reflection: { icon: Sparkles, label: "Reflection", accentClass: "text-blue-400", glowColor: "rgba(96, 165, 250, 0.1)", orbColor: "bg-blue-500/6" },
    breathwork: { icon: Wind, label: "Breathwork", accentClass: "text-teal-400", glowColor: "rgba(45, 212, 191, 0.1)", orbColor: "bg-teal-500/6" },
  };
  const config = typeConfig[contentType] || typeConfig.quote;
  const IconComponent = config.icon;

  const renderContent = () => {
    if (contentType === "quote") {
      return (
        <div className="relative overflow-hidden rounded-3xl border border-primary/15 p-8 pb-7" style={{ background: `linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--card) / 0.8) 100%)`, boxShadow: `0 0 40px ${config.glowColor}, 0 20px 60px rgba(0,0,0,0.2)` }}>
          {/* Floating gradient orbs */}
          <div className={`absolute -top-12 -right-12 w-40 h-40 ${config.orbColor} rounded-full blur-3xl`} />
          <div className={`absolute -bottom-8 -left-8 w-32 h-32 ${config.orbColor} rounded-full blur-3xl`} />
          <ActionButtons />
          {/* Label */}
          <div className="flex items-center gap-2 mb-5 relative z-10">
            <div className="w-1 h-4 rounded-full bg-gradient-to-b from-primary to-primary/30" />
            <span className="text-[10px] text-primary font-bold uppercase tracking-[0.15em]">{config.label}</span>
          </div>
          <p className="font-serif-quote text-xl text-foreground leading-[1.7] mb-4 italic relative z-10 pr-12">"{content}"</p>
          {author && <p className="text-muted-foreground/60 text-sm font-medium relative z-10">— {author}</p>}
        </div>
      );
    }

    return (
      <div className="relative overflow-hidden rounded-3xl border border-primary/10 p-8 pb-7" style={{ background: `linear-gradient(145deg, hsl(var(--card)) 0%, hsl(var(--card) / 0.85) 100%)`, boxShadow: `0 0 35px ${config.glowColor}, 0 16px 48px rgba(0,0,0,0.15)` }}>
        {/* Floating gradient orbs */}
        <div className={`absolute -top-10 -right-10 w-36 h-36 ${config.orbColor} rounded-full blur-3xl`} />
        <div className={`absolute -bottom-6 -left-6 w-28 h-28 ${config.orbColor} rounded-full blur-2xl`} />
        <ActionButtons />
        {/* Label + icon */}
        <div className="flex items-center gap-2.5 mb-5 relative z-10">
          {IconComponent && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.3, stiffness: 300, damping: 15 }}>
              <IconComponent className={`w-6 h-6 ${config.accentClass}`} style={{ filter: `drop-shadow(0 0 8px ${config.glowColor})` }} />
            </motion.div>
          )}
          <span className={`text-[10px] ${config.accentClass} font-bold uppercase tracking-[0.15em]`}>{config.label}</span>
        </div>
        <p className="text-xl font-bold text-foreground leading-[1.65] relative z-10 pr-12">{content}</p>
      </div>
    );
  };

  return (
    <>
      {renderContent()}
      {!hideMicroAction && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="relative overflow-hidden rounded-2xl border border-primary/10 p-5 mb-4 mt-4"
          style={{ background: `linear-gradient(135deg, hsl(var(--accent)) 0%, hsl(var(--accent) / 0.6) 100%)`, boxShadow: `0 0 20px hsl(var(--primary) / 0.06)` }}
        >
          <div className="absolute -top-6 -right-6 w-20 h-20 bg-primary/5 rounded-full blur-2xl" />
          <p className="text-[10px] text-primary font-bold uppercase tracking-[0.15em] mb-1.5 relative z-10">⚡ Your Micro-Action</p>
          <p className="text-foreground text-sm font-medium leading-relaxed relative z-10">{microAction}</p>
        </motion.div>
      )}
    </>
  );
};

const UnlockFlow = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"mood" | "loading" | "card" | "done">("mood");
  const [selectedMood, setSelectedMood] = useState(3);
  const [contentType, setContentType] = useState("quote");
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState<string | undefined>();
  const [microAction, setMicroAction] = useState("");
  const [saved, setSaved] = useState(false);
  const [intention, setIntention] = useState("");
  const [showShareCard, setShowShareCard] = useState(false);
  const [newDropId, setNewDropId] = useState<string | null>(null);

  const handleSave = useCallback(() => {
    if (saved) {
      // Unsave: remove from savedContent
      const state = getState();
      const updated = state.savedContent.filter(
        (s) => !(s.content === content && s.date === todayStr())
      );
      setState({ savedContent: updated });
      setSaved(false);
      toast("Removed from saved");
    } else {
      // Save: add to savedContent
      const state = getState();
      const newItem: SavedContent = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        date: todayStr(),
        type: contentType,
        content,
        author,
        microAction,
      };
      setState({ savedContent: [...state.savedContent, newItem] });
      setSaved(true);
      toast("Saved to your collection 🔖");
    }
  }, [saved, content, contentType, author, microAction]);

  const handleMoodSelect = useCallback(async (value: number) => {
    setSelectedMood(value);
    setPhase("loading");

    const state = getState();
    const actions = FALLBACK_ACTIONS[value] || FALLBACK_ACTIONS[3];
    const fallbackAction = actions[Math.floor(Math.random() * actions.length)];

    try {
      const { data, error } = await supabase.functions.invoke("mindset-coach", {
        body: {
          name: state.name,
          goals: state.goals,
          blockers: state.blockers,
          feeling: value,
          streak: state.streak,
          excludeIds: getRecentContentIds(),
          recentMicroActions: getRecentMicroActions(),
          todayUnlockCount: (state.dailyHistory || []).filter((e: any) => e.date === todayStr()).length,
        },
      });

      if (error) throw error;

      const returnedContent = data.content || data.message || "";
      const returnedType = data.type || "quote";
      
      // ── Client-side tone validation ──
      // Catch mood-content mismatches that slip through the edge function
      const NEGATIVE_TONE_WORDS = [
        "anxiety", "anxious", "insecure", "insecurity", "weakness", "weak",
        "broken", "breaking", "struggle", "struggling", "fear", "afraid",
        "overwhelm", "stressed", "stress", "lonely", "loneliness", "hurt",
        "pain", "suffer", "doubt yourself", "not enough", "giving up",
        "falling apart", "lost cause", "worthless", "hopeless",
      ];
      const AGGRESSIVE_TONE_WORDS = [
        "no excuses", "stop being", "grind harder", "stop whining",
        "man up", "toughen up", "weak people", "losers", "pathetic",
      ];
      
      const contentLower = returnedContent.toLowerCase();
      let isToneMismatch = false;
      
      if (value >= 4) {
        // High mood: reject negative/consolation content
        isToneMismatch = NEGATIVE_TONE_WORDS.some(w => contentLower.includes(w));
      } else if (value <= 2) {
        // Low mood: reject aggressive push content
        isToneMismatch = AGGRESSIVE_TONE_WORDS.some(w => contentLower.includes(w));
      }
      
      if (isToneMismatch) {
        // Use mood-appropriate fallback instead
        const name = state.name || "you";
        if (value >= 4) {
          setContentType("affirmation");
          setContent(`${name}, this energy is proof you're becoming someone who doesn't quit. Channel it — do something extraordinary today.`);
        } else if (value <= 2) {
          setContentType("reflection");
          setContent(`${name}, showing up on the hard days is what separates you from everyone who quit. What's one small win you can grab right now?`);
        }
      } else {
        setContentType(returnedType);
        setContent(returnedContent);
        const rawAuthor = data.author;
        // Only show real person authors for quotes
        if (returnedType === "quote" && rawAuthor && rawAuthor.toLowerCase() !== "unknown") {
          setAuthor(rawAuthor);
        } else {
          setAuthor(undefined);
        }
      }
      
      const finalAction = data.microAction || fallbackAction;
      setMicroAction(finalAction);

      // Track this content ID so it won't repeat for 3 days
      if (data.contentId) trackContentId(data.contentId);
      // Track micro-action text so it won't repeat for 3 days
      trackMicroAction(finalAction);
    } catch {
      // Fallback — mood-appropriate local content
      const name = state.name || "you";
      if (value >= 4) {
        setContentType("affirmation");
        setContent(`${name}, this energy is proof you're becoming someone who doesn't quit. Channel it — do something extraordinary today.`);
      } else if (value === 3) {
        setContentType("affirmation");
        setContent(`${name}, you're building something powerful. Every check-in compounds into the person you're becoming.`);
      } else {
        setContentType("reflection");
        setContent(`${name}, showing up on the hard days is what separates you from everyone who quit. What's one small win you can grab right now?`);
      }
      setMicroAction(fallbackAction);
    }

    setPhase("card");
  }, []);

  const handleUnlock = () => {
    const state = getState();
    const today = todayStr();
    const alreadyCheckedIn = isToday(state.lastCheckInDate);

    let newStreak = state.streak;
    if (!alreadyCheckedIn) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = yesterday.toISOString().split("T")[0];
      if (state.lastCheckInDate === yStr || state.streak === 0) newStreak = state.streak + 1;
      else if (!state.lastCheckInDate) newStreak = 1;
      else newStreak = 1;
    }

    const moodEntry = { date: today, feeling: selectedMood };
    // For re-reflections (premium), APPEND the new entry so check-in count increases
    // For first check-in of the day, just add normally
    const moodHistory = [...state.moodHistory, moodEntry].slice(-120);

    // Save daily history entry — accumulate multiple unlocks per day
    const dailyEntry = {
      date: today,
      feeling: selectedMood,
      content: { type: contentType, content, author },
      microAction,
      intention: intention.trim() || undefined,
    };
    const existingHistory = state.dailyHistory || [];
    const dailyHistory = [...existingHistory, dailyEntry].slice(-200);

    setState({
      streak: newStreak,
      longestStreak: Math.max(newStreak, state.longestStreak),
      lastCheckInDate: today,
      unlockCount: state.unlockCount + 1,
      todayContent: { type: contentType, content, author },
      todayMessage: content || null,
      todayMicroAction: microAction,
      moodHistory,
      dailyHistory,
    });

    // Check for theme drop unlocks
    const updatedState = getState();
    const streakDrops = checkStreakDrops(newStreak, updatedState.themeInventory);
    const holidayDrops = checkHolidayDrops(updatedState.themeInventory);
    const allNewDrops = [...streakDrops, ...holidayDrops];

    // Unlock all new drops
    for (const dropId of allNewDrops) {
      unlockThemeDrop(dropId);
    }

    if (allNewDrops.length > 0) {
      // Theme drop unlocked! Use drop-colored confetti and go straight to modal
      const drop = getThemeDrop(allNewDrops[0]);
      const dropColor = drop?.accentHex || "#FFD700";
      confetti({ particleCount: 90, spread: 80, origin: { y: 0.55 }, colors: [dropColor, "#FFF", "#FFD700"], scalar: 1.3, gravity: 0.7, ticks: 180 });
      setTimeout(() => confetti({ particleCount: 50, angle: 60, spread: 60, origin: { x: 0, y: 0.6 }, colors: [dropColor, "#FFF"], scalar: 1.1, gravity: 0.8, ticks: 140 }), 200);
      setTimeout(() => confetti({ particleCount: 50, angle: 120, spread: 60, origin: { x: 1, y: 0.6 }, colors: [dropColor, "#FFF"], scalar: 1.1, gravity: 0.8, ticks: 140 }), 400);
      // Skip generic "+1 Day" — go straight to the themed drop modal
      setNewDropId(allNewDrops[0]);
    } else {
      // Normal unlock — differentiate first check-in vs re-reflection
      setPhase("done");
      if (!alreadyCheckedIn) {
        // First check-in today — gold confetti + streak celebration
        fireConfetti();
      }
      // No confetti for re-reflections
      setTimeout(() => navigate("/home"), 2400);
    }
  };

  return (
    <div className="mobile-container bg-background flex flex-col items-center justify-center px-6">
      <AnimatePresence mode="wait">
        {phase === "mood" && (
          <motion.div key="mood" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -20 }} className="w-full text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">How are you feeling?</h1>
            <p className="text-muted-foreground text-sm mb-12">Tap to select your mood</p>
            <div className="flex justify-between items-end px-2 mb-8">
              {MOODS.map((mood) => (
                <motion.button key={mood.value} whileTap={{ scale: 0.85 }} onClick={() => handleMoodSelect(mood.value)} className="flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-300 mood-glow">
                  <span className="text-4xl">{mood.emoji}</span>
                  <span className="text-[10px] text-muted-foreground font-medium">{mood.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {phase === "loading" && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-8">
            {/* Dribbble-inspired orbital dots */}
            <div className="orbital-loader">
              <div className="dot" />
              <div className="dot" />
              <div className="dot" />
            </div>
            <div className="text-center">
              <p className="text-foreground font-semibold text-sm mb-1">Curating your moment</p>
              <p className="text-muted-foreground/50 text-xs">Personalized for how you're feeling</p>
            </div>
          </motion.div>
        )}

        {phase === "card" && (
          <motion.div key="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -30 }} className="w-full">
            {/* 1. Motivational Content — appears first with spring float */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", damping: 22, stiffness: 180, delay: 0 }}
              style={{ willChange: "transform, opacity" }}
            >
              <ContentCard
                contentType={contentType}
                content={content}
                author={author}
                microAction={microAction}
                saved={saved}
                onSave={handleSave}
                onShare={() => setShowShareCard(true)}
                hideMicroAction
              />
            </motion.div>

            {/* 2. Micro-Action — cascades up second */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", damping: 22, stiffness: 180, delay: 1.8 }}
              className="relative overflow-hidden rounded-2xl border border-primary/10 p-5 mb-4 mt-4"
              style={{ background: `linear-gradient(135deg, hsl(var(--accent)) 0%, hsl(var(--accent) / 0.6) 100%)`, boxShadow: `0 0 20px hsl(var(--primary) / 0.06)`, willChange: "transform, opacity" }}
            >
              <div className="absolute -top-6 -right-6 w-20 h-20 bg-primary/5 rounded-full blur-2xl" />
              <p className="text-[10px] text-primary font-bold uppercase tracking-[0.15em] mb-1.5 relative z-10">⚡ Your Micro-Action</p>
              <p className="text-foreground text-sm font-medium leading-relaxed relative z-10">{microAction}</p>
            </motion.div>

            {/* 3. Intention — appears third */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", damping: 22, stiffness: 180, delay: 2.8 }}
              className="mb-4"
              style={{ willChange: "transform, opacity" }}
            >
              <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.15em] mb-2.5 block px-1">
                Set your intention <span className="text-muted-foreground/30 normal-case tracking-normal font-normal">(optional)</span>
              </label>
              <textarea
                value={intention}
                onChange={(e) => setIntention(e.target.value)}
                placeholder="What's one thing you'll focus on today?"
                maxLength={200}
                rows={2}
                className="w-full bg-card/80 backdrop-blur-sm border border-border/30 rounded-2xl px-4 py-3.5 text-foreground text-sm placeholder:text-muted-foreground/25 resize-none focus:outline-none focus:border-primary/40 focus:shadow-[0_0_15px_hsl(var(--primary)/0.08)] transition-all duration-300"
              />
            </motion.div>

            {/* 4. Unlock Button — appears last with premium glow */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", damping: 18, stiffness: 160, delay: 3.4 }}
              style={{ willChange: "transform, opacity" }}
            >
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }} 
                onClick={handleUnlock} 
                className="w-full py-5 rounded-2xl bg-primary text-primary-foreground font-bold text-lg gold-glow cursor-pointer relative overflow-hidden btn-shimmer"
              >
                <span className="relative z-10 flex items-center justify-center gap-2.5">
                  Lock It In
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
              </motion.button>
            </motion.div>
          </motion.div>
        )}

        {phase === "done" && !newDropId && (() => {
          const state = getState();
          const todayEntries = (state.dailyHistory || []).filter((e: any) => e.date === todayStr());
          const isReflection = todayEntries.length > 1;
          return (
            <motion.div key="done" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", damping: 20, stiffness: 200 }} className="text-center relative">
              {/* Confetti burst — CSS particles with Framer Motion */}
              {Array.from({ length: 24 }).map((_, i) => {
                const angle = (i / 24) * 360;
                const distance = 80 + Math.random() * 120;
                const x = Math.cos((angle * Math.PI) / 180) * distance;
                const y = Math.sin((angle * Math.PI) / 180) * distance - 40;
                const colors = [
                  'hsl(var(--primary))',
                  'hsl(var(--primary) / 0.7)',
                  'hsl(45, 100%, 60%)',
                  'hsl(280, 80%, 65%)',
                  'hsl(160, 80%, 55%)',
                  'hsl(340, 85%, 60%)',
                ];
                const color = colors[i % colors.length];
                const size = 4 + Math.random() * 4;
                const isRect = i % 3 === 0;
                return (
                  <motion.div
                    key={`confetti-${i}`}
                    initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
                    animate={{ x, y, scale: [0, 1.2, 0.8], opacity: [1, 1, 0], rotate: Math.random() * 360 }}
                    transition={{ duration: 0.9 + Math.random() * 0.5, delay: Math.random() * 0.2, ease: "easeOut" }}
                    className="absolute left-1/2 top-1/2 pointer-events-none z-20"
                    style={{
                      width: isRect ? size * 1.5 : size,
                      height: size,
                      borderRadius: isRect ? '1px' : '50%',
                      background: color,
                      willChange: "transform, opacity",
                    }}
                  />
                );
              })}
              
              {/* Radial glow burst behind icon */}
              <motion.div 
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.5, 1.2], opacity: [0, 0.4, 0.2] }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="absolute -top-8 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-primary/15 blur-3xl"
                style={{ willChange: "transform, opacity" }}
              />
              {isReflection ? (() => {
                  // Fire celebration confetti for re-reflections too
                  const reflectionCount = todayEntries.length;
                  const messages = [
                    { title: "Mind Sharpened", sub: "Another rep for your mental game." },
                    { title: "Clarity Unlocked", sub: "You're building unstoppable momentum." },
                    { title: "Level Up", sub: "Most people stopped. You didn't." },
                    { title: "Deep Focus", sub: "Your mind is getting sharper every session." },
                  ];
                  const msg = messages[Math.min(reflectionCount - 2, messages.length - 1)] || messages[0];
                  return (
                    <>
                      {/* Multi-layer animated glow burst */}
                      <motion.div 
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: [0, 2, 1.6], opacity: [0, 0.5, 0.15] }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-[80px]"
                        style={{ background: `radial-gradient(circle, hsl(var(--primary) / 0.4) 0%, hsl(var(--primary) / 0.1) 50%, transparent 70%)`, willChange: "transform, opacity" }}
                      />
                      <motion.div 
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: [0, 1.8, 1.4], opacity: [0, 0.3, 0.1] }}
                        transition={{ duration: 1, delay: 0.15, ease: "easeOut" }}
                        className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-blue-500/10 blur-[60px]"
                        style={{ willChange: "transform, opacity" }}
                      />

                      {/* Premium diamond icon — no spinning rings */}
                      <motion.div 
                        initial={{ scale: 0, rotate: -15 }} 
                        animate={{ scale: [0, 1.3, 1], rotate: 0 }} 
                        transition={{ type: "spring", damping: 12, stiffness: 200 }} 
                        className="mb-8 relative z-10 inline-flex items-center justify-center w-28 h-28 rounded-full"
                        style={{ 
                          background: `linear-gradient(135deg, hsl(var(--primary) / 0.15) 0%, hsl(var(--primary) / 0.04) 100%)`, 
                          boxShadow: `0 0 60px hsl(var(--primary) / 0.25), 0 0 100px hsl(var(--primary) / 0.08)` 
                        }}
                      >
                        {/* Static outer ring — decorative, NOT spinning */}
                        <div 
                          className="absolute inset-0 rounded-full"
                          style={{ border: '1px solid hsl(var(--primary) / 0.2)' }}
                        />
                        {/* Static inner ring */}
                        <div 
                          className="absolute inset-2.5 rounded-full"
                          style={{ border: '1px solid hsl(var(--primary) / 0.1)' }}
                        />
                        {/* Breathing glow behind icon */}
                        <motion.div
                          animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.45, 0.2] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                          className="absolute inset-4 rounded-full bg-primary/12 blur-lg"
                          style={{ willChange: "opacity" }}
                        />
                        {/* Diamond SVG — precision & clarity */}
                        <svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 12px hsl(var(--primary) / 0.5))`, position: 'relative', zIndex: 10 }}>
                          <path d="M6 3h12l4 6-10 13L2 9Z"/>
                          <path d="M11 3 8 9l4 13 4-13-3-6"/>
                          <path d="M2 9h20"/>
                        </svg>
                      </motion.div>

                      {/* Title with gradient text */}
                      <motion.p 
                        initial={{ opacity: 0, y: 15 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ delay: 0.3, type: "spring", damping: 20 }} 
                        className="text-3xl font-extrabold text-foreground mb-2 relative z-10 gold-text-glow"
                      >
                        {msg.title}
                      </motion.p>
                      
                      <motion.p 
                        initial={{ opacity: 0, y: 8 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ delay: 0.5 }} 
                        className="text-muted-foreground/70 text-sm relative z-10 mb-6"
                      >
                        {msg.sub}
                      </motion.p>

                      {/* Stats badge — session count */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.7, type: "spring", damping: 15 }}
                        className="relative z-10 inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-primary/20"
                        style={{ 
                          background: `linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--card) / 0.8) 100%)`,
                          boxShadow: `0 0 20px hsl(var(--primary) / 0.08)` 
                        }}
                      >
                        <span className="text-primary text-sm font-bold">{reflectionCount}x</span>
                        <span className="text-muted-foreground/60 text-xs font-medium">today's reflections</span>
                      </motion.div>
                    </>
                  );
                })() : (
                <>
                  {/* Trophy icon with static glow ring */}
                  <motion.div 
                    initial={{ scale: 0, rotate: -15 }} 
                    animate={{ scale: [0, 1.3, 1], rotate: 0 }} 
                    transition={{ type: "spring", damping: 12, stiffness: 200 }} 
                    className="mb-6 relative z-10 inline-flex items-center justify-center w-24 h-24 rounded-full"
                    style={{ background: `linear-gradient(135deg, hsl(var(--primary) / 0.2) 0%, hsl(var(--primary) / 0.06) 100%)`, boxShadow: `0 0 50px hsl(var(--primary) / 0.25), 0 0 100px hsl(var(--primary) / 0.1)` }}
                  >
                    <div
                      className="absolute inset-0 rounded-full border border-primary/20"
                    />
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 12px hsl(var(--primary) / 0.6))` }}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
                  </motion.div>
                  <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="text-3xl font-extrabold text-foreground mb-1.5 gold-text-glow relative z-10">Day {state.streak}</motion.p>
                  <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="text-muted-foreground/70 text-sm relative z-10">Streak locked. No one can take this from you.</motion.p>
                </>
              )}
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Share Card Modal */}
      {showShareCard && (
        <ShareCard
          contentType={contentType}
          content={content}
          author={author}
          streak={getState().streak}
          onClose={() => setShowShareCard(false)}
        />
      )}

      {/* Theme Drop Celebration Modal */}
      {newDropId && (
        <ThemeDropModal
          dropId={newDropId}
          onClose={() => {
            setNewDropId(null);
            navigate("/home");
          }}
          onEquip={() => {
            applyThemeFromState();
            setNewDropId(null);
            navigate("/home");
          }}
        />
      )}
    </div>
  );
};

export default UnlockFlow;
