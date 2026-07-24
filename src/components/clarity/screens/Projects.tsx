// Clarity — Projects. Pick-3 selector, trending chips, community focus cards.
import { useClarity } from "@/lib/clarityStore";
import { COMMUNITY, TRENDING } from "@/lib/clarityData";

export default function Projects() {
  const { state, actions } = useClarity();
  const sel = state.selProj;
  const projCount = sel.length;
  const enabled = projCount === 3;

  return (
    <div className="anim-fadeIn absolute inset-0 flex flex-col bg-background">
      <div className="clarity-scroll flex-1 overflow-y-auto px-[22px] pb-[118px] pt-[78px]">
        <div className="text-[29px] font-extrabold leading-[1.15] tracking-[-0.8px]">Projects</div>
        <div className="mt-2.5 text-[15px] leading-[1.5] text-[hsl(var(--muted-foreground))]">
          Pick 3 to protect this week. Small enough to finish, big enough to matter.
        </div>

        <div className="mx-0.5 mb-3 mt-[22px] flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-[2px] text-[hsl(var(--muted-foreground))]">YOUR 3 FOR THIS WEEK</span>
          <span className="text-[13px] font-bold text-[hsl(var(--spice-200))]">{projCount}/3</span>
        </div>

        <div className="flex flex-col gap-2.5">
          {state.projects.map((p) => {
            const on = sel.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => actions.toggleProject(p.id)}
                className="flex w-full items-center gap-3 rounded-[16px] p-4 text-left transition-[background-color,border-color] duration-200"
                style={{
                  border: "1px solid " + (on ? "hsl(var(--spice-400) / .6)" : "hsl(var(--sand-line))"),
                  background: on ? "hsl(var(--spice-400) / .12)" : "hsl(var(--sietch))",
                }}
              >
                <span className="flex-1">
                  <span className="block text-[16px] font-bold">{p.title}</span>
                  <span className="mt-[3px] block text-[13px] text-[hsl(var(--muted-foreground))]">{p.desc}</span>
                </span>
                <span
                  className="grid h-[26px] w-[26px] flex-none place-items-center rounded-full text-[14px] font-bold text-white"
                  style={{
                    border: "2px solid " + (on ? "hsl(var(--spice-400))" : "rgba(255,255,255,.22)"),
                    background: on ? "hsl(var(--spice-500))" : "transparent",
                  }}
                >
                  {on ? "✓" : ""}
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={actions.confirmProjects}
          className="mt-3.5 h-14 w-full rounded-[18px] text-[17px] font-bold transition-[background-color,color] duration-200"
          style={{
            background: enabled ? "var(--spice-grad)" : "rgba(255,255,255,.06)",
            color: enabled ? "#fff" : "hsl(var(--muted-foreground))",
            cursor: enabled ? "pointer" : "default",
          }}
        >
          {enabled ? "Lock in my week" : `Pick ${3 - projCount} more`}
        </button>

        <div className="my-[30px] h-px raise" />

        <div className="mb-[11px] text-[11px] font-bold tracking-[2px] text-[hsl(var(--muted-foreground))]">NEED IDEAS? TRENDING NOW</div>
        <div className="mb-[26px] flex flex-wrap gap-2">
          {TRENDING.map((t) => (
            <button
              key={t}
              onClick={() => {/* inspiration only */}}
              className="rounded-full border border-[hsl(var(--spice-400) / .22)] bg-[hsl(var(--spice-400) / .08)] px-3.5 py-2.5 text-[13.5px] font-medium text-[hsl(var(--spice-200))]"
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mb-3 text-[11px] font-bold tracking-[2px] text-[hsl(var(--muted-foreground))]">WHAT OTHERS ARE FOCUSED ON</div>
        <div className="flex flex-col gap-3">
          {COMMUNITY.map((c) => (
            <div key={c.id} className="rounded-[20px] border border-[hsl(var(--sand-line))] bg-[hsl(var(--sietch))] p-[18px]">
              <div className="flex items-center gap-3">
                <span
                  className="grid h-[44px] w-[44px] flex-none place-items-center rounded-[14px] text-[18px] font-extrabold text-white"
                  style={{ background: c.color }}
                >
                  {c.name[0]}
                </span>
                <span className="flex-1">
                  <span className="block text-[16px] font-bold">{c.name}</span>
                  <span className="mt-px block text-[13px] text-[hsl(var(--muted-foreground))]">{c.focus}</span>
                </span>
                <span className="whitespace-nowrap text-[13px] font-semibold text-[hsl(var(--spice-400))]">♥ {c.cheers}</span>
              </div>
              <div className="mt-3.5 flex flex-wrap gap-[7px]">
                {c.projects.map((t) => (
                  <span key={t} className="rounded-full border border-sand-line raise px-[11px] py-[7px] text-[12.5px] font-medium text-[hsl(var(--muted-foreground))]">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
