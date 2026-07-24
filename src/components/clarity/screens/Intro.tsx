// Clarity — full cinematic first-run intro. Full-bleed Higgsfield media per scene,
// bottom-anchored copy + CTA (always visible), keyed crossfades.
import { useState } from "react";
import { motion } from "framer-motion";
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
    body: "Lock in. Get clear.", cta: "Show me how",
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
    <div className="anim-fadeIn absolute inset-0 overflow-hidden bg-black">
      {/* full-bleed media (keyed crossfade) */}
      <motion.div key={"m" + i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} className="absolute inset-0">
        {scene.kind === "video" ? (
          <video className="h-full w-full object-cover" src={scene.media} autoPlay muted loop playsInline />
        ) : (
          <img className="h-full w-full object-cover" src={scene.media} alt="" />
        )}
      </motion.div>

      {/* legibility gradient */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(5,3,8,.35) 0%, rgba(5,3,8,.1) 32%, rgba(5,3,8,.72) 66%, #050308 100%)" }} />

      {/* brand centerpiece on scene 0 */}
      {scene.brand && (
        <div className="anim-floaty pointer-events-none absolute inset-x-0 top-[34%] flex flex-col items-center gap-7">
          <div style={{ filter: "drop-shadow(0 0 26px rgba(140,90,255,.55))" }}>
            <LEDLogo />
          </div>
        </div>
      )}

      <button onClick={actions.finishIntro} className="absolute right-5 top-[62px] z-10 text-[14px] font-semibold text-white/60">
        Skip
      </button>

      {/* bottom-anchored copy + controls (always visible) */}
      <div className="absolute inset-x-0 bottom-0 z-[2] px-7 pb-9 pt-6">
        <motion.div key={"t" + i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}>
          {scene.kicker && <div className="text-[11px] font-bold tracking-[3px] text-[#a394ff]">{scene.kicker}</div>}
          {scene.title && <div className="mt-2.5 text-[29px] font-extrabold leading-[1.08] tracking-[-0.8px]">{scene.title}</div>}
          <div className={(scene.title ? "mt-3 " : "") + "max-w-[340px] text-[16px] leading-[1.5] text-[#cbc6da]"}>{scene.body}</div>
        </motion.div>

        <div className="mb-5 mt-6 flex gap-[7px]">
          {SCENES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setI(idx)}
              className="h-[7px] rounded-full transition-all"
              style={{ width: idx === i ? 22 : 7, background: idx === i ? "#8b6bff" : "rgba(255,255,255,.25)" }}
            />
          ))}
        </div>

        <button
          onClick={next}
          className="h-[58px] w-full rounded-[18px] text-[17px] font-bold text-white shadow-clarity-glow"
          style={{ background: "linear-gradient(135deg,#9d7bff,#6a4bd6)" }}
        >
          {scene.cta}
        </button>
      </div>
    </div>
  );
}
