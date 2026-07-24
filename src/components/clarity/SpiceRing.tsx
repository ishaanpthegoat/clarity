// Clarity — the spice ring.
//
// The app's one repeated form. The travelled arc is solid spice; the part still
// ahead of you is a dotted "sand" track rather than a flat grey stroke, so an
// unfinished ring reads as ground left to cross instead of a gauge that is low.
import type { ReactNode } from "react";

interface Props {
  /** 0–1 */
  progress: number;
  size?: number;
  stroke?: number;
  children?: ReactNode;
  /** slow radial bloom behind the ring */
  glow?: boolean;
  /** seconds; set 0 while scrubbing to avoid a lagging arc */
  transitionMs?: number;
  className?: string;
  gradientId?: string;
}

export default function SpiceRing({
  progress,
  size = 224,
  stroke = 13,
  children,
  glow = true,
  transitionMs = 900,
  className = "",
  gradientId = "spiceRing",
}: Props) {
  const clamped = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
  const r = (size - stroke) / 2 - 2;
  const circ = 2 * Math.PI * r;
  const c = size / 2;

  return (
    <div
      className={`relative grid place-items-center ${glow ? "heat-shimmer" : ""} ${className}`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="hsl(var(--spice-200))" />
            <stop offset="0.55" stopColor="hsl(var(--spice-400))" />
            <stop offset="1" stopColor="hsl(var(--spice-700))" />
          </linearGradient>
        </defs>

        {/* the ground still ahead */}
        <circle
          cx={c} cy={c} r={r} fill="none"
          stroke="hsl(var(--spice-400) / 0.18)"
          strokeWidth={Math.max(2, stroke - 8)}
          strokeLinecap="round"
          strokeDasharray="1 9"
        />
        {/* the ground covered */}
        <circle
          cx={c} cy={c} r={r} fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - clamped)}
          transform={`rotate(-90 ${c} ${c})`}
          style={{
            transition: transitionMs
              ? `stroke-dashoffset ${transitionMs}ms cubic-bezier(.2,.8,.2,1)`
              : undefined,
            filter: "drop-shadow(0 0 10px hsl(var(--spice-400) / 0.45))",
          }}
        />
      </svg>

      <div className="relative flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}
