// Clarity — one correct, reusable toggle switch (used in Home header + Settings)
interface Props {
  on: boolean;
  onClick: () => void;
  size?: "sm" | "md";
  "aria-label"?: string;
}

const SIZES = {
  md: { w: 48, h: 28, knob: 22, pad: 3 },
  sm: { w: 44, h: 26, knob: 20, pad: 3 },
} as const;

export default function ClaritySwitch({ on, onClick, size = "md", ...rest }: Props) {
  const { w, h, knob, pad } = SIZES[size];
  const travel = w - knob - pad * 2;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onClick}
      className="relative flex-none rounded-full transition-colors duration-200"
      style={{
        width: w,
        height: h,
        background: on ? "#8b6bff" : "rgba(255,255,255,.14)",
        border: "1px solid " + (on ? "rgba(139,107,255,.65)" : "rgba(255,255,255,.16)"),
      }}
      {...rest}
    >
      <span
        className="absolute rounded-full bg-white shadow-[0_2px_5px_rgba(0,0,0,.4)] transition-transform duration-200"
        style={{
          width: knob,
          height: knob,
          top: (h - knob) / 2 - 1, // account for 1px border
          left: pad,
          transform: on ? `translateX(${travel}px)` : "translateX(0)",
        }}
      />
    </button>
  );
}
