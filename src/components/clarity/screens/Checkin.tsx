// Clarity — Evening check-in. Mood, day-go, activities, note.
import { useClarity } from "@/lib/clarityStore";
import { MOODS, DAY_GO_OPTIONS, ACTIVITY_OPTIONS } from "@/lib/clarityData";

function chip(on: boolean) {
  return {
    border: "1px solid " + (on ? "#8b6bff" : "rgba(139,107,255,.22)"),
    background: on ? "rgba(139,107,255,.2)" : "rgba(139,107,255,.06)",
    color: on ? "#fff" : "#c4b2ff",
  } as const;
}

export default function Checkin() {
  const { state, actions } = useClarity();

  return (
    <div className="anim-fadeIn absolute inset-0 flex flex-col overflow-y-auto bg-black px-[22px] pb-[118px] pt-[78px]"
      style={{ background: "radial-gradient(90% 55% at 50% 0%,#14102a,#000 68%)" }}>
      <div className="mb-2">
        <span className="text-[28px] font-extrabold tracking-[-0.7px]">Evening check-in</span>
      </div>
      <div className="mb-[26px] text-[14.5px] leading-[1.5] text-[#8a8a97]">Take a minute to close out the day.</div>

      <div className="mb-3.5 text-[13px] font-bold text-[#dcdce4]">How are you feeling tonight?</div>
      <div className="mb-[30px] flex justify-between gap-1.5">
        {MOODS.map((m) => {
          const on = state.mood === m.value;
          return (
            <button
              key={m.value}
              onClick={() => actions.setMood(m.value)}
              className="grid h-[52px] w-[52px] place-items-center rounded-[16px] text-[28px] transition-all"
              style={{ border: "2px solid " + (on ? "#8b6bff" : "transparent"), background: on ? "rgba(139,107,255,.18)" : "rgba(255,255,255,.04)" }}
            >
              {m.emoji}
            </button>
          );
        })}
      </div>

      <div className="mb-3.5 text-[13px] font-bold text-[#dcdce4]">How did today's focus go?</div>
      <div className="mb-[30px] flex flex-wrap gap-[9px]">
        {DAY_GO_OPTIONS.map((v) => (
          <button key={v} onClick={() => actions.setDayGo(v)} className="rounded-full px-[15px] py-[11px] text-[14px] font-medium transition-all" style={chip(state.dayGo === v)}>
            {v}
          </button>
        ))}
      </div>

      <div className="mb-3.5 text-[13px] font-bold text-[#dcdce4]">What did you make time for?</div>
      <div className="mb-[30px] flex flex-wrap gap-[9px]">
        {ACTIVITY_OPTIONS.map((k) => (
          <button key={k} onClick={() => actions.toggleActivity(k)} className="rounded-full px-[15px] py-[11px] text-[14px] font-medium transition-all" style={chip(state.activities.includes(k))}>
            {k}
          </button>
        ))}
      </div>

      <div className="mb-3.5 text-[13px] font-bold text-[#dcdce4]">Anything on your mind?</div>
      <input
        value={state.checkinNote}
        onChange={(e) => actions.setCheckinNote(e.target.value)}
        placeholder="One line for future you (optional)"
        className="mb-7 w-full rounded-[16px] border border-[rgba(140,110,255,.2)] bg-[#0e0d13] p-4 text-[15px] text-white outline-none placeholder:text-[#55555f]"
      />

      <button
        onClick={actions.saveCheckin}
        className="h-14 w-full rounded-[18px] text-[17px] font-bold text-white"
        style={{ background: "linear-gradient(135deg,#9d7bff,#6a4bd6)" }}
      >
        Finish check-in
      </button>
    </div>
  );
}
