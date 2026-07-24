// Clarity — Home. Collapsing header, the day's ring, and the cards that make up
// a day. Every number on this screen comes out of the logged history.
import { useRef } from "react";
import { useClarity } from "@/lib/clarityStore";
import { QUOTES, ARTICLES } from "@/lib/clarityData";
import {
  dateKey,
  formatDayLabel,
  formatDuration,
  isToday,
  lastSevenDays,
  totalsFor,
  weekOverWeekDelta,
} from "@/lib/clarityStats";
import RingHero from "../RingHero";
import WeekChart from "../WeekChart";
import ClaritySwitch from "../ClaritySwitch";
import {
  ChevronLeft, ChevronRight, Gear, Lock, ArrowUpRight, Check, Flame, Shield, Search,
} from "../icons";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Still up";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function Home() {
  const { state, actions, derived } = useClarity();
  const heroRef = useRef<HTMLDivElement>(null);
  const greetRef = useRef<HTMLDivElement>(null);
  const compactRef = useRef<HTMLDivElement>(null);

  const quote = QUOTES[state.quoteIndex % QUOTES.length];
  const projCount = state.selProj.length;
  const viewingToday = isToday(state.viewDate);
  const day = derived.viewedDay;

  const todayArticle = ARTICLES[new Date().getDay() % ARTICLES.length];
  const readDone = state.articlesDone.includes(todayArticle.id);

  const week = totalsFor(state.days, lastSevenDays());
  const delta = weekOverWeekDelta(state.days);
  const held = day.pulls ? `${day.holds}/${day.pulls}` : "—";

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

  // Visual chrome stays small; the tap target underneath is always >= 44px.
  const hit = "grid h-11 w-11 place-items-center";
  const chip =
    "grid place-items-center rounded-xl border border-sand-line raise text-muted-foreground transition-colors group-hover:text-foreground group-disabled:opacity-30";

  return (
    <div className="anim-fadeIn absolute inset-0">
      {/* ── header ── */}
      <div className="absolute left-0 right-0 top-[52px] z-40 h-[120px] px-5">
        <div className="relative flex h-11 items-center justify-center">
          <button
            onClick={() => actions.stepViewDate(-1)}
            className={`group ${hit}`}
            aria-label="Previous day"
          >
            <span className={`${chip} h-[26px] w-[26px]`}><ChevronLeft size={12} /></span>
          </button>
          <button
            onClick={() => actions.setViewDate(dateKey())}
            className="font-display grid h-11 place-items-center whitespace-nowrap px-1"
            aria-label={`${formatDayLabel(state.viewDate)} — jump to today`}
          >
            <span className="rounded-full border border-sand-line raise px-[15px] py-[6px] text-[12px] font-semibold uppercase tracking-[0.18em] text-foreground/85">
              {formatDayLabel(state.viewDate)}
            </span>
          </button>
          <button
            onClick={() => actions.stepViewDate(1)}
            disabled={viewingToday}
            className={`group ${hit}`}
            aria-label="Next day"
          >
            <span className={`${chip} h-[26px] w-[26px]`}><ChevronRight size={12} /></span>
          </button>

          <div className="absolute right-[-6px] flex items-center">
            <button
              onClick={() => actions.setPaletteOpen(true)}
              className={`group ${hit}`}
              aria-label="Search Clarity"
            >
              <span className={`${chip} h-9 w-9`}><Search size={16} /></span>
            </button>
            <button
              onClick={() => actions.go("settings")}
              className={`group ${hit}`}
              aria-label="Settings"
            >
              <span className={`${chip} h-9 w-9`}><Gear size={17} /></span>
            </button>
          </div>
        </div>

        <div className="relative mt-4 h-[50px]">
          <div ref={greetRef} className="absolute left-0 top-0 max-w-[240px]">
            <div className="text-[13px] font-medium text-muted-foreground">{greeting()}</div>
            <h1 className="truncate text-[26px] font-extrabold leading-[1.1] tracking-[-0.02em]">
              {state.name || "Welcome"}
            </h1>
          </div>
          <div ref={compactRef} className="absolute left-0 top-[10px] flex items-center gap-2.5 opacity-0">
            <span className="font-display text-[17px] font-semibold uppercase tracking-[0.12em]">Clarity</span>
            <span className="readout text-[13px] font-semibold text-spice-400">{derived.score.score}%</span>
          </div>

          <div className="absolute right-0 top-0.5 flex items-center gap-2.5">
            <span
              className="text-[12px] font-semibold transition-colors"
              style={{ color: state.locking ? "hsl(var(--spice-300))" : "hsl(var(--muted-foreground))" }}
            >
              {state.locking ? "Locking on" : "Locking off"}
            </span>
            <ClaritySwitch on={state.locking} onClick={actions.toggleLock} size="sm" aria-label="App locking" />
          </div>
        </div>
      </div>

      {/* ── scroll body ── */}
      <div
        onScroll={onScroll}
        className="clarity-scroll absolute inset-0 overflow-y-auto overflow-x-hidden px-[18px] pb-[118px] pt-[178px]"
      >
        <div ref={heroRef} style={{ transformOrigin: "top center" }}>
          <RingHero />
        </div>

        {derived.scheduleOn && (
          <div className="anim-cardUp mb-3.5 flex items-center gap-3 rounded-[18px] border border-spice-400/25 bg-spice-400/[0.07] px-4 py-3">
            <span className="text-spice-400"><Shield size={17} /></span>
            <span className="flex-1 text-[13.5px] leading-[1.4]">
              <span className="font-semibold">Your focus window is open.</span>{" "}
              <span className="text-muted-foreground">
                Locking holds until {state.schedule.end}.
              </span>
            </span>
          </div>
        )}

        {/* today's task */}
        <div className="anim-cardUp sietch-card card-lift mb-3.5 p-5" style={{ animationDelay: ".05s" }}>
          <div className="mb-3 flex items-center justify-between">
            <span className="eyebrow">Today&rsquo;s focus</span>
            <button
              onClick={actions.openTask}
              className="-my-3.5 -mr-2 px-2 py-3.5 text-[12.5px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              {state.task ? "Change" : "Set it"}
            </button>
          </div>
          {state.task ? (
            <>
              <div className="line-clamp-3 break-words text-[22px] font-bold leading-[1.25] tracking-[-0.015em]">
                {state.task}
              </div>
              <div className="mt-2 text-[14px] leading-[1.45] text-muted-foreground">
                One clear block. That is the whole ask for today.
              </div>
            </>
          ) : (
            <button onClick={actions.openTask} className="w-full text-left">
              <div className="text-[19px] font-bold leading-[1.3] text-muted-foreground">
                Name the one thing.
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-[13.5px] font-semibold text-spice-400">
                Pick your focus <ArrowUpRight size={13} />
              </div>
            </button>
          )}
        </div>

        {/* held the line — the app's own scoreboard for the thing it exists to do */}
        <div className="anim-cardUp mb-3.5 grid grid-cols-3 gap-2.5" style={{ animationDelay: ".07s" }}>
          {[
            { v: formatDuration(day.focusedSeconds), l: "Focused" },
            { v: derived.streak ? `${derived.streak}` : "—", l: "Day streak", flame: derived.streak >= 3 },
            { v: held, l: "Pulls held" },
          ].map((s) => (
            <div key={s.l} className="sietch-card px-3 py-3.5 text-center">
              <div className="readout flex items-center justify-center gap-1 text-[20px] font-bold tracking-[-0.01em]">
                {s.flame && <span className="text-spice-400"><Flame size={15} /></span>}
                {s.v}
              </div>
              <div className="eyebrow eyebrow-muted mt-1.5 text-[9.5px]">{s.l}</div>
            </div>
          ))}
        </div>

        {/* quote */}
        <button
          onClick={actions.nextQuote}
          className="anim-cardUp sietch-card-warm card-lift relative mb-3.5 w-full overflow-hidden p-[22px_20px] text-left"
          style={{ animationDelay: ".08s" }}
        >
          <div className="eyebrow mb-3">Quote of the day</div>
          <div className="font-epigraph max-w-[280px] text-[22px] leading-[1.35] text-foreground">
            {quote.text}
          </div>
          <div className="mt-3 text-[12.5px] font-medium text-muted-foreground">{quote.author}</div>
        </button>

        {/* today's read */}
        <button
          onClick={() => actions.openArticle(todayArticle.id)}
          className="anim-cardUp sietch-card card-lift mb-3.5 w-full overflow-hidden p-5 text-left"
          style={{ animationDelay: ".085s" }}
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="eyebrow">Today&rsquo;s read · {todayArticle.category}</span>
            {readDone ? (
              <span className="flex items-center gap-1 text-[12px] font-semibold text-spice-200">
                <Check size={12} /> Done
              </span>
            ) : (
              <span className="text-[12px] text-muted-foreground">{todayArticle.readMins} min</span>
            )}
          </div>
          <div className="text-[19px] font-bold leading-[1.25] tracking-[-0.01em]">{todayArticle.title}</div>
          <div className="mt-2 text-[14px] leading-[1.45] text-muted-foreground">{todayArticle.excerpt}</div>
          <div className="mt-3 flex items-center gap-1.5 text-[13px] font-semibold text-spice-400">
            {readDone ? "Read again" : "Read & explain it back"}
            <ArrowUpRight size={13} />
          </div>
        </button>

        {/* this week's projects */}
        <button
          onClick={() => actions.go("projects")}
          className="anim-cardUp sietch-card-warm card-lift mb-3.5 w-full p-5 text-left"
          style={{ animationDelay: ".09s" }}
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="eyebrow">This week&rsquo;s projects</span>
            <span className="readout text-[13px] font-bold text-spice-200">{projCount}/3</span>
          </div>
          {projCount === 0 ? (
            <div className="flex items-center justify-between">
              <span className="text-[16px] font-semibold">Choose your 3 projects</span>
              <span className="text-spice-300"><ArrowUpRight size={18} /></span>
            </div>
          ) : (
            <div className="mt-1 flex flex-col gap-2.5">
              {state.projects
                .filter((p) => state.selProj.includes(p.id))
                .map((p) => (
                  <div key={p.id} className="flex items-center gap-2.5">
                    <span className="h-1.5 w-1.5 flex-none rounded-full bg-spice-400" />
                    <span className="text-[15px] font-semibold">{p.title}</span>
                  </div>
                ))}
            </div>
          )}
        </button>

        {/* locked apps */}
        <div className="anim-cardUp sietch-card mb-3.5 p-5" style={{ animationDelay: ".12s" }}>
          <div className="mb-4 flex items-center justify-between">
            <span className="eyebrow">Locked for now</span>
            <span className="text-[12px] text-muted-foreground">Tap to see</span>
          </div>
          <div
            className="flex justify-between gap-2.5 transition-opacity"
            style={{ opacity: state.locking ? 1 : 0.35 }}
          >
            {state.apps.map((app) => (
              <button
                key={app.id}
                onClick={() => actions.openApp(app)}
                className="flex flex-1 flex-col items-center gap-2"
                aria-label={`Open ${app.name}`}
              >
                <span
                  className="relative grid aspect-square w-full max-w-[60px] place-items-center rounded-[15px] text-[26px] shadow-sietch-card"
                  style={{ background: app.color }}
                >
                  {app.emoji}
                  {app.locked && (
                    <span className="absolute -bottom-1 -right-1 grid h-[22px] w-[22px] place-items-center rounded-full border-[2.5px] border-sietch bg-spice-500 text-white">
                      <Lock size={10} />
                    </span>
                  )}
                </span>
                <span className="text-[11px] font-medium text-muted-foreground">{app.name}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => actions.go("spring")}
            className="tap-expand mt-[18px] flex w-full items-center justify-center gap-1.5 border-t border-sand-line pt-4 text-[13px] font-semibold text-spice-400"
          >
            Open your home screen
            <ArrowUpRight size={14} />
          </button>
        </div>

        {/* this week */}
        <button
          onClick={() => actions.go("insights")}
          className="anim-cardUp sietch-card card-lift mb-4 w-full p-5 text-left"
          style={{ animationDelay: ".19s" }}
        >
          <div className="mb-4 flex items-center justify-between">
            <span className="eyebrow">Last 7 days</span>
            <span className="flex items-center gap-1 text-[12.5px] font-semibold text-spice-400">
              Insights <ArrowUpRight size={12} />
            </span>
          </div>
          <div className="mb-5 flex justify-between">
            {[
              [formatDuration(week.focusedSeconds), "DEEP WORK"],
              [String(week.completedSessions), "SESSIONS"],
              [delta === null ? "—" : `${delta > 0 ? "+" : ""}${delta}%`, "VS LAST WEEK"],
            ].map(([v, l]) => (
              <div key={l}>
                <div className="readout text-[22px] font-extrabold tracking-[-0.02em]">{v}</div>
                <div className="eyebrow eyebrow-muted mt-1 text-[9.5px]">{l}</div>
              </div>
            ))}
          </div>
          <WeekChart />
        </button>

        <button
          onClick={() => actions.startFocus()}
          className="anim-cardUp btn-shimmer anim-glowLoop spice-grad h-[58px] w-full rounded-[18px] text-[17px] font-bold text-[hsl(var(--primary-foreground))]"
          style={{ animationDelay: ".26s, .9s" }}
        >
          Start a {state.sessionMinutes}-minute session
        </button>
      </div>
    </div>
  );
}
