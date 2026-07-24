import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getState, setState } from "@/lib/store";

const GOALS = ["Career", "Fitness", "Relationships", "Mental Health", "Wealth", "Creativity"];
const BLOCKERS = ["Anxiety", "Procrastination", "Self-Doubt", "Burnout", "Lack of Focus", "Fear"];

const Chip = ({ label, selected, onToggle }: { label: string; selected: boolean; onToggle: () => void }) => (
  <motion.button
    whileTap={{ scale: 0.93 }}
    onClick={onToggle}
    className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 border ${
      selected
        ? "bg-primary/15 border-primary text-primary chip-glow"
        : "bg-card border-border text-muted-foreground hover:border-muted-foreground/40"
    }`}
  >
    {label}
  </motion.button>
);

const SetFocus = () => {
  const navigate = useNavigate();
  const state = getState();
  const [goals, setGoals] = useState<string[]>(state.goals);
  const [blockers, setBlockers] = useState<string[]>(state.blockers);

  const toggle = (arr: string[], item: string): string[] =>
    arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];

  const canContinue = goals.length > 0 && blockers.length > 0;

  const handleContinue = () => {
    setState({ goals, blockers });
    navigate("/onboarding/apps");
  };

  return (
    <div className="mobile-container bg-background flex flex-col px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex-1">
        <h1 className="text-3xl font-bold text-foreground mb-2">Set your focus</h1>
        <p className="text-muted-foreground mb-8">What matters to you right now?</p>

        <div className="mb-10">
          <h2 className="text-sm font-semibold text-primary uppercase tracking-wider mb-4">Your Goals</h2>
          <div className="flex flex-wrap gap-2.5">
            {GOALS.map((g) => (
              <Chip key={g} label={g} selected={goals.includes(g)} onToggle={() => setGoals(toggle(goals, g))} />
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-secondary uppercase tracking-wider mb-4">What holds you back?</h2>
          <div className="flex flex-wrap gap-2.5">
            {BLOCKERS.map((b) => (
              <Chip key={b} label={b} selected={blockers.includes(b)} onToggle={() => setBlockers(toggle(blockers, b))} />
            ))}
          </div>
        </div>
      </motion.div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: canContinue ? 1 : 0.4 }}
        whileTap={canContinue ? { scale: 0.95 } : {}}
        onClick={handleContinue}
        disabled={!canContinue}
        className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-lg mt-8 disabled:cursor-not-allowed"
      >
        Continue
      </motion.button>
    </div>
  );
};

export default SetFocus;
