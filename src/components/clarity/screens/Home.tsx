// Clarity — Home. Collapsing header, the day's ring, and the cards that make up
// a day. Every number on this screen comes out of the logged history.
import { useRef } from "react";
import { useClarity, GOAL_BOUNDS, SESSION_BOUNDS } from "@/lib/clarityStore";
import { QUOTES } from "@/lib/clarityData";
import { categoryLabel } from "@/lib/feeds";
import { greet, goalPhrase } from "@/lib/personalize";
import {
  dateKey,
  daysUntil,
  formatDayLabel,
  formatDue,
  formatDuration,
  isToday,
  lastSevenDays,
  totalsFor,
  weekOverWeekDelta,
} from "@/lib/clarityStats";
import RingHero from "../RingHero";
import WeekChart from "../WeekChart";
import ClaritySwitch from "../ClaritySwitch";
import AppLogo from "../AppLogo";
import DurationSlider from "../DurationSlider";
import { IconAction, Tip } from "../Action";
import {
  ChevronLeft, ChevronRight, Gear, ArrowUpRight, Check, Flame, Shield, Search,
  Snowflake, MoonIcon,
} from "../icons";

export default function Home() {
  const { state, actions, derived } = useClarity();
  const heroRef = useRef<HTMLDivElement>(null);
  const greetRef = useRef<HTMLDivElement>(null);
  const compactRef = useRef<HTMLDivElement>(null);
  const headerBgRef = useRef<HTMLDivElement>(null);

  const quote = QUOTES[state.quoteIndex % QUOTES.length];
  const projCount = state.selProj.length;
  const viewingToday = isToday(state.viewDate);
  const day = derived.viewedDay;

  const checkedIn = !!derived.today.checkin;
  const evening = new Date().getHours() >= 17;
  const goal = state.profile.goal ? goalPhrase(state.profile.goal) : null;

  const week = totalsFor(state.days, lastSevenDays());
  const delta = weekOverWeekDelta(state.days);
  const held = day.pulls ? `${day.holds}/${day.pulls}` : "—";
  const frozenToday = state.freezeDays.includes(dateKey());

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
    // The header floats over the scroll body, so cards would otherwise slide
    // straight through the date nav and the locking switch. Fade a backdrop in
    // on the same ramp as the compact title.
    if (headerBgRef.current) headerBgRef.current.style.opacity = String(c);
  }

  // Visual chrome stays small; the tap target underneath is always >= 44px.
  const hit = "grid h-11 w-11 place-items-center";
  const chip =
    "grid place-items-center rounded-xl border border-sand-line raise text-muted-foreground transition-colors group-hover:text-foreground group-disabled:opacity-30";

  return (
    <div className="anim-fadeIn absolute inset-0">
      {/* Sits under the header and over the scroll body. */}
      <div
        ref={headerBgRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-30 h-[182px] opacity-0"
        style={{
          background:
            "linear-gradient(to bottom, hsl(var(--background)) 0%, hsl(var(--background)) 74%, transparent 100%)",
        }}
      />

      {/* ── header ── */}
      <div className="absolute left-0 right-0 z-40 h-[120px] px-5" style={{ top: "calc(52px + var(--safe-t))" }}>
        <div className="relative flex h-11 items-center justify-center">
          <Tip label="Show the day before">
            <button
              onClick={() => actions.stepViewDate(-1)}
              className={`group ${hit}`}
              aria-label="Previous day"
            >
              <span className={`${chip} h-[26px] w-[26px]`}><ChevronLeft size={12} /></span>
            </button>
          </Tip>
          <Tip label={viewingToday ? "You're looking at today" : "Jump back to today"}>
            <button
              onClick={() => actions.setViewDate(dateKey())}
              className="font-display grid h-11 place-items-center whitespace-nowrap px-1"
              aria-label={`${formatDayLabel(state.viewDate)} — jump to today`}
            >
              <span className="rounded-full border border-sand-line raise px-[15px] py-[6px] text-[12px] font-semibold uppercase tracking-[0.18em] text-foreground/85">
                {formatDayLabel(state.viewDate)}
              </span>
            </button>
          </Tip>
          <Tip label={viewingToday ? "There's no history for tomorrow yet" : "Show the day after"}>
            <button
              onClick={() => actions.stepViewDate(1)}
              disabled={viewingToday}
              className={`group ${hit}`}
              aria-label="Next day"
            >
              <span className={`${chip} h-[26px] w-[26px]`}><ChevronRight size={12} /></span>
            </button>
          </Tip>

          <div className="absolute right-[-8px] flex items-center gap-0.5">
            <IconAction
              icon={<Search size={15} />}
              label="Search"
              tooltip="Search Clarity — or press ⌘K"
              onClick={() => actions.setPaletteOpen(true)}
            />
            <IconAction
              icon={<Gear size={16} />}
              label="Settings"
              tooltip="Sessions, locking, appearance and your data"
              onClick={() => actions.go("settings")}
            />
          </div>
        </div>

        <div className="relative mt-4 h-[50px]">
          <div ref={greetRef} className="absolute left-0 top-0 max-w-[240px]">
            {/* Name is rendered beneath, so the greeting is asked for without one. */}
            <div className="text-[13px] font-medium text-muted-foreground">{greet("")}</div>
            <h1 className="truncate text-[26px] font-extrabold leading-[1.1] tracking-[-0.02em]">
              {state.profile.name || "Welcome"}
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
        className="clarity-scroll absolute inset-0 overflow-y-auto overflow-x-hidden px-[18px] pb-[118px] pt-[calc(178px_+_var(--safe-t))]"
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

        {/* today's digest — the thing that replaces the scroll */}
        <button
          onClick={actions.openDigest}
          className="anim-cardUp sietch-card card-lift mb-3.5 w-full p-5 text-left"
          style={{ animationDelay: ".05s" }}
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="eyebrow">Today&rsquo;s digest</span>
            {derived.digestDone ? (
              <span className="flex items-center gap-1 text-[12px] font-semibold text-spice-200">
                <Check size={12} /> Read
              </span>
            ) : (
              <span className="text-[12px] text-muted-foreground">
                {state.digest ? `${state.digest.readMins} min` : "Under 2 min"}
              </span>
            )}
          </div>
          <div className="text-[19px] font-bold leading-[1.3] tracking-[-0.01em]">
            {derived.digestDone
              ? "You're caught up for today."
              : "Everything you follow, in one read."}
          </div>
          <div className="mt-2 text-[14px] leading-[1.45] text-muted-foreground">
            {state.profile.interests.length
              ? state.profile.interests.map(categoryLabel).join(" · ")
              : "Pick what you follow to start getting a digest."}
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[13px] font-semibold text-spice-400">
            {derived.digestDone ? "Read it again" : "Read today's"}
            <ArrowUpRight size={13} />
          </div>
        </button>

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

        {/* streak freeze — surfaced only when there is something to lose today */}
        {viewingToday && derived.streak > 0 && derived.today.focusedSeconds < 600 && (
          <div className="anim-cardUp mb-3.5 flex items-center gap-3 rounded-[18px] border border-spice-400/25 bg-spice-400/[0.07] px-4 py-3">
            <span className="flex-none text-spice-300"><Snowflake size={17} /></span>
            <span className="flex-1 text-[13.5px] leading-[1.4]">
              <span className="font-semibold">
                Your {derived.streak}-day streak is on the line.
              </span>{" "}
              <span className="text-muted-foreground">
                {frozenToday
                  ? "Frozen — today can't break it."
                  : derived.freezeAvailable
                    ? "Ten focused minutes keeps it, or freeze the day."
                    : "Ten focused minutes keeps it."}
              </span>
            </span>
            {!frozenToday && derived.freezeAvailable && (
              <Tip label="Spend your weekly freeze so today can't break the streak">
                <button
                  onClick={actions.spendFreeze}
                  aria-label="Freeze today's streak"
                  className="h-11 flex-none rounded-[12px] border border-spice-400/40 bg-spice-400/[0.12] px-3.5 text-[12.5px] font-semibold text-spice-200"
                >
                  Freeze
                </button>
              </Tip>
            )}
          </div>
        )}

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

        {/* session dials — these used to be two screens deep in Settings, which
            is the wrong place for the two numbers people retune most often */}
        <div className="anim-cardUp sietch-card mb-3.5 px-[18px]" style={{ animationDelay: ".085s" }}>
          <DurationSlider
            id="home-session"
            label="Session length"
            hint="How long a new focus session runs"
            value={state.sessionMinutes}
            onChange={actions.setSessionMinutes}
            min={SESSION_BOUNDS.min}
            max={SESSION_BOUNDS.max}
            step={SESSION_BOUNDS.step}
            ticks={[5, 60, 180, 300, 420]}
            presets={[15, 25, 50, 90, 180]}
          />
          <div className="border-t border-sand-line">
            <DurationSlider
              id="home-goal"
              label="Daily goal"
              hint="Deep work you're aiming for each day"
              value={state.goalMinutes}
              onChange={actions.setGoalMinutes}
              min={GOAL_BOUNDS.min}
              max={GOAL_BOUNDS.max}
              step={GOAL_BOUNDS.step}
              ticks={[10, 180, 360, 540, 720]}
              presets={[60, 120, 180, 300, 480]}
            />
          </div>
        </div>

        {/* check-in — off the tab bar, surfaced here when the day is old enough
            to have something worth reflecting on */}
        {viewingToday && (evening || checkedIn) && (
          <button
            onClick={() => actions.go("checkin")}
            className="anim-cardUp sietch-card card-lift mb-3.5 flex w-full items-center gap-3.5 p-5 text-left"
            style={{ animationDelay: ".088s" }}
          >
            <span className="grid h-11 w-11 flex-none place-items-center rounded-[13px] border border-spice-400/30 bg-spice-400/[0.10] text-spice-300">
              {checkedIn ? <Check size={18} /> : <MoonIcon size={18} />}
            </span>
            <span className="flex-1">
              <span className="block text-[15.5px] font-bold">
                {checkedIn ? "Today's checked in" : "Close out the day"}
              </span>
              <span className="block text-[13.5px] leading-[1.4] text-muted-foreground">
                {checkedIn
                  ? "Tap to update how it actually went."
                  : "A minute of reflection, then it's logged."}
              </span>
            </span>
            <span className="text-spice-300"><ArrowUpRight size={17} /></span>
          </button>
        )}

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
                .map((p) => {
                  const late = p.dueDate ? daysUntil(p.dueDate) < 0 : false;
                  return (
                    <div key={p.id} className="flex items-center gap-2.5">
                      <span className="h-1.5 w-1.5 flex-none rounded-full bg-spice-400" />
                      <span className="min-w-0 flex-1 truncate text-[15px] font-semibold">
                        {p.title}
                      </span>
                      {p.dueDate && (
                        <span
                          className="flex-none text-[11.5px] font-semibold"
                          style={{
                            color: late
                              ? "hsl(var(--destructive))"
                              : "hsl(var(--muted-foreground))",
                          }}
                        >
                          {formatDue(p.dueDate)}
                        </span>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </button>

        {/* locked apps */}
        <div className="anim-cardUp sietch-card mb-3.5 p-5" style={{ animationDelay: ".12s" }}>
          <div className="mb-1 flex items-center justify-between">
            <span className="eyebrow">Locked for now</span>
            <span className="text-[12px] text-muted-foreground">Tap to see</span>
          </div>
          {/* Says what the locking is *for*, in their words. A lock with a
              stated purpose is easier to keep than one without. */}
          <div className="mb-4 text-[12.5px] leading-[1.4] text-muted-foreground">
            {goal ? <>So the time goes to {goal} instead.</> : "So the time goes somewhere you chose."}
          </div>
          <div className="flex flex-wrap justify-start gap-x-3 gap-y-4">
            {state.apps.map((app) => (
              <Tip
                key={app.id}
                label={
                  !state.locking
                    ? `${app.name} is open — locking is off`
                    : app.locked
                      ? `${app.name} is locked. Tap to see what's waiting on the other side.`
                      : `${app.name} isn't locked`
                }
              >
                <button
                  onClick={() => actions.openApp(app)}
                  className="flex w-[60px] flex-col items-center gap-2"
                  aria-label={`Open ${app.name}${app.locked && state.locking ? " — locked" : ""}`}
                >
                  <AppLogo
                    app={app}
                    size={60}
                    locked={app.locked}
                    muted={!state.locking}
                  />
                  <span className="w-full truncate text-center text-[11px] font-medium text-muted-foreground">
                    {app.name}
                  </span>
                </button>
              </Tip>
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
