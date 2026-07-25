// Clarity — Settings. Every row here changes something; nothing is display-only.
import { useState } from "react";
import { useClarity, GOAL_BOUNDS, SESSION_BOUNDS } from "@/lib/clarityStore";
import { SOUNDSCAPES } from "@/lib/soundscape";
import { APP_CATALOG } from "@/lib/clarityData";
import ClaritySwitch from "../ClaritySwitch";
import AppLogo from "../AppLogo";
import DurationSlider from "../DurationSlider";
import { IconAction, Tip } from "../Action";
import { ChevronLeft, Sun, MoonIcon, Trash, Plus, X } from "../icons";

const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];
/** Marks under the session track. Deliberately sparse — the readout is exact. */
const SESSION_TICKS = [5, 60, 180, 300, 420];
const SESSION_PRESETS = [15, 25, 50, 90, 180];
const GOAL_TICKS = [10, 180, 360, 540, 720];
const GOAL_PRESETS = [60, 120, 180, 300, 480];

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

  return (
    <div className="anim-slideUp clarity-scroll absolute inset-0 flex flex-col overflow-y-auto bg-background px-[22px] pb-[118px] pt-[calc(78px_+_var(--safe-t))]">
      <div className="mb-6 flex items-center gap-3">
        <IconAction
          icon={<ChevronLeft size={18} />}
          label="Back"
          tooltip="Back to home"
          onClick={() => actions.go("home")}
        />
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
        {/* Sliders, not preset chips — the old four buttons capped a session at
            90 minutes, which is shorter than plenty of real deep work. */}
        <DurationSlider
          id="session-length"
          label="Session length"
          hint="How long a new focus session runs. Drag all the way for a seven-hour block."
          value={state.sessionMinutes}
          onChange={actions.setSessionMinutes}
          min={SESSION_BOUNDS.min}
          max={SESSION_BOUNDS.max}
          step={SESSION_BOUNDS.step}
          ticks={SESSION_TICKS}
          presets={SESSION_PRESETS}
        />
        <DurationSlider
          id="daily-goal"
          label="Daily goal"
          hint="Deep work you're aiming for each day. Moves in ten-minute steps."
          value={state.goalMinutes}
          onChange={actions.setGoalMinutes}
          min={GOAL_BOUNDS.min}
          max={GOAL_BOUNDS.max}
          step={GOAL_BOUNDS.step}
          ticks={GOAL_TICKS}
          presets={GOAL_PRESETS}
        />
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
          <div key={app.id} className="flex items-center gap-3 py-3">
            <AppLogo app={app} size={38} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[15.5px] font-semibold">{app.name}</div>
              <div className="mt-0.5 text-[12.5px] text-muted-foreground">
                {app.locked ? "Locked while Clarity is on" : "Open — not being watched"}
              </div>
            </div>
            <IconAction
              icon={<X size={14} />}
              label="Remove"
              tooltip={`Stop watching ${app.name} entirely`}
              onClick={() => actions.removeApp(app.id)}
              side="left"
              hideLabel
            />
            <ClaritySwitch
              on={app.locked}
              onClick={() => actions.toggleAppLock(app.id)}
              aria-label={`Lock ${app.name}`}
            />
          </div>
        ))}

        {/* Anything from the catalogue that isn't already on the list. */}
        {APP_CATALOG.filter((c) => !state.apps.some((a) => a.id === c.id)).length > 0 && (
          <div className="py-4">
            <div className="mb-3 text-[13px] text-muted-foreground">Add another app</div>
            <div className="flex flex-wrap gap-2">
              {APP_CATALOG.filter((c) => !state.apps.some((a) => a.id === c.id)).map((c) => (
                <Tip key={c.id} label={`Start locking ${c.name}`}>
                  <button
                    onClick={() => actions.addApp(c.id)}
                    aria-label={`Add ${c.name}`}
                    className="flex h-11 items-center gap-2 rounded-[12px] border border-sand-line raise pl-1.5 pr-3 text-[13.5px] font-semibold text-foreground/85 transition-colors hover:border-spice-400/40 hover:text-foreground"
                  >
                    <AppLogo app={{ ...c }} size={30} />
                    {c.name}
                    <Plus size={13} />
                  </button>
                </Tip>
              ))}
            </div>
          </div>
        )}
      </Section>

      <Section title="Your data">
        <Row label="Export history" hint="Every session, day and project, as JSON">
          <Tip label="Download your whole history as a JSON file">
            <button
              onClick={actions.exportData}
              className="grid h-11 place-items-center rounded-[10px] border border-sand-line px-4 text-[13.5px] font-semibold text-foreground/85 transition-colors hover:text-foreground"
            >
              Export
            </button>
          </Tip>
        </Row>
        <Row label="Reset everything" hint="Clears your history. This cannot be undone.">
          <Tip label="Delete every logged day, session and project">
            <button
              onClick={() => setConfirmReset(true)}
              className="flex h-11 items-center gap-1.5 rounded-[10px] border border-destructive/40 px-4 text-[13.5px] font-semibold text-destructive"
            >
              <Trash size={14} /> Reset
            </button>
          </Tip>
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
