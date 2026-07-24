// Clarity — the day's ring. Three readings of the same day, all derived.
import { useClarity } from "@/lib/clarityStore";
import { formatDuration } from "@/lib/clarityStats";
import SpiceRing from "./SpiceRing";
import { ChevronLeft, ChevronRight } from "./icons";

export default function RingHero() {
  const { state, actions, derived } = useClarity();
  const day = derived.viewedDay;
  const { score, focusPct, taskPct, holdPct } = derived.score;

  const goalLabel = formatDuration(state.goalMinutes * 60);

  const rings = [
    {
      big: String(score),
      unit: "%",
      pct: score / 100,
      label: "CLARITY SCORE",
      sub:
        day.focusedSeconds === 0 && day.todosTotal === 0
          ? "Nothing logged yet — a session will start this moving"
          : `${formatDuration(day.focusedSeconds)} of your ${goalLabel} goal`,
    },
    {
      big: String(day.todosDone),
      unit: `/${day.todosTotal}`,
      pct: taskPct,
      label: "TASKS DONE",
      sub: day.todosTotal
        ? `${day.todosDone} of ${day.todosTotal} finished`
        : "No tasks on the list yet",
    },
    {
      big: day.pulls ? String(Math.round(holdPct * 100)) : "—",
      unit: day.pulls ? "%" : "",
      pct: day.pulls ? holdPct : 0,
      label: "PULLS HELD",
      sub: day.pulls
        ? `You were pulled ${day.pulls}×, and held ${day.holds}`
        : "Nothing has pulled at you today",
    },
  ];

  const ri = Math.min(state.ringIndex, rings.length - 1);
  const ring = rings[ri];
  void focusPct;

  // 30px circle, 44px tap target.
  const navBtn = "group grid h-11 w-11 flex-none place-items-center";
  const navChip =
    "grid h-[30px] w-[30px] place-items-center rounded-full border border-sand-line raise text-muted-foreground transition-colors group-hover:text-foreground";

  return (
    <div className="anim-popIn mb-5 flex flex-col items-center" style={{ transformOrigin: "top center" }}>
      <div className="flex items-center gap-1">
        <button onClick={() => actions.cycleRing(-1)} className={navBtn} aria-label="Previous metric">
          <span className={navChip}><ChevronLeft size={15} /></span>
        </button>

        <SpiceRing progress={ring.pct} size={224} stroke={13}>
          <div className="readout text-[58px] font-bold leading-none tracking-[-0.03em]">
            {ring.big}
            <span className="text-[24px] font-semibold text-muted-foreground">{ring.unit}</span>
          </div>
          <div className="eyebrow mt-1.5">{ring.label}</div>
        </SpiceRing>

        <button onClick={() => actions.cycleRing(1)} className={navBtn} aria-label="Next metric">
          <span className={navChip}><ChevronRight size={15} /></span>
        </button>
      </div>

      <div className="mt-3 max-w-[280px] text-center text-[13.5px] leading-[1.4] text-muted-foreground">
        {ring.sub}
      </div>

      {/* 7px dot, 44px hit area — thumbs are not cursors. */}
      <div className="mt-1 flex">
        {rings.map((r, i) => (
          <button
            key={r.label}
            onClick={() => actions.setRing(i)}
            aria-label={`Show ${r.label.toLowerCase()}`}
            aria-current={i === ri ? "true" : undefined}
            // Full height, narrow width on purpose: widening each dot to 44px
            // would treble the visual gap. The 44px chevrons either side drive
            // the same state, so this stays a secondary affordance.
            data-secondary-affordance="true"
            className="grid h-11 place-items-center px-[3.5px]"
          >
            <span
              className="block h-[7px] rounded-full transition-[width,background-color] duration-300"
              style={{
                width: i === ri ? 20 : 7,
                background: i === ri ? "hsl(var(--spice-400))" : "hsl(var(--sand-line))",
              }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
