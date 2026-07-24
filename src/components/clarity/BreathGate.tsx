// Clarity — the breath gate.
//
// The block screen's "Not now" used to be a single tap, which is exactly the
// speed at which a craving wins. This puts a paced 4-in / 6-out breath between
// the impulse and the exit. one sec's published data on the same mechanic
// (Max Planck) found ~57% fewer opens of the targeted app; the point is not to
// punish, it is to make the decision happen at a speed you can actually think at.
import { useEffect, useMemo, useRef, useState } from "react";

const INHALE_MS = 4000;
const EXHALE_MS = 6000;
const CYCLE_MS = INHALE_MS + EXHALE_MS;

const SIZE = 260;
const R = 112;
const CIRC = 2 * Math.PI * R;

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

interface Props {
  cycles?: number;
  /** the gate opened — the user did the work */
  onComplete: () => void;
  /** backed out of the breath itself, not out of the block */
  onCancel: () => void;
  /** what the gate opens onto, e.g. "Instagram" */
  target?: string;
}

export default function BreathGate({ cycles = 3, onComplete, onCancel, target }: Props) {
  const reduced = usePrefersReducedMotion();
  const [phase, setPhase] = useState<"in" | "out">("in");
  const [cycle, setCycle] = useState(1);
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);

  const totalMs = cycles * CYCLE_MS;
  const startRef = useRef(0);
  const doneRef = useRef(onComplete);
  doneRef.current = onComplete;

  // One rAF loop drives everything, so React re-renders track frames rather
  // than a pile of independent timers drifting apart.
  useEffect(() => {
    let raf = 0;
    startRef.current = performance.now();

    const tick = (now: number) => {
      const ms = now - startRef.current;
      setElapsed(ms);

      if (ms >= totalMs) {
        setDone(true);
        doneRef.current();
        return;
      }
      const within = ms % CYCLE_MS;
      setPhase(within < INHALE_MS ? "in" : "out");
      setCycle(Math.min(cycles, Math.floor(ms / CYCLE_MS) + 1));
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [cycles, totalMs]);

  const progress = Math.min(1, elapsed / totalMs);

  /** 0 at the bottom of the breath, 1 at the top. */
  const breath = useMemo(() => {
    const within = elapsed % CYCLE_MS;
    if (within < INHALE_MS) return within / INHALE_MS;
    return 1 - (within - INHALE_MS) / EXHALE_MS;
  }, [elapsed]);

  // Ease the scale so the turn at the top and bottom is soft, not a bounce.
  const eased = 0.5 - Math.cos(breath * Math.PI) / 2;
  const scale = reduced ? 1 : 0.6 + eased * 0.4;
  const secondsLeft = Math.max(0, Math.ceil((totalMs - elapsed) / 1000));

  return (
    <div className="flex flex-col items-center px-6">
      <div className="eyebrow">Before it opens</div>
      <p className="mt-3 max-w-[290px] text-center text-[15px] leading-[1.5] text-muted-foreground">
        Three breaths, then the choice is yours.
      </p>

      <div className="relative mt-9 grid place-items-center" style={{ width: SIZE, height: SIZE }}>
        {/* Ambient bloom that swells with the breath */}
        {!reduced && (
          <div
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{
              background: "radial-gradient(circle, hsl(var(--spice-400) / 0.26) 0%, transparent 66%)",
              transform: `scale(${0.75 + eased * 0.55})`,
              opacity: 0.45 + eased * 0.55,
            }}
          />
        )}

        {/* The breathing disc */}
        <div
          className="absolute rounded-full"
          style={{
            width: 186,
            height: 186,
            transform: `scale(${scale})`,
            background: "var(--spice-grad)",
            opacity: 0.2,
            boxShadow: "0 0 70px hsl(var(--spice-400) / 0.4)",
          }}
        />
        <div
          className="absolute rounded-full border-2"
          style={{
            width: 186,
            height: 186,
            transform: `scale(${scale})`,
            borderColor: "hsl(var(--spice-400) / 0.6)",
          }}
        />

        {/* Whole-exercise progress arc */}
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute -rotate-90">
          <defs>
            <linearGradient id="breathArc" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="hsl(var(--spice-200))" />
              <stop offset="1" stopColor="hsl(var(--spice-700))" />
            </linearGradient>
          </defs>
          <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="hsl(var(--sand-line))" strokeWidth="4" />
          <circle
            cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none"
            stroke="url(#breathArc)" strokeWidth="4" strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC * (1 - progress)}
          />
        </svg>

        <div className="relative flex flex-col items-center text-center">
          <div className="font-display text-[32px] font-semibold uppercase tracking-[0.03em] text-foreground">
            {done ? "Good" : phase === "in" ? "Breathe in" : "Breathe out"}
          </div>
          <div className="eyebrow eyebrow-muted mt-2.5">
            {done ? "Gate open" : `Cycle ${cycle} of ${cycles}`}
          </div>
        </div>
      </div>

      <div
        className="readout mt-8 text-[15px] font-semibold text-spice-300"
        aria-live="polite"
        aria-atomic="true"
      >
        {done ? "Done" : `${secondsLeft}s`}
      </div>
      {target && (
        <div className="mt-1.5 text-[13px] text-muted-foreground">Then {target} opens.</div>
      )}

      <button
        onClick={onCancel}
        className="mt-10 rounded-xl px-5 py-2.5 text-[14.5px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        Never mind — back to work
      </button>
    </div>
  );
}
