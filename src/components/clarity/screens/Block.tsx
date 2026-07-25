// Clarity — the block screen.
// Two ways out, and neither of them is fast. Starting a session is the way
// forward; opening the app anyway costs a breath first.
import { useState } from "react";
import { useClarity } from "@/lib/clarityStore";
import { BLOCK_LINES, SEED_APPS } from "@/lib/clarityData";
import BreathGate from "../BreathGate";
import AppLogo from "../AppLogo";
import { Clock } from "../icons";

export default function Block() {
  const { state, actions, derived } = useClarity();
  const [gate, setGate] = useState(false);
  const [opened, setOpened] = useState(false);

  // The real mark, at the size of a real app icon — recognising exactly what
  // you reached for is the entire mechanism of this screen.
  const ba = state.blockedApp ?? SEED_APPS[0];

  // A different line each time, so the screen never becomes wallpaper.
  const line = BLOCK_LINES[derived.today.pulls % BLOCK_LINES.length];

  if (gate) {
    return (
      <div
        className="anim-fadeIn absolute inset-0 flex flex-col items-center justify-center px-[26px]"
        style={{ background: "radial-gradient(100% 70% at 50% 20%,hsl(22 50% 11%),hsl(var(--void)) 65%)" }}
      >
        {!opened ? (
          <BreathGate
            cycles={3}
            target={ba.name}
            onComplete={() => setOpened(true)}
            onCancel={actions.blockHold}
          />
        ) : (
          <div className="anim-popIn flex flex-col items-center text-center">
            <div className="font-display text-[30px] font-semibold uppercase tracking-[0.04em]">
              Still want it?
            </div>
            <div className="mt-3 max-w-[280px] text-[15px] leading-[1.5] text-muted-foreground">
              You have the gate open. It is a real choice now, which is all this screen was ever for.
            </div>
            <div className="mt-8 flex w-full max-w-[300px] flex-col gap-3">
              <button
                onClick={actions.blockHold}
                className="spice-grad h-14 w-full rounded-[18px] text-[16px] font-bold text-[hsl(var(--primary-foreground))]"
              >
                No — back to work
              </button>
              <button
                onClick={actions.blockDismissAnyway}
                className="h-[50px] w-full rounded-[16px] text-[15px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                Open {ba.name} for 5 minutes
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="anim-slideUp clarity-scroll absolute inset-0 flex flex-col overflow-y-auto px-[26px] pb-10 pt-[calc(82px_+_var(--safe-t))]"
      style={{ background: "radial-gradient(100% 70% at 50% 20%,hsl(22 50% 11%),hsl(var(--void)) 65%)" }}
    >
      <div className="flex flex-col items-center">
        <AppLogo app={ba} size={78} locked />
        <h1 className="font-display mt-[22px] text-center text-[30px] font-semibold uppercase tracking-[0.03em]">
          {ba.name} is locked
        </h1>
        <div className="font-epigraph mt-3.5 max-w-[300px] text-center text-[19px] leading-[1.45] text-spice-100">
          {line}
        </div>
      </div>

      <div className="sietch-card mt-[30px] p-5">
        <div className="eyebrow mb-2.5">Finish this first</div>
        <div className="text-[20px] font-bold leading-[1.3] tracking-[-0.01em]">
          {state.task || "You haven't named today's focus yet."}
        </div>
        <div className="mt-3.5 flex items-center gap-2 border-t border-sand-line pt-3.5">
          <span className="text-spice-400"><Clock size={15} /></span>
          <span className="text-[13.5px] text-muted-foreground">
            Focus 15 minutes to unlock 5 minutes of access
          </span>
        </div>
      </div>

      {derived.today.pulls > 1 && (
        <div className="mt-3.5 rounded-[16px] border border-sand-line raise px-4 py-3 text-[13px] leading-[1.45] text-muted-foreground">
          That&rsquo;s <span className="font-semibold text-foreground">{derived.today.pulls}</span> pulls today.
          You&rsquo;ve held <span className="font-semibold text-spice-300">{derived.today.holds}</span> of them.
        </div>
      )}

      <div className="flex-1" />
      <div className="mt-[26px] flex flex-col gap-3">
        <button
          onClick={() => actions.startFocus({ minutes: 15, earnBack: true })}
          className="spice-grad shadow-spice-glow-lg h-14 w-full rounded-[18px] text-[17px] font-bold text-[hsl(var(--primary-foreground))]"
        >
          Start a focus session
        </button>
        <button
          onClick={actions.blockHold}
          className="h-[50px] w-full rounded-[16px] border border-sand-line text-[15px] font-semibold text-foreground/80 transition-colors hover:text-foreground"
        >
          Not now — back to work
        </button>
        <button
          onClick={() => setGate(true)}
          className="h-[42px] w-full text-[13.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Open it anyway
        </button>
      </div>
    </div>
  );
}
