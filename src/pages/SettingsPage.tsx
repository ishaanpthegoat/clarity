import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Sun, Moon, Lock, Target, AlertTriangle, CreditCard, Bell, Trash2, Clock, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getState, setState, CheckInSlot } from "@/lib/store";
import { useTheme } from "@/lib/theme";
import ThemeCustomizer from "@/components/ThemeCustomizer";

const GOALS = ["Career", "Fitness", "Relationships", "Mental Health", "Wealth", "Creativity"];
const BLOCKERS = ["Anxiety", "Procrastination", "Self-Doubt", "Burnout", "Lack of Focus", "Fear"];
const APPS = ["Instagram", "TikTok", "X", "YouTube", "Reddit", "Snapchat"];

const formatTime12h = (time24: string) => {
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
};

const SettingsPage = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [state, setLocalState] = useState(getState());
  const [editSection, setEditSection] = useState<string | null>(null);
  const [showTheme, setShowTheme] = useState(false);

  useEffect(() => {
    setLocalState(getState());
  }, []);

  const toggleItem = (key: "goals" | "blockers" | "lockedApps", item: string) => {
    const current = state[key] as string[];
    const updated = current.includes(item) ? current.filter((i) => i !== item) : [...current, item];
    const newState = setState({ [key]: updated });
    setLocalState(newState);
  };

  const schedule = state.checkInSchedule || [];

  const updateSchedule = (newSchedule: CheckInSlot[]) => {
    const newState = setState({ checkInSchedule: newSchedule });
    setLocalState(newState);
  };

  const addSlot = () => {
    const newSlot: CheckInSlot = { id: `slot_${Date.now()}`, time: "12:00", label: `Check-in ${schedule.length + 1}`, enabled: true };
    updateSchedule([...schedule, newSlot]);
  };

  const removeSlot = (id: string) => {
    if (schedule.length <= 1) return;
    updateSchedule(schedule.filter(s => s.id !== id));
  };

  const updateSlotTime = (id: string, time: string) => {
    updateSchedule(schedule.map(s => s.id === id ? { ...s, time } : s));
  };

  const toggleSlot = (id: string) => {
    updateSchedule(schedule.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  return (
    <div className="mobile-container bg-background flex flex-col px-6 py-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate("/home")} className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center hover:border-muted-foreground/30 transition-colors">
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Settings</h1>
      </div>

      <div className="flex-1 space-y-2">
        {/* Section: App */}
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] px-1 mb-1 mt-2">App</p>
        <SettingsRow icon={Lock} label="Locked Apps" value={`${state.lockedApps.length} apps`} onClick={() => setEditSection(editSection === "apps" ? null : "apps")} />
        {editSection === "apps" && <EditChips items={APPS} selected={state.lockedApps} onToggle={(item) => toggleItem("lockedApps", item)} />}

        <SettingsRow icon={Target} label="Goals" value={state.goals.join(", ") || "None"} onClick={() => setEditSection(editSection === "goals" ? null : "goals")} />
        {editSection === "goals" && <EditChips items={GOALS} selected={state.goals} onToggle={(item) => toggleItem("goals", item)} />}

        <SettingsRow icon={AlertTriangle} label="Blockers" value={state.blockers.join(", ") || "None"} onClick={() => setEditSection(editSection === "blockers" ? null : "blockers")} />
        {editSection === "blockers" && <EditChips items={BLOCKERS} selected={state.blockers} onToggle={(item) => toggleItem("blockers", item)} accent />}

        {/* Check-in Schedule */}
        <SettingsRow icon={Clock} label="Check-in Schedule" value={`${schedule.filter(s => s.enabled).length} active`} onClick={() => setEditSection(editSection === "schedule" ? null : "schedule")} />
        <AnimatePresence>
          {editSection === "schedule" && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="flex flex-col gap-2 py-2">
                {schedule.map((slot) => (
                  <div key={slot.id} className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${slot.enabled ? "bg-card border-border" : "bg-card/50 border-border/30 opacity-50"}`}>
                    <div className="flex-1 relative">
                      <span className="text-foreground font-bold text-lg font-mono-num">{formatTime12h(slot.time)}</span>
                      <input
                        type="time"
                        value={slot.time}
                        onChange={(e) => updateSlotTime(slot.id, e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                    </div>
                    <button
                      onClick={() => toggleSlot(slot.id)}
                      className={`w-11 h-6 rounded-full transition-all duration-300 relative flex-shrink-0 ${slot.enabled ? "bg-primary" : "bg-muted"}`}
                    >
                      <motion.div
                        animate={{ x: slot.enabled ? 20 : 2 }}
                        transition={{ type: "spring", damping: 20, stiffness: 300 }}
                        className="w-5 h-5 rounded-full bg-white absolute top-0.5 shadow-sm"
                      />
                    </button>
                    {schedule.length > 1 && (
                      <button onClick={() => removeSlot(slot.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/30 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                <button onClick={addSlot} className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-primary/30 text-primary text-sm font-medium hover:bg-primary/5 transition-colors">
                  <Plus className="w-4 h-4" />
                  Add check-in
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Section: Account */}
        <div className="mt-6 pt-4 border-t border-border/30">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] px-1 mb-1">Account</p>
        </div>
        <SettingsRow icon={CreditCard} label="Subscription" value="Free Trial" onClick={() => navigate("/paywall")} />

        <button onClick={() => setShowTheme(!showTheme)} className="w-full flex items-center justify-between py-4 px-4 bg-card rounded-2xl border border-border/50 hover:border-muted-foreground/20 transition-colors">
          <div className="flex items-center gap-3">
            {theme === "dark" ? <Moon className="w-4.5 h-4.5 text-primary" /> : <Sun className="w-4.5 h-4.5 text-primary" />}
            <span className="text-foreground font-medium text-sm">Appearance</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs capitalize font-medium">Customize</span>
            <ChevronRight className={`w-4 h-4 text-muted-foreground/50 transition-transform ${showTheme ? "rotate-90" : ""}`} />
          </div>
        </button>
        {showTheme && <ThemeCustomizer />}

        <SettingsRow icon={Bell} label="Notifications" value="Coming soon" onClick={() => {}} />

        {/* Danger zone */}
        <div className="pt-8">
          <button
            onClick={() => {
              localStorage.removeItem("mindlock_state");
              localStorage.removeItem("mindlock_chat_history");
              localStorage.removeItem("mindlock_chat_count");
              navigate("/");
            }}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-destructive/20 text-destructive text-sm font-semibold hover:bg-destructive/5 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Reset App Data
          </button>
        </div>
      </div>
    </div>
  );
};

const SettingsRow = ({ icon: Icon, label, value, onClick }: { icon: any; label: string; value: string; onClick: () => void }) => (
  <button onClick={onClick} className="w-full flex items-center justify-between gap-4 py-4 px-4 bg-card rounded-2xl border border-border/50 hover:border-muted-foreground/20 transition-colors">
    <div className="flex items-center gap-3 shrink-0">
      <Icon className="w-4.5 h-4.5 text-muted-foreground" />
      <span className="text-foreground font-medium text-sm">{label}</span>
    </div>
    <div className="flex items-center gap-2 min-w-0">
      <span className="text-muted-foreground text-xs truncate font-medium text-right">{value}</span>
      <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0" />
    </div>
  </button>
);

const EditChips = ({ items, selected, onToggle, accent = false }: { items: string[]; selected: string[]; onToggle: (item: string) => void; accent?: boolean }) => (
  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="flex flex-wrap gap-2 px-2 pb-2 pt-1">
    {items.map((item) => (
      <motion.button
        key={item}
        whileTap={{ scale: 0.93 }}
        onClick={() => onToggle(item)}
        className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all duration-300 ${
          selected.includes(item) 
            ? accent 
              ? "bg-red-500/15 border-red-400/60 text-red-400 chip-glow-red" 
              : "bg-primary/15 border-primary text-primary chip-glow" 
            : "bg-card border-border text-muted-foreground hover:border-muted-foreground/30"
        }`}
      >
        {item}
      </motion.button>
    ))}
  </motion.div>
);

export default SettingsPage;
