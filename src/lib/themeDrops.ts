// Theme Drops — Collectible accent themes earned through streaks & holidays

export interface ThemeDrop {
  id: string;
  name: string;
  description: string;
  type: "streak" | "holiday";
  icon: string;
  accentHex: string;
  accentHSL: string;
  glowHSL: string;
  bgHSL: string;     // background tint
  cardHSL: string;   // card surface tint
  tier: "free" | "premium";
  streakRequired?: number;
  holidayDate?: { month: number; day: number };
}

export const THEME_DROPS: ThemeDrop[] = [
  // ── Streak Milestones ──
  {
    id: "streak_3",
    name: "First Spark",
    description: "3-day streak",
    type: "streak",
    icon: "⚡",
    accentHex: "#FF6B35",
    accentHSL: "18 100% 60%",
    glowHSL: "18 100% 65%",
    bgHSL: "18 40% 5%",
    cardHSL: "18 30% 9%",
    tier: "free",
    streakRequired: 3,
  },
  {
    id: "streak_7",
    name: "Week Warrior",
    description: "7-day streak",
    type: "streak",
    icon: "🛡️",
    accentHex: "#4ECDC4",
    accentHSL: "175 58% 55%",
    glowHSL: "175 58% 60%",
    bgHSL: "175 30% 5%",
    cardHSL: "175 20% 9%",
    tier: "premium",    streakRequired: 7,
  },
  {
    id: "streak_14",
    name: "Fortnight Focus",
    description: "14-day streak",
    type: "streak",
    icon: "💎",
    accentHex: "#7B68EE",
    accentHSL: "249 80% 67%",
    glowHSL: "249 80% 72%",
    bgHSL: "249 30% 5%",
    cardHSL: "249 20% 9%",
    tier: "premium",
    streakRequired: 14,
  },
  {
    id: "streak_30",
    name: "Monthly Master",
    description: "30-day streak",
    type: "streak",
    icon: "👑",
    accentHex: "#FF1493",
    accentHSL: "328 100% 54%",
    glowHSL: "328 100% 60%",
    bgHSL: "328 30% 5%",
    cardHSL: "328 20% 9%",
    tier: "premium",
    streakRequired: 30,
  },
  {
    id: "streak_60",
    name: "Diamond Mind",
    description: "60-day streak",
    type: "streak",
    icon: "💠",
    accentHex: "#00CED1",
    accentHSL: "181 100% 41%",
    glowHSL: "181 100% 50%",
    bgHSL: "181 35% 4%",
    cardHSL: "181 25% 8%",
    tier: "premium",
    streakRequired: 60,
  },
  {
    id: "streak_100",
    name: "Centurion",
    description: "100-day streak",
    type: "streak",
    icon: "🏆",
    accentHex: "#FFD700",
    accentHSL: "51 100% 50%",
    glowHSL: "51 100% 58%",
    bgHSL: "43 30% 5%",
    cardHSL: "43 20% 9%",
    tier: "premium",
    streakRequired: 100,
  },
  {
    id: "streak_200",
    name: "Oracle",
    description: "200-day streak",
    type: "streak",
    icon: "🔮",
    accentHex: "#9400D3",
    accentHSL: "282 100% 41%",
    glowHSL: "282 100% 52%",
    bgHSL: "282 40% 4%",
    cardHSL: "282 30% 8%",
    tier: "premium",
    streakRequired: 200,
  },
  {
    id: "streak_300",
    name: "Gladiator",
    description: "300-day streak",
    type: "streak",
    icon: "⚔️",
    accentHex: "#B22222",
    accentHSL: "0 69% 42%",
    glowHSL: "0 69% 52%",
    bgHSL: "0 35% 5%",
    cardHSL: "0 25% 9%",
    tier: "premium",
    streakRequired: 300,
  },
  {
    id: "streak_365",
    name: "Transcendence",
    description: "1-year streak",
    type: "streak",
    icon: "🌅",
    accentHex: "#FF8C00",
    accentHSL: "33 100% 50%",
    glowHSL: "33 100% 58%",
    bgHSL: "25 35% 5%",
    cardHSL: "25 25% 9%",
    tier: "premium",
    streakRequired: 365,
  },
  {
    id: "streak_500",
    name: "Dragon Soul",
    description: "500-day streak",
    type: "streak",
    icon: "🐉",
    accentHex: "#00FF7F",
    accentHSL: "150 100% 50%",
    glowHSL: "150 100% 58%",
    bgHSL: "150 30% 4%",
    cardHSL: "150 20% 8%",
    tier: "premium",
    streakRequired: 500,
  },
  {
    id: "streak_548",
    name: "Astral",
    description: "1.5-year streak",
    type: "streak",
    icon: "💫",
    accentHex: "#4169E1",
    accentHSL: "225 73% 57%",
    glowHSL: "225 73% 65%",
    bgHSL: "225 35% 4%",
    cardHSL: "225 25% 8%",
    tier: "premium",
    streakRequired: 548,
  },
  {
    id: "streak_730",
    name: "Eternal",
    description: "2-year streak",
    type: "streak",
    icon: "👁️",
    accentHex: "#E5E4E2",
    accentHSL: "40 3% 89%",
    glowHSL: "40 5% 95%",
    bgHSL: "0 0% 3%",
    cardHSL: "0 0% 7%",
    tier: "premium",
    streakRequired: 730,
  },
  {
    id: "streak_1000",
    name: "Singularity",
    description: "1000-day streak",
    type: "streak",
    icon: "🌌",
    accentHex: "#FFFFFF",
    accentHSL: "0 0% 100%",
    glowHSL: "0 0% 100%",
    bgHSL: "240 20% 3%",
    cardHSL: "240 15% 6%",
    tier: "premium",
    streakRequired: 1000,
  },

  // ── Holiday Drops ──
  {
    id: "new_year",
    name: "Fresh Start",
    description: "Jan 1",
    type: "holiday",
    icon: "🎆",
    accentHex: "#C0C0C0",
    accentHSL: "0 0% 75%",
    glowHSL: "0 0% 82%",
    bgHSL: "220 15% 5%",
    cardHSL: "220 10% 9%",
    tier: "free",
    holidayDate: { month: 1, day: 1 },
  },
  {
    id: "valentines",
    name: "Heart & Soul",
    description: "Feb 14",
    type: "holiday",
    icon: "💝",
    accentHex: "#FF69B4",
    accentHSL: "330 100% 71%",
    glowHSL: "330 100% 76%",
    bgHSL: "330 30% 5%",
    cardHSL: "330 20% 9%",
    tier: "free",
    holidayDate: { month: 2, day: 14 },
  },
  {
    id: "july_4th",
    name: "Freedom Focus",
    description: "Jul 4",
    type: "holiday",
    icon: "🦅",
    accentHex: "#DC143C",
    accentHSL: "348 83% 47%",
    glowHSL: "348 83% 55%",
    bgHSL: "348 25% 5%",
    cardHSL: "348 18% 9%",
    tier: "premium",
    holidayDate: { month: 7, day: 4 },
  },
  {
    id: "halloween",
    name: "Dark Focus",
    description: "Oct 31",
    type: "holiday",
    icon: "🎃",
    accentHex: "#FF4500",
    accentHSL: "16 100% 50%",
    glowHSL: "16 100% 58%",
    bgHSL: "16 30% 4%",
    cardHSL: "16 20% 8%",
    tier: "free",
    holidayDate: { month: 10, day: 31 },
  },
  {
    id: "christmas",
    name: "Winter Glow",
    description: "Dec 25",
    type: "holiday",
    icon: "🎄",
    accentHex: "#228B22",
    accentHSL: "120 61% 34%",
    glowHSL: "120 61% 42%",
    bgHSL: "120 25% 4%",
    cardHSL: "120 18% 8%",
    tier: "free",
    holidayDate: { month: 12, day: 25 },
  },
];

/** Get a drop by ID */
export function getThemeDrop(id: string): ThemeDrop | undefined {
  return THEME_DROPS.find((d) => d.id === id);
}

/** Check which streak drops should be unlocked based on current streak */
export function checkStreakDrops(currentStreak: number, inventory: string[]): string[] {
  return THEME_DROPS.filter(
    (d) =>
      d.type === "streak" &&
      d.streakRequired !== undefined &&
      currentStreak >= d.streakRequired &&
      !inventory.includes(d.id)
  ).map((d) => d.id);
}

/** Check which holiday drops should be unlocked today */
export function checkHolidayDrops(inventory: string[]): string[] {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  return THEME_DROPS.filter(
    (d) =>
      d.type === "holiday" &&
      d.holidayDate?.month === month &&
      d.holidayDate?.day === day &&
      !inventory.includes(d.id)
  ).map((d) => d.id);
}
