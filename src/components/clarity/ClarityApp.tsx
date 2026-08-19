// Clarity — root shell. Device frame + view router + persistent chrome.
import { useEffect } from "react";
import { ClarityProvider, useClarity } from "@/lib/clarityStore";
import ErrorBoundary from "./ErrorBoundary";
import StatusBar from "./StatusBar";
import TabBar from "./TabBar";
import CommandPalette from "./CommandPalette";
import SignoffSheet from "./SignoffSheet";
import FocusPrompt from "./FocusPrompt";
import Splash from "./screens/Splash";
import Onboarding from "./screens/Onboarding";
import Home from "./screens/Home";
import Focus from "./screens/Focus";
import Block from "./screens/Block";
import Settings from "./screens/Settings";
import Projects from "./screens/Projects";
import Todos from "./screens/Todos";
import Springboard from "./screens/Springboard";
import Paywall from "./screens/Paywall";
import Digest from "./screens/Digest";
import Insights from "./screens/Insights";
import Milestones from "./screens/Milestones";
import Knows from "./screens/Knows";

function Screens() {
  const { state } = useClarity();
  switch (state.view) {
    case "splash": return <Splash />;
    case "onboarding": return <Onboarding />;
    case "home": return <Home />;
    case "focus": return <Focus />;
    case "blocked": return <Block />;
    case "settings": return <Settings />;
    case "projects": return <Projects />;
    case "todos": return <Todos />;
    case "spring": return <Springboard />;
    case "paywall": return <Paywall />;
    case "digest": return <Digest />;
    case "insights": return <Insights />;
    case "milestones": return <Milestones />;
    case "knows": return <Knows />;
    default: return <Home />;
  }
}

/** Single-key shortcuts, ignored while the user is typing. */
function useShortcuts() {
  const { state, actions } = useClarity();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      if (state.paletteOpen) return;
      if (state.view === "splash" || state.view === "onboarding") return;

      switch (e.key.toLowerCase()) {
        case "h": actions.go("home"); break;
        case "f": actions.startFocus(); break;
        case "k": actions.go("knows"); break;
        case "l": actions.toggleLock(); break;
        case "i": actions.go("insights"); break;
        case "r": actions.go("digest"); break;
        case "p": actions.go("projects"); break;
        case ",": actions.go("settings"); break;
        case "escape": if (state.view !== "home") actions.go("home"); break;
        default: return;
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [state.view, state.paletteOpen, actions]);
}

function Device() {
  const { state } = useClarity();
  useShortcuts();
  const onSplash = state.view === "splash";

  return (
    <div
      className="clarity-root grid min-h-[100dvh] w-full place-items-center"
      style={{ background: "var(--stage)" }}
    >
      <div
        className="relative w-full max-w-[440px] overflow-hidden bg-background md:my-6 md:rounded-[44px] md:border md:border-sand-line md:shadow-[0_40px_90px_-20px_rgba(0,0,0,.9),0_0_120px_-30px_rgba(240,144,43,.28)]"
        style={{ height: "100dvh", maxHeight: "min(100dvh, 900px)" }}
      >
        <StatusBar />
        <Screens />
        <TabBar />
        <CommandPalette />
        <SignoffSheet />
        <FocusPrompt />
        {!onSplash && (
          <div
            className="pointer-events-none absolute left-1/2 z-[90] h-[5px] w-[134px] -translate-x-1/2 rounded-[3px] bg-foreground/30"
            style={{ bottom: "calc(9px + var(--safe-b))" }}
          />
        )}
      </div>
    </div>
  );
}

export default function ClarityApp() {
  return (
    <ErrorBoundary>
      <ClarityProvider>
        <Device />
      </ClarityProvider>
    </ErrorBoundary>
  );
}
