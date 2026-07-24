// Clarity — evening check-in. Saved onto the day, so it shows up in history.
import { useClarity } from "@/lib/clarityStore";
import { MOODS, DAY_GO_OPTIONS, ACTIVITY_OPTIONS } from "@/lib/clarityData";
import { formatDuration } from "@/lib/clarityStats";

function chipStyle(on: boolean) {
  return {
    border: `1px solid ${on ? "hsl(var(--spice-400) / 0.5)" : "hsl(var(--sand-line))"}`,
    background: on ? "hsl(var(--spice-400) / 0.16)" : "hsl(var(--spice-400) / 0.04)",
    color: on ? "hsl(var(--spice-100))" : "hsl(var(--muted-foreground))",
  } as const;
}

export default function Checkin() {
  const { state, actions, derived } = useClarity();
  const day = derived.today;
  const alreadyDone = !!day.checkin;

  const label = "mb-3 text-[13.5px] font-semibold text-foreground/90";

  return (
    <div
      className="anim-fadeIn clarity-scroll absolute inset-0 flex flex-col overflow-y-auto px-[22px] pb-[118px] pt-[78px]"
      style={{ background: "radial-gradient(90% 55% at 50% 0%,hsl(24 40% 10%),hsl(var(--void)) 68%)" }}
    >
      <h1 className="font-display text-[32px] font-semibold uppercase tracking-[0.03em]">
        Evening check-in
      </h1>
      <p className="mb-6 mt-1.5 text-[14.5px] leading-[1.5] text-muted-foreground">
        {alreadyDone ? "You already closed today out — this will update it." : "Take a minute to close out the day."}
      </p>

      {/* what the day actually held, so the reflection has something to sit against */}
      <div className="sietch-card mb-7 flex justify-between p-4">
        {[
          [formatDuration(day.focusedSeconds), "FOCUSED"],
          [`${day.todosDone}/${day.todosTotal || 0}`, "TASKS"],
          [day.pulls ? `${day.holds}/${day.pulls}` : "—", "PULLS HELD"],
        ].map(([v, l]) => (
          <div key={l} className="text-center">
            <div className="readout text-[18px] font-bold">{v}</div>
            <div className="eyebrow eyebrow-muted mt-1 text-[9px]">{l}</div>
          </div>
        ))}
      </div>

      <div className={label}>How are you feeling tonight?</div>
      <div className="mb-7 flex justify-between gap-1.5">
        {MOODS.map((m) => {
          const on = state.mood === m.value;
          return (
            <button
              key={m.value}
              onClick={() => actions.setMood(m.value)}
              aria-pressed={on}
              aria-label={`Mood ${m.value + 1} of 5`}
              className="grid h-[52px] w-[52px] place-items-center rounded-[16px] text-[28px] transition-[background-color,border-color] duration-200"
              style={{
                border: `2px solid ${on ? "hsl(var(--spice-400))" : "transparent"}`,
                background: on ? "hsl(var(--spice-400) / 0.16)" : "hsl(var(--card))",
              }}
            >
              {m.emoji}
            </button>
          );
        })}
      </div>

      <div className={label}>How did today&rsquo;s focus go?</div>
      <div className="mb-7 flex flex-wrap gap-[9px]">
        {DAY_GO_OPTIONS.map((v) => (
          <button
            key={v}
            onClick={() => actions.setDayGo(v)}
            aria-pressed={state.dayGo === v}
            className="rounded-full px-[15px] py-[11px] text-[14px] font-medium transition-[background-color,border-color,color] duration-200"
            style={chipStyle(state.dayGo === v)}
          >
            {v}
          </button>
        ))}
      </div>

      <div className={label}>What did you make time for?</div>
      <div className="mb-7 flex flex-wrap gap-[9px]">
        {ACTIVITY_OPTIONS.map((k) => (
          <button
            key={k}
            onClick={() => actions.toggleActivity(k)}
            aria-pressed={state.activities.includes(k)}
            className="rounded-full px-[15px] py-[11px] text-[14px] font-medium transition-[background-color,border-color,color] duration-200"
            style={chipStyle(state.activities.includes(k))}
          >
            {k}
          </button>
        ))}
      </div>

      <label htmlFor="checkin-note" className={label}>Anything on your mind?</label>
      <input
        id="checkin-note"
        value={state.checkinNote}
        onChange={(e) => actions.setCheckinNote(e.target.value)}
        placeholder="One line for future you (optional)"
        name="reflection"
        autoComplete="off"
        maxLength={280}
        className="mb-7 w-full rounded-[16px] border border-sand-line raise p-4 text-[15px] text-foreground outline-none placeholder:text-muted-foreground focus:border-spice-400/50"
      />

      <button
        onClick={actions.saveCheckin}
        className="spice-grad h-14 w-full rounded-[18px] text-[17px] font-bold text-[hsl(var(--primary-foreground))]"
      >
        {alreadyDone ? "Update check-in" : "Finish check-in"}
      </button>
    </div>
  );
}
