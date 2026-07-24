import React, { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Check, Lock, Smartphone, Brain, Target, Shield, Zap, User, Clock, LinkIcon, Star, Flame, ChevronLeft, Heart, Sparkles } from "lucide-react";
import { setState } from "@/lib/store";

/* ═══════════════════════════════════════════════════
   STORY-BASED ONBOARDING — 19 SCREENS
   Prayerlock-inspired high-conversion flow
   ═══════════════════════════════════════════════════ */

const GOALS = ["Career", "Fitness", "Relationships", "Mental Health", "Wealth", "Creativity"];
const BLOCKERS = ["Anxiety", "Procrastination", "Self-Doubt", "Burnout", "Lack of Focus", "Fear"];

const DEEPER_STRUGGLES = [
  { emoji: "😶", label: "I know what to do but can't start" },
  { emoji: "🔁", label: "I keep repeating the same patterns" },
  { emoji: "🧠", label: "My mind won't stop overthinking" },
  { emoji: "😩", label: "I feel stuck even when I try" },
  { emoji: "🫠", label: "I'm exhausted before the day even starts" },
  { emoji: "🪞", label: "I don't feel like the person I want to be" },
  { emoji: "🚀", label: "I'm doing great — I just want to keep the momentum" },
];

const APPS = [
  { name: "Instagram", icon: "📸" },
  { name: "TikTok", icon: "🎵" },
  { name: "X", icon: "𝕏" },
  { name: "YouTube", icon: "▶️" },
  { name: "Reddit", icon: "🤖" },
  { name: "Snapchat", icon: "👻" },
];

const ACTIVITY_OPTIONS = [
  { emoji: "🔥", label: "very active — i'm always working on them", value: "very_active" },
  { emoji: "💪", label: "somewhat active — i try, but it's inconsistent", value: "somewhat_active" },
  { emoji: "😴", label: "not active — i struggle to start", value: "not_active" },
];

const MOTIVATION_OPTIONS = [
  { emoji: "🚀", label: "extremely motivated — i just need structure", value: "extremely_motivated" },
  { emoji: "⚡", label: "motivated — but i lose steam sometimes", value: "motivated" },
  { emoji: "🌱", label: "building up — i need a spark", value: "building" },
];

const SOCIAL_PROOF_REVIEWS = [
  {
    stars: 5,
    title: "GAME CHANGER.",
    body: "no joke, this is the only thing that's actually helped me stay consistent. the app lock is genius.",
    author: "Alex R.",
  },
  {
    stars: 5,
    title: "FINALLY!!",
    body: "finally an app that gets it. i was so sick of my phone owning my mornings. now my mind gets the first word.",
    author: "Jordan M.",
  },
];

const PLAN_LOADING_STEPS = [
  "analyzing your goals...",
  "mapping your blockers...",
  "personalizing your content...",
  "building your unlock flow...",
  "your plan is ready ✓",
];

const COMMITMENT_BULLETS = [
  "I'll check in daily, even when I don't feel like it",
  "I'll let the lock protect my focus",
  "I'll trust the process for at least 30 days",
  "I choose growth over comfort",
];

// ─── Shimmer text effect ───
const ShimmerText = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <span className={`relative inline-block ${className}`}>
    {children}
    <motion.span
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
      initial={{ x: "-100%" }}
      animate={{ x: "200%" }}
      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, ease: "linear" }}
      style={{ WebkitBackgroundClip: "text" }}
    />
  </span>
);

// ─── Typing animation for coach preview ───
const TypingText = ({ text, delay = 0 }: { text: string; delay?: number }) => {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), delay * 1000);
    return () => clearTimeout(timer);
  }, [delay]);
  useEffect(() => {
    if (!started) return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, 18);
    return () => clearInterval(interval);
  }, [started, text]);
  return <>{displayed}<motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }} className="text-primary">{displayed.length < text.length ? "▎" : ""}</motion.span></>;
};

// ─── Animated counter ───
const AnimatedCounter = ({ target }: { target: number }) => {
  const [count, setCount] = useState(0);
  useState(() => {
    let current = 0;
    const increment = Math.ceil(target / 40);
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) { current = target; clearInterval(timer); }
      setCount(current);
    }, 30);
  });
  return <span>{count}</span>;
};

// ─── Progress bar (replaces dots — Prayerlock-style) ───
const ProgressBar = ({ current, total }: { current: number; total: number }) => {
  const pct = Math.round(((current + 1) / total) * 100);
  return (
    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
      <motion.div
        className="h-full bg-primary rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      />
    </div>
  );
};

// ─── Option card ───
const OptionCard = ({ emoji, label, selected, onClick }: {
  emoji: string; label: string; selected: boolean; onClick: () => void;
}) => (
  <motion.button
    whileTap={{ scale: 0.97 }}
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all duration-300 text-left ${
      selected
        ? "bg-primary/10 border-primary/60 backdrop-blur-sm shadow-[0_0_20px_rgba(var(--primary-rgb),0.15)] chip-glow"
        : "bg-card/80 backdrop-blur-sm border-border hover:border-muted-foreground/30"
    }`}
  >
    <motion.span className="text-2xl" animate={selected ? { scale: [1, 1.2, 1] } : {}} transition={{ duration: 0.3 }}>{emoji}</motion.span>
    <span className={`font-medium text-sm ${selected ? "text-primary" : "text-foreground"}`}>{label}</span>
    <AnimatePresence>
      {selected && (
        <motion.div initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }} transition={{ type: "spring", damping: 12 }} className="ml-auto w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
          <Check className="w-3.5 h-3.5 text-primary-foreground" />
        </motion.div>
      )}
    </AnimatePresence>
  </motion.button>
);

// ─── Chip (for multi-select) ───
const Chip = ({ label, selected, onToggle, accent }: {
  label: string; selected: boolean; onToggle: () => void; accent?: boolean;
}) => (
  <motion.button whileTap={{ scale: 0.92 }} onClick={onToggle}
    animate={selected ? { scale: [1, 1.05, 1] } : {}}
    transition={{ duration: 0.25 }}
    className={`px-5 py-3 rounded-2xl font-semibold text-sm border transition-all duration-300 ${
      selected
        ? accent
          ? "bg-orange-500/15 border-orange-400/50 text-orange-300 backdrop-blur-sm shadow-[0_0_15px_rgba(249,115,22,0.15)] chip-glow"
          : "bg-primary/10 border-primary/60 text-primary backdrop-blur-sm shadow-[0_0_15px_rgba(var(--primary-rgb),0.15)] chip-glow"
        : "bg-card/80 backdrop-blur-sm border-border text-muted-foreground hover:border-muted-foreground/40"
    }`}
  >
    {label}
  </motion.button>
);

// ─── Time picker row ───
const formatTime12h = (time24: string) => {
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return { display: `${h12}:${String(m).padStart(2, "0")}`, period };
};

const TimeRow = ({ label, time, enabled, onTimeChange, onToggle }: {
  label: string; time: string; enabled: boolean; onTimeChange: (t: string) => void; onToggle: () => void;
}) => {
  const { display, period } = formatTime12h(time);
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className={`flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 ${enabled ? "bg-card border-border" : "bg-card/50 border-border/50 opacity-40"}`}>
      <div className="flex-1">
        <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.15em] mb-2">{label}</p>
        <button
          type="button"
          disabled={!enabled}
          onClick={() => { try { inputRef.current?.showPicker(); } catch { inputRef.current?.click(); } }}
          className="flex items-baseline gap-2 cursor-pointer group"
        >
          <span className="text-foreground text-3xl font-bold font-mono-num tracking-tight group-hover:text-primary transition-colors">{display}</span>
          <span className="text-muted-foreground text-sm font-semibold group-hover:text-primary/70 transition-colors">{period}</span>
          <span className="text-muted-foreground/30 text-xs ml-1">✎</span>
        </button>
        <input
          ref={inputRef}
          type="time"
          value={time}
          onChange={(e) => onTimeChange(e.target.value)}
          disabled={!enabled}
          className="sr-only"
        />
      </div>
      <button onClick={onToggle}
        className={`w-14 h-8 rounded-full transition-all duration-300 relative flex-shrink-0 ${
          enabled ? "bg-primary gold-glow" : "bg-muted"
        }`}
      >
        <motion.div
          animate={{ x: enabled ? 24 : 2 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="w-6 h-6 rounded-full bg-white absolute top-1 shadow-md"
        />
      </button>
    </div>
  );
};

// ─── Animated ring for "building plan" screen ───
const PlanLoadingRing = ({ progress }: { progress: number }) => {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  return (
    <svg width="140" height="140" className="rotate-[-90deg]">
      <circle cx="70" cy="70" r={radius} fill="none" stroke="hsl(225, 20%, 18%)" strokeWidth="8" />
      <motion.circle
        cx="70" cy="70" r={radius} fill="none" stroke="hsl(43, 72%, 52%)"
        strokeWidth="8" strokeLinecap="round"
        strokeDasharray={circumference}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
    </svg>
  );
};

// ─── Star rating display ───
const Stars = ({ count }: { count: number }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: count }).map((_, i) => (
      <Star key={i} className="w-4 h-4 fill-primary text-primary" />
    ))}
  </div>
);

const pageVariants = {
  enter: { opacity: 0, y: 40 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -30 },
};

const OnboardingStory = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [activityLevel, setActivityLevel] = useState("");
  const [motivationLevel, setMotivationLevel] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [blockers, setBlockers] = useState<string[]>([]);
  const [deeperStruggles, setDeeperStruggles] = useState<string[]>([]);
  const [lockedApps, setLockedApps] = useState<string[]>([]);
  const [checkInSchedule, setCheckInSchedule] = useState([
    { id: "morning", time: "07:00", label: "Morning", enabled: true },
    { id: "afternoon", time: "13:00", label: "Afternoon", enabled: false },
    { id: "evening", time: "20:00", label: "Evening", enabled: false },
  ]);

  // Loading screen state
  const [loadingStep, setLoadingStep] = useState(0);
  const [loadingPct, setLoadingPct] = useState(0);

  const totalSteps = 18;

  const toggle = (arr: string[], item: string) =>
    arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];

  const next = useCallback(() => {
    if (step < totalSteps - 1) setStep((s) => s + 1);
  }, [step]);

  const back = useCallback(() => {
    if (step > 0) setStep((s) => s - 1);
  }, [step]);

  // ─── Auto-advance for loading screen (step 11) ───
  useEffect(() => {
    if (step !== 11) return;
    setLoadingStep(0);
    setLoadingPct(0);

    const stepInterval = setInterval(() => {
      setLoadingStep((s) => {
        const next = s + 1;
        if (next >= PLAN_LOADING_STEPS.length) {
          clearInterval(stepInterval);
          // Auto-advance after a short pause
          setTimeout(() => setStep(12), 800);
        }
        return Math.min(next, PLAN_LOADING_STEPS.length - 1);
      });
    }, 1200);

    const pctInterval = setInterval(() => {
      setLoadingPct((p) => Math.min(p + 2, 100));
    }, 100);

    return () => { clearInterval(stepInterval); clearInterval(pctInterval); };
  }, [step]);

  const handleFinishOnboarding = () => {
    setState({
      name: name.trim(), goals, blockers, lockedApps,
      activityLevel, motivationLevel,
      deeperStruggles, commitmentMade: true,
      checkInSchedule,
      // Also set legacy fields for backward compat
      lockTimes: {
        morning: checkInSchedule[0]?.time || "07:00",
        afternoon: checkInSchedule[1]?.time || "13:00",
        evening: checkInSchedule[2]?.time || "20:00",
      },
      lockTimesEnabled: {
        morning: checkInSchedule[0]?.enabled || false,
        afternoon: checkInSchedule[1]?.enabled || false,
        evening: checkInSchedule[2]?.enabled || false,
      },
      onboardingComplete: true,
    });
    navigate("/paywall?from=onboarding");
  };

  const canProceed = () => {
    if (step === 3) return name.trim().length > 0;
    if (step === 4) return activityLevel.length > 0;
    if (step === 5) return motivationLevel.length > 0;
    if (step === 6) return goals.length > 0;
    if (step === 7) return blockers.length > 0;
    if (step === 8) return deeperStruggles.length > 0;

    return true;
  };

  const enabledTimesCount = checkInSchedule.filter(s => s.enabled).length;

  // Screens where we hide the bottom CTA (they have their own or auto-advance)
  const hideBottomCTA = [9, 11].includes(step);
  // Final screen index
  const finalScreen = totalSteps - 1;

  return (
    <div className="mobile-container bg-background flex flex-col min-h-[100dvh] relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-64 h-64 rounded-full bg-primary/3 blur-[100px] pointer-events-none" />

      {/* Top bar: back button + progress bar */}
      {step < finalScreen && (
        <div className="pt-safe-top px-6 pt-14 pb-4 flex items-center gap-3">
          {step > 0 && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={back}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>
          )}
          <ProgressBar current={step} total={totalSteps - 1} />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col px-6 pb-8 overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* ─── SCREEN 0: The Hook ─── */}
          {step === 0 && (
            <motion.div key="hook" variants={pageVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.5 }} className="flex-1 flex flex-col items-center justify-center text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", damping: 15 }} className="w-20 h-20 rounded-2xl bg-card/80 backdrop-blur-sm flex items-center justify-center mb-8 border border-border/50">
                <Smartphone className="w-10 h-10 text-primary" />
              </motion.div>
              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="text-muted-foreground text-base mb-4">
                the average person unlocks their phone
              </motion.p>
              <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.8, type: "spring", damping: 12 }} className="relative">
                {/* Pulsing radial glow behind counter */}
                <motion.div
                  className="absolute inset-0 -inset-x-12 -inset-y-6 rounded-full bg-primary/10 blur-3xl"
                  animate={{ opacity: [0.3, 0.6, 0.3], scale: [0.9, 1.1, 0.9] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
                <p className="text-7xl font-black text-foreground gold-text-glow leading-none mb-3 relative z-10"><AnimatedCounter target={205} /></p>
                <p className="text-muted-foreground text-lg relative z-10">times a day.</p>
              </motion.div>
            </motion.div>
          )}

          {/* ─── SCREEN 1: The Gut Punch ─── */}
          {step === 1 && (
            <motion.div key="punch" variants={pageVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.5 }} className="flex-1 flex flex-col items-center justify-center text-center">
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-muted-foreground text-lg mb-8">that's over</motion.p>
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5, type: "spring" }} className="mb-8">
                <p className="text-6xl font-black text-foreground leading-none mb-2">4+ hours</p>
                <p className="text-muted-foreground text-lg">lost every single day.</p>
              </motion.div>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="text-3xl font-bold text-foreground">gone.</motion.p>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} transition={{ delay: 1.5 }} className="mt-12 flex gap-3">
                {[0, 1, 2].map((i) => (
                  <motion.span key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 0.3, y: 0 }} transition={{ delay: 1.5 + i * 0.15 }} className="text-3xl">📱</motion.span>
                ))}
              </motion.div>
            </motion.div>
          )}

          {/* ─── SCREEN 2: The Reframe ─── */}
          {step === 2 && (
            <motion.div key="reframe" variants={pageVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.5 }} className="flex-1 flex flex-col items-center justify-center text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", damping: 12 }} className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-8 border border-primary/20">
                <Brain className="w-10 h-10 text-primary" />
              </motion.div>
              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-2xl font-bold text-foreground mb-4 max-w-[300px] leading-snug">
                what if every unlock<br /><ShimmerText className="text-primary">started with intention?</ShimmerText>
              </motion.p>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-muted-foreground text-base max-w-[280px] leading-relaxed mb-12">
                mindlock puts a 10-second mindset reset between you and your distractions.
              </motion.p>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }} className="flex gap-6">
                {[{ icon: Target, label: "set goals" }, { icon: Shield, label: "block apps" }, { icon: Zap, label: "get focused" }].map(({ icon: Icon, label }, i) => (
                  <motion.div key={label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 + i * 0.15 }} className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-xl bg-card border border-border/50 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-[11px] text-muted-foreground font-medium">{label}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}

          {/* ─── SCREEN 3: Name Input ─── */}
          {step === 3 && (
            <motion.div key="name" variants={pageVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.5 }} className="flex-1 flex flex-col pt-8">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 15 }} className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 border border-primary/20">
                <User className="w-8 h-8 text-primary" />
              </motion.div>
              <h1 className="text-3xl font-bold text-foreground mb-2">what should we call you?</h1>
              <p className="text-muted-foreground mb-10">we'll use this to personalize your experience.</p>
              <motion.input
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                autoFocus
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && canProceed() && next()}
                placeholder="your name"
                className="w-full bg-card border border-border rounded-2xl px-5 py-4 text-xl text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
              />
            </motion.div>
          )}

          {/* ─── SCREEN 4: Activity Level ─── */}
          {step === 4 && (
            <motion.div key="activity" variants={pageVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.5 }} className="flex-1 flex flex-col pt-8">
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-muted-foreground text-sm mb-2">
                {name ? `nice to meet you, ${name}.` : "quick question."}
              </motion.p>
              <h1 className="text-3xl font-bold text-foreground mb-2">how active are you with your goals?</h1>
              <p className="text-muted-foreground mb-8">this helps us personalize your daily content.</p>
              <div className="flex flex-col gap-3">
                {ACTIVITY_OPTIONS.map((opt, i) => (
                  <motion.div key={opt.value} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.08 }}>
                    <OptionCard emoji={opt.emoji} label={opt.label} selected={activityLevel === opt.value} onClick={() => setActivityLevel(opt.value)} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ─── SCREEN 5: Motivation Level ─── */}
          {step === 5 && (
            <motion.div key="motivation" variants={pageVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.5 }} className="flex-1 flex flex-col pt-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">how motivated are you right now?</h1>
              <p className="text-muted-foreground mb-8">be honest — there's no wrong answer.</p>
              <div className="flex flex-col gap-3">
                {MOTIVATION_OPTIONS.map((opt, i) => (
                  <motion.div key={opt.value} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.08 }}>
                    <OptionCard emoji={opt.emoji} label={opt.label} selected={motivationLevel === opt.value} onClick={() => setMotivationLevel(opt.value)} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ─── SCREEN 6: Goals ─── */}
          {step === 6 && (
            <motion.div key="goals" variants={pageVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.5 }} className="flex-1 flex flex-col pt-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">what are you working toward{name ? `, ${name}` : ""}?</h1>
              <p className="text-muted-foreground mb-10">select everything that resonates.</p>
              <div className="flex flex-wrap gap-3">
                {GOALS.map((g, i) => (
                  <motion.div key={g} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }}>
                    <Chip label={g} selected={goals.includes(g)} onToggle={() => setGoals(toggle(goals, g))} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ─── SCREEN 7: Blockers ─── */}
          {step === 7 && (
            <motion.div key="blockers" variants={pageVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.5 }} className="flex-1 flex flex-col pt-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">what holds you back?</h1>
              <p className="text-muted-foreground mb-10">be honest — this helps us personalize your experience.</p>
              <div className="flex flex-wrap gap-3">
                {BLOCKERS.map((b, i) => (
                  <motion.div key={b} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }}>
                    <Chip label={b} selected={blockers.includes(b)} onToggle={() => setBlockers(toggle(blockers, b))} accent />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ─── SCREEN 8: 🆕 Deeper Struggles ─── */}
          {step === 8 && (
            <motion.div key="deeper" variants={pageVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.5 }} className="flex-1 flex flex-col pt-8">
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-muted-foreground text-sm mb-3">
                sometimes, the real blockers go deeper.
              </motion.p>
              <h1 className="text-3xl font-bold text-foreground mb-2">does any of this resonate?</h1>
              <p className="text-muted-foreground mb-8">select all that apply — no judgment here.</p>
              <div className="flex flex-col gap-3">
                {DEEPER_STRUGGLES.map((item, i) => (
                  <motion.div key={item.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }}>
                    <OptionCard
                      emoji={item.emoji}
                      label={item.label}
                      selected={deeperStruggles.includes(item.label)}
                      onClick={() => setDeeperStruggles(toggle(deeperStruggles, item.label))}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ─── SCREEN 9: Lock Apps + Connect Screen Time (Combined) ─── */}
          {step === 9 && (
            <motion.div key="apps-screentime" variants={pageVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.5 }} className="flex-1 flex flex-col items-center justify-center text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", damping: 12 }} className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-6 border border-blue-400/20">
                <LinkIcon className="w-10 h-10 text-blue-400" />
              </motion.div>
              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-3xl font-bold text-foreground mb-2">
                lock your distractions
              </motion.h1>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-muted-foreground text-sm max-w-[300px] leading-relaxed mb-6">
                select the apps you want to lock, then connect screen time to activate.
              </motion.p>

              <div className="grid grid-cols-3 gap-3 w-full max-w-[320px] mb-8">
                {APPS.map((app, i) => {
                  const isLocked = lockedApps.includes(app.name);
                  return (
                    <motion.button key={app.name} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 + i * 0.05, type: "spring", damping: 18 }} whileTap={{ scale: 0.9 }} onClick={() => setLockedApps(toggle(lockedApps, app.name))}
                      className={`relative flex flex-col items-center gap-2 py-5 rounded-2xl border transition-all duration-300 ${isLocked ? "bg-primary/10 border-primary chip-glow" : "bg-card border-border hover:border-muted-foreground/30"}`}
                    >
                      <span className="text-2xl">{app.icon}</span>
                      <span className={`text-[11px] font-medium ${isLocked ? "text-primary" : "text-muted-foreground"}`}>{app.name}</span>
                      <AnimatePresence>
                        {isLocked && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-primary-foreground" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  );
                })}
              </div>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setState({ screenTimeConnected: true, lockedApps });
                  next();
                }}
                className="flex items-center gap-3 px-7 py-3.5 rounded-2xl bg-blue-500/15 border border-blue-400/30 text-blue-400 font-semibold transition-all hover:bg-blue-500/25"
              >
                <LinkIcon className="w-5 h-5" />
                connect screen time
              </motion.button>
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                onClick={next}
                className="mt-4 px-6 py-2 text-muted-foreground text-sm underline underline-offset-4 hover:text-foreground transition-colors"
              >
                skip for now
              </motion.button>
            </motion.div>
          )}

          {/* ─── SCREEN 10: Lock Timer Schedule ─── */}
          {step === 10 && (
            <motion.div key="timers" variants={pageVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.5 }} className="flex-1 flex flex-col pt-8">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 15 }} className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 border border-primary/20">
                <Clock className="w-8 h-8 text-primary" />
              </motion.div>
              <h1 className="text-3xl font-bold text-foreground mb-2">set your check-in times</h1>
              <p className="text-muted-foreground mb-8">your apps will lock at these times until you check in.</p>
              <div className="flex flex-col gap-3">
                {checkInSchedule.map((slot, idx) => (
                  <motion.div key={slot.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <TimeRow
                          label={slot.label}
                          time={slot.time}
                          enabled={slot.enabled}
                          onTimeChange={(t) => {
                            const updated = [...checkInSchedule];
                            updated[idx] = { ...updated[idx], time: t };
                            setCheckInSchedule(updated);
                          }}
                          onToggle={() => {
                            const updated = [...checkInSchedule];
                            updated[idx] = { ...updated[idx], enabled: !updated[idx].enabled };
                            setCheckInSchedule(updated);
                          }}
                        />
                      </div>
                      {checkInSchedule.length > 1 && (
                        <button
                          onClick={() => setCheckInSchedule(checkInSchedule.filter((_, i) => i !== idx))}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground/40 hover:text-red-400 hover:bg-red-500/10 transition-colors text-sm"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}

                {/* Add check-in button */}
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  onClick={() => {
                    const newId = `custom_${Date.now()}`;
                    setCheckInSchedule([
                      ...checkInSchedule,
                      { id: newId, time: "12:00", label: `Check-in ${checkInSchedule.length + 1}`, enabled: true },
                    ]);
                  }}
                  className="w-full py-3 rounded-xl border-2 border-dashed border-primary/20 text-primary/60 text-sm font-semibold hover:border-primary/40 hover:text-primary transition-colors"
                >
                  + Add check-in time
                </motion.button>
              </div>

              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-center text-muted-foreground text-xs mt-6">
                {enabledTimesCount === 0 ? "enable at least one check-in time" : `${enabledTimesCount} check-in ${enabledTimesCount === 1 ? "time" : "times"} set`}
              </motion.p>
            </motion.div>
          )}

          {/* ─── SCREEN 11: "Building Your Plan" Loading ─── */}
          {step === 11 && (
            <motion.div key="loading" variants={pageVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.5 }} className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="relative mb-8">
                <PlanLoadingRing progress={loadingPct} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.span
                    key={loadingPct >= 100 ? "done" : "pct"}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`text-2xl font-bold ${loadingPct >= 100 ? "text-primary" : "text-foreground"}`}
                  >
                    {loadingPct >= 100 ? "✓" : `${loadingPct}%`}
                  </motion.span>
                </div>
              </div>
              <AnimatePresence mode="wait">
                <motion.p
                  key={loadingStep}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="text-muted-foreground text-base"
                >
                  {PLAN_LOADING_STEPS[loadingStep]}
                </motion.p>
              </AnimatePresence>
              {/* Checkmarks for completed steps */}
              <div className="mt-8 flex flex-col gap-2 items-start w-full max-w-[260px]">
                {PLAN_LOADING_STEPS.slice(0, -1).map((stepText, i) => (
                  <motion.div
                    key={stepText}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: i < loadingStep ? 1 : 0, x: i < loadingStep ? 0 : -10 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center gap-2"
                  >
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Check className="w-3 h-3 text-green-400" />
                    </div>
                    <span className="text-muted-foreground text-xs">{stepText}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ─── SCREEN 13: 🆕 Personalized Thank You + How It Works ─── */}
          {step === 12 && (
            <motion.div key="thankyou" variants={pageVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.5 }} className="flex-1 flex flex-col pt-8">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12 }} className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 border border-primary/20">
                <Heart className="w-8 h-8 text-primary" />
              </motion.div>
              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-3xl font-bold text-foreground mb-3">
                {name ? `${name}, thank you` : "thank you"} for your honesty.
              </motion.h1>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-muted-foreground mb-10 leading-relaxed">
                we built something just for you. here's how it works:
              </motion.p>
              {[
                { num: "1", title: "check in daily", desc: "tell us how you feel. takes 10 seconds." },
                { num: "2", title: "get your message", desc: "personalized content matched to your mood + goals." },
                { num: "3", title: "unlock your apps", desc: "your distractions stay locked until you show up for yourself." },
              ].map((item, i) => (
                <motion.div
                  key={item.num}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + i * 0.2 }}
                  className="flex gap-4 mb-5"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold text-sm">{item.num}</span>
                  </div>
                  <div>
                    <p className="text-foreground font-semibold mb-0.5">{item.title}</p>
                    <p className="text-muted-foreground text-sm">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* ─── SCREEN 14: 🆕 AI Content Preview ─── */}
          {step === 13 && (() => {
            const PREVIEW_CONTENT: Record<string, { quote: string; author: string; action: string }> = {
              Career: {
                quote: "The pain of discipline weighs ounces. The pain of regret weighs tons.",
                author: "Jim Rohn",
                action: "Count backward from 5, then immediately start the task you've been avoiding.",
              },
              Fitness: {
                quote: "You have to work hard in the dark to shine in the light.",
                author: "Kobe Bryant",
                action: "Drop and do 10 push-ups right now.",
              },
              "Mental Health": {
                quote: "The wound is the place where the light enters you.",
                author: "Rumi",
                action: "Put your hand on your heart and say: \"I am doing my best and that is enough.\"",
              },
              Relationships: {
                quote: "Owning our story and loving ourselves through that process is the bravest thing we'll ever do.",
                author: "Brené Brown",
                action: "Text someone you care about and tell them one thing you appreciate about them.",
              },
              Wealth: {
                quote: "Discipline equals freedom.",
                author: "Jocko Willink",
                action: "Write one expense you can cut this week — then redirect that money toward your goal.",
              },
              Creativity: {
                quote: "Start before you're ready. Don't prepare, begin.",
                author: "Mel Robbins",
                action: "Open your biggest project right now and write just one sentence of progress.",
              },
            };
            const primaryGoal = goals[0] || "Career";
            const content = PREVIEW_CONTENT[primaryGoal] || PREVIEW_CONTENT.Career;
            return (
            <motion.div key="preview" variants={pageVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.5 }} className="flex-1 flex flex-col pt-8">
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-muted-foreground text-sm mb-3">
                here's a taste of what you'll get every day.
              </motion.p>
              <h1 className="text-3xl font-bold text-foreground mb-8">content made just for you</h1>

              {/* Quote preview card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-card rounded-3xl p-8 mb-4 border border-border/50"
              >
                <Sparkles className="w-5 h-5 text-blue-400 mb-4" />
                <p className="font-serif-quote text-lg text-foreground leading-relaxed italic mb-4">
                  "{content.quote}"
                </p>
                <p className="text-muted-foreground text-sm">— {content.author}</p>
              </motion.div>

              {/* Micro-action preview */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-accent rounded-2xl p-5"
              >
                <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-1.5">today's micro-action</p>
                <p className="text-foreground text-sm">{content.action}</p>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-center text-muted-foreground text-xs mt-6"
              >
                personalized to your mood, goals, and blockers — every single day
              </motion.p>
            </motion.div>
            );
          })()}

          {/* ─── SCREEN 15: 🆕 Social Proof ─── */}
          {step === 14 && (
            <motion.div key="social" variants={pageVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.5 }} className="flex-1 flex flex-col pt-8">
              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold text-foreground mb-2">
                mindlock was designed for{" "}
                <span className="text-primary">people like you</span>.
              </motion.h1>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-muted-foreground mb-6">
                reviews from people using mindlock.
              </motion.p>

              {/* Stats bar */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="flex items-center justify-center gap-3 mb-8"
              >
                <div className="flex items-center gap-1">
                  <span className="text-2xl">🏆</span>
                  <span className="text-primary text-sm font-bold">#1 mindset app</span>
                  <span className="text-2xl">🏆</span>
                </div>
                <div className="flex items-center gap-1">
                  <Stars count={5} />
                  <span className="text-primary text-xs font-semibold">+200,000</span>
                </div>
              </motion.div>

              {/* Review cards */}
              {SOCIAL_PROOF_REVIEWS.map((review, i) => (
                <motion.div
                  key={review.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.2 }}
                  className="bg-card rounded-2xl p-6 mb-4 border border-border/50"
                >
                  <Stars count={review.stars} />
                  <p className="text-foreground font-bold mt-2 mb-2">{review.title}</p>
                  <p className="text-muted-foreground text-sm leading-relaxed">{review.body}</p>
                  <p className="text-muted-foreground/60 text-xs mt-2">— {review.author}</p>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* ─── SCREEN 16: 🆕 Commitment Pledge ─── */}
          {step === 15 && (
            <motion.div key="commit" variants={pageVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.5 }} className="flex-1 flex flex-col pt-8">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12 }} className="text-5xl mb-6">✊</motion.div>
              <h1 className="text-3xl font-bold text-foreground mb-2">make your commitment</h1>
              <p className="text-muted-foreground mb-8">this is your promise to yourself.</p>

              <div className="flex flex-col gap-3 mb-8">
                {COMMITMENT_BULLETS.map((bullet, i) => (
                  <motion.div
                    key={bullet}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.15 }}
                    className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border/50"
                  >
                    <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <p className="text-foreground text-sm font-medium">{bullet}</p>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="bg-primary/5 border border-primary/20 rounded-2xl p-5 text-center"
              >
                <p className="text-muted-foreground text-xs mb-2">signed by</p>
                <p className="text-primary text-xl font-bold">{name || "you"}</p>
              </motion.div>
            </motion.div>
          )}

          {/* ─── SCREEN 17: 🆕 30-Day Journey Preview ─── */}
          {step === 16 && (
            <motion.div key="journey" variants={pageVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.5 }} className="flex-1 flex flex-col items-center justify-center text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", damping: 15 }}
                className="w-full max-w-[320px] bg-gradient-to-br from-primary/15 via-primary/5 to-transparent rounded-3xl p-8 border border-primary/20 mb-8"
              >
                <Flame className="w-8 h-8 text-primary mx-auto mb-4" />
                <h2 className="text-2xl font-black text-foreground mb-2">your 30-day journey</h2>
                <p className="text-muted-foreground text-sm mb-6">here's what happens when you commit:</p>

                {[
                  { day: "day 1-7", text: "build the habit, break the scroll cycle" },
                  { day: "day 8-14", text: "notice the shift in your energy" },
                  { day: "day 15-21", text: "deeper focus, clearer thinking" },
                  { day: "day 22-30", text: "a completely new relationship with your phone" },
                ].map((phase, i) => (
                  <motion.div
                    key={phase.day}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.15 }}
                    className="flex items-start gap-3 mb-4 text-left"
                  >
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-primary text-xs font-bold uppercase tracking-wider">{phase.day}</p>
                      <p className="text-muted-foreground text-sm">{phase.text}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="text-muted-foreground text-xs"
              >
                your journey starts now.
              </motion.p>
            </motion.div>
          )}

          {/* ─── SCREEN 18: Locked In (Finale) ─── */}
          {step === 17 && (
            <motion.div key="lockedin" variants={pageVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.5 }} className="flex-1 flex flex-col items-center justify-center text-center relative">
              {/* Radial glow burst */}
              <motion.div
                className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-primary/15 blur-[80px]"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.5, 1], opacity: [0, 0.8, 0.4] }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.3, 1] }}
                transition={{ duration: 0.7, type: "spring", damping: 10 }}
                className="text-8xl mb-8 relative z-10"
              >
                🔒
              </motion.div>
              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-4xl font-black text-foreground mb-3 gold-text-glow relative z-10">
                <ShimmerText>you're locked in{name ? `, ${name}` : ""}.</ShimmerText>
              </motion.h1>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="text-muted-foreground text-base max-w-[280px] leading-relaxed mb-4 relative z-10">
                your mind comes first. every single day.
              </motion.p>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }} className="flex gap-3 mb-12 relative z-10">
                {["🎯", "🧠", "💪"].map((emoji, i) => (
                  <motion.span key={i} initial={{ opacity: 0, y: 10, scale: 0 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 1.1 + i * 0.15, type: "spring", damping: 10 }} className="text-3xl">{emoji}</motion.span>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Bottom CTA ─── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mt-auto pt-6">
          {hideBottomCTA ? (
            null
          ) : step < finalScreen ? (
            <motion.button
              whileTap={canProceed() ? { scale: 0.95 } : {}}
              onClick={next}
              disabled={!canProceed()}
              className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all duration-300 ${
                canProceed() ? "bg-primary text-primary-foreground gold-glow" : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              {step === 15 ? "i commit ✊" : "continue"}
            </motion.button>
          ) : (
            <motion.button whileTap={{ scale: 0.95 }} onClick={handleFinishOnboarding} className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg gold-glow">
              let's go 🚀
            </motion.button>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default OnboardingStory;
