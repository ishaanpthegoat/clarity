import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Lock as LockIcon, Crown, Flame } from "lucide-react";
import { getState, setState, equipThemeDrop } from "@/lib/store";
import { useNavigate } from "react-router-dom";
import { THEME_DROPS, getThemeDrop } from "@/lib/themeDrops";

const BETA_MODE = true; // Unlock everything during beta

const ACCENT_COLORS = [
  { id: "gold", label: "Gold", color: "#D4AF37", hsl: "43 72% 52%" },
  { id: "blue", label: "Ocean", color: "#3B82F6", hsl: "217 91% 60%", premium: true },
  { id: "purple", label: "Amethyst", color: "#8B5CF6", hsl: "258 90% 66%", premium: true },
  { id: "green", label: "Emerald", color: "#10B981", hsl: "160 84% 39%", premium: true },
  { id: "rose", label: "Rose", color: "#F43F5E", hsl: "347 77% 50%", premium: true },
  { id: "cyan", label: "Ice", color: "#06B6D4", hsl: "188 94% 43%", premium: true },
  { id: "amber", label: "Amber", color: "#F59E0B", hsl: "38 92% 50%", premium: true },
];

const BACKGROUNDS = [
  { id: "dark", label: "Midnight", bg: "#0a0a0a", card: "#141414" },
  { id: "deepblue", label: "Deep Blue", bg: "#0a0f1a", card: "#111827", premium: true },
  { id: "charcoal", label: "Charcoal", bg: "#1a1a1a", card: "#252525", premium: true },
  { id: "noir", label: "Pure Noir", bg: "#000000", card: "#0d0d0d", premium: true },
  { id: "snow", label: "Snow", bg: "#f8f9fa", card: "#ffffff", premium: true, light: true },
  { id: "ivory", label: "Warm Ivory", bg: "#faf8f5", card: "#ffffff", premium: true, light: true },
  { id: "silver", label: "Soft Gray", bg: "#f0f0f0", card: "#fafafa", premium: true, light: true },
];

// Apply theme to the DOM — exported so it can be called on app load
export function applyThemeFromState() {
  const state = getState();
  const activeDrop = state.activeThemeDrop ? getThemeDrop(state.activeThemeDrop) : null;

  if (activeDrop) {
    document.documentElement.style.setProperty("--primary", activeDrop.accentHSL);
    document.documentElement.style.setProperty("--glow-color", activeDrop.glowHSL);
    document.documentElement.style.setProperty("--background", activeDrop.bgHSL);
    document.documentElement.style.setProperty("--card", activeDrop.cardHSL);
  } else {
    const accent = ACCENT_COLORS.find((c) => c.id === state.accentColor);
    if (accent) {
      document.documentElement.style.setProperty("--primary", accent.hsl);
    }
    document.documentElement.style.setProperty("--glow-color", "43 80% 60%");
    const bg = BACKGROUNDS.find((b) => b.id === state.backgroundTheme);
    if (bg) {
      document.documentElement.style.setProperty("--background", bgToHSL(bg.bg));
      document.documentElement.style.setProperty("--card", bgToHSL(bg.card));
      
      if ((bg as any).light) {
        // ── Light mode: all text/UI must be dark on light backgrounds ──
        document.documentElement.style.setProperty("--foreground", "225 25% 12%");
        document.documentElement.style.setProperty("--card-foreground", "225 25% 12%");
        document.documentElement.style.setProperty("--popover", bgToHSL(bg.card));
        document.documentElement.style.setProperty("--popover-foreground", "225 25% 12%");
        document.documentElement.style.setProperty("--primary-foreground", "0 0% 100%");
        document.documentElement.style.setProperty("--secondary", "216 15% 60%");
        document.documentElement.style.setProperty("--secondary-foreground", "225 25% 12%");
        document.documentElement.style.setProperty("--muted", "40 20% 92%");
        document.documentElement.style.setProperty("--muted-foreground", "215 12% 45%");
        document.documentElement.style.setProperty("--accent", "40 20% 94%");
        document.documentElement.style.setProperty("--accent-foreground", "225 25% 12%");
        document.documentElement.style.setProperty("--destructive-foreground", "0 0% 100%");
        document.documentElement.style.setProperty("--border", "40 15% 85%");
        document.documentElement.style.setProperty("--input", "40 15% 85%");
        document.documentElement.style.setProperty("--ring", "43 72% 45%");
        document.documentElement.style.setProperty("--navy", "225 25% 95%");
        document.documentElement.style.setProperty("--charcoal", "40 30% 97%");
      } else {
        // ── Dark mode: standard dark theme values ──
        document.documentElement.style.setProperty("--foreground", "210 40% 98%");
        document.documentElement.style.setProperty("--card-foreground", "210 40% 98%");
        document.documentElement.style.setProperty("--popover", bgToHSL(bg.card));
        document.documentElement.style.setProperty("--popover-foreground", "210 40% 98%");
        document.documentElement.style.setProperty("--primary-foreground", "228 20% 5%");
        document.documentElement.style.setProperty("--secondary", "216 20% 50%");
        document.documentElement.style.setProperty("--secondary-foreground", "210 40% 98%");
        document.documentElement.style.setProperty("--muted", "225 20% 16%");
        document.documentElement.style.setProperty("--muted-foreground", "215 15% 55%");
        document.documentElement.style.setProperty("--accent", "225 25% 15%");
        document.documentElement.style.setProperty("--accent-foreground", "210 40% 98%");
        document.documentElement.style.setProperty("--destructive-foreground", "210 40% 98%");
        document.documentElement.style.setProperty("--border", "225 20% 18%");
        document.documentElement.style.setProperty("--input", "225 20% 18%");
        document.documentElement.style.setProperty("--ring", "43 72% 52%");
        document.documentElement.style.setProperty("--navy", "225 25% 11%");
        document.documentElement.style.setProperty("--charcoal", "228 20% 5%");
      }
    } else {
      document.documentElement.style.setProperty("--background", "0 0% 4%");
      document.documentElement.style.setProperty("--card", "0 0% 8%");
    }
  }
}

function bgToHSL(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

const STREAK_DROPS = THEME_DROPS.filter((d) => d.type === "streak");
const HOLIDAY_DROPS = THEME_DROPS.filter((d) => d.type === "holiday");

const ThemeCustomizer = () => {
  const navigate = useNavigate();
  const [state, setLocalState] = useState(getState());
  const isPremium = BETA_MODE;

  const hasActiveDrop = !!state.activeThemeDrop;

  const selectAccent = (id: string, premium?: boolean) => {
    if (hasActiveDrop) return; // Disabled when theme is active
    if (premium && !isPremium) { navigate("/paywall"); return; }
    const newState = setState({ accentColor: id, activeThemeDrop: null });
    setLocalState(newState);
    applyThemeFromState();
  };

  const selectBackground = (id: string, premium?: boolean) => {
    if (hasActiveDrop) return; // Disabled when theme is active
    if (premium && !isPremium) { navigate("/paywall"); return; }
    const newState = setState({ backgroundTheme: id });
    setLocalState(newState);
    applyThemeFromState();
  };

  const toggleDrop = (dropId: string, tier: "free" | "premium") => {
    const isOwned = BETA_MODE || state.themeInventory.includes(dropId);
    if (!isOwned) {
      if (tier === "premium" && !isPremium) navigate("/paywall");
      return;
    }
    const newActiveId = state.activeThemeDrop === dropId ? null : dropId;
    equipThemeDrop(newActiveId);
    const newState = setState({ activeThemeDrop: newActiveId });
    setLocalState(newState);
    applyThemeFromState();
  };

  const totalCount = THEME_DROPS.length;
  const ownedCount = BETA_MODE ? totalCount : state.themeInventory.length;

  const activeDrop = state.activeThemeDrop ? getThemeDrop(state.activeThemeDrop) : null;

  // Free-floating 3D orb — no container, no box
  const renderOrb = (drop: typeof THEME_DROPS[0], idx: number) => {
    const isOwned = BETA_MODE || state.themeInventory.includes(drop.id);
    const isActive = state.activeThemeDrop === drop.id;
    const isLocked = !isOwned;

    return (
      <motion.button
        key={drop.id}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: idx * 0.03 }}
        whileTap={isOwned ? { scale: 0.85 } : undefined}
        whileHover={isOwned ? { scale: 1.08 } : undefined}
        onClick={() => toggleDrop(drop.id, drop.tier)}
        className="flex flex-col items-center shrink-0"
        style={{ width: 72, gap: 6 }}
      >
        {/* Orb */}
        <div className="relative" style={{ width: 56, height: 56 }}>
          {/* Active — spinning ring */}
          {isActive && (
            <motion.div
              className="absolute -inset-2 rounded-full"
              style={{
                background: `conic-gradient(from 0deg, ${drop.accentHex}80, transparent 40%, ${drop.accentHex}80 50%, transparent 90%, ${drop.accentHex}80)`,
                filter: `blur(1px)`,
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
            />
          )}

          {/* Orb body — frosted glass */}
          <div
            className="relative w-full h-full rounded-full"
            style={{
              background: isLocked
                ? "radial-gradient(circle at 40% 35%, rgba(50,50,55,0.9) 0%, rgba(25,25,30,0.95) 100%)"
                : `radial-gradient(circle at 40% 35%, ${drop.accentHex}30 0%, ${drop.accentHex}12 50%, rgba(30,30,38,0.85) 100%)`,
              boxShadow: isActive
                ? `0 4px 24px ${drop.accentHex}35, 0 0 40px ${drop.accentHex}10, inset 0 1px 1px rgba(255,255,255,0.08)`
                : isLocked
                ? "inset 0 1px 1px rgba(255,255,255,0.03), 0 2px 8px rgba(0,0,0,0.3)"
                : "inset 0 1px 2px rgba(255,255,255,0.08), 0 2px 10px rgba(0,0,0,0.25)",
              border: isActive
                ? `2px solid ${drop.accentHex}80`
                : isLocked
                ? "1.5px solid rgba(255,255,255,0.04)"
                : "1.5px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(8px)",
              transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            {/* Glass highlight — top shine */}
            <div
              className="absolute rounded-full"
              style={{
                top: 3, left: "50%", transform: "translateX(-50%)",
                width: 28, height: 10,
                background: isLocked
                  ? "radial-gradient(ellipse, rgba(255,255,255,0.04) 0%, transparent 100%)"
                  : "radial-gradient(ellipse, rgba(255,255,255,0.14) 0%, transparent 100%)",
              }}
            />

            {/* Icon — absolutely centered */}
            {isLocked ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <LockIcon className="w-4 h-4 text-white/15" />
              </div>
            ) : (
              <span
                className="absolute z-10"
                style={{
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  fontSize: 26,
                  lineHeight: "26px",
                  textAlign: "center",
                  filter: isActive ? `drop-shadow(0 0 6px ${drop.accentHex})` : "none",
                  transition: "filter 0.3s ease",
                }}
              >
                {drop.icon}
              </span>
            )}

            {/* Active check */}
            {isActive && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -bottom-0.5 -right-0.5 rounded-full flex items-center justify-center z-10"
                style={{
                  width: 18, height: 18,
                  backgroundColor: drop.accentHex,
                  boxShadow: `0 0 10px ${drop.accentHex}90`,
                }}
              >
                <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
              </motion.div>
            )}
          </div>

          {/* Premium badge */}
          {drop.tier === "premium" && isLocked && !isPremium && (
            <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-yellow-500/15 flex items-center justify-center backdrop-blur-sm">
              <Crown className="w-2.5 h-2.5 text-yellow-500/50" />
            </div>
          )}
        </div>

        {/* Name */}
        <span className={`text-[9px] font-semibold text-center leading-tight transition-colors duration-300 ${
          isActive ? "text-foreground" : isLocked ? "text-muted-foreground/25" : "text-muted-foreground/60"
        }`} style={{ maxWidth: 68 }}>
          {drop.name}
        </span>
        {isLocked && (
          <span className="text-[7px] text-muted-foreground/20 -mt-0.5">{drop.description}</span>
        )}
      </motion.button>
    );
  };

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      className="pb-3 pt-2"
    >
      {/* ─── Theme Drops ─── */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2.5">
          <div className="w-1 h-4 rounded-full bg-gradient-to-b from-primary to-primary/30" />
          <p className="text-[11px] font-bold text-foreground uppercase tracking-[0.12em]">Theme Drops</p>
          <span className="text-[9px] font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            {ownedCount}/{totalCount}
          </span>
        </div>
      </div>

      {/* Streaks — wrapped grid */}
      <div className="mx-2 mb-4 rounded-2xl border border-border/30 bg-card/30 backdrop-blur-sm overflow-hidden">
        <div className="flex items-center gap-2 px-4 pt-3.5 pb-2">
          <Flame className="w-3 h-3 text-orange-400" />
          <p className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-[0.2em]">Streaks</p>
        </div>
        <div className="flex flex-wrap gap-x-2 gap-y-4 px-3 pb-4 justify-start">
          {STREAK_DROPS.map((d, i) => renderOrb(d, i))}
        </div>
      </div>

      {/* Holidays — wrapped grid */}
      <div className="mx-2 mb-4 rounded-2xl border border-border/30 bg-card/30 backdrop-blur-sm overflow-hidden">
        <div className="flex items-center gap-2 px-4 pt-3.5 pb-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary/50"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
          <p className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-[0.2em]">Holidays</p>
        </div>
        <div className="flex flex-wrap gap-x-2 gap-y-4 px-3 pb-4 justify-start">
          {HOLIDAY_DROPS.map((d, i) => renderOrb(d, i))}
        </div>
      </div>

      {/* Divider */}
      <div className="mx-3 mb-4 border-t border-border/20" />

      {/* ─── Manual Customization ─── */}
      <AnimatePresence>
        {hasActiveDrop && activeDrop && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mx-3 mb-4 flex items-center gap-3 p-3.5 rounded-2xl"
            style={{
              background: `linear-gradient(135deg, ${activeDrop.accentHex}10, transparent)`,
              border: `1px solid ${activeDrop.accentHex}25`,
              boxShadow: `0 0 20px ${activeDrop.accentHex}06`,
            }}
          >
            <span className="text-lg">{activeDrop.icon}</span>
            <div className="flex-1">
              <p className="text-[11px] font-bold text-foreground">{activeDrop.name} Active</p>
              <p className="text-[9px] text-muted-foreground/50 mt-0.5">Tap the theme orb to deactivate and use manual colors</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Accent Colors */}
      <div className={`px-3 transition-opacity duration-300 ${hasActiveDrop ? "opacity-25 pointer-events-none" : ""}`}>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] mb-3">Accent Color</p>
        <div className="flex gap-3 mb-5 flex-wrap">
          {ACCENT_COLORS.map((accent) => (
            <button
              key={accent.id}
              onClick={() => selectAccent(accent.id, accent.premium)}
              className="flex flex-col items-center gap-1.5 relative"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  state.accentColor === accent.id && !hasActiveDrop ? "ring-2 ring-offset-2 ring-offset-background scale-110" : "hover:scale-105"
                } ${accent.premium && !isPremium ? "opacity-50" : ""}`}
                style={{ backgroundColor: accent.color }}
              >
                {state.accentColor === accent.id && !hasActiveDrop && <Check className="w-4 h-4 text-white" />}
                {accent.premium && !isPremium && <LockIcon className="w-3 h-3 text-white/60" />}
              </div>
              <span className="text-[9px] text-muted-foreground font-medium">{accent.label}</span>
            </button>
          ))}
        </div>

        {/* Background */}
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] mb-3">Background</p>
        <div className="flex gap-3 mb-2 flex-wrap">
          {BACKGROUNDS.map((bg) => (
            <button
              key={bg.id}
              onClick={() => selectBackground(bg.id, bg.premium)}
              className="flex flex-col items-center gap-1.5 relative"
            >
              <div
                className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all duration-300 ${
                  state.backgroundTheme === bg.id && !hasActiveDrop
                    ? "border-primary scale-110"
                    : bg.premium && !isPremium
                    ? "border-border/30 opacity-50"
                    : "border-border hover:scale-105"
                }`}
                style={{ backgroundColor: bg.bg }}
              >
                {state.backgroundTheme === bg.id && !hasActiveDrop && <Check className="w-4 h-4 text-primary" />}
                {bg.premium && !isPremium && <LockIcon className="w-3 h-3 text-muted-foreground/40" />}
              </div>
              <span className="text-[9px] text-muted-foreground font-medium">{bg.label}</span>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default ThemeCustomizer;
