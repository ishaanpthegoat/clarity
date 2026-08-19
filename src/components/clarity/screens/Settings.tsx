// Clarity — Settings. Every row here changes something; nothing is display-only.
//
// This screen used to carry two duration sliders, an ambient-sound picker, a
// name field and a theme switch under a "You" heading. The sliders moved to
// Home (they are tuned far too often to live three taps deep), the sound went
// entirely, and "You" went with it — your name comes from onboarding now, and
// there is nothing else about you worth a settings row.
//
// What is left is genuinely settings: what you follow, how locking behaves,
// which apps it applies to, and your data.
import { useState } from "react";
import { useClarity } from "@/lib/clarityStore";
import { APP_CATALOG } from "@/lib/clarityData";
import { INTEREST_CATEGORIES } from "@/lib/feeds";
import ClaritySwitch from "../ClaritySwitch";
import AppLogo from "../AppLogo";
import { IconAction, Tip } from "../Action";
import { ChevronLeft, Sun, MoonIcon, Trash, Plus, X, Check } from "../icons";

const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

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
  const [confirmForget, setConfirmForget] = useState(false);

  const { interests } = state.profile;

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

      {/* The only route to the paywall. It no longer interrupts anyone on open. */}
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

      {/* Everything onboarding learned, and the only place to change it.
          Deliberately *not* a "You" section — none of this is profile trivia,
          it is the input that decides what the digest contains and what the
          block screen says back to you. Leaving it uneditable would have made
          a two-minute conversation permanent. */}
      <div className="eyebrow eyebrow-muted mb-2.5 ml-1">What Clarity knows</div>
      <div className="sietch-card mb-6 divide-y divide-[hsl(var(--sand-line))] px-[18px]">
        <Row label="Your name" hint="Used when Clarity talks to you">
          <input
            value={state.profile.name}
            onChange={(e) => actions.setProfile({ name: e.target.value })}
            placeholder="Add your name"
            aria-label="Your name"
            maxLength={40}
            spellCheck={false}
            className="h-11 w-[130px] rounded-[10px] border border-sand-line raise px-3 text-right text-[14px] text-foreground outline-none placeholder:text-muted-foreground focus:border-spice-400/50"
          />
        </Row>

        <div className="py-4">
          <label htmlFor="set-goal" className="text-[15.5px] font-semibold">
            What you&rsquo;re trying to get to
          </label>
          <div className="mt-0.5 text-[13px] leading-[1.35] text-muted-foreground">
            Shown back to you at the moment you reach for a locked app
          </div>
          <input
            id="set-goal"
            value={state.profile.goal}
            onChange={(e) => actions.setProfile({ goal: e.target.value })}
            placeholder="e.g. finally learn to cook properly"
            maxLength={140}
            className="mt-2.5 h-11 w-full rounded-[10px] border border-sand-line raise px-3 text-[14.5px] text-foreground outline-none placeholder:text-muted-foreground focus:border-spice-400/50"
          />
        </div>

        <div className="py-4">
          <div className="text-[15.5px] font-semibold">What you follow</div>
          <div className="mt-0.5 text-[13px] leading-[1.35] text-muted-foreground">
            Turning one off stops it appearing tomorrow
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {INTEREST_CATEGORIES.map((c) => {
              const on = interests.includes(c.id);
              return (
                <Tip key={c.id} label={on ? `Stop following ${c.label}` : c.blurb}>
                  <button
                    onClick={() =>
                      actions.setInterests(
                        on ? interests.filter((x) => x !== c.id) : [...interests, c.id],
                      )
                    }
                    aria-pressed={on}
                    className="flex min-h-[44px] items-center gap-2 rounded-[13px] px-3.5 text-[14px] font-semibold transition-colors"
                    style={{
                      border: `1px solid ${on ? "hsl(var(--spice-400) / 0.45)" : "hsl(var(--sand-line))"}`,
                      background: on ? "hsl(var(--spice-400) / 0.13)" : "transparent",
                      color: on ? "hsl(var(--spice-100))" : "hsl(var(--muted-foreground))",
                    }}
                  >
                    {c.label}
                    {on && <Check size={13} />}
                  </button>
                </Tip>
              );
            })}
          </div>
        </div>

        {/* One field per followed category — this is what pulls a story to the
            top of the digest rather than leaving it in the pile. */}
        {interests.length > 0 && (
          <div className="py-4">
            <div className="text-[15.5px] font-semibold">Specifically</div>
            <div className="mt-0.5 text-[13px] leading-[1.35] text-muted-foreground">
              Anything matching these gets pulled to the top of your digest
            </div>
            <div className="mt-3 flex flex-col gap-2.5">
              {interests.map((id) => (
                <div key={id} className="flex items-center gap-2.5">
                  <label
                    htmlFor={`spec-${id}`}
                    className="w-[74px] flex-none text-[13px] font-semibold text-muted-foreground"
                  >
                    {INTEREST_CATEGORIES.find((c) => c.id === id)?.label ?? id}
                  </label>
                  <input
                    id={`spec-${id}`}
                    value={state.profile.specifics[id] ?? ""}
                    onChange={(e) =>
                      actions.setProfile({
                        specifics: { ...state.profile.specifics, [id]: e.target.value },
                      })
                    }
                    placeholder="A team, a company, a topic"
                    maxLength={120}
                    className="h-11 flex-1 rounded-[10px] border border-sand-line raise px-3 text-[14px] text-foreground outline-none placeholder:text-muted-foreground focus:border-spice-400/50"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="py-4">
          <label htmlFor="set-avoid" className="text-[15.5px] font-semibold">
            Less of
          </label>
          <div className="mt-0.5 text-[13px] leading-[1.35] text-muted-foreground">
            Stories matching this are hidden, and the digest says how many
          </div>
          <input
            id="set-avoid"
            value={state.profile.avoid}
            onChange={(e) => actions.setProfile({ avoid: e.target.value })}
            placeholder="e.g. politics"
            maxLength={120}
            className="mt-2.5 h-11 w-full rounded-[10px] border border-sand-line raise px-3 text-[14.5px] text-foreground outline-none placeholder:text-muted-foreground focus:border-spice-400/50"
          />
        </div>
      </div>

      <Section title="Focus">
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
        <Row label="Session length and daily goal" hint="Both live on the home screen now">
          <button
            onClick={() => actions.go("home")}
            className="h-11 rounded-[10px] border border-sand-line px-4 text-[13.5px] font-semibold text-foreground/85 transition-colors hover:text-foreground"
          >
            Open
          </button>
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
                    aria-label={DAY_NAMES[i]}
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

      <Section title="Display">
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
        <Row
          label="Forget what Clarity knows"
          hint="Wipes the profile above and starts onboarding again. Your history stays."
        >
          <Tip label="Delete the profile and re-run onboarding">
            <button
              onClick={() => setConfirmForget(true)}
              className="flex h-11 items-center gap-1.5 rounded-[10px] border border-destructive/40 px-4 text-[13.5px] font-semibold text-destructive"
            >
              <Trash size={14} /> Forget
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

      {/* Honest about where it lives. Everything here is on this device only —
          nothing is uploaded, because there is no server to upload it to. */}
      <p className="mb-6 px-1 text-[12.5px] leading-[1.5] text-muted-foreground">
        Your history is stored on this device and never leaves it.
      </p>

      {confirmForget && (
        <div className="anim-fadeIn mb-6 rounded-[18px] border border-destructive/35 bg-destructive/[0.07] p-4 text-center">
          <div className="text-[15px] font-semibold">Forget what Clarity knows?</div>
          <div className="mt-1.5 text-[13px] leading-[1.45] text-muted-foreground">
            Your name, goal, what you follow and today&rsquo;s digest all go, and onboarding runs
            again. Your history, projects and to-dos stay.
          </div>
          <div className="mt-3.5 flex gap-2">
            <button
              onClick={() => setConfirmForget(false)}
              className="h-11 flex-1 rounded-[12px] border border-sand-line text-[13.5px] font-semibold"
            >
              Keep it
            </button>
            <button
              onClick={() => {
                setConfirmForget(false);
                actions.forgetProfile();
              }}
              className="h-11 flex-1 rounded-[12px] bg-destructive/85 text-[13.5px] font-semibold text-white"
            >
              Forget
            </button>
          </div>
        </div>
      )}

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
