// Clarity — full cinematic first-run intro. Full-bleed Higgsfield media per scene,
// bottom-anchored copy + CTA (always visible), keyed crossfades.
import { useState } from "react";
import { useClarity } from "@/lib/clarityStore";
import LEDLogo from "../LEDLogo";

type Scene = {
  media: string;
  kind: "video" | "image";
  brand?: boolean;
  kicker?: string;
  title?: string;
  body: string;
  cta: string;
};

const SCENES: Scene[] = [
  {
    media: "/clarity/aurora.mp4", kind: "video", brand: true,
    body: "Get back your clarity.", cta: "Show me how",
  },
  {
    media: "/clarity/intro-distraction.mp4", kind: "video",
    kicker: "THE PROBLEM", title: "Your focus is being spent for you",
    body: "The apps are engineered to hold your attention. Willpower alone was never going to win that fight.",
    cta: "Continue",
  },
  {
    media: "/clarity/onboard-lock.png", kind: "image",
    kicker: "STEP ONE", title: "Lock away the noise",
    body: "Put your most distracting apps behind a lock during the hours that actually matter.",
    cta: "Continue",
  },
  {
    media: "/clarity/onboard-focus.png", kind: "image",
    kicker: "STEP TWO", title: "Give one thing your focus",
    body: "Name a single task for the day. A focus session keeps you honest until it's done.",
    cta: "Continue",
  },
  {
    media: "/clarity/intro-clarity.mp4", kind: "video",
    kicker: "STEP THREE", title: "Earn your clarity back",
    body: "Finish focused blocks to unlock time — and watch the day build the way you meant it to.",
    cta: "Get started",
  },
];

export default function Intro() {
  const { actions } = useClarity();
  const [i, setI] = useState(0);
  const scene = SCENES[i];
  const last = i === SCENES.length - 1;
  const next = () => (last ? actions.finishIntro() : setI((v) => v + 1));

  return (
    <div className="anim-fadeIn absolute inset-0 overflow-hidden bg-background">
      {/* full-bleed media — remounted per scene so the CSS fade replays */}
      <div key={"m" + i} className="anim-fadeIn absolute inset-0" style={{ animationDuration: ".6s" }}>
        {scene.kind === "video" ? (
          <video className="h-full w-full object-cover" src={scene.media} autoPlay muted loop playsInline />
        ) : (
          <img
            className="h-full w-full object-cover"
            src={scene.media}
            alt=""
            width={440}
            height={900}
            fetchPriority="high"
          />
        )}
      </div>

      {/* warm the footage into the spice palette */}
      <div
        className="pointer-events-none absolute inset-0 opacity-70 mix-blend-color"
        style={{ background: "linear-gradient(160deg,#f5c542,#c2410c)" }}
      />

      {/* legibility gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, hsl(20 30% 3% / .35) 0%, hsl(20 30% 3% / .1) 32%, hsl(20 30% 3% / .78) 66%, hsl(var(--void)) 100%)",
        }}
      />

      {/* brand centerpiece on scene 0 */}
      {scene.brand && (
        <div className="anim-floaty pointer-events-none absolute inset-x-0 top-[34%] flex flex-col items-center gap-7">
          <div style={{ filter: "drop-shadow(0 0 26px hsl(var(--spice-400) / .55))" }}>
            <LEDLogo />
          </div>
        </div>
      )}

      <button
        onClick={actions.finishIntro}
        className="absolute right-2 top-[52px] z-10 grid h-11 min-w-11 place-items-center px-3 text-[14px] font-semibold text-white/70 transition-colors hover:text-white"
      >
        Skip
      </button>

      {/* bottom-anchored copy + controls (always visible) */}
      <div className="absolute inset-x-0 bottom-0 z-[2] px-7 pb-9 pt-6">
        <div key={"t" + i} className="anim-cardUp" style={{ animationDuration: ".45s" }}>
          {scene.kicker && <div className="eyebrow">{scene.kicker}</div>}
          {scene.title && (
            <h1 className="font-display mt-2.5 text-[34px] font-semibold uppercase leading-[1.02] tracking-[0.01em]">
              {scene.title}
            </h1>
          )}
          <p className={(scene.title ? "mt-3 " : "") + "max-w-[340px] text-[16px] leading-[1.5] text-foreground/80"}>
            {scene.body}
          </p>
        </div>

        {/* The dot is 7px but the hit area is 44px — thumbs are not cursors. */}
        <div className="mb-2 mt-3 flex">
          {SCENES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setI(idx)}
              aria-label={`Go to step ${idx + 1} of ${SCENES.length}`}
              aria-current={idx === i ? "step" : undefined}
              // Full height, narrow width on purpose — the CTA advances scenes.
              data-secondary-affordance="true"
              className="grid h-11 place-items-center px-[3.5px]"
            >
              <span
                className="block h-[7px] rounded-full transition-[width,background-color] duration-300"
                style={{
                  width: idx === i ? 22 : 7,
                  background: idx === i ? "hsl(var(--spice-400))" : "hsl(var(--foreground) / .28)",
                }}
              />
            </button>
          ))}
        </div>

        <button
          onClick={next}
          className="h-[58px] w-full rounded-[18px] text-[17px] font-bold text-white shadow-spice-glow"
          style={{ background: "var(--spice-grad)" }}
        >
          {scene.cta}
        </button>
      </div>
    </div>
  );
}
