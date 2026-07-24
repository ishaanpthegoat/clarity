// Clarity — Paywall. Pro upgrade. (Front-end flow + persisted pro state; real IAP is out of scope.)
import { useState } from "react";
import { useClarity } from "@/lib/clarityStore";
import { Check, Lock } from "../icons";

const FEATURES = [
  "Lock unlimited apps, all day",
  "AI review on your work & reading",
  "The daily read, 4 days a week",
  "Full focus history & insights",
  "Every theme and future feature",
];

const PLANS = [
  { id: "year", label: "Yearly", price: "$39.99", sub: "$3.33 / mo · best value", badge: "SAVE 44%" },
  { id: "month", label: "Monthly", price: "$5.99", sub: "billed monthly", badge: null as string | null },
] as const;

export default function Paywall() {
  const { actions } = useClarity();
  const [plan, setPlan] = useState<string>("year");

  return (
    <div className="anim-fadeIn absolute inset-0 flex flex-col overflow-hidden bg-background">
      {/* ambient */}
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{ backgroundImage: "url(/clarity/aurora.png)", backgroundSize: "cover", backgroundPosition: "center top" }}
      />
      <div className="absolute inset-0" style={{ background: "radial-gradient(90% 60% at 50% 0%,transparent,rgba(5,3,8,.85) 75%)" }} />

      <button onClick={actions.dismissPaywall} className="absolute right-5 top-[62px] z-10 grid h-8 w-8 place-items-center rounded-full raise text-[18px] text-white/50">
        ✕
      </button>

      <div className="clarity-scroll relative z-[1] flex flex-1 flex-col overflow-y-auto px-6 pb-6 pt-[104px]">
        <div
          className="anim-popIn mx-auto grid h-[72px] w-[72px] place-items-center rounded-[22px]"
          style={{ background: "var(--spice-grad)", boxShadow: "0 0 50px hsl(var(--spice-400) / .5)" }}
        >
          <Lock size={30} />
        </div>

        <div className="anim-cardUp mt-6 text-center" style={{ animationDelay: ".05s" }}>
          <div className="text-[30px] font-extrabold leading-[1.1] tracking-[-0.8px]">Unlock Clarity Pro</div>
          <div className="mx-auto mt-3 max-w-[300px] text-[15px] leading-[1.5] text-[hsl(var(--muted-foreground))]">
            Protect every hour that matters and get the full focus toolkit.
          </div>
        </div>

        <div className="mt-7 flex flex-col gap-3">
          {FEATURES.map((f, i) => (
            <div key={f} className="anim-cardUp flex items-center gap-3" style={{ animationDelay: `${0.1 + i * 0.05}s` }}>
              <span className="grid h-[26px] w-[26px] flex-none place-items-center rounded-full" style={{ background: "hsl(var(--spice-400) / .18)" }}>
                <span className="text-[hsl(var(--spice-200))]"><Check size={14} /></span>
              </span>
              <span className="text-[15.5px] text-[hsl(var(--foreground) / 0.92)]">{f}</span>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3">
          {PLANS.map((p) => {
            const on = plan === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setPlan(p.id)}
                className="relative flex items-center gap-3 rounded-[18px] p-4 text-left transition-[background-color,border-color] duration-200"
                style={{
                  border: "1.5px solid " + (on ? "hsl(var(--spice-500))" : "hsl(var(--sand-line))"),
                  background: on ? "hsl(var(--spice-400) / .12)" : "hsl(var(--sietch))",
                }}
              >
                <span
                  className="grid h-[24px] w-[24px] flex-none place-items-center rounded-full"
                  style={{ border: "2px solid " + (on ? "hsl(var(--spice-400))" : "rgba(255,255,255,.22)"), background: on ? "hsl(var(--spice-500))" : "transparent" }}
                >
                  {on && <Check size={13} />}
                </span>
                <span className="flex-1">
                  <span className="block text-[16px] font-bold">{p.label}</span>
                  <span className="block text-[13px] text-[hsl(var(--muted-foreground))]">{p.sub}</span>
                </span>
                <span className="text-right">
                  <span className="block text-[17px] font-extrabold">{p.price}</span>
                  {p.badge && <span className="text-[11px] font-bold text-[hsl(var(--spice-200))]">{p.badge}</span>}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative z-[1] px-6 pb-8 pt-3">
        <button
          onClick={actions.subscribe}
          className="anim-glowLoop h-[58px] w-full rounded-[18px] text-[17px] font-bold text-white"
          style={{ background: "var(--spice-grad)" }}
        >
          Start 7-day free trial
        </button>
        <div className="mt-3 flex items-center justify-center gap-4 text-[12px] text-[hsl(var(--muted-foreground))]">
          <button onClick={actions.subscribe}>Restore</button>
          <span className="text-white/15">·</span>
          <button onClick={actions.dismissPaywall}>Maybe later</button>
        </div>
      </div>
    </div>
  );
}
