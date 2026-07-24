// Clarity — bottom tab bar. Hidden anywhere the screen owns the whole frame.
import { useClarity, type ClarityView } from "@/lib/clarityStore";
import { HomeIcon, GridIcon, ListIcon, ChartIcon, MoonIcon } from "./icons";

const HIDDEN: ClarityView[] = [
  "splash", "intro", "focus", "blocked", "task", "spring", "paywall", "articles",
];

const TABS: { view: ClarityView; label: string; Icon: typeof HomeIcon }[] = [
  { view: "home", label: "Home", Icon: HomeIcon },
  { view: "insights", label: "Insights", Icon: ChartIcon },
  { view: "todos", label: "To-do", Icon: ListIcon },
  { view: "projects", label: "Projects", Icon: GridIcon },
  { view: "checkin", label: "Check-in", Icon: MoonIcon },
];

export default function TabBar() {
  const { state, actions } = useClarity();
  if (HIDDEN.includes(state.view)) return null;

  return (
    <nav
      className="frosted-nav absolute bottom-0 left-0 right-0 z-50 px-4 pt-3"
      style={{ height: 92, paddingBottom: "max(26px, env(safe-area-inset-bottom))" }}
      aria-label="Main"
    >
      <div className="flex items-center justify-between">
        {TABS.map(({ view, label, Icon }) => {
          // Milestones lives under Insights, so the tab stays lit while you're there.
          const active = state.view === view || (view === "insights" && state.view === "milestones");
          return (
            <button
              key={view}
              onClick={() => actions.go(view)}
              aria-current={active ? "page" : undefined}
              className="flex flex-1 flex-col items-center gap-1 rounded-lg py-1 transition-colors"
              style={{ color: active ? "hsl(var(--spice-300))" : "hsl(var(--muted-foreground))" }}
            >
              <Icon size={21} />
              <span className="text-[10px] font-semibold">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
