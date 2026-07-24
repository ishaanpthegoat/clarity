import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { useEffect } from "react";
import { getThemeDrop } from "@/lib/themeDrops";
import { equipThemeDrop } from "@/lib/store";

interface ThemeDropModalProps {
  dropId: string;
  onClose: () => void;
  onEquip: () => void;
}

const ThemeDropModal = ({ dropId, onClose, onEquip }: ThemeDropModalProps) => {
  const drop = getThemeDrop(dropId);

  useEffect(() => {
    if (!drop) return;
    // Celebration confetti in the drop's accent color
    const hex = drop.accentHex;
    setTimeout(() => {
      confetti({
        particleCount: 60,
        spread: 80,
        origin: { y: 0.55 },
        colors: [hex, "#FFF", "#FFD700"],
        scalar: 1.3,
        gravity: 0.7,
        ticks: 160,
      });
    }, 200);
    setTimeout(() => {
      confetti({
        particleCount: 40,
        angle: 60,
        spread: 50,
        origin: { x: 0, y: 0.6 },
        colors: [hex, "#FFF"],
        scalar: 1.1,
        gravity: 0.8,
        ticks: 130,
      });
    }, 500);
    setTimeout(() => {
      confetti({
        particleCount: 40,
        angle: 120,
        spread: 50,
        origin: { x: 1, y: 0.6 },
        colors: [hex, "#FFF"],
        scalar: 1.1,
        gravity: 0.8,
        ticks: 130,
      });
    }, 700);
  }, [drop]);

  if (!drop) return null;

  const handleEquip = () => {
    equipThemeDrop(dropId);
    onEquip();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center px-8"
        style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 15, stiffness: 200, delay: 0.1 }}
          className="text-center max-w-sm w-full"
        >
          {/* Glowing icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.3, 1] }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mx-auto mb-6 w-28 h-28 rounded-full flex items-center justify-center relative"
            style={{
              background: `radial-gradient(circle, ${drop.accentHex}30 0%, transparent 70%)`,
              boxShadow: `0 0 40px ${drop.accentHex}40, 0 0 80px ${drop.accentHex}20`,
            }}
          >
            <span className="text-6xl">{drop.icon}</span>
            {/* Animated ring */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ border: `2px solid ${drop.accentHex}60` }}
              animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.2, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>

          {/* Text */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-xs font-bold uppercase tracking-[0.2em] mb-2"
            style={{ color: drop.accentHex }}
          >
            Theme Unlocked
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-3xl font-black text-white mb-2"
          >
            {drop.name}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-sm text-white/50 mb-8"
          >
            {drop.type === "streak" ? `🔥 ${drop.description}` : `📅 ${drop.description}`}
          </motion.p>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="flex flex-col gap-3"
          >
            <button
              onClick={handleEquip}
              className="w-full py-4 rounded-2xl font-bold text-base text-white transition-all"
              style={{
                backgroundColor: drop.accentHex,
                boxShadow: `0 0 24px ${drop.accentHex}40`,
              }}
            >
              Equip Now 🎨
            </button>
            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-2xl border border-white/10 text-white/50 font-semibold text-sm hover:text-white/70 transition-colors"
            >
              Save for Later
            </button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ThemeDropModal;
