// Clarity — switchable progress ring hero (Clarity Score / Tasks Done / Productivity)
import { useClarity } from "@/lib/clarityStore";
import { ChevronLeft, ChevronRight } from "./icons";

const RCIRC = 578;

export default function RingHero() {
  const { state, actions } = useClarity();
  const total = state.todos.length || 1;
  const doneCount = state.todos.filter((t) => t.done).length;

  const rings = [
    { big: "68", unit: "%", pct: 0.68, label: "CLARITY SCORE", sub: "2h 02m of your 3h goal today" },
    { big: String(doneCount), unit: "/" + state.todos.length, pct: doneCount / total, label: "TASKS DONE", sub: `${doneCount} of ${state.todos.length} tasks finished today` },
    { big: "82", unit: "%", pct: 0.82, label: "PRODUCTIVITY", sub: "Up 12% from last week" },
  ];
  const ri = Math.min(state.ringIndex, rings.length - 1);
  const ring = rings[ri];

  const navBtn =
    "flex h-[30px] w-[30px] flex-none place-items-center rounded-full border border-white/[0.08] bg-white/[0.05] text-[#8a8a97] grid";

  return (
    <div className="anim-pop-in mb-5 flex flex-col items-center" style={{ transformOrigin: "top center" }}>
      <div className="flex items-center gap-1">
        <button onClick={() => actions.cycleRing(-1)} className={navBtn}>
          <ChevronLeft size={15} />
        </button>
        <div
          className="relative grid h-[224px] w-[224px] place-items-center"
          style={{ filter: "drop-shadow(0 0 40px rgba(139,107,255,.35))" }}
        >
          <svg width="224" height="224" viewBox="0 0 220 220">
            <defs>
              <linearGradient id="ringHeroGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#c4b2ff" />
                <stop offset="1" stopColor="#7a4bff" />
              </linearGradient>
            </defs>
            <circle cx="110" cy="110" r="92" fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="13" />
            <circle
              cx="110" cy="110" r="92" fill="none" stroke="url(#ringHeroGrad)" strokeWidth="13"
              strokeLinecap="round" strokeDasharray={RCIRC} transform="rotate(-90 110 110)"
              style={{ strokeDashoffset: RCIRC * (1 - ring.pct), transition: "stroke-dashoffset .9s cubic-bezier(.2,.8,.2,1)" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-[58px] font-extrabold leading-none tracking-[-2px]">
              {ring.big}
              <span className="text-[24px] font-bold text-[#8a8a97]">{ring.unit}</span>
            </div>
            <div className="mt-0.5 text-[11px] font-bold tracking-[3px] text-[#a394ff]">{ring.label}</div>
          </div>
        </div>
        <button onClick={() => actions.cycleRing(1)} className={navBtn}>
          <ChevronRight size={15} />
        </button>
      </div>
      <div className="mt-3 text-[14px] text-[#8a8a97]">{ring.sub}</div>
      <div className="mt-3.5 flex gap-[7px]">
        {rings.map((_, i) => (
          <button
            key={i}
            onClick={() => actions.setRing(i)}
            className="h-[7px] rounded-full transition-all"
            style={{ width: i === ri ? 20 : 7, background: i === ri ? "#8b6bff" : "rgba(255,255,255,.2)" }}
          />
        ))}
      </div>
    </div>
  );
}
