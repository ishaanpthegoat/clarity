// Clarity — a real app's icon.
//
// These are the actual brand marks, on the actual brand tiles. That matters:
// the whole block screen depends on you recognising, in a glance, exactly what
// you just reached for. A generic emoji lets you off the hook.
import type { AppIcon } from "@/lib/clarityData";
import { publicUrl } from "@/lib/asset";
import { Lock } from "./icons";

interface Props {
  app: Pick<AppIcon, "name" | "logo" | "tile" | "bleed" | "invert">;
  size?: number;
  /** Draw the lock badge on the corner. */
  locked?: boolean;
  /** Dim the tile — used when locking is switched off entirely. */
  muted?: boolean;
  className?: string;
}

export default function AppLogo({
  app,
  size = 60,
  locked = false,
  muted = false,
  className = "",
}: Props) {
  // The mark sits on ~62% of the tile, which is roughly how iOS lays out a
  // glyph inside a squircle. Bleed marks are already tiles, so they fill it.
  const pad = app.bleed ? 0 : Math.round(size * 0.19);
  const radius = Math.round(size * 0.245);

  return (
    <span
      className={`relative grid flex-none place-items-center overflow-hidden shadow-sietch-card transition-opacity ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: app.tile,
        opacity: muted ? 0.4 : 1,
        // A hairline keeps white tiles from bleeding into a light background.
        boxShadow: "inset 0 0 0 1px hsl(0 0% 0% / 0.12), 0 6px 16px -6px rgba(0,0,0,.7)",
      }}
    >
      <img
        src={publicUrl(app.logo)}
        alt=""
        width={size - pad * 2}
        height={size - pad * 2}
        loading="lazy"
        decoding="async"
        style={{
          width: size - pad * 2,
          height: size - pad * 2,
          objectFit: "contain",
          filter: app.invert ? "brightness(0) invert(1)" : undefined,
        }}
      />
      {locked && (
        <span
          className="absolute grid place-items-center rounded-full bg-spice-500 text-white"
          style={{
            height: Math.round(size * 0.36),
            width: Math.round(size * 0.36),
            right: -Math.round(size * 0.05),
            bottom: -Math.round(size * 0.05),
            border: `${Math.max(2, Math.round(size * 0.04))}px solid hsl(var(--sietch))`,
          }}
        >
          <Lock size={Math.round(size * 0.18)} />
        </span>
      )}
    </span>
  );
}
