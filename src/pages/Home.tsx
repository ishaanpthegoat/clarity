import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Settings, Lock, Flame, Heart, BookOpen, Compass } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getState, isToday, getNextCheckInTime } from "@/lib/store";
import { ResponsiveContainer, AreaChart, Area } from "recharts";

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

// Fixed Mon→Sun week
const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

const Home = () => {
  const navigate = useNavigate();
  const [state, setLocalState] = useState(getState());


  useEffect(() => {
    setLocalState(getState());
    // Re-read state when returning to this tab/page
    const refresh = () => setLocalState(getState());
    window.addEventListener("focus", refresh);
    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") refresh();
    });
    window.addEventListener("storage", refresh);
    // Also poll for state changes when navigating back (SPA)
    const interval = setInterval(refresh, 2000);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("storage", refresh);
      clearInterval(interval);
    };
  }, []);

  const checkedInToday = isToday(state.lastCheckInDate);
  const moodData = state.moodHistory.map((m) => ({ day: m.date.slice(5), mood: m.feeling }));

  // Build Mon→Sun for the CURRENT week (Mon first, Sun last)
  const today = new Date();
  const todayDow = today.getDay(); // 0=Sun, 1=Mon, ...
  const mondayOffset = todayDow === 0 ? -6 : 1 - todayDow; // How many days back to Monday
  
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + mondayOffset + i);
    const dateStr = d.toISOString().split("T")[0];
    const todayStr = today.toISOString().split("T")[0];
    const wasCheckedIn = state.moodHistory.some((m) => m.date === dateStr);
    const isFuture = d > today && dateStr !== todayStr;
    return {
      label: WEEKDAY_LABELS[i],
      checked: wasCheckedIn,
      isToday: dateStr === todayStr,
      isFuture,
    };
  });

  return (
    <div className="mobile-container bg-background flex flex-col px-6 py-10">
      {/* Top bar */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Lock className="w-4 h-4 text-primary" />
          <span className="font-medium">{state.lockedApps.length} apps locked</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/explore")} className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex items-center justify-center hover:border-primary/40 active:scale-95 transition-all duration-200">
            <Compass className="w-4 h-4 text-primary" />
          </button>
          <button onClick={() => navigate("/history")} className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex items-center justify-center hover:border-primary/40 active:scale-95 transition-all duration-200">
            <BookOpen className="w-4 h-4 text-primary" />
          </button>
          <button onClick={() => navigate("/settings")} className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex items-center justify-center hover:border-primary/40 active:scale-95 transition-all duration-200">
            <Settings className="w-4 h-4 text-primary" />
          </button>
        </div>
      </div>

      {/* Greeting */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="text-muted-foreground text-base mb-10 font-medium"
      >
        {getGreeting()}{state.name ? `, ${state.name}` : ""}
      </motion.p>

      {/* ═══ Premium Streak Display ═══ */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, type: "spring", damping: 15 }}
        className="text-center mb-6 relative"
      >
        {/* Animated radial glow behind streak */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-48 h-48 rounded-full bg-primary/5 blur-3xl streak-bg-pulse" />
        </div>

        {/* Fire icon with triple glow ring */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring", damping: 12 }}
          className="inline-block mb-4 relative"
        >
          {/* Outer pulse ring */}
          <div className="absolute inset-0 w-20 h-20 -m-2 rounded-full border border-primary/20 fire-ring-outer" />
          <div className="absolute inset-0 w-20 h-20 -m-2 rounded-full border border-primary/10 fire-ring-inner" />
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500/20 to-primary/10 flex items-center justify-center mx-auto day-glow">
            <Flame className="w-9 h-9 text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.5)]" />
          </div>
        </motion.div>

        {/* Streak number — BIG and glowing */}
        <motion.p
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", damping: 12, delay: 0.35 }}
          className="text-8xl font-black text-foreground leading-none mb-2 gradient-text-gold font-mono-num streak-number-glow relative z-10"
        >
          {state.streak}
        </motion.p>
        <p className="text-muted-foreground text-sm font-semibold uppercase tracking-[0.25em] mb-1.5">
          day streak
        </p>
        {state.streak > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-primary/60 text-xs font-medium"
          >
            {state.streak === 1 ? "Great start! Keep building." : state.streak < 7 ? "Building momentum. Keep going!" : state.streak < 30 ? "You're on fire! Don't stop now." : "Legendary consistency. You're unstoppable."}
          </motion.p>
        )}
      </motion.div>

      {/* Weekday dots — Mon → Sun (premium glow) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex justify-center gap-2 mb-10"
      >
        {weekDays.map((d, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 + i * 0.06 }}
            className="flex flex-col items-center gap-1"
          >
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                d.checked
                  ? "bg-primary text-primary-foreground day-glow ring-2 ring-primary/40 scale-110"
                  : d.isToday
                  ? "bg-card border-2 border-primary/60 text-primary today-pulse"
                  : d.isFuture
                  ? "bg-transparent border border-primary/25 text-primary/35 day-text-glow"
                  : "bg-transparent border border-primary/25 text-primary/35 day-text-glow"
              }`}
            >
              {d.checked ? "✓" : d.label}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Today's content */}
      {state.todayContent && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="premium-card p-6 mb-4">
          <div className="flex items-center gap-2 mb-3">
            {state.todayContent.type === "quote" && <span className="text-primary text-[10px] font-bold uppercase tracking-[0.15em]">Today's Quote</span>}
            {state.todayContent.type === "affirmation" && <><Heart className="w-3 h-3 text-primary" /><span className="text-primary text-[10px] font-bold uppercase tracking-[0.15em]">Affirmation</span></>}
            {state.todayContent.type === "reflection" && <><span className="text-blue-400 text-[10px] font-bold uppercase tracking-[0.15em]">💭 Reflection</span></>}
            {state.todayContent.type === "challenge" && <><span className="text-orange-400 text-[10px] font-bold uppercase tracking-[0.15em]">🔥 Challenge</span></>}
            {!["quote", "affirmation", "reflection", "challenge"].includes(state.todayContent.type) && <span className="text-primary text-[10px] font-bold uppercase tracking-[0.15em]">Today's Message</span>}
          </div>
          <p className={`text-foreground leading-relaxed ${
            state.todayContent.type === "quote" 
              ? "italic font-serif-quote text-lg" 
              : state.todayContent.type === "reflection" 
              ? "italic text-base"
              : "font-medium text-base"
          }`}>
            {state.todayContent.type === "quote" ? `"${state.todayContent.content}"` : state.todayContent.content}
          </p>
          {state.todayContent.author && <p className="text-muted-foreground/60 text-xs mt-3 font-medium">{state.todayContent.author !== "MindLock Coach" ? `— ${state.todayContent.author}` : state.todayContent.author}</p>}
        </motion.div>
      )}

      {state.todayMicroAction && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.15 }} className="premium-card p-4 mb-4">
          <p className="text-[10px] text-primary font-bold uppercase tracking-[0.15em] mb-1.5">Today's Action</p>
          <p className="text-foreground text-sm font-medium leading-relaxed">{state.todayMicroAction}</p>
        </motion.div>
      )}

      {/* Today's Intention */}
      {(() => {
        const todayDate = new Date().toISOString().split("T")[0];
        const todayEntries = (state.dailyHistory || []).filter(e => e.date === todayDate && e.intention);
        const latestIntention = todayEntries.length > 0 ? todayEntries[todayEntries.length - 1].intention : null;
        if (!latestIntention) return null;
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.25 }} className="premium-card p-4 mb-6">
            <p className="text-[10px] text-primary font-bold uppercase tracking-[0.15em] mb-1.5">🎯 Today's Intention</p>
            <p className="text-foreground text-sm font-medium leading-relaxed italic">{latestIntention}</p>
          </motion.div>
        );
      })()}



      {/* ═══ PREMIUM PROGRESSION FEATURES ═══ */}
      {(() => {
        const BETA_MODE = true;
        const isPremium = BETA_MODE;

        const todayDate = new Date();

        // ── Weekly Recap data ──
        const thisWeekEntries = state.moodHistory.filter(m => {
          const entryDate = new Date(m.date);
          const diffDays = Math.floor((todayDate.getTime() - entryDate.getTime()) / 86400000);
          return diffDays < 7;
        });
        const lastWeekEntries = state.moodHistory.filter(m => {
          const entryDate = new Date(m.date);
          const diffDays = Math.floor((todayDate.getTime() - entryDate.getTime()) / 86400000);
          return diffDays >= 7 && diffDays < 14;
        });
        const thisWeekAvg = thisWeekEntries.length > 0 
          ? thisWeekEntries.reduce((s, m) => s + m.feeling, 0) / thisWeekEntries.length 
          : 0;
        const lastWeekAvg = lastWeekEntries.length > 0 
          ? lastWeekEntries.reduce((s, m) => s + m.feeling, 0) / lastWeekEntries.length 
          : 0;
        const weekDelta = thisWeekAvg - lastWeekAvg;
        const bestDay = thisWeekEntries.length > 0 
          ? thisWeekEntries.reduce((best, m) => m.feeling > best.feeling ? m : best, thisWeekEntries[0])
          : null;
        const bestDayName = bestDay 
          ? new Date(bestDay.date).toLocaleDateString("en-US", { weekday: "long" })
          : null;

        if (!isPremium) return null;

        return (
          <>
            {/* ── This Week ── */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.6 }}
              className="premium-card mb-4 relative overflow-hidden border border-primary/20 shadow-[0_0_20px_hsl(var(--primary)/0.08)]"
            >
              {/* Decorative gradient orbs */}
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-primary/8 rounded-full blur-3xl" />
              <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl" />
              
              {/* Header with gradient accent */}
              <div className="px-5 pt-5 pb-3 relative z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-1 h-4 rounded-full bg-gradient-to-b from-primary to-primary/30" />
                  <span className="text-[11px] text-foreground font-bold uppercase tracking-[0.15em]">This Week</span>
                  <span className="text-[9px] bg-primary/15 text-primary px-2.5 py-0.5 rounded-full font-bold tracking-wide">PRO</span>
                </div>
              </div>

              {thisWeekEntries.length > 0 ? (
                <div className="px-5 pb-5 space-y-3 relative z-10">
                  {/* Mood hero row */}
                  <div className="flex items-center gap-4 bg-card rounded-2xl p-4 border border-primary/40 shadow-[0_0_15px_hsl(var(--primary)/0.1)]">
                    <div className="text-4xl">{["", "😔", "😐", "🙂", "😊", "🔥"][Math.round(thisWeekAvg)] || "🙂"}</div>
                    <div className="flex-1">
                      <p className="text-foreground text-xl font-black font-mono-num gradient-text-gold">
                        {thisWeekAvg.toFixed(1)}<span className="text-sm font-semibold text-muted-foreground">/5</span>
                      </p>
                      <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">Avg mood</p>
                    </div>
                    {lastWeekEntries.length > 0 && (
                      <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${weekDelta >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                        {weekDelta >= 0 ? "↑" : "↓"} {Math.abs(weekDelta).toFixed(1)}
                      </div>
                    )}
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2">
                    {(() => {
                      const lifetimeAvg = state.moodHistory.length > 0
                        ? (state.moodHistory.reduce((s, m) => s + m.feeling, 0) / state.moodHistory.length).toFixed(1)
                        : "—";
                      return [
                        { value: thisWeekEntries.length, label: "Check-ins", icon: "📋" },
                        { value: state.streak, label: "Streak", icon: "🔥" },
                        { value: lifetimeAvg, label: "Lifetime", icon: "💎" },
                      ].map((stat, i) => (
                        <motion.div
                          key={stat.label}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.7 + i * 0.08 }}
                          className="bg-card rounded-xl p-3 text-center border border-primary/30 relative overflow-hidden group hover:border-primary/50 transition-colors"
                        >
                          <p className="text-[10px] mb-1">{stat.icon}</p>
                          <p className="text-foreground font-black text-xl font-mono-num">{stat.value}</p>
                          <p className="text-muted-foreground/50 text-[8px] font-bold uppercase tracking-widest mt-0.5">{stat.label}</p>
                        </motion.div>
                      ));
                    })()}
                  </div>

                  {/* Best day insight */}
                  {bestDayName && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.9 }}
                      className="bg-gradient-to-r from-primary/10 to-transparent border-l-[3px] border-primary/60 rounded-r-xl px-4 py-3"
                    >
                      <p className="text-foreground text-sm">
                        <span className="text-primary font-bold">🏆 Best day:</span>{" "}
                        <span className="font-medium">{bestDayName}</span>
                        <span className="text-muted-foreground"> — you felt {["", "low", "meh", "good", "great", "on fire"][bestDay!.feeling]}</span>
                      </p>
                    </motion.div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 px-5 relative z-10">
                  <p className="text-3xl mb-2">📊</p>
                  <p className="text-muted-foreground/60 text-sm font-medium">Complete check-ins this week to see your recap</p>
                </div>
              )}
            </motion.div>

            {/* ── Mood · 7 Days (PRO) ── */}
            {moodData.length > 1 && (() => {
              const moodEmojis = ["", "😔", "😐", "🙂", "😊", "🔥"];
              const avgMood = moodData.reduce((s, d) => s + d.mood, 0) / moodData.length;
              const trendLabel = avgMood >= 4 ? "You're on fire" : avgMood >= 3 ? "Trending up" : avgMood >= 2 ? "Building momentum" : "Keep showing up";
              return (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="premium-card p-5 mb-8 relative overflow-hidden border border-primary/20 shadow-[0_0_20px_hsl(var(--primary)/0.08)]">
                {/* Background glow */}
                <div className="absolute -top-8 -right-8 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
                
                {/* Header */}
                <div className="flex items-center justify-between mb-1 relative z-10">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-1 h-4 rounded-full bg-gradient-to-b from-primary to-primary/30" />
                      <span className="text-[11px] text-foreground font-bold uppercase tracking-[0.15em]">Mood · 7 days</span>
                      <span className="text-[9px] bg-primary/15 text-primary px-2.5 py-0.5 rounded-full font-bold tracking-wide">PRO</span>
                    </div>
                    <p className="text-xs text-primary/80 font-medium mt-1 ml-3.5">{trendLabel} {avgMood >= 3 ? "📈" : "💪"}</p>
                  </div>
                  <div className="flex items-center gap-1 bg-primary/10 px-2.5 py-1 rounded-full">
                    <span className="text-sm">{moodEmojis[Math.round(avgMood)] || "🙂"}</span>
                    <span className="text-[11px] text-primary font-bold">{avgMood.toFixed(1)}</span>
                  </div>
                </div>

                {/* Chart */}
                <div className="h-28 mt-2 relative z-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={moodData} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
                      <defs>
                        <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                          <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area 
                        type="monotone" 
                        dataKey="mood" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2.5} 
                        fill="url(#moodGrad)" 
                        dot={(props: any) => {
                          const { cx, cy, payload } = props;
                          return (
                            <g key={`dot-${cx}`}>
                              <circle cx={cx} cy={cy} r={5} fill="hsl(var(--background))" stroke="hsl(var(--primary))" strokeWidth={2} />
                              <text x={cx} y={cy - 12} textAnchor="middle" fontSize={12}>{moodEmojis[payload.mood] || ""}</text>
                            </g>
                          );
                        }}
                        activeDot={{ r: 7, fill: "hsl(var(--primary))", stroke: "hsl(var(--background))", strokeWidth: 3 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Day labels */}
                <div className="flex justify-between px-1 mt-1 relative z-10">
                  {moodData.slice(-7).map((d, i) => (
                    <span key={i} className="text-[9px] text-muted-foreground/50 font-medium">{d.day}</span>
                  ))}
                </div>
              </motion.div>
              );
            })()}
          </>
        );
      })()}

      {/* CTA */}
      {!checkedInToday ? (
        <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileTap={{ scale: 0.95 }} onClick={() => navigate("/unlock")} className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg gold-glow tracking-tight btn-shimmer">
          Daily Check-in
        </motion.button>
      ) : (() => {
        const BETA_MODE = true;
        const isPremium = BETA_MODE;
        const nextTime = getNextCheckInTime();
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-3">
            <p className="text-muted-foreground text-sm font-medium">✅ Today's streak secured</p>
            {isPremium ? (
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate("/unlock")} className="w-full py-3.5 rounded-2xl border-2 border-primary/30 text-primary font-semibold text-base hover:bg-primary/5 transition-colors">
                🔄 Reflect Again
              </motion.button>
            ) : nextTime ? (
              <div className="w-full py-3.5 rounded-2xl border-2 border-border/50 text-muted-foreground font-medium text-sm text-center">
                🔒 Next check-in at {nextTime.display}
              </div>
            ) : (
              <div className="w-full py-3.5 rounded-2xl border-2 border-primary/20 text-primary/60 font-medium text-sm text-center">
                ✅ All check-ins complete today
              </div>
            )}
          </motion.div>
        );
      })()}
    </div>
  );
};

export default Home;
