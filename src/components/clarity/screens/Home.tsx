// Clarity — Home. Collapsing header, switchable ring hero, cards, week chart, focus CTA.
import { useRef } from "react";
import { useClarity } from "@/lib/clarityStore";
import { QUOTES, ARTICLES } from "@/lib/clarityData";
import RingHero from "../RingHero";
import WeekChart from "../WeekChart";
import ClaritySwitch from "../ClaritySwitch";
import { ChevronLeft, ChevronRight, Gear, Lock, ArrowUpRight, Check } from "../icons";

const SECTION = "text-[11px] font-bold tracking-[2px] text-[#a394ff]";

export default function Home() {
  const { state, actions } = useClarity();
  const heroRef = useRef<HTMLDivElement>(null);
  const greetRef = useRef<HTMLDivElement>(null);
  const compactRef = useRef<HTMLDivElement>(null);

  const quote = QUOTES[state.quoteIndex % QUOTES.length];
  const lockedApps = state.apps;
  const projCount = state.selProj.length;
  const todayArticle = ARTICLES[2]; // Wednesday's read
  const readDone = state.articlesDone.includes(todayArticle.id);

  function onScroll(e: React.UIEvent<HTMLDivElement>) {
    const y = e.currentTarget.scrollTop;
    const p = Math.min(y / 150, 1);
    if (heroRef.current) {
      heroRef.current.style.opacity = String(1 - p);
      heroRef.current.style.transform = `scale(${1 - 0.3 * p}) translateY(${-30 * p}px)`;
    }
    const g = Math.min(y / 55, 1);
    if (greetRef.current) greetRef.current.style.opacity = String(1 - g);
    const c = Math.max(0, Math.min((y - 45) / 55, 1));
    if (compactRef.current) {
      compactRef.current.style.opacity = String(c);
      compactRef.current.style.transform = `translateY(${(1 - c) * -6}px)`;
    }
  }

  return (
    <div className="anim-fadeIn absolute inset-0">
      {/* header */}
      <div className="absolute left-0 right-0 top-[52px] z-40 h-[120px] px-5">
        <div className="relative flex h-8 items-center justify-center gap-3">
          <button className="grid h-[26px] w-[26px] place-items-center rounded-lg border border-white/[0.08] bg-white/[0.05] text-[#8a8a97]">
            <ChevronLeft size={12} />
          </button>
          <div className="whitespace-nowrap rounded-full border border-white/[0.08] bg-white/[0.05] px-[15px] py-[7px] text-[12px] font-bold tracking-[1.5px] text-[#c9c9d4]">
            WED, JUL 22
          </div>
          <button className="grid h-[26px] w-[26px] place-items-center rounded-lg border border-white/[0.08] bg-white/[0.05] text-[#8a8a97]">
            <ChevronRight size={12} />
          </button>
          <button
            onClick={() => actions.go("settings")}
            className="absolute right-0 top-[-2px] grid h-9 w-9 place-items-center rounded-[11px] border border-white/[0.08] bg-white/[0.05] text-[#c9c9d4]"
          >
            <Gear size={17} />
          </button>
        </div>

        <div className="relative mt-4 h-[50px]">
          <div ref={greetRef} className="absolute left-0 top-0 max-w-[230px]">
            <div className="text-[13px] font-semibold tracking-[0.2px] text-[#8a8a97]">Good afternoon</div>
            <div className="text-[25px] font-extrabold leading-[1.1] tracking-[-0.5px]">{state.name}</div>
          </div>
          <div ref={compactRef} className="absolute left-0 top-[10px] flex items-center gap-[9px] opacity-0">
            <svg width="26" height="26" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="4" />
              <circle cx="18" cy="18" r="15" fill="none" stroke="#a98cff" strokeWidth="4" strokeLinecap="round" strokeDasharray="94" strokeDashoffset="30" transform="rotate(-90 18 18)" />
            </svg>
            <span className="text-[17px] font-extrabold tracking-[-0.3px]">Clarity</span>
            <span className="text-[13px] font-bold text-[#a98cff]">68%</span>
          </div>

          <div className="absolute right-0 top-0.5 flex items-center gap-[9px]">
            <span
              className="text-[12px] font-semibold transition-colors"
              style={{ color: state.locking ? "#c4b2ff" : "#8a8a97" }}
            >
              {state.locking ? "Locking on" : "Locking off"}
            </span>
            <ClaritySwitch on={state.locking} onClick={actions.toggleLock} size="sm" aria-label="App locking" />
          </div>
        </div>
      </div>

      {/* scroll body */}
      <div onScroll={onScroll} className="clarity-scroll absolute inset-0 overflow-y-auto overflow-x-hidden px-[18px] pb-[118px] pt-[178px]">
        <div ref={heroRef} style={{ transformOrigin: "top center" }}>
          <RingHero />
        </div>

        {/* today's task */}
        <div className="anim-cardUp mb-3.5 rounded-[22px] border border-[rgba(140,110,255,.12)] bg-[#0e0d13] p-5" style={{ animationDelay: ".05s" }}>
          <div className="mb-3 flex items-center justify-between">
            <span className={SECTION}>TODAY'S TASK</span>
            <button onClick={actions.openTask} className="text-[12px] font-semibold text-[#8a8a97]">Change</button>
          </div>
          <div className="text-[22px] font-bold leading-[1.25] tracking-[-0.4px]">{state.task}</div>
          <div className="mt-2 text-[14px] leading-[1.4] text-[#8a8a97]">One clear block. That is the whole ask for today.</div>
        </div>

        {/* quote */}
        <div
          onClick={actions.nextQuote}
          className="anim-cardUp relative mb-3.5 cursor-pointer overflow-hidden rounded-[22px] border border-[rgba(140,110,255,.16)] p-[22px_20px]"
          style={{ animationDelay: ".08s", background: "linear-gradient(135deg,rgba(139,107,255,.1),rgba(139,107,255,.02))" }}
        >
          <div className="pointer-events-none absolute right-[18px] top-[10px] font-serif text-[52px] leading-none" style={{ color: "rgba(157,123,255,.3)" }}>&rdquo;</div>
          <div className={SECTION + " mb-3"}>QUOTE OF THE DAY</div>
          <div className="max-w-[270px] text-[18px] font-semibold leading-[1.4] tracking-[-0.3px]">{quote.text}</div>
          <div className="mt-3 text-[13px] text-[#8a8a97]">{quote.author}</div>
        </div>

        {/* today's read */}
        <div
          onClick={() => actions.openArticle(todayArticle.id)}
          className="anim-cardUp mb-3.5 cursor-pointer overflow-hidden rounded-[22px] border border-[rgba(140,110,255,.16)] bg-[#0e0d13] p-5"
          style={{ animationDelay: ".085s" }}
        >
          <div className="mb-2 flex items-center justify-between">
            <span className={SECTION}>TODAY'S READ · {todayArticle.category}</span>
            {readDone ? (
              <span className="flex items-center gap-1 text-[12px] font-semibold text-[#7ee0a8]">
                <Check size={12} /> Done
              </span>
            ) : (
              <span className="text-[12px] text-[#8a8a97]">{todayArticle.readMins} min</span>
            )}
          </div>
          <div className="text-[19px] font-bold leading-[1.25] tracking-[-0.3px]">{todayArticle.title}</div>
          <div className="mt-2 text-[14px] leading-[1.4] text-[#8a8a97]">{todayArticle.excerpt}</div>
          <div className="mt-3 flex items-center gap-1.5 text-[13px] font-semibold text-[#a394ff]">
            {readDone ? "Read again" : "Read & explain it back"}
            <ArrowUpRight size={13} />
          </div>
        </div>

        {/* this week's projects */}
        <div
          onClick={() => actions.go("projects")}
          className="anim-cardUp mb-3.5 cursor-pointer rounded-[22px] border border-[rgba(140,110,255,.22)] p-5"
          style={{ animationDelay: ".09s", background: "linear-gradient(135deg,rgba(139,107,255,.14),rgba(139,107,255,.03))" }}
        >
          <div className="mb-2 flex items-center justify-between">
            <span className={SECTION}>THIS WEEK'S PROJECTS</span>
            <span className="text-[13px] font-bold text-[#c4b2ff]">{projCount}/3</span>
          </div>
          {projCount === 0 ? (
            <div className="flex items-center justify-between">
              <span className="text-[16px] font-semibold text-white">Choose your 3 projects</span>
              <span className="text-[20px] text-[#a98cff]">→</span>
            </div>
          ) : (
            <div className="mt-1 flex flex-col gap-[9px]">
              {state.projects.filter((p) => state.selProj.includes(p.id)).map((p) => (
                <div key={p.id} className="flex items-center gap-2.5">
                  <span className="h-1.5 w-1.5 flex-none rounded-full bg-[#9d7bff]" />
                  <span className="text-[15px] font-semibold">{p.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* locked apps */}
        <div className="anim-cardUp mb-3.5 rounded-[22px] border border-[rgba(140,110,255,.12)] bg-[#0e0d13] p-5" style={{ animationDelay: ".12s" }}>
          <div className="mb-4 flex items-center justify-between">
            <span className={SECTION}>LOCKED FOR NOW</span>
            <span className="text-[12px] text-[#55555f]">Tap to see</span>
          </div>
          <div className="flex justify-between gap-2.5 transition-opacity" style={{ opacity: state.locking ? 1 : 0.35 }}>
            {lockedApps.map((app) => (
              <button key={app.id} onClick={() => actions.openApp(app)} className="flex flex-1 flex-col items-center gap-2">
                <span
                  className="relative grid aspect-square w-full max-w-[60px] place-items-center rounded-[15px] text-[26px] shadow-clarity-card"
                  style={{ background: app.color }}
                >
                  {app.emoji}
                  <span className="absolute -bottom-1 -right-1 grid h-[22px] w-[22px] place-items-center rounded-full border-[2.5px] border-[#0e0d13] bg-[#8b6bff]">
                    <Lock size={10} />
                  </span>
                </span>
                <span className="text-[11px] font-medium text-[#8a8a97]">{app.name}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => actions.go("spring")}
            className="mt-[18px] flex w-full items-center justify-center gap-1.5 border-t border-white/[0.06] pt-4 text-[13px] font-semibold text-[#a394ff]"
          >
            Open your home screen
            <ArrowUpRight size={14} />
          </button>
        </div>

        {/* this week */}
        <div className="anim-cardUp mb-4 rounded-[22px] border border-[rgba(140,110,255,.12)] bg-[#0e0d13] p-5" style={{ animationDelay: ".19s" }}>
          <div className={SECTION + " mb-4"}>THIS WEEK</div>
          <div className="mb-5 flex justify-between">
            {[["8h 40m", "DEEP WORK"], ["12", "SESSIONS"], ["6", "DAY STREAK"]].map(([v, l]) => (
              <div key={l}>
                <div className="text-[22px] font-extrabold tracking-[-0.5px]">{v}</div>
                <div className="mt-[3px] text-[10.5px] tracking-[1.2px] text-[#55555f]">{l}</div>
              </div>
            ))}
          </div>
          <WeekChart />
        </div>

        <button
          onClick={() => actions.startFocus()}
          className="anim-cardUp anim-glowLoop h-[58px] w-full rounded-[18px] text-[17px] font-bold text-white"
          style={{ animationDelay: ".26s, .9s", background: "linear-gradient(135deg,#9d7bff,#6a4bd6)" }}
        >
          Start a focus session
        </button>
      </div>
    </div>
  );
}
