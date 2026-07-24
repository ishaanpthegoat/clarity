// Clarity — "Get it rated". Camera → analyzing spinner → AI score reveal.
import { useClarity } from "@/lib/clarityStore";
import { CameraLens } from "../icons";

const STRENGTHS = [
  "Clear structure and strong hierarchy",
  "Consistent visual language throughout",
];
const SUGGESTIONS = [
  "Tighten the opening so the goal reads instantly",
  "Add one concrete result or metric",
];

const RCIRC = 578;

export default function Review() {
  const { state, actions } = useClarity();
  const score = state.submitScore ?? 87;

  return (
    <div className="anim-fadeIn absolute inset-0 flex flex-col overflow-y-auto bg-black px-[22px] pb-[118px] pt-[78px]">
      <div className="mb-4">
        <span className="text-[28px] font-extrabold tracking-[-0.7px]">Get it rated</span>
      </div>

      {state.submitStage === "camera" && (
        <div className="flex flex-1 flex-col">
          <div className="mb-[22px] text-[14.5px] leading-[1.5] text-[#8a8a97]">
            Snap a photo of your work and our AI gives you a quick, honest read on where it stands.
          </div>
          <div
            className="relative flex aspect-[3/4] w-full flex-col items-center justify-center gap-3.5 overflow-hidden rounded-[24px]"
            style={{
              border: "2px dashed rgba(139,107,255,.35)",
              background: "radial-gradient(80% 60% at 50% 40%,rgba(139,107,255,.08),rgba(255,255,255,.02))",
            }}
          >
            {[
              "top-4 left-4 border-t-[3px] border-l-[3px] rounded-tl-md",
              "top-4 right-4 border-t-[3px] border-r-[3px] rounded-tr-md",
              "bottom-4 left-4 border-b-[3px] border-l-[3px] rounded-bl-md",
              "bottom-4 right-4 border-b-[3px] border-r-[3px] rounded-br-md",
            ].map((c) => (
              <span key={c} className={`absolute h-[26px] w-[26px] ${c}`} style={{ borderColor: "rgba(196,178,255,.5)" }} />
            ))}
            <span className="text-[#8a7fb5]"><CameraLens size={46} /></span>
            <span className="text-[14px] font-medium text-[#8a7fb5]">Point at your work</span>
          </div>
          <div className="flex-1" />
          <div className="mt-[26px] flex justify-center">
            <button
              onClick={actions.capturePhoto}
              className="h-[74px] w-[74px] rounded-full border-4 border-white/15 shadow-[0_0_40px_-6px_rgba(139,107,255,.7)]"
              style={{ background: "linear-gradient(135deg,#9d7bff,#6a4bd6)" }}
            />
          </div>
        </div>
      )}

      {state.submitStage === "analyzing" && (
        <div className="anim-fadeIn flex flex-1 flex-col items-center justify-center gap-6">
          <div className="anim-spin h-[58px] w-[58px] rounded-full border-4 border-[rgba(139,107,255,.18)] border-t-[#9d7bff]" />
          <div className="text-[17px] font-semibold text-[#dcdce4]">Reading your work...</div>
          <div className="text-[13.5px] text-[#8a8a97]">This takes just a moment</div>
        </div>
      )}

      {state.submitStage === "result" && (
        <div className="anim-pop-in flex flex-1 flex-col">
          <div className="my-[10px] mb-6 flex flex-col items-center">
            <div className="relative grid h-[150px] w-[150px] place-items-center" style={{ filter: "drop-shadow(0 0 26px rgba(139,107,255,.4))" }}>
              <svg width="150" height="150" viewBox="0 0 220 220">
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#c4b2ff" />
                    <stop offset="1" stopColor="#7a4bff" />
                  </linearGradient>
                </defs>
                <circle cx="110" cy="110" r="92" fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="15" />
                <circle
                  cx="110" cy="110" r="92" fill="none" stroke="url(#scoreGrad)" strokeWidth="15"
                  strokeLinecap="round" strokeDasharray={RCIRC} transform="rotate(-90 110 110)"
                  style={{ strokeDashoffset: RCIRC * (1 - score / 100), transition: "stroke-dashoffset 1s cubic-bezier(.2,.8,.2,1)" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-[44px] font-extrabold leading-none tracking-[-2px]">
                  {score}
                  <span className="text-[17px] font-bold text-[#8a8a97]">/100</span>
                </div>
              </div>
            </div>
            <div className="mt-3.5 text-[22px] font-extrabold tracking-[-0.4px]">Strong work</div>
            <div className="mt-1.5 max-w-[270px] text-center text-[14px] leading-[1.45] text-[#8a8a97]">
              You are close. A couple of tweaks and this is ready to ship.
            </div>
          </div>

          <div className="mb-3 rounded-[18px] border border-[rgba(140,110,255,.14)] bg-[#0e0d13] p-[18px]">
            <div className="mb-3 text-[11px] font-bold tracking-[2px] text-[#7ee0a8]">WHAT IS WORKING</div>
            {STRENGTHS.map((t) => (
              <div key={t} className="mb-[9px] flex items-start gap-2.5">
                <span className="flex-none font-bold text-[#7ee0a8]">+</span>
                <span className="text-[14.5px] leading-[1.4] text-[#cbc6da]">{t}</span>
              </div>
            ))}
          </div>
          <div className="mb-5 rounded-[18px] border border-[rgba(140,110,255,.14)] bg-[#0e0d13] p-[18px]">
            <div className="mb-3 text-[11px] font-bold tracking-[2px] text-[#a394ff]">WHERE TO PUSH</div>
            {SUGGESTIONS.map((t) => (
              <div key={t} className="mb-[9px] flex items-start gap-2.5">
                <span className="flex-none font-bold text-[#a394ff]">→</span>
                <span className="text-[14.5px] leading-[1.4] text-[#cbc6da]">{t}</span>
              </div>
            ))}
          </div>

          <button
            onClick={actions.resetSubmit}
            className="h-[52px] w-full rounded-[16px] border border-white/[0.08] bg-white/[0.05] text-[15px] font-semibold text-[#c9c9d4]"
          >
            Rate another
          </button>
        </div>
      )}
    </div>
  );
}
