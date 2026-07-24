// Clarity — Block screen. Shown when a locked app is opened while locking is on.
import { useClarity } from "@/lib/clarityStore";
import { Lock, Clock } from "../icons";

export default function Block() {
  const { state, actions } = useClarity();
  const ba = state.blockedApp ?? {
    name: "Instagram",
    emoji: "📸",
    color: "linear-gradient(135deg,#feda75,#fa7e1e,#d62976,#962fbf)",
  };

  return (
    <div
      className="anim-slideUp absolute inset-0 flex flex-col overflow-y-auto px-[26px] pb-10 pt-[82px]"
      style={{ background: "radial-gradient(100% 70% at 50% 20%,#1c1338,#060509 65%)" }}
    >
      <div className="flex flex-col items-center">
        <div
          className="relative grid h-[78px] w-[78px] place-items-center rounded-[20px] text-[38px] shadow-[0_10px_30px_-8px_rgba(0,0,0,.7)]"
          style={{ background: ba.color }}
        >
          {ba.emoji}
          <span className="absolute -bottom-1.5 -right-1.5 grid h-[30px] w-[30px] place-items-center rounded-full border-[3px] border-[#0a0812] bg-[#8b6bff]">
            <Lock size={14} />
          </span>
        </div>
        <div className="mt-[22px] text-center text-[26px] font-extrabold tracking-[-0.6px]">{ba.name} is locked</div>
        <div className="mt-3.5 max-w-[290px] text-center text-[16px] leading-[1.5] text-[#c4b2ff]">
          The task feels heavier in your head than it will in your hands. Give it ten minutes and watch it shrink.
        </div>
      </div>

      <div className="mt-[30px] rounded-[20px] border border-[rgba(140,110,255,.16)] bg-[#0e0d13] p-5">
        <div className="mb-2.5 text-[11px] font-bold tracking-[2px] text-[#a394ff]">FINISH THIS FIRST</div>
        <div className="text-[20px] font-bold leading-[1.3] tracking-[-0.3px]">{state.task}</div>
        <div className="mt-3.5 flex items-center gap-2 border-t border-white/[0.06] pt-3.5">
          <span className="text-[#a394ff]"><Clock size={15} /></span>
          <span className="text-[13.5px] text-[#8a8a97]">Focus 15 minutes to unlock 5 minutes of access</span>
        </div>
      </div>

      <div className="flex-1" />
      <div className="mt-[26px] flex flex-col gap-3">
        <button
          onClick={() => actions.startFocus(15, true)}
          className="h-14 w-full rounded-[18px] text-[17px] font-bold text-white shadow-clarity-glow-lg"
          style={{ background: "linear-gradient(135deg,#9d7bff,#6a4bd6)" }}
        >
          Start a focus session
        </button>
        <button onClick={actions.blockDismiss} className="h-[50px] w-full rounded-[16px] text-[15px] font-semibold text-[#8a8a97]">
          Not now
        </button>
      </div>
    </div>
  );
}
