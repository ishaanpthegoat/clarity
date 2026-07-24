// Clarity — root shell. Device frame + view router + persistent chrome.
import { ClarityProvider, useClarity } from "@/lib/clarityStore";
import ErrorBoundary from "./ErrorBoundary";
import StatusBar from "./StatusBar";
import TabBar from "./TabBar";
import Splash from "./screens/Splash";
import Intro from "./screens/Intro";
import Home from "./screens/Home";
import Focus from "./screens/Focus";
import Block from "./screens/Block";
import SetTask from "./screens/SetTask";
import Settings from "./screens/Settings";
import Projects from "./screens/Projects";
import Todos from "./screens/Todos";
import Review from "./screens/Review";
import Checkin from "./screens/Checkin";
import Springboard from "./screens/Springboard";
import Paywall from "./screens/Paywall";
import Articles from "./screens/Articles";

function Screens() {
  const { state } = useClarity();
  switch (state.view) {
    case "splash": return <Splash />;
    case "intro": return <Intro />;
    case "home": return <Home />;
    case "focus": return <Focus />;
    case "blocked": return <Block />;
    case "task": return <SetTask />;
    case "settings": return <Settings />;
    case "projects": return <Projects />;
    case "todos": return <Todos />;
    case "submit": return <Review />;
    case "checkin": return <Checkin />;
    case "spring": return <Springboard />;
    case "paywall": return <Paywall />;
    case "articles": return <Articles />;
    default: return <Home />;
  }
}

function Device() {
  const { state } = useClarity();
  const onSplash = state.view === "splash";
  return (
    <div
      className="clarity-root grid min-h-[100dvh] w-full place-items-center"
      style={{ background: "radial-gradient(120% 80% at 50% -10%,#161226 0%,#050507 55%,#000 100%)" }}
    >
      <div
        className="relative w-full max-w-[440px] overflow-hidden bg-black md:my-6 md:rounded-[44px] md:border md:border-[#26232f] md:shadow-[0_40px_90px_-20px_rgba(0,0,0,.9),0_0_120px_-30px_rgba(139,107,255,.35)]"
        style={{ height: "100dvh", maxHeight: "min(100dvh, 900px)" }}
      >
        <StatusBar />
        <Screens />
        <TabBar />
        {!onSplash && (
          <div className="pointer-events-none absolute bottom-[9px] left-1/2 z-[90] h-[5px] w-[134px] -translate-x-1/2 rounded-[3px] bg-white/40" />
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
