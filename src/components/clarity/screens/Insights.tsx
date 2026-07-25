// Clarity — Insights. The honest version of the numbers on Home, plus the
// session log. If a day is empty here it is because nothing was logged, not
// because the screen is decorative.
import { useState } from "react";
import { useClarity } from "@/lib/clarityStore";
import {
  addDays,
  dateKey,
  dayInitial,
  formatDuration,
  getDay,
  totalsFor,
  weekOverWeekDelta,
} from "@/lib/clarityStats";
import { ChevronLeft, Flame, Trophy } from "../icons";

type Range = 7 | 30;

export default function Insights() {
  const { state, actions, derived } = useClarity();
  const [range, setRange] = useState<Range>(7);

  const keys = Array.from({ length: range }, (_, i) => addDays(dateKey(), i - (range - 1)));
  const totals = totalsFor(state.days, keys);
  const delta = weekOverWeekDelta(state.days);

  const activeDays = keys.filter((k) => getDay(state.days, k).focusedSeconds > 0).length;
  const avgPerActive = activeDays ? totals.focusedSeconds / activeDays : 0;
  const holdRate = totals.pulls ? Math.round((totals.holds / totals.pulls) * 100) : null;
  const completionRate = totals.sessions
    ? Math.round((totals.completedSessions / totals.sessions) * 100)
    : null;

  const peak = Math.max(state.goalMinutes * 60 * 0.5, ...keys.map((k) => getDay(state.days, k).focusedSeconds), 1);

  const recent = [...state.sessions].reverse().slice(0, 12);

  const stat = (value: string, label: string, sub?: string) => (
    <div key={label} className="sietch-card p-4">
      <div className="readout text-[24px] font-bold tracking-[-0.02em]">{value}</div>
      <div className="eyebrow eyebrow-muted mt-1.5 text-[9.5px]">{label}</div>
      {sub && <div className="mt-1 text-[11.5px] leading-[1.35] text-muted-foreground">{sub}</div>}
    </div>
  );

  return (
    <div className="anim-slideUp clarity-scroll absolute inset-0 flex flex-col overflow-y-auto bg-background px-[22px] pb-[118px] pt-[calc(78px_+_var(--safe-t))]">
      <div className="mb-6 flex items-center gap-3.5">
        <button
          onClick={() => actions.go("home")}
          className="grid h-11 w-11 place-items-center rounded-[13px] border border-sand-line raise text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Back to home"
        >
          <ChevronLeft size={18} />
        </button>
        <h1 className="font-display text-[32px] font-semibold uppercase tracking-[0.03em]">Insights</h1>
      </div>

      {/* range switch */}
      <div className="mb-5 flex gap-2 rounded-[14px] border border-sand-line raise p-1">
        {([7, 30] as Range[]).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className="h-11 flex-1 rounded-[10px] text-[13px] font-semibold transition-colors"
            style={{
              background: range === r ? "hsl(var(--spice-400) / 0.16)" : "transparent",
              color: range === r ? "hsl(var(--spice-200))" : "hsl(var(--muted-foreground))",
            }}
          >
            Last {r} days
          </button>
        ))}
      </div>

      {totals.focusedSeconds === 0 ? (
        <div className="sietch-card flex flex-col items-center px-6 py-12 text-center">
          <span className="text-spice-400 opacity-60"><Trophy size={34} /></span>
          <div className="mt-4 text-[17px] font-bold">Nothing logged yet</div>
          <div className="mt-2 max-w-[260px] text-[14px] leading-[1.5] text-muted-foreground">
            Finish one focus session and this screen starts telling you the truth about your weeks.
          </div>
          <button
            onClick={() => actions.startFocus()}
            className="spice-grad mt-6 h-12 rounded-[14px] px-6 text-[15px] font-bold text-[hsl(var(--primary-foreground))]"
          >
            Start a session
          </button>
        </div>
      ) : (
        <>
          {/* the chart */}
          <div className="sietch-card mb-4 p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="eyebrow">Deep work</span>
              {delta !== null && range === 7 && (
                <span
                  className="readout text-[12.5px] font-semibold"
                  style={{ color: delta >= 0 ? "hsl(var(--spice-300))" : "hsl(var(--muted-foreground))" }}
                >
                  {delta > 0 ? "+" : ""}{delta}% vs last week
                </span>
              )}
            </div>
            <div className="flex h-[96px] items-end justify-between gap-[3px]">
              {keys.map((k) => {
                const secs = getDay(state.days, k).focusedSeconds;
                const isToday = k === dateKey();
                return (
                  <span
                    key={k}
                    title={`${formatDuration(secs)} — ${k}`}
                    className="flex-1 rounded-[4px]"
                    style={{
                      height: `${secs ? Math.max(5, Math.min(100, (secs / peak) * 100)) : 4}%`,
                      background: isToday
                        ? "var(--spice-grad)"
                        : secs
                          ? "hsl(var(--spice-400) / 0.32)"
                          : "hsl(var(--sand-line))",
                    }}
                  />
                );
              })}
            </div>
            {range === 7 && (
              <div className="mt-2 flex justify-between gap-[3px]">
                {keys.map((k) => (
                  <span key={k} className="flex-1 text-center text-[10px] text-muted-foreground">
                    {dayInitial(k)}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="mb-4 grid grid-cols-2 gap-2.5">
            {stat(formatDuration(totals.focusedSeconds), "Total focus", `across ${activeDays} active days`)}
            {stat(formatDuration(avgPerActive), "Average day", "on days you showed up")}
            {stat(String(totals.completedSessions), "Sessions finished",
              completionRate !== null ? `${completionRate}% of those started` : undefined)}
            {stat(holdRate === null ? "—" : `${holdRate}%`, "Pulls held",
              totals.pulls ? `${totals.holds} of ${totals.pulls}` : "nothing pulled at you")}
          </div>

          <div className="sietch-card-warm mb-4 flex items-center gap-4 p-5">
            <span className="text-spice-400"><Flame size={26} /></span>
            <div className="flex-1">
              <div className="readout text-[22px] font-bold">
                {derived.streak} day{derived.streak === 1 ? "" : "s"}
              </div>
              <div className="mt-0.5 text-[13px] text-muted-foreground">
                {derived.streak === 0
                  ? "Ten focused minutes today starts a streak."
                  : derived.today.focusedSeconds >= 600
                    ? "Today already counts. Nothing to protect."
                    : "Ten minutes today keeps it alive."}
              </div>
            </div>
          </div>

          {/* session log */}
          <div className="eyebrow mb-3 ml-1">Recent sessions</div>
          <div className="sietch-card mb-6 divide-y divide-[hsl(var(--sand-line))] px-[18px]">
            {recent.length === 0 && (
              <div className="py-5 text-[14px] text-muted-foreground">No sessions yet.</div>
            )}
            {recent.map((s) => {
              const d = new Date(s.startedAt);
              return (
                <div key={s.id} className="py-3.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="flex-1 truncate text-[15px] font-semibold">
                      {s.task || "Focus"}
                    </span>
                    <span
                      className="readout flex-none text-[13px] font-semibold"
                      style={{
                        color: s.completed ? "hsl(var(--spice-300))" : "hsl(var(--muted-foreground))",
                      }}
                    >
                      {formatDuration(s.focusedSeconds)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[11.5px] text-muted-foreground">
                    <span>
                      {d.toLocaleDateString(undefined, { month: "short", day: "numeric" })} ·{" "}
                      {d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                    </span>
                    {s.strict && <span className="text-spice-400">Commit Mode</span>}
                    {!s.completed && <span>· ended early</span>}
                  </div>
                  {s.note && (
                    <div className="mt-1.5 text-[13px] leading-[1.4] text-foreground/70">{s.note}</div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      <button
        onClick={() => actions.go("milestones")}
        className="sietch-card card-lift flex items-center gap-3.5 p-4 text-left"
      >
        <span className="text-spice-400"><Trophy size={22} /></span>
        <span className="flex-1">
          <span className="block text-[15px] font-bold">Milestones</span>
          <span className="block text-[13px] text-muted-foreground">What you&rsquo;ve earned so far</span>
        </span>
        <span className="text-muted-foreground">→</span>
      </button>
    </div>
  );
}
