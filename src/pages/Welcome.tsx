import { useState } from "react";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getState } from "@/lib/store";

const Welcome = () => {
  const navigate = useNavigate();
  const [isPressed, setIsPressed] = useState(false);

  const handleStart = () => {
    const state = getState();
    if (state.onboardingComplete) {
      navigate("/home");
    } else {
      navigate("/onboarding");
    }
  };

  return (
    <div className="mobile-container bg-background flex flex-col items-center justify-center px-8 relative">
      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-primary/3 blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.8, delay: 0.2 }}
        className="mb-10"
      >
        <div className="w-20 h-20 rounded-2xl bg-card/80 backdrop-blur-sm flex items-center justify-center animate-pulse-gold border border-border/30">
          <Lock className="w-10 h-10 text-primary" />
        </div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="text-5xl font-black tracking-tighter text-foreground mb-4 gradient-text-gold"
      >
        MindLock
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="text-muted-foreground text-lg text-center leading-relaxed mb-16 font-medium"
      >
        Your mind first. Then your phone.
      </motion.p>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onPointerDown={() => setIsPressed(true)}
        onPointerUp={() => setIsPressed(false)}
        onPointerLeave={() => setIsPressed(false)}
        onClick={handleStart}
        className={`w-full max-w-[280px] py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg tracking-tight transition-all duration-200 btn-shimmer ${
          isPressed ? "gold-glow" : ""
        }`}
      >
        Get Started
      </motion.button>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 text-muted-foreground/30 text-xs font-medium tracking-wide"
      >
        Built for your daily reset
      </motion.p>
    </div>
  );
};

export default Welcome;
