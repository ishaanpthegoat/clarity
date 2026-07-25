// Clarity — procedural profile pictures.
//
// Placeholder faces, but generated rather than stock: each person's hue seeds a
// two-stop gradient and a dune ridge, so the same author is always the same
// picture. Costs nothing, loads instantly, and never lands in the uncanny
// valley the way a generated face does.
interface Props {
  /** Two-letter monogram. */
  initials: string;
  /** 0-360. The one number that makes this person look like themselves. */
  hue: number;
  size?: number;
  /** Warm ring for authors you follow / ideas you've adopted. */
  ring?: boolean;
  className?: string;
}

export default function Avatar({ initials, hue, size = 44, ring = false, className = "" }: Props) {
  const id = `av${hue}`;
  return (
    <span
      className={`relative grid flex-none place-items-center overflow-hidden ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.32),
        boxShadow: ring
          ? `0 0 0 2px hsl(var(--sietch)), 0 0 0 3.5px hsl(var(--spice-400) / .75)`
          : "inset 0 0 0 1px hsl(0 0% 100% / 0.09)",
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        aria-hidden="true"
        style={{ position: "absolute", inset: 0 }}
      >
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={`hsl(${hue} 72% 62%)`} />
            <stop offset="100%" stopColor={`hsl(${(hue + 32) % 360} 68% 38%)`} />
          </linearGradient>
        </defs>
        <rect width="100" height="100" fill={`url(#${id})`} />
        {/* A dune ridge, phase-shifted by hue so no two read the same. */}
        <path
          d={`M0 ${64 + (hue % 14)} Q 25 ${48 + (hue % 20)} 50 ${62 + (hue % 12)} T 100 ${54 + (hue % 16)} V100 H0 Z`}
          fill="hsl(0 0% 0% / 0.17)"
        />
      </svg>
      <span
        className="font-display relative select-none font-semibold uppercase text-white"
        style={{
          fontSize: Math.round(size * 0.36),
          letterSpacing: "0.04em",
          textShadow: "0 1px 3px hsl(0 0% 0% / .38)",
        }}
      >
        {initials}
      </span>
    </span>
  );
}
