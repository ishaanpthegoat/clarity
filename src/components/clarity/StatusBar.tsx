// Clarity — faux iOS status bar. The clock is real, because a frozen 9:41 is the
// first thing that makes a demo look like a demo.
import { useEffect, useState } from "react";
import { useClarity, type ClarityView } from "@/lib/clarityStore";
import { CellBars, Wifi } from "./icons";

/**
 * Screens that own the whole frame with imagery.
 *
 * They get no scrim: these have their own legibility gradients, and painting a
 * band of page colour across the top would slice the top off the footage.
 */
const FULL_BLEED: ClarityView[] = ["splash", "intro", "spring", "blocked", "focus"];

function clock(): string {
  return new Date()
    .toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    .replace(/\s?[AP]M/i, "");
}

export default function StatusBar() {
  const { state } = useClarity();
  const [time, setTime] = useState(clock);
  const scrim = !FULL_BLEED.includes(state.view);

  useEffect(() => {
    const id = window.setInterval(() => setTime(clock()), 15_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    // The outer box is the full unsafe-to-safe span; the inner row is the
    // original 56px bar, shifted down by the real inset instead of resized.
    // That keeps every existing measurement inside the row untouched — on a
    // device with no notch (var(--safe-t) resolves to 0) this is pixel-identical
    // to before.
    <div
      className="pointer-events-none absolute left-0 right-0 top-0 z-[70] text-foreground"
      style={{ height: "calc(56px + var(--safe-t))" }}
      aria-hidden="true"
    >
      {/* A scrolling screen would otherwise run its own text straight through
          the clock. Solid for the height of the bar, then a short fade so the
          edge of the mask never becomes a visible line. */}
      {scrim && (
        <div
          className="absolute inset-x-0 top-0"
          style={{
            height: "calc(84px + var(--safe-t))",
            background:
              "linear-gradient(to bottom, hsl(var(--background)) 0%, hsl(var(--background)) 62%, transparent 100%)",
          }}
        />
      )}
      <div
        className="relative flex h-14 items-center justify-between px-8"
        style={{ marginTop: "var(--safe-t)" }}
      >
        <span className="readout relative text-[16px] font-semibold tracking-[0.01em]">{time}</span>
        <span className="relative flex items-center gap-[7px] opacity-90">
          <CellBars />
          <Wifi />
          <span className="inline-flex items-center">
            <span className="relative inline-block h-3 w-[23px] rounded-[3.5px] border-[1.5px] border-current opacity-50">
              <span className="absolute inset-[1.5px] w-[65%] rounded-[1.5px] bg-current opacity-100" />
            </span>
            <span className="ml-px inline-block h-1 w-[1.6px] rounded-r-[2px] bg-current opacity-50" />
          </span>
        </span>
      </div>
    </div>
  );
}
