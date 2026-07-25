// Clarity — bottom tab bar.
//
// Six destinations, each with its word showing. The active pill is one shared
// layout element rather than six independently-fading backgrounds, so it slides
// between tabs on a spring and stays interruptible if you tab twice quickly.
import { motion } from "motion/react";
import { useClarity, type ClarityView } from "@/lib/clarityStore";
import { Tip } from "./Action";
import { SPRING } from "@/lib/motion";
import { HomeIcon, GridIcon, ListIcon, ChartIcon, MoonIcon, BookIcon } from "./icons";

const TABS: {
  view: ClarityView;
  label: string;
  tooltip: string;
  Icon: typeof HomeIcon;
  /** Views that live under this tab and should keep it lit. */
  covers?: ClarityView[];
}[] = [
  { view: "home", label: "Home", tooltip: "Today at a glance", Icon: HomeIcon },
  { view: "articles", label: "Read", tooltip: "Today's read, and explain it back", Icon: BookIcon },
  { view: "todos", label: "To-do", tooltip: "Everything you said you'd do", Icon: ListIcon },
  { view: "projects", label: "Projects", tooltip: "Your 3 for the week, plus ideas", Icon: GridIcon, covers: ["grade"] },
  { view: "insights", label: "Insights", tooltip: "How the last weeks actually went", Icon: ChartIcon, covers: ["milestones"] },
  { view: "checkin", label: "Check-in", tooltip: "Close out the day", Icon: MoonIcon },
];

export default function TabBar() {
  const { state, actions, derived } = useClarity();
  if (derived.tabBarHidden) return null;

  return (
    <nav
      className="frosted-nav absolute bottom-0 left-0 right-0 z-50 px-2 pt-2"
      style={{ height: 92, paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}
      aria-label="Main"
    >
      <div className="flex items-stretch justify-between">
        {TABS.map(({ view, label, tooltip, Icon, covers }) => {
          const active = state.view === view || (covers?.includes(state.view) ?? false);
          return (
            <Tip key={view} label={tooltip} side="top">
              {/* No aria-label: the visible word *is* the accessible name, and
                  overriding it with the longer tooltip would break "label in
                  name" for anyone driving this by voice. Radix wires the
                  tooltip up as a description instead. */}
              <button
                onClick={() => actions.go(view)}
                aria-current={active ? "page" : undefined}
                className="relative flex min-h-[46px] flex-1 flex-col items-center justify-center gap-[3px] rounded-[13px] px-0.5 py-1"
              >
                {active && (
                  <motion.span
                    layoutId="tab-pill"
                    aria-hidden="true"
                    className="absolute inset-0 rounded-[13px] border border-spice-400/25 bg-spice-400/[0.10]"
                    transition={SPRING.crisp}
                  />
                )}
                <span
                  className="relative transition-colors duration-150"
                  style={{ color: active ? "hsl(var(--spice-300))" : "hsl(var(--muted-foreground))" }}
                >
                  <Icon size={20} />
                </span>
                <span
                  className="relative text-[9.5px] font-semibold leading-none tracking-[0.01em] transition-colors duration-150"
                  style={{ color: active ? "hsl(var(--spice-200))" : "hsl(var(--muted-foreground))" }}
                >
                  {label}
                </span>
              </button>
            </Tip>
          );
        })}
      </div>
    </nav>
  );
}
