// Clarity — Set today's focus task. Input + suggestion chips.
import { useClarity } from "@/lib/clarityStore";
import { TASK_SUGGESTIONS } from "@/lib/clarityData";
import { ChevronLeft } from "../icons";

export default function SetTask() {
  const { state, actions } = useClarity();

  return (
    <div className="anim-slideUp absolute inset-0 flex flex-col bg-black px-6 pb-10 pt-[78px]">
      <button
        onClick={() => actions.go("home")}
        className="mb-[26px] grid h-10 w-10 place-items-center rounded-[13px] border border-white/[0.08] bg-white/[0.05] text-[#c9c9d4]"
      >
        <ChevronLeft size={18} />
      </button>
      <div className="text-[30px] font-extrabold leading-[1.15] tracking-[-0.8px]">
        What is today
        <br />
        really about?
      </div>
      <div className="mt-3 text-[15px] leading-[1.5] text-[#8a8a97]">
        Name one thing. Everything you lock away is protecting this.
      </div>

      <input
        value={state.taskDraft}
        onChange={(e) => actions.setTaskDraft(e.target.value)}
        placeholder="Your one focus"
        className="mt-7 w-full rounded-[16px] border border-[rgba(140,110,255,.2)] bg-[#0e0d13] p-[18px] text-[17px] font-semibold text-white outline-none placeholder:text-[#55555f]"
      />

      <div className="mb-3 mt-[26px] text-[11px] font-bold tracking-[2px] text-[#55555f]">SUGGESTIONS</div>
      <div className="flex flex-wrap gap-2.5">
        {TASK_SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => actions.setTaskDraft(s)}
            className="rounded-full border border-[rgba(139,107,255,.22)] bg-[rgba(139,107,255,.1)] px-[15px] py-[11px] text-[14px] font-medium text-[#c4b2ff]"
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex-1" />
      <button
        onClick={actions.saveTask}
        className="h-14 w-full rounded-[18px] text-[17px] font-bold text-white"
        style={{ background: "linear-gradient(135deg,#9d7bff,#6a4bd6)" }}
      >
        Set my focus
      </button>
    </div>
  );
}
