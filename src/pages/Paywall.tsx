import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, Sparkles, Users, Flame, Clock, Bookmark, Palette, Target, BarChart3, Compass } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

const PLANS = [
  { id: "weekly", label: "$6.99/wk", sublabel: "Weekly", price: 6.99 },
  { id: "yearly", label: "$39.99/yr", sublabel: "Best Value · just $0.77/wk", price: 39.99, highlight: true },
];

const PRO_FEATURES = [
  { icon: Flame, text: "Unlimited check-ins & reflections" },
  { icon: Sparkles, text: "AI-personalized content matched to mood" },
  { icon: BarChart3, text: "Weekly mood recap & analytics" },
  { icon: Target, text: "Daily intentions & journaling" },
  { icon: Clock, text: "Custom check-in schedule" },
  { icon: Compass, text: "Explore library with 10 categories" },
  { icon: Bookmark, text: "Unlimited saved bookmarks" },
  { icon: Palette, text: "Exclusive theme drops" },
];

const FREE_FEATURES = [
  "1 daily check-in",
  "Curated daily quotes",
  "Basic streak tracking",
  "Journal history",
  "Starter theme drops",
];

const Paywall = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isOnboarding = searchParams.get("from") === "onboarding";
  const [selected, setSelected] = useState("yearly");
  const [userCount, setUserCount] = useState(10000);
  const countRef = useRef<number | null>(null);

  // Animated social proof counter — ticks up on mount
  useEffect(() => {
    const target = 10247;
    const duration = 2000;
    const steps = 30;
    const increment = (target - 10000) / steps;
    let step = 0;
    countRef.current = window.setInterval(() => {
      step++;
      if (step >= steps) {
        setUserCount(target);
        if (countRef.current) clearInterval(countRef.current);
      } else {
        setUserCount(Math.floor(10000 + increment * step));
      }
    }, duration / steps);
    return () => { if (countRef.current) clearInterval(countRef.current); };
  }, []);

  const handleSkip = () => {
    navigate("/home");
  };

  const handlePurchase = () => {
    // TODO: Wire up RevenueCat / Superwall
    navigate("/home");
  };

  return (
    <div className="mobile-container bg-background flex flex-col px-6 py-8 relative overflow-hidden">
      {/* Ambient glows */}
      <motion.div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-primary/8 blur-[120px] pointer-events-none"
        animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.1, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute bottom-1/4 right-0 w-48 h-48 rounded-full bg-primary/5 blur-[100px] pointer-events-none" />

      {/* Header */}
      {!isOnboarding ? (
        <button onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
      ) : (
        <div className="mb-6 h-5" /> 
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 overflow-y-auto"
      >
        {/* Emotional hook */}
        {isOnboarding ? (
          <>
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">your plan is ready</span>
            </motion.div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              start your free trial.
            </h1>
            <p className="text-muted-foreground mb-6">
              try mindlock free for 3 days. cancel anytime — no charge until your trial ends.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Unlock <span className="text-primary">MindLock Pro</span>
            </h1>
            <p className="text-muted-foreground mb-6">
              Invest in your mind. It compounds.
            </p>
          </>
        )}

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-2 mb-8 py-2.5 px-4 bg-card/60 backdrop-blur-sm rounded-xl border border-border/50"
        >
          <Users className="w-4 h-4 text-primary shrink-0" />
          <p className="text-xs text-muted-foreground">
            Join <span className="text-foreground font-semibold tabular-nums">{userCount.toLocaleString()}+</span> people building better habits
          </p>
        </motion.div>

        {/* Comparison */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {/* Free column */}
          <motion.div initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="bg-card/80 backdrop-blur-sm rounded-2xl p-4 border border-border/30">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] mb-3">
              Free
            </p>
            {FREE_FEATURES.map((f, i) => (
              <motion.div key={f} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 + i * 0.05 }} className="flex items-start gap-2 mb-2.5">
                <Check className="w-3.5 h-3.5 text-muted-foreground/50 mt-0.5 shrink-0" />
                <span className="text-xs text-muted-foreground">{f}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Pro column — glassmorphism with animated border */}
          <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }} className="relative rounded-2xl overflow-hidden">
            {/* Animated gradient border */}
            <motion.div 
              className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/40 via-primary/10 to-primary/30"
              animate={{ backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"] }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            />
            <div className="relative bg-primary/8 backdrop-blur-sm rounded-2xl p-4 m-[1px] border border-primary/20">
              <div className="flex items-center gap-1.5 mb-3">
                <Sparkles className="w-3 h-3 text-primary" />
                <p className="text-[10px] font-bold text-primary uppercase tracking-[0.15em]">
                  Pro
                </p>
              </div>
              {PRO_FEATURES.map(({ icon: Icon, text }, i) => (
                <motion.div key={text} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 + i * 0.05 }} className="flex items-start gap-2 mb-2.5">
                  <Icon className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                  <span className="text-xs text-foreground font-medium">{text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Pricing pills */}
        <div className="space-y-3 mb-6">
          {PLANS.map((plan) => (
            <motion.button
              key={plan.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => setSelected(plan.id)}
              className={`w-full flex items-center justify-between py-4 px-5 rounded-2xl border transition-all duration-300 ${
                selected === plan.id
                  ? "bg-primary/10 border-primary/60 backdrop-blur-sm shadow-[0_0_20px_rgba(var(--primary-rgb),0.15)] chip-glow"
                  : "bg-card/80 backdrop-blur-sm border-border hover:border-muted-foreground/30"
              }`}
            >
              <div className="text-left">
                <p className={`font-semibold ${selected === plan.id ? "text-primary" : "text-foreground"}`}>
                  {plan.label}
                </p>
                <p className="text-xs text-muted-foreground">{plan.sublabel}</p>
              </div>
              {plan.highlight && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6, type: "spring", damping: 12 }}
                  className="px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase"
                >
                  Save 89%
                </motion.span>
              )}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* CTA — with subtle pulsing glow */}
      <div className="relative">
        <motion.div
          className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handlePurchase}
          className="relative w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-lg gold-glow btn-shimmer"
        >
          Start 3-Day Free Trial
        </motion.button>
      </div>

      <p className="text-center text-muted-foreground/50 text-[10px] mt-3">
        Cancel anytime · You won't be charged during your trial
      </p>

      {/* Skip option for onboarding */}
      {isOnboarding && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          onClick={handleSkip}
          className="text-center text-muted-foreground/40 text-xs mt-4 py-2 hover:text-muted-foreground transition-colors"
        >
          Not now
        </motion.button>
      )}
    </div>
  );
};

export default Paywall;
