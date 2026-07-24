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
    <div className="anim-fadeIn absolute inset-0 flex flex-col overflow-y-auto bg-background px-[22px] pb-[118px] pt-[78px]">
      <div className="mb-4">
        <span className="text-[28px] font-extrabold tracking-[-0.7px]">Get it rated</span>
      </div>

      {state.submitStage === "camera" && (
        <div className="flex flex-1 flex-col">
          <div className="mb-[22px] text-[14.5px] leading-[1.5] text-[hsl(var(--muted-foreground))]">
            Snap a photo of your work and our AI gives you a quick, honest read on where it stands.
          </div>
          <div
            className="relative flex aspect-[3/4] w-full flex-col items-center justify-center gap-3.5 overflow-hidden rounded-[24px]"
            style={{
              border: "2px dashed hsl(var(--spice-400) / .35)",
              background: "radial-gradient(80% 60% at 50% 40%,hsl(var(--spice-400) / .08),rgba(255,255,255,.02))",
            }}
          >
            {[
              "top-4 left-4 border-t-[3px] border-l-[3px] rounded-tl-md",
              "top-4 right-4 border-t-[3px] border-r-[3px] rounded-tr-md",
              "bottom-4 left-4 border-b-[3px] border-l-[3px] rounded-bl-md",
              "bottom-4 right-4 border-b-[3px] border-r-[3px] rounded-br-md",
            ].map((c) => (
              <span key={c} className={`absolute h-[26px] w-[26px] ${c}`} style={{ borderColor: "hsl(var(--spice-200) / .5)" }} />
            ))}
            <span className="text-[hsl(var(--muted-foreground))]"><CameraLens size={46} /></span>
            <span className="text-[14px] font-medium text-[hsl(var(--muted-foreground))]">Point at your work</span>
          </div>
          <div className="flex-1" />
          <div className="mt-[26px] flex justify-center">
            <button
              onClick={actions.capturePhoto}
              className="h-[74px] w-[74px] rounded-full border-4 border-white/15 shadow-[0_0_40px_-6px_hsl(var(--spice-400) / .7)]"
              style={{ background: "var(--spice-grad)" }}
            />
          </div>
        </div>
      )}

      {state.submitStage === "analyzing" && (
        <div className="anim-fadeIn flex flex-1 flex-col items-center justify-center gap-6">
          <div className="anim-spin h-[58px] w-[58px] rounded-full border-4 border-[hsl(var(--spice-400) / .18)] border-t-[hsl(var(--spice-400))]" />
          <div className="text-[17px] font-semibold text-[hsl(var(--foreground) / 0.9)]">Reading your work…</div>
          <div className="text-[13.5px] text-[hsl(var(--muted-foreground))]">This takes just a moment</div>
        </div>
      )}

      {state.submitStage === "result" && (
        <div className="anim-popIn flex flex-1 flex-col">
          <div className="my-[10px] mb-6 flex flex-col items-center">
            <div className="relative grid h-[150px] w-[150px] place-items-center" style={{ filter: "drop-shadow(0 0 26px hsl(var(--spice-400) / .4))" }}>
              <svg width="150" height="150" viewBox="0 0 220 220">
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="hsl(var(--spice-200))" />
                    <stop offset="1" stopColor="hsl(var(--spice-700))" />
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
                  <span className="text-[17px] font-bold text-[hsl(var(--muted-foreground))]">/100</span>
                </div>
              </div>
            </div>
            <div className="mt-3.5 text-[22px] font-extrabold tracking-[-0.4px]">Strong work</div>
            <div className="mt-1.5 max-w-[270px] text-center text-[14px] leading-[1.45] text-[hsl(var(--muted-foreground))]">
              You are close. A couple of tweaks and this is ready to ship.
            </div>
          </div>

          <div className="mb-3 rounded-[18px] border border-[hsl(var(--sand-line))] bg-[hsl(var(--sietch))] p-[18px]">
            <div className="mb-3 text-[11px] font-bold tracking-[2px] text-[hsl(var(--spice-200))]">WHAT IS WORKING</div>
            {STRENGTHS.map((t) => (
              <div key={t} className="mb-[9px] flex items-start gap-2.5">
                <span className="flex-none font-bold text-[hsl(var(--spice-200))]">+</span>
                <span className="text-[14.5px] leading-[1.4] text-[hsl(var(--foreground) / 0.8)]">{t}</span>
              </div>
            ))}
          </div>
          <div className="mb-5 rounded-[18px] border border-[hsl(var(--sand-line))] bg-[hsl(var(--sietch))] p-[18px]">
            <div className="mb-3 text-[11px] font-bold tracking-[2px] text-[hsl(var(--spice-400))]">WHERE TO PUSH</div>
            {SUGGESTIONS.map((t) => (
              <div key={t} className="mb-[9px] flex items-start gap-2.5">
                <span className="flex-none font-bold text-[hsl(var(--spice-400))]">→</span>
                <span className="text-[14.5px] leading-[1.4] text-[hsl(var(--foreground) / 0.8)]">{t}</span>
              </div>
            ))}
          </div>

          <button
            onClick={actions.resetSubmit}
            className="h-[52px] w-full rounded-[16px] border border-sand-line raise text-[15px] font-semibold text-[hsl(var(--foreground) / 0.85)]"
          >
            Rate another
          </button>
        </div>
      )}
    </div>
  );
}
