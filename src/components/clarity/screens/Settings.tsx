// Clarity — Settings. Locking toggle, per-app locks, focus goal + name.
import { useClarity } from "@/lib/clarityStore";
import ClaritySwitch from "../ClaritySwitch";
import { ChevronLeft } from "../icons";

export default function Settings() {
  const { state, actions } = useClarity();
  return (
    <div className="anim-slideUp absolute inset-0 flex flex-col overflow-y-auto bg-black px-[22px] pb-10 pt-[78px]">
      <div className="mb-[30px] flex items-center gap-3.5">
        <button
          onClick={() => actions.go("home")}
          className="grid h-10 w-10 place-items-center rounded-[13px] border border-white/[0.08] bg-white/[0.05] text-[#c9c9d4]"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-[30px] font-extrabold tracking-[-0.8px]">Settings</span>
      </div>

      {/* Pro banner */}
      <button
        onClick={state.isPro ? undefined : actions.goPaywall}
        className="mb-5 flex w-full items-center gap-3.5 rounded-[20px] p-4 text-left"
        style={{
          border: "1px solid rgba(139,107,255,.35)",
          background: state.isPro
            ? "linear-gradient(135deg,rgba(139,107,255,.14),rgba(139,107,255,.03))"
            : "linear-gradient(135deg,rgba(139,107,255,.2),rgba(139,107,255,.05))",
        }}
      >
        <span className="grid h-11 w-11 flex-none place-items-center rounded-[13px]" style={{ background: "linear-gradient(135deg,#9d7bff,#6a4bd6)" }}>
          <span className="text-[20px]">✦</span>
        </span>
        <span className="flex-1">
          <span className="block text-[16px] font-bold">{state.isPro ? "Clarity Pro is active" : "Upgrade to Clarity Pro"}</span>
          <span className="block text-[13px] text-[#b6b2c4]">{state.isPro ? "Thanks for backing your focus." : "Unlock everything · 7-day free trial"}</span>
        </span>
        {!state.isPro && <span className="text-[#a394ff]">→</span>}
      </button>

      <div className="mb-5 rounded-[20px] border border-[rgba(140,110,255,.12)] bg-[#0e0d13] px-[18px] py-1.5">
        <div className="flex items-center justify-between py-4">
          <div>
            <div className="text-[16px] font-semibold">App locking</div>
            <div className="mt-0.5 text-[13px] text-[#8a8a97]">{state.locking ? "Locking on" : "Locking off"}</div>
          </div>
          <ClaritySwitch on={state.locking} onClick={actions.toggleLock} aria-label="App locking" />
        </div>
      </div>

      <div className="mb-3 ml-1 text-[11px] font-bold tracking-[2px] text-[#55555f]">LOCKED APPS</div>
      <div className="mb-6 rounded-[20px] border border-[rgba(140,110,255,.12)] bg-[#0e0d13] px-[18px] py-1.5">
        {state.apps.map((app, i) => (
          <div
            key={app.id}
            className="flex items-center justify-between py-3.5"
            style={{ borderBottom: i < state.apps.length - 1 ? "1px solid rgba(255,255,255,.05)" : "none" }}
          >
            <div className="flex items-center gap-3.5">
              <span className="grid h-[38px] w-[38px] place-items-center rounded-[11px] text-[19px]" style={{ background: app.color }}>
                {app.emoji}
              </span>
              <span className="text-[16px] font-semibold">{app.name}</span>
            </div>
            <ClaritySwitch on={app.locked} onClick={() => actions.toggleAppLock(app.id)} aria-label={app.name} />
          </div>
        ))}
      </div>

      <div className="rounded-[20px] border border-[rgba(140,110,255,.12)] bg-[#0e0d13] px-[18px] py-1.5">
        <div className="flex items-center justify-between border-b border-white/[0.05] py-4">
          <span className="text-[16px] font-semibold">Focus goal</span>
          <span className="text-[15px] text-[#8a8a97]">3h deep work</span>
        </div>
        <div className="flex items-center justify-between py-4">
          <span className="text-[16px] font-semibold">Your name</span>
          <span className="text-[15px] text-[#8a8a97]">{state.name}</span>
        </div>
      </div>
    </div>
  );
}
