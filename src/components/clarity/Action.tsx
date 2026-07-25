// Clarity — the button primitives.
//
// Two rules the whole app follows, and this file is how they get enforced:
//
//   1. No naked icons. Every control carries a word. Icon-only buttons test
//      the user's memory for no reason, and they are the first thing that
//      breaks for anyone who does not already know the app.
//   2. Every control also carries a tooltip, so the pointer and the keyboard
//      get the longer explanation the 9px caption cannot fit.
//
// Tap targets are 44px minimum. The visual chrome can be as small as the
// design wants; `Tip` and `IconAction` keep the hit area honest underneath.
import { forwardRef, type ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CSS_EASE_OUT, DUR } from "@/lib/motion";

type Side = "top" | "right" | "bottom" | "left";

/** Wraps any control in a tooltip. Use when the control already shows a label. */
export function Tip({
  children,
  label,
  side = "top",
}: {
  children: ReactNode;
  label: ReactNode;
  side?: Side;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side={side}
        sideOffset={6}
        className="max-w-[220px] rounded-[10px] border-sand-line bg-[hsl(var(--popover))] px-2.5 py-1.5 text-[12.5px] font-medium leading-[1.35] text-foreground/90 shadow-[0_10px_30px_-12px_rgba(0,0,0,.85)]"
      >
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

interface IconActionProps {
  icon: ReactNode;
  /** The visible word under the icon. Keep it to one. */
  label: string;
  /** The longer sentence, tooltip only. Falls back to `label`. */
  tooltip?: string;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  side?: Side;
  /** Hide the caption but keep the tooltip — for genuinely dense toolbars. */
  hideLabel?: boolean;
  className?: string;
}

/**
 * A small icon button with its caption underneath.
 *
 * The chrome around the glyph is deliberately small; the button itself is the
 * full 44px, so the caption sits inside the tap target rather than next to it.
 */
export const IconAction = forwardRef<HTMLButtonElement, IconActionProps>(function IconAction(
  { icon, label, tooltip, onClick, disabled, active, side = "bottom", hideLabel, className = "" },
  ref,
) {
  // The visible word has to survive into the accessible name — a voice user
  // saying "click Settings" must hit the button that says Settings, so the
  // longer tooltip is appended rather than substituted.
  const accessibleName = tooltip && tooltip !== label ? `${label} — ${tooltip}` : label;

  const button = (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={accessibleName}
      aria-pressed={active === undefined ? undefined : active}
      className={`group grid min-h-[44px] min-w-[44px] place-items-center gap-[3px] rounded-[12px] px-1 disabled:opacity-30 ${className}`}
      style={{ transition: `color ${DUR.fast}s ${CSS_EASE_OUT}` }}
    >
      <span
        className="grid h-8 w-8 place-items-center rounded-[10px] border border-sand-line raise transition-colors group-hover:border-spice-400/40 group-active:scale-95"
        style={{
          color: active ? "hsl(var(--spice-300))" : "hsl(var(--muted-foreground))",
          borderColor: active ? "hsl(var(--spice-400) / .45)" : undefined,
          background: active ? "hsl(var(--spice-400) / .12)" : undefined,
          transition: `transform ${DUR.instant}s ${CSS_EASE_OUT}, color ${DUR.fast}s ${CSS_EASE_OUT}, background-color ${DUR.fast}s ${CSS_EASE_OUT}, border-color ${DUR.fast}s ${CSS_EASE_OUT}`,
        }}
      >
        {icon}
      </span>
      {!hideLabel && (
        <span
          className="text-[8.5px] font-semibold uppercase leading-none tracking-[0.09em] transition-colors"
          style={{ color: active ? "hsl(var(--spice-300))" : "hsl(var(--muted-foreground))" }}
        >
          {label}
        </span>
      )}
    </button>
  );

  return (
    <Tip label={tooltip ?? label} side={side}>
      {button}
    </Tip>
  );
});

interface PrimaryActionProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  /** The tooltip sentence. Primary buttons already say what they do. */
  tooltip?: string;
  /** Swaps the label for a spinner and blocks repeat taps. */
  busy?: boolean;
  variant?: "spice" | "quiet" | "danger";
  className?: string;
  style?: React.CSSProperties;
  type?: "button" | "submit";
}

/** The full-width button at the bottom of a screen. */
export function PrimaryAction({
  children,
  onClick,
  disabled,
  tooltip,
  busy,
  variant = "spice",
  className = "",
  style,
  type = "button",
}: PrimaryActionProps) {
  const base =
    "relative grid h-[56px] w-full place-items-center overflow-hidden rounded-[18px] text-[16.5px] font-bold disabled:cursor-default";
  const skin =
    variant === "spice"
      ? "spice-grad text-[hsl(var(--primary-foreground))] shadow-spice-glow disabled:opacity-40 disabled:shadow-none"
      : variant === "danger"
        ? "bg-destructive/85 text-white disabled:opacity-40"
        : "border border-sand-line raise text-foreground/85 hover:text-foreground disabled:opacity-40";

  const button = (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      className={`${base} ${skin} ${className}`}
      style={{
        transition: `transform ${DUR.instant}s ${CSS_EASE_OUT}, opacity ${DUR.fast}s ${CSS_EASE_OUT}`,
        ...style,
      }}
      onPointerDown={(e) => {
        e.currentTarget.style.transform = "scale(0.985)";
      }}
      onPointerUp={(e) => {
        e.currentTarget.style.transform = "";
      }}
      onPointerLeave={(e) => {
        e.currentTarget.style.transform = "";
      }}
    >
      {busy ? (
        <span className="flex items-center gap-2.5">
          <span className="anim-spin h-4 w-4 rounded-full border-2 border-current/25 border-t-current" />
          <span className="text-[15px]">Working…</span>
        </span>
      ) : (
        children
      )}
    </button>
  );

  return tooltip ? <Tip label={tooltip}>{button}</Tip> : button;
}

/** A pill in a row of choices. Always carries its own word. */
export function ChipAction({
  children,
  onClick,
  active,
  tooltip,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  active?: boolean;
  tooltip?: string;
  className?: string;
}) {
  const chip = (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`grid h-11 min-w-11 place-items-center rounded-[12px] px-3.5 text-[13px] font-semibold ${
        active
          ? "border border-spice-400/45 bg-spice-400/[0.14] text-spice-200"
          : "border border-sand-line raise text-muted-foreground hover:text-foreground"
      } ${className}`}
      style={{
        transition: `background-color ${DUR.fast}s ${CSS_EASE_OUT}, color ${DUR.fast}s ${CSS_EASE_OUT}, border-color ${DUR.fast}s ${CSS_EASE_OUT}`,
      }}
    >
      {children}
    </button>
  );
  return tooltip ? <Tip label={tooltip}>{chip}</Tip> : chip;
}
