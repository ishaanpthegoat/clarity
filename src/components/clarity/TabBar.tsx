// Clarity — global bottom tab bar (hidden on splash/focus/blocked/task/spring)
import { useClarity, type ClarityView } from "@/lib/clarityStore";
import { HomeIcon, GridIcon, ListIcon, Camera, MoonIcon } from "./icons";

const HIDDEN: ClarityView[] = ["splash", "intro", "focus", "blocked", "task", "spring", "paywall", "articles"];

const TABS: { view: ClarityView; label: string; Icon: typeof HomeIcon }[] = [
  { view: "home", label: "Home", Icon: HomeIcon },
  { view: "projects", label: "Projects", Icon: GridIcon },
  { view: "todos", label: "To-do", Icon: ListIcon },
  { view: "submit", label: "Review", Icon: Camera },
  { view: "checkin", label: "Check-in", Icon: MoonIcon },
];

export default function TabBar() {
  const { state, actions } = useClarity();
  if (HIDDEN.includes(state.view)) return null;

  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-50 border-t border-white/[0.06] px-6 pb-[26px] pt-3"
      style={{
        height: 92,
        background: "rgba(8,7,11,.72)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <div className="flex items-center justify-between">
        {TABS.map(({ view, label, Icon }) => {
          const active = state.view === view;
          return (
            <button
              key={view}
              onClick={() => actions.go(view)}
              className="flex flex-1 flex-col items-center gap-1 transition-colors"
              style={{ color: active ? "#a98cff" : "#55555f" }}
            >
              <Icon size={22} />
              <span className="text-[10px] font-semibold">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
