// Clarity — the focus session.
// Commit Mode removes the exits on purpose; quitting is still possible, but it
// costs a confirmation and it goes into your history as what it was.
import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { useClarity, fmtTime } from "@/lib/clarityStore";
import { formatDuration } from "@/lib/clarityStats";
import { playSoundscape, SOUNDSCAPES, type SoundHandle } from "@/lib/soundscape";
import SpiceRing from "../SpiceRing";
import { Check, Lock, Sound, SoundOff } from "../icons";

export default function Focus() {
  const { state, actions } = useClarity();
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [muted, setMuted] = useState(false);
  const soundRef = useRef<SoundHandle | null>(null);

  const frac = state.focusTotal ? (state.focusTotal - state.focusLeft) / state.focusTotal : 0;
  const elapsed = state.focusTotal - state.focusLeft;

  // Ambient sound follows the session, and stops the moment it ends.
  useEffect(() => {
    if (state.soundscape === "none" || muted || state.focusDone) return;
    soundRef.current = playSoundscape(state.soundscape);
    return () => {
      soundRef.current?.stop();
      soundRef.current = null;
    };
  }, [state.soundscape, muted, state.focusDone]);

  useEffect(() => {
    if (!state.focusDone) return;
    soundRef.current?.stop();
    confetti({
      particleCount: 110,
      spread: 75,
      startVelocity: 42,
      gravity: 1.3,
      ticks: 160,
      scalar: 0.9,
      origin: { y: 0.42 },
      colors: ["#f0902b", "#f5c542", "#c2410c", "#fbdf8a"],
      disableForReducedMotion: true,
    });
  }, [state.focusDone]);

  const soundName = SOUNDSCAPES.find((s) => s.id === state.soundscape)?.name;

  return (
    <div
      className="anim-fadeIn absolute inset-0 flex flex-col px-[26px] pb-[60px] pt-[92px]"
      style={{ background: "radial-gradient(90% 60% at 50% 28%,hsl(24 45% 10%),hsl(var(--void)) 70%)" }}
    >
      <div className="text-center">
        <div className="flex items-center justify-center gap-2">
          <span className="eyebrow">{state.strict ? "Commit Mode" : "Focus session"}</span>
          {state.strict && <span className="text-spice-400"><Lock size={12} /></span>}
        </div>
        <div className="mt-2 text-[18px] font-semibold text-foreground/90">
          {state.task || "Focus"}
        </div>
      </div>

      {!state.focusDone ? (
        <div className="flex flex-1 flex-col items-center justify-center">
          <SpiceRing progress={frac} size={262} stroke={10} transitionMs={1000} gradientId="focusRing">
            <div className="readout text-[58px] font-bold tracking-[-0.035em]">{fmtTime(state.focusLeft)}</div>
            <div className="eyebrow eyebrow-muted mt-1">Remaining</div>
          </SpiceRing>

          {state.soundscape !== "none" && (
            <button
              onClick={() => setMuted((m) => !m)}
              className="mt-6 flex items-center gap-2 rounded-full border border-sand-line raise px-3.5 py-1.5 text-[12.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {muted ? <SoundOff size={14} /> : <Sound size={14} />}
              {muted ? "Sound off" : soundName}
            </button>
          )}

          <div className="mt-8 flex w-full gap-3">
            <button
              onClick={actions.toggleRun}
              disabled={state.strict}
              className="spice-grad h-[54px] flex-1 rounded-[16px] text-[16px] font-bold text-[hsl(var(--primary-foreground))] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {state.strict ? "Locked in" : state.running ? "Pause" : "Resume"}
            </button>
            <button
              onClick={() => setConfirmQuit(true)}
              className="grid h-[54px] w-[54px] place-items-center rounded-[16px] border border-sand-line raise text-muted-foreground transition-colors hover:text-foreground"
              aria-label="End session"
            >
              ✕
            </button>
          </div>

          {confirmQuit && (
            <div className="anim-fadeIn mt-5 w-full rounded-[18px] border border-destructive/30 bg-destructive/[0.07] p-4 text-center">
              <div className="text-[15px] font-semibold">
                End with {formatDuration(state.focusLeft)} left?
              </div>
              <div className="mt-1.5 text-[13px] leading-[1.45] text-muted-foreground">
                {state.strict
                  ? "You committed to this one. It goes down as unfinished."
                  : "This session gets logged as unfinished."}
              </div>
              <div className="mt-3.5 flex gap-2.5">
                <button
                  onClick={() => setConfirmQuit(false)}
                  className="h-11 flex-1 rounded-[13px] border border-sand-line raise text-[14px] font-semibold"
                >
                  Keep going
                </button>
                <button
                  onClick={actions.abandonFocus}
                  className="h-11 flex-1 rounded-[13px] bg-destructive/85 text-[14px] font-semibold text-white"
                >
                  End it
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="anim-popIn clarity-scroll flex flex-1 flex-col items-center overflow-y-auto pt-6 text-center">
          <div
            className="spice-grad mb-6 grid h-24 w-24 flex-none place-items-center rounded-full text-[hsl(var(--primary-foreground))]"
            style={{ boxShadow: "0 0 60px hsl(var(--spice-400) / 0.5)" }}
          >
            <Check size={44} />
          </div>
          <div className="font-display text-[34px] font-semibold uppercase tracking-[0.04em]">
            That was real focus
          </div>
          <div className="readout mt-2 text-[15px] text-spice-300">
            {formatDuration(elapsed)} on {state.task || "your work"}
          </div>

          <div className="mt-7 w-full text-left">
            <label htmlFor="session-note" className="eyebrow eyebrow-muted mb-2 block">
              What did you actually get done?
            </label>
            <textarea
              id="session-note"
              value={state.sessionNote}
              onChange={(e) => actions.setSessionNote(e.target.value)}
              rows={3}
              name="sessionNote"
              maxLength={280}
              placeholder="Optional — it goes into your history"
              className="w-full resize-none rounded-[16px] border border-sand-line raise px-4 py-3 text-[15px] leading-[1.45] text-foreground outline-none placeholder:text-muted-foreground focus:border-spice-400/50"
            />
          </div>

          <div className="mt-6 flex w-full flex-none flex-col gap-3 pb-4">
            <button
              onClick={actions.finishFocus}
              className="spice-grad h-[54px] w-full rounded-[16px] text-[16px] font-bold text-[hsl(var(--primary-foreground))]"
            >
              {state.earnBack ? `Unlock ${state.blockedApp?.name ?? "app"} for 5 min` : "Save and finish"}
            </button>
            <button
              onClick={() => {
                actions.finishFocus();
                actions.startFocus();
              }}
              className="h-[50px] w-full rounded-[16px] border border-sand-line text-[15px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              Go again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
