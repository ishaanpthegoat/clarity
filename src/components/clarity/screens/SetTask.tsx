// Clarity — set today's focus. One field, and the app will not pretend a blank one counts.
import { useClarity } from "@/lib/clarityStore";
import { TASK_SUGGESTIONS } from "@/lib/clarityData";
import { ChevronLeft } from "../icons";

export default function SetTask() {
  const { state, actions } = useClarity();
  const empty = !state.taskDraft.trim();

  return (
    <div className="anim-slideUp absolute inset-0 flex flex-col bg-background px-6 pb-10 pt-[calc(78px_+_var(--safe-t))]">
      <button
        onClick={() => actions.go("home")}
        className="mb-[26px] grid h-10 w-10 place-items-center rounded-[13px] border border-sand-line raise text-muted-foreground transition-colors hover:text-foreground"
        aria-label="Back to home"
      >
        <ChevronLeft size={18} />
      </button>

      <h1 className="font-display text-[38px] font-semibold uppercase leading-[1.02] tracking-[0.01em]">
        What is today
        <br />
        really about?
      </h1>
      <p className="mt-3 text-[15px] leading-[1.5] text-muted-foreground">
        Name one thing. Everything you lock away is protecting this.
      </p>

      <input
        value={state.taskDraft}
        onChange={(e) => actions.setTaskDraft(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && !empty && actions.saveTask()}
        placeholder="Your one focus"
        aria-label="Your one focus"
        name="focus"
        autoComplete="off"
        enterKeyHint="done"
        maxLength={120}
        className="mt-7 w-full rounded-[16px] border border-sand-line raise p-[18px] text-[17px] font-semibold text-foreground outline-none placeholder:text-muted-foreground focus:border-spice-400/50"
      />

      <div className="eyebrow eyebrow-muted mb-3 mt-[26px]">Suggestions</div>
      <div className="flex flex-wrap gap-2.5">
        {TASK_SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => actions.setTaskDraft(s)}
            className="rounded-full border border-spice-400/25 bg-spice-400/[0.08] px-[15px] py-[11px] text-[14px] font-medium text-spice-200 transition-colors hover:bg-spice-400/[0.16]"
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex-1" />
      <button
        onClick={actions.saveTask}
        disabled={empty}
        className="spice-grad h-14 w-full rounded-[18px] text-[17px] font-bold text-[hsl(var(--primary-foreground))] transition-opacity disabled:opacity-40"
      >
        Set my focus
      </button>
    </div>
  );
}
