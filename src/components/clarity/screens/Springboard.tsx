// Clarity — Springboard. A faux iOS home screen; locked apps show a lock overlay.
import { useClarity } from "@/lib/clarityStore";
import { Lock, ChevronRight } from "../icons";
import type { AppIcon } from "@/lib/clarityData";

const tile = (color: string) =>
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

export default function Springboard() {
  const { state, actions } = useClarity();
  const byId = (id: string) => state.apps.find((a) => a.id === id)!;
  const lockedCount = state.apps.filter((a) => a.locked && state.locking).length;

  type Cell = { name: string; emoji: string; color: string; locked: boolean; app?: AppIcon };
  const decoy = (name: string, emoji: string, color: string): Cell => ({ name, emoji, color, locked: false });
  const lockedCell = (id: string): Cell => {
    const a = byId(id);
    return { name: a.name, emoji: a.emoji, color: a.color, locked: state.locking && a.locked, app: a };
  };

  const springApps: Cell[] = [
    decoy("Messages", "💬", "linear-gradient(135deg,#5ffc7b,#0fbb4d)"),
    decoy("Camera", "📷", "linear-gradient(135deg,#4a4a52,#26262c)"),
    decoy("Photos", "🌄", "linear-gradient(135deg,#fff,#e8e8ee)"),
    decoy("Maps", "🗺️", "linear-gradient(135deg,#a7e3a0,#5fb0e8)"),
    lockedCell("ig"), lockedCell("tt"), lockedCell("yt"), lockedCell("sc"),
    decoy("Clock", "⏰", "#0b0b0f"),
    decoy("Calendar", "📅", "linear-gradient(135deg,#fff,#ececef)"),
    decoy("Notes", "📝", "linear-gradient(135deg,#fff2b0,#ffd84d)"),
    decoy("Weather", "⛅", "linear-gradient(135deg,#4a9bff,#1f5fd0)"),
  ];
  const dockApps = [
    { emoji: "📞", color: "linear-gradient(135deg,#5ffc7b,#0fbb4d)" },
    { emoji: "🧭", color: "linear-gradient(135deg,#5ac8fa,#0a84ff)" },
    { emoji: "✉️", color: "linear-gradient(135deg,#4a9bff,#1f5fd0)" },
    { emoji: "🎧", color: "linear-gradient(135deg,#fb5c74,#fa2d48)" },
  ];

  return (
    <div className="anim-fadeIn absolute inset-0 overflow-hidden" style={{ background: "radial-gradient(130% 90% at 50% 0%,#241a3f 0%,#120e22 42%,#08060f 100%)" }}>
      <div className="absolute bottom-0 left-0 right-0 top-[66px] flex flex-col px-6 pt-2">
        <div className="mb-[22px] flex items-center justify-center">
          <span className="text-[66px] font-extralight leading-none tracking-[-2px]" style={{ color: "rgba(255,255,255,.94)" }}>9:41</span>
        </div>
        <div className="mb-[30px] flex items-center justify-center gap-[7px] text-[13px] font-medium" style={{ color: "rgba(255,255,255,.6)" }}>
          <span>Wednesday, July 22</span>
        </div>

        {/* Clarity status pill */}
        <button
          onClick={() => actions.go("home")}
          className="mb-[26px] flex w-full items-center gap-3 rounded-[20px] px-4 py-3.5 text-left"
          style={{ background: "rgba(20,16,34,.66)", border: "1px solid rgba(139,107,255,.28)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)" }}
        >
          <img src="/clarity/icon.png" alt="Clarity" className="h-10 w-10 flex-none rounded-xl" />
          <span className="flex-1">
            <span className="block text-[14px] font-bold text-white">{state.locking ? "Clarity is on" : "Clarity is off"}</span>
            <span className="mt-px block text-[12.5px] text-[#b9aee0]">
              {state.locking ? `${lockedCount} apps locked until your focus is done` : "Tap to open Clarity"}
            </span>
          </span>
          <span className="text-[#8a7fb5]"><ChevronRight size={18} /></span>
        </button>

        {/* app grid */}
        <div className="grid grid-cols-4 gap-x-4 gap-y-5">
          {springApps.map((c, i) => (
            <button
              key={i}
              onClick={() => c.app && actions.openApp(c.app)}
              className="flex flex-col items-center gap-[7px]"
            >
              <span style={tile(c.color)}>
                {c.emoji}
                {c.locked && (
                  <span className="absolute inset-0 grid place-items-center rounded-[15px]" style={{ background: "rgba(6,5,12,.52)" }}>
                    <Lock size={18} />
                  </span>
                )}
              </span>
              <span className="text-[11px] font-normal tracking-[0.1px]" style={{ color: "rgba(255,255,255,.82)" }}>{c.name}</span>
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* dock */}
        <div className="mb-6 flex justify-around rounded-[28px] px-4 py-3" style={{ background: "rgba(255,255,255,.08)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
          {dockApps.map((a, i) => (
            <button key={i}>
              <span style={dockTile(a.color)}>{a.emoji}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
