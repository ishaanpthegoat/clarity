// Clarity — Springboard. A faux home screen; locked apps carry a lock overlay.
//
// The apps you actually lock are drawn with their real marks, and the filler
// around them stays as emoji tiles. That contrast is the whole point of the
// screen: the things Clarity governs should look exactly as recognisable here
// as they do on your real home screen.
import { useClarity } from "@/lib/clarityStore";
import { formatDuration } from "@/lib/clarityStats";
import { Lock, ChevronRight } from "../icons";
import type { AppIcon } from "@/lib/clarityData";
import { publicUrl } from "@/lib/asset";
import AppLogo from "../AppLogo";
import { Tip } from "../Action";

const decoyTile = (color: string) =>
  ({
    position: "relative",
    width: "100%",
    aspectRatio: "1",
    maxWidth: "60px",
    borderRadius: "15px",
    display: "grid",
    placeItems: "center",
    fontSize: "29px",
    background: color,
    boxShadow: "0 7px 18px -7px rgba(0,0,0,.7)",
  }) as React.CSSProperties;

const dockTile = (color: string) =>
  ({
    width: "56px",
    height: "56px",
    borderRadius: "15px",
    display: "grid",
    placeItems: "center",
    fontSize: "27px",
    background: color,
    boxShadow: "0 7px 18px -7px rgba(0,0,0,.7)",
  }) as React.CSSProperties;

type Cell =
  | { kind: "decoy"; name: string; emoji: string; color: string }
  | { kind: "app"; name: string; app: AppIcon; locked: boolean };

export default function Springboard() {
  const { state, actions, derived } = useClarity();
  const lockedCount = state.apps.filter((a) => a.locked && state.locking).length;

  const now = new Date();
  const time = now
    .toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    .replace(/\s?[AP]M/i, "");
  const date = now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  const decoy = (name: string, emoji: string, color: string): Cell =>
    ({ kind: "decoy", name, emoji, color });

  const springApps: Cell[] = [
    decoy("Messages", "💬", "linear-gradient(135deg,#5ffc7b,#0fbb4d)"),
    decoy("Camera", "📷", "linear-gradient(135deg,#4a4a52,#26262c)"),
    decoy("Photos", "🌄", "linear-gradient(135deg,#fff,#e8e8ee)"),
    decoy("Maps", "🗺️", "linear-gradient(135deg,#a7e3a0,#5fb0e8)"),
    // Every app the user actually watches, in the order they added them.
    ...state.apps.map(
      (a): Cell => ({ kind: "app", name: a.name, app: a, locked: state.locking && a.locked }),
    ),
    decoy("Clock", "⏰", "#0b0b0f"),
    decoy("Calendar", "📅", "linear-gradient(135deg,#fff,#ececef)"),
    decoy("Notes", "📝", "linear-gradient(135deg,#fff2b0,#ffd84d)"),
    decoy("Weather", "⛅", "linear-gradient(135deg,#4a9bff,#1f5fd0)"),
  ];

  const dockApps = [
    { name: "Phone", emoji: "📞", color: "linear-gradient(135deg,#5ffc7b,#0fbb4d)" },
    { name: "Safari", emoji: "🧭", color: "linear-gradient(135deg,#5ac8fa,#0a84ff)" },
    { name: "Mail", emoji: "✉️", color: "linear-gradient(135deg,#4a9bff,#1f5fd0)" },
    { name: "Music", emoji: "🎧", color: "linear-gradient(135deg,#fb5c74,#fa2d48)" },
  ];

  return (
    <div
      className="anim-fadeIn absolute inset-0 overflow-hidden"
      style={{
        background:
          "radial-gradient(130% 90% at 50% 0%,hsl(26 48% 16%) 0%,hsl(24 40% 8%) 42%,hsl(var(--void)) 100%)",
      }}
    >
      <div className="clarity-scroll absolute bottom-0 left-0 right-0 top-[66px] flex flex-col overflow-y-auto px-6 pt-2">
        <div className="mb-[18px] flex items-center justify-center">
          <span className="readout text-[66px] font-extralight leading-none tracking-[-0.04em] text-white/95">
            {time}
          </span>
        </div>
        <div className="mb-[26px] text-center text-[13px] font-medium text-white/60">{date}</div>

        {/* Clarity status pill */}
        <Tip label="Open Clarity" side="bottom">
          <button
            onClick={() => actions.go("home")}
            aria-label="Open Clarity"
            className="mb-[26px] flex w-full items-center gap-3 rounded-[20px] px-4 py-3.5 text-left"
            style={{
              background: "hsl(28 30% 10% / .7)",
              border: "1px solid hsl(var(--spice-400) / .3)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
            }}
          >
            <img
              src={publicUrl("/clarity/icon.png")}
              alt=""
              width={40}
              height={40}
              loading="lazy"
              className="h-10 w-10 flex-none rounded-xl"
            />
            <span className="flex-1">
              <span className="block text-[14px] font-bold text-white">
                {state.locking ? "Clarity is on" : "Clarity is off"}
              </span>
              <span className="mt-px block text-[12.5px] text-spice-100/80">
                {state.locking
                  ? `${lockedCount} app${lockedCount === 1 ? "" : "s"} locked · ${formatDuration(derived.today.focusedSeconds)} focused today`
                  : "Tap to open Clarity"}
              </span>
            </span>
            <span className="text-spice-300/70">
              <ChevronRight size={18} />
            </span>
          </button>
        </Tip>

        <div className="grid grid-cols-4 gap-x-4 gap-y-5">
          {springApps.map((c, i) => (
            <Tip
              key={`${c.name}-${i}`}
              label={
                c.kind === "app"
                  ? c.locked
                    ? `${c.name} is locked — tap to see why`
                    : `${c.name} is open`
                  : c.name
              }
            >
              <button
                onClick={() => c.kind === "app" && actions.openApp(c.app)}
                className="flex flex-col items-center gap-[7px]"
                aria-label={c.kind === "app" && c.locked ? `${c.name} — locked` : c.name}
              >
                {c.kind === "app" ? (
                  <span className="relative grid w-full max-w-[60px] place-items-center">
                    <AppLogo app={c.app} size={60} />
                    {c.locked && (
                      <span
                        className="absolute inset-0 grid place-items-center rounded-[15px] text-white"
                        style={{ background: "hsl(20 30% 4% / .58)" }}
                      >
                        <Lock size={18} />
                      </span>
                    )}
                  </span>
                ) : (
                  <span style={decoyTile(c.color)}>{c.emoji}</span>
                )}
                <span className="text-[11px] text-white/80">{c.name}</span>
              </button>
            </Tip>
          ))}
        </div>

        <div className="flex-1" />

        <div
          className="mb-6 mt-6 flex justify-around rounded-[28px] px-4 py-3"
          style={{
            background: "hsl(40 20% 90% / .09)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          {dockApps.map((a) => (
            <Tip key={a.name} label={a.name}>
              <button aria-label={a.name} className="grid min-h-[56px] min-w-[56px] place-items-center">
                <span style={dockTile(a.color)}>{a.emoji}</span>
              </button>
            </Tip>
          ))}
        </div>
      </div>
    </div>
  );
}
