// Clarity — Milestones. Earned from the real log, never granted for opening the app.
import { useClarity } from "@/lib/clarityStore";
import { milestones } from "@/lib/clarityStats";
import { Check, ChevronLeft } from "../icons";

export default function Milestones() {
  const { state, actions } = useClarity();
  const all = milestones(state.days, state.sessions);
  const earned = all.filter((m) => m.earned).length;

  return (
    <div className="anim-slideUp clarity-scroll absolute inset-0 flex flex-col overflow-y-auto bg-background px-[22px] pb-[118px] pt-[calc(78px_+_var(--safe-t))]">
      <div className="mb-6 flex items-center gap-3.5">
        <button
          onClick={() => actions.go("insights")}
          className="grid h-11 w-11 place-items-center rounded-[13px] border border-sand-line raise text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Back to insights"
        >
          <ChevronLeft size={18} />
        </button>
        <h1 className="font-display text-[32px] font-semibold uppercase tracking-[0.03em]">Milestones</h1>
      </div>

      <div className="sietch-card-warm mb-5 p-5">
        <div className="readout text-[30px] font-bold">
          {earned}
          <span className="text-[18px] font-semibold text-muted-foreground">/{all.length}</span>
        </div>
        <div className="mt-1 text-[13.5px] text-muted-foreground">
          {earned === all.length
            ? "All of them. That took real time."
            : "Each one comes out of your own history — there is no way to shortcut them."}
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {all.map((m) => (
          <div
            key={m.id}
            className="sietch-card p-4"
            style={{ opacity: m.earned ? 1 : 0.72 }}
          >
            <div className="flex items-center gap-3.5">
              <span
                className="grid h-11 w-11 flex-none place-items-center rounded-[13px] border"
                style={{
                  background: m.earned ? "var(--spice-grad)" : "hsl(var(--muted))",
                  borderColor: m.earned ? "transparent" : "hsl(var(--sand-line))",
                  color: m.earned ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
                }}
              >
                {m.earned ? <Check size={20} /> : <span className="readout text-[13px] font-bold">{Math.round(m.progress * 100)}%</span>}
              </span>
              <span className="flex-1">
                <span className="block text-[15.5px] font-bold">{m.name}</span>
                <span className="block text-[13px] leading-[1.4] text-muted-foreground">{m.detail}</span>
              </span>
            </div>

            {!m.earned && (
              <div className="mt-3 h-[5px] w-full overflow-hidden rounded-full bg-[hsl(var(--sand-line))]">
                <div
                  className="spice-grad h-full rounded-full transition-[width] duration-700"
                  style={{ width: `${Math.max(2, m.progress * 100)}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
