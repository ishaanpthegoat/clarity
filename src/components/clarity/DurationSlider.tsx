// Clarity — the duration control.
//
// Replaces the four preset chips that used to cap a session at 90 minutes.
// Dragging is the right gesture here: picking a session length is a *feel*
// decision, not a menu choice, and the readout above the track means you never
// have to guess what the handle is pointing at.
//
// A detent tick fires haptics as you cross each step, which is what makes a
// slider feel physical rather than like a value being scrubbed.
import { useCallback, useRef } from "react";
import { Slider } from "@/components/ui/slider";
import { ChipAction, Tip } from "./Action";
import { haptic } from "@/lib/feedback";

interface Props {
  value: number;
  onChange: (minutes: number) => void;
  min: number;
  max: number;
  step: number;
  /** Labelled marks under the track. */
  ticks?: number[];
  /** One-tap common values. */
  presets?: number[];
  label: string;
  hint?: string;
  id: string;
}

/** 25 → "25m", 90 → "1h 30m", 420 → "7h" */
export function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export default function DurationSlider({
  value,
  onChange,
  min,
  max,
  step,
  ticks = [],
  presets = [],
  label,
  hint,
  id,
}: Props) {
  // Only buzz when the value actually lands on a new detent — a buzz per
  // pointer-move event is a vibrating phone, not feedback.
  const lastRef = useRef(value);
  const handle = useCallback(
    (next: number[]) => {
      const v = next[0];
      if (v !== lastRef.current) {
        lastRef.current = v;
        haptic(6);
        onChange(v);
      }
    },
    [onChange],
  );

  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="py-4">
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="text-[15.5px] font-semibold">
          {label}
        </label>
        <output
          htmlFor={id}
          className="readout text-[26px] font-bold leading-none tracking-[-0.01em] text-spice-200"
        >
          {formatMinutes(value)}
        </output>
      </div>
      {hint && <div className="mt-1 text-[13px] leading-[1.35] text-muted-foreground">{hint}</div>}

      <div className="relative mt-3.5">
        <Slider
          id={id}
          value={[value]}
          min={min}
          max={max}
          step={step}
          onValueChange={handle}
          aria-label={label}
          aria-valuetext={formatMinutes(value)}
        />
        {/* Tick marks sit under the track and are decorative — the labels below
            them carry the meaning, and the slider announces its own value. */}
        {ticks.length > 0 && (
          <div className="pointer-events-none relative mt-1 h-[18px]" aria-hidden="true">
            {ticks.map((t) => {
              const left = ((t - min) / (max - min)) * 100;
              const passed = value >= t;
              return (
                <span
                  key={t}
                  className="absolute top-0 -translate-x-1/2 text-[10px] font-semibold tabular tracking-[0.02em] transition-colors"
                  style={{
                    left: `${left}%`,
                    color: passed ? "hsl(var(--spice-300) / .9)" : "hsl(var(--muted-foreground) / .7)",
                  }}
                >
                  {formatMinutes(t)}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {presets.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {presets.map((p) => (
            <ChipAction
              key={p}
              active={value === p}
              onClick={() => {
                lastRef.current = p;
                haptic(10);
                onChange(p);
              }}
              tooltip={`Set ${label.toLowerCase()} to ${formatMinutes(p)}`}
              // No height override — ChipAction's 44px is the floor the
              // touch-target test enforces, and these are thumb targets.
              className="px-3 text-[12.5px]"
            >
              {formatMinutes(p)}
            </ChipAction>
          ))}
          <Tip label={`Currently ${formatMinutes(value)} — ${Math.round(pct)}% of the way to ${formatMinutes(max)}`}>
            <span className="grid h-9 place-items-center px-1 text-[11px] font-medium text-muted-foreground">
              max {formatMinutes(max)}
            </span>
          </Tip>
        </div>
      )}
    </div>
  );
}
