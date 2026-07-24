// Clarity — Focus session. Animated timer ring, pause/resume, done state + confetti.
import { useEffect } from "react";
import confetti from "canvas-confetti";
import { useClarity, fmtTime } from "@/lib/clarityStore";
import { Check } from "../icons";

const TC = 741;

export default function Focus() {
  const { state, actions } = useClarity();
  const frac = state.focusTotal ? (state.focusTotal - state.focusLeft) / state.focusTotal : 0;

  useEffect(() => {
    if (!state.focusDone) return;
    confetti({
      particleCount: 110,
      spread: 75,
      startVelocity: 42,
      gravity: 1.3,
      ticks: 160, // auto-clear quickly so it doesn't bleed into the next screen
      scalar: 0.9,
      origin: { y: 0.42 },
      colors: ["#9d7bff", "#c4b2ff", "#7a4bff", "#ffffff"],
      disableForReducedMotion: true,
    });
  }, [state.focusDone]);

  return (
    <div
      className="anim-fadeIn absolute inset-0 flex flex-col px-[26px] pb-[60px] pt-[96px]"
      style={{ background: "radial-gradient(90% 60% at 50% 30%,#191233,#060509 70%)" }}
    >
      <div className="text-center">
        <div className="text-[11px] font-bold tracking-[3px] text-[#a394ff]">FOCUS SESSION</div>
        <div className="mt-2 text-[18px] font-semibold text-[#dcdce4]">{state.task}</div>
      </div>

      {!state.focusDone ? (
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="relative grid h-[262px] w-[262px] place-items-center" style={{ filter: "drop-shadow(0 0 50px rgba(139,107,255,.4))" }}>
            <svg width="262" height="262" viewBox="0 0 260 260">
              <defs>
                <linearGradient id="timerGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#c4b2ff" />
                  <stop offset="1" stopColor="#7a4bff" />
                </linearGradient>
              </defs>
              <circle cx="130" cy="130" r="118" fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="10" />
              <circle
                cx="130" cy="130" r="118" fill="none" stroke="url(#timerGrad)" strokeWidth="10"
                strokeLinecap="round" transform="rotate(-90 130 130)"
                style={{ strokeDasharray: TC, strokeDashoffset: TC * (1 - frac), transition: "stroke-dashoffset 1s linear" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="clarity-tab-num text-[58px] font-extrabold tracking-[-2px]">{fmtTime(state.focusLeft)}</div>
              <div className="mt-0.5 text-[12px] tracking-[2px] text-[#8a8a97]">REMAINING</div>
            </div>
          </div>

          <div className="mt-11 flex w-full gap-3">
            <button
              onClick={actions.toggleRun}
              className="h-[54px] flex-1 rounded-[16px] text-[16px] font-bold text-white"
              style={{ background: "linear-gradient(135deg,#9d7bff,#6a4bd6)" }}
            >
              {state.running ? "Pause" : "Resume"}
            </button>
            <button
              onClick={actions.finishFocus}
              className="h-[54px] w-[54px] rounded-[16px] border border-white/10 bg-white/[0.05] text-[18px] text-[#c9c9d4]"
            >
              ✕
            </button>
          </div>
          <button onClick={actions.skipToEnd} className="mt-4 text-[13px] text-[#55555f]">
            Skip to end (demo)
          </button>
        </div>
      ) : (
        <div className="anim-pop-in flex flex-1 flex-col items-center justify-center text-center">
          <div
            className="mb-[26px] grid h-24 w-24 place-items-center rounded-full"
            style={{ background: "linear-gradient(135deg,#9d7bff,#6a4bd6)", boxShadow: "0 0 60px rgba(139,107,255,.5)" }}
          >
            <Check size={44} />
          </div>
          <div className="text-[26px] font-extrabold tracking-[-0.5px]">That was real focus.</div>
          <div className="mt-2.5 max-w-[270px] text-[15px] leading-[1.5] text-[#8a8a97]">
            You gave the work your full attention. That is how the day gets built.
          </div>
          <div className="mt-9 flex w-full flex-col gap-3">
            <button
              onClick={actions.finishFocus}
              className="h-[54px] w-full rounded-[16px] text-[16px] font-bold text-white"
              style={{ background: "linear-gradient(135deg,#9d7bff,#6a4bd6)" }}
            >
              {state.earnBack ? `Unlock ${state.blockedApp?.name ?? "app"} for 5 min` : "Done"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
