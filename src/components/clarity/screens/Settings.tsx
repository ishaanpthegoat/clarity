// Clarity — Settings. Every row here changes something; nothing is display-only.
import { useState } from "react";
import { useClarity } from "@/lib/clarityStore";
import { SOUNDSCAPES } from "@/lib/soundscape";
import { formatDuration } from "@/lib/clarityStats";
import ClaritySwitch from "../ClaritySwitch";
import { ChevronLeft, Sun, MoonIcon, Trash } from "../icons";

const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];
const SESSION_PRESETS = [15, 25, 50, 90];
const GOAL_PRESETS = [60, 120, 180, 300];

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="min-w-0 flex-1">
        <div className="text-[15.5px] font-semibold">{label}</div>
        {hint && <div className="mt-0.5 text-[13px] leading-[1.35] text-muted-foreground">{hint}</div>}
      </div>
      <div className="flex-none">{children}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <div className="eyebrow eyebrow-muted mb-2.5 ml-1">{title}</div>
      <div className="sietch-card mb-6 divide-y divide-[hsl(var(--sand-line))] px-[18px]">{children}</div>
    </>
  );
}

export default function Settings() {
  const { state, actions } = useClarity();
  const [confirmReset, setConfirmReset] = useState(false);

  const chip = (active: boolean) =>
    `grid h-11 min-w-11 place-items-center rounded-[10px] px-3 text-[13px] font-semibold transition-colors ${
      active
        ? "bg-spice-400/16 text-spice-200 border border-spice-400/40"
        : "border border-sand-line text-muted-foreground hover:text-foreground"
    }`;

  return (
    <div className="anim-slideUp clarity-scroll absolute inset-0 flex flex-col overflow-y-auto bg-background px-[22px] pb-[118px] pt-[78px]">
      <div className="mb-6 flex items-center gap-3.5">
        <button
          onClick={() => actions.go("home")}
          className="grid h-11 w-11 place-items-center rounded-[13px] border border-sand-line raise text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Back to home"
        >
          <ChevronLeft size={18} />
        </button>
        <h1 className="font-display text-[32px] font-semibold uppercase tracking-[0.03em]">Settings</h1>
      </div>

      {/* Pro banner */}
      <button
        onClick={state.isPro ? undefined : actions.goPaywall}
        className={`sietch-card-warm mb-6 flex w-full items-center gap-3.5 p-4 text-left ${state.isPro ? "" : "card-lift"}`}
      >
        <span className="spice-grad grid h-11 w-11 flex-none place-items-center rounded-[13px] text-[20px] text-[hsl(var(--primary-foreground))]">
          ✦
        </span>
        <span className="flex-1">
          <span className="block text-[15.5px] font-bold">
            {state.isPro ? "Clarity Pro is active" : "Upgrade to Clarity Pro"}
          </span>
          <span className="block text-[13px] text-muted-foreground">
            {state.isPro ? "Thanks for backing your focus." : "Unlock everything · 7-day free trial"}
          </span>
        </span>
        {!state.isPro && <span className="text-spice-300">→</span>}
      </button>

      <Section title="You">
        <Row label="Your name" hint="Used on the home screen">
          <input
            value={state.name}
            onChange={(e) => actions.setName(e.target.value)}
            placeholder="Add your name"
            aria-label="Your name"
            name="name"
            autoComplete="given-name"
            spellCheck={false}
            maxLength={40}
            className="h-11 w-[130px] rounded-[10px] border border-sand-line raise px-3 text-right text-[14px] text-foreground outline-none placeholder:text-muted-foreground focus:border-spice-400/50"
          />
        </Row>
        <Row label="Appearance" hint={state.theme === "dark" ? "Night on the sand" : "Midday glare"}>
          <div className="flex gap-1.5">
            <button
              onClick={() => actions.setTheme("dark")}
              className={`grid h-11 w-11 place-items-center rounded-[10px] ${
                state.theme === "dark"
                  ? "bg-spice-400/16 text-spice-200 border border-spice-400/40"
                  : "border border-sand-line text-muted-foreground"
              }`}
              aria-label="Dark theme"
              aria-pressed={state.theme === "dark"}
            >
              <MoonIcon size={16} />
            </button>
            <button
              onClick={() => actions.setTheme("light")}
              className={`grid h-11 w-11 place-items-center rounded-[10px] ${
                state.theme === "light"
                  ? "bg-spice-400/16 text-spice-200 border border-spice-400/40"
                  : "border border-sand-line text-muted-foreground"
              }`}
              aria-label="Light theme"
              aria-pressed={state.theme === "light"}
            >
              <Sun size={16} />
            </button>
          </div>
        </Row>
      </Section>

      <Section title="Focus">
        <Row label="Session length" hint={`New sessions run ${state.sessionMinutes} minutes`}>
          <div className="flex gap-1.5">
            {SESSION_PRESETS.map((m) => (
              <button
                key={m}
                onClick={() => actions.setSessionMinutes(m)}
                className={chip(state.sessionMinutes === m)}
              >
                {m}
              </button>
            ))}
          </div>
        </Row>
        <Row label="Daily goal" hint={`${formatDuration(state.goalMinutes * 60)} of deep work`}>
          <div className="flex gap-1.5">
            {GOAL_PRESETS.map((m) => (
              <button key={m} onClick={() => actions.setGoalMinutes(m)} className={chip(state.goalMinutes === m)}>
                {m < 60 ? `${m}m` : `${m / 60}h`}
              </button>
            ))}
          </div>
        </Row>
        <Row
          label="Commit Mode by default"
          hint="No pause and no early exit, unless you confirm it"
        >
          <ClaritySwitch
            on={state.strictDefault}
            onClick={() => actions.setStrictDefault(!state.strictDefault)}
            aria-label="Commit Mode by default"
          />
        </Row>
        <Row label="Ambient sound" hint={SOUNDSCAPES.find((s) => s.id === state.soundscape)?.detail}>
          <select
            value={state.soundscape}
            onChange={(e) => actions.setSoundscape(e.target.value as typeof state.soundscape)}
            aria-label="Ambient sound"
            className="h-11 rounded-[10px] border border-sand-line raise px-3 text-[14px] text-foreground outline-none focus:border-spice-400/50"
          >
            {SOUNDSCAPES.map((s) => (
              <option key={s.id} value={s.id} className="bg-[hsl(var(--popover))]">
                {s.name}
              </option>
            ))}
          </select>
        </Row>
      </Section>

      <Section title="Locking">
        <Row label="App locking" hint={state.locking ? "Distractions are locked away" : "Apps are open"}>
          <ClaritySwitch on={state.locking} onClick={actions.toggleLock} aria-label="App locking" />
        </Row>
        <Row label="Focus window" hint="Locking turns itself on inside these hours">
          <ClaritySwitch
            on={state.schedule.enabled}
            onClick={() => actions.setSchedule({ enabled: !state.schedule.enabled })}
            aria-label="Focus window"
          />
        </Row>
        {state.schedule.enabled && (
          <div className="py-4">
            <div className="mb-3 flex items-center gap-2.5">
              <input
                type="time"
                value={state.schedule.start}
                onChange={(e) => actions.setSchedule({ start: e.target.value })}
                aria-label="Window starts"
                className="flex-1 rounded-[10px] border border-sand-line raise px-3 py-2 text-[14px] text-foreground outline-none focus:border-spice-400/50"
              />
              <span className="text-[13px] text-muted-foreground">to</span>
              <input
                type="time"
                value={state.schedule.end}
                onChange={(e) => actions.setSchedule({ end: e.target.value })}
                aria-label="Window ends"
                className="flex-1 rounded-[10px] border border-sand-line raise px-3 py-2 text-[14px] text-foreground outline-none focus:border-spice-400/50"
              />
            </div>
            <div className="flex justify-between gap-1.5">
              {DAY_LETTERS.map((letter, i) => {
                const on = state.schedule.days.includes(i);
                return (
                  <button
                    key={i}
                    onClick={() =>
                      actions.setSchedule({
                        days: on
                          ? state.schedule.days.filter((d) => d !== i)
                          : [...state.schedule.days, i],
                      })
                    }
                    aria-pressed={on}
                    aria-label={["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][i]}
                    className="h-9 flex-1 rounded-[10px] text-[13px] font-bold transition-colors"
                    style={{
                      background: on ? "hsl(var(--spice-400) / 0.16)" : "transparent",
                      border: `1px solid ${on ? "hsl(var(--spice-400) / 0.4)" : "hsl(var(--sand-line))"}`,
                      color: on ? "hsl(var(--spice-200))" : "hsl(var(--muted-foreground))",
                    }}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </Section>

      <Section title="Locked apps">
        {state.apps.map((app) => (
          <Row key={app.id} label={app.name}>
            <div className="flex items-center gap-3.5">
              <span
                className="grid h-[34px] w-[34px] place-items-center rounded-[10px] text-[17px]"
                style={{ background: app.color }}
              >
                {app.emoji}
              </span>
              <ClaritySwitch
                on={app.locked}
                onClick={() => actions.toggleAppLock(app.id)}
                aria-label={`Lock ${app.name}`}
              />
            </div>
          </Row>
        ))}
      </Section>

      <Section title="Your data">
        <Row label="Export history" hint="Every session and day, as JSON">
          <button
            onClick={actions.exportData}
            className="grid h-11 place-items-center rounded-[10px] border border-sand-line px-4 text-[13.5px] font-semibold text-foreground/85 transition-colors hover:text-foreground"
          >
            Export
          </button>
        </Row>
        <Row label="Reset everything" hint="Clears your history. This cannot be undone.">
          <button
            onClick={() => setConfirmReset(true)}
            className="flex h-11 items-center gap-1.5 rounded-[10px] border border-destructive/40 px-4 text-[13.5px] font-semibold text-destructive"
          >
            <Trash size={14} /> Reset
          </button>
        </Row>
      </Section>

      {confirmReset && (
        <div className="anim-fadeIn mb-6 rounded-[18px] border border-destructive/35 bg-destructive/[0.07] p-4 text-center">
          <div className="text-[15px] font-semibold">Delete your whole history?</div>
          <div className="mt-1.5 text-[13px] leading-[1.45] text-muted-foreground">
            {state.sessions.length} session{state.sessions.length === 1 ? "" : "s"} and every logged day. There is no undo.
          </div>
          <div className="mt-3.5 flex gap-2.5">
            <button
              onClick={() => setConfirmReset(false)}
              className="h-11 flex-1 rounded-[13px] border border-sand-line text-[14px] font-semibold"
            >
              Keep it
            </button>
            <button
              onClick={() => {
                actions.resetAllData();
                setConfirmReset(false);
              }}
              className="h-11 flex-1 rounded-[13px] bg-destructive/85 text-[14px] font-semibold text-white"
            >
              Delete it all
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
