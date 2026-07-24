import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { setState } from "@/lib/store";
import { Check } from "lucide-react";

const APPS = [
  { name: "Instagram", icon: "📸" },
  { name: "TikTok", icon: "🎵" },
  { name: "X", icon: "𝕏" },
  { name: "YouTube", icon: "▶️" },
  { name: "Reddit", icon: "🤖" },
  { name: "Snapchat", icon: "👻" },
];

const LockApps = () => {
  const navigate = useNavigate();
  const [locked, setLocked] = useState<string[]>([]);

  const toggle = (app: string) =>
    setLocked((prev) => (prev.includes(app) ? prev.filter((a) => a !== app) : [...prev, app]));

  const handleStart = () => {
    setState({ lockedApps: locked, onboardingComplete: true });
    navigate("/unlock");
  };

  return (
    <div className="mobile-container bg-background flex flex-col px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex-1">
        <h1 className="text-3xl font-bold text-foreground mb-2">Lock your distractions</h1>
        <p className="text-muted-foreground mb-10">Select apps you want to lock until you've done your daily check-in.</p>

        <div className="grid grid-cols-3 gap-4">
          {APPS.map((app) => {
            const isLocked = locked.includes(app.name);
            return (
              <motion.button
                key={app.name}
                whileTap={{ scale: 0.9 }}
                onClick={() => toggle(app.name)}
                className={`relative flex flex-col items-center gap-2.5 py-6 rounded-2xl border transition-all duration-300 ${
                  isLocked ? "bg-primary/10 border-primary chip-glow" : "bg-card border-border"
                }`}
              >
                <span className="text-3xl">{app.icon}</span>
                <span className={`text-xs font-medium ${isLocked ? "text-primary" : "text-muted-foreground"}`}>{app.name}</span>
                <AnimatePresence>
                  {isLocked && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} whileTap={{ scale: 0.95 }} onClick={handleStart} className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-lg mt-8">
        Start My Journey
      </motion.button>
    </div>
  );
};

export default LockApps;
