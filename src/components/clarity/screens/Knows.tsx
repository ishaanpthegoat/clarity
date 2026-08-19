// Clarity — what the app knows about you.
//
// An app that quietly builds a model of someone and never shows it to them is
// doing something worse than being wrong. This is that model, in plain words,
// editable and deletable.
//
// It matters more here than in most apps because this profile is not decoration:
// it decides which categories get pulled, which headlines rank to the top of the
// digest, what gets filtered out, and what gets quoted back on the block screen.
// If tomorrow's digest reads oddly, this page is the explanation — and the fix.
import { useCallback, useRef, useState } from "react";
import { motion } from "motion/react";
import { useClarity } from "@/lib/clarityStore";
import { INTEREST_CATEGORIES } from "@/lib/feeds";
import { useSwipeUpSync } from "@/lib/useSwipeUpSync";
import { DUR, EASE_OUT, SPRING, stagger } from "@/lib/motion";
import SyncHint from "../SyncHint";
import { PrimaryAction, Tip } from "../Action";
import { Check, Trash } from "../icons";

/** One free-text field. Commits on blur — no save button anywhere on this page. */
function Field({
  label,
  hint,
  value,
  placeholder,
  multiline,
  onCommit,
}: {
  label: string;
  hint?: string;
  value: string;
  placeholder: string;
  multiline?: boolean;
  onCommit: (v: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  // A change from elsewhere (re-running onboarding) should beat a stale draft.
  const [seen, setSeen] = useState(value);
  if (seen !== value) {
    setSeen(value);
    setDraft(value);
  }

  const commit = () => draft !== value && onCommit(draft);
  const shared =
    "w-full bg-transparent text-[15px] leading-[1.5] text-foreground outline-none placeholder:text-muted-foreground/55";

  return (
    <div className="sietch-card mt-3 p-4">
      <div className="eyebrow eyebrow-muted mb-1">{label}</div>
      {hint && <p className="mb-2.5 text-[12.5px] leading-[1.4] text-muted-foreground">{hint}</p>}
      {multiline ? (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          placeholder={placeholder}
          aria-label={label}
          rows={2}
          className={`${shared} resize-none`}
        />
      ) : (
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
          placeholder={placeholder}
          aria-label={label}
          className={shared}
        />
      )}
    </div>
  );
}

export default function Knows() {
  const { state, actions } = useClarity();
  const [confirmForget, setConfirmForget] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sync = useSwipeUpSync(scrollRef, useCallback(() => actions.syncNow(), [actions]));

  const p = state.profile;
  const followed = INTEREST_CATEGORIES.filter((c) => p.interests.includes(c.id));

  // What fraction of the picture exists. Specifics count once, in aggregate —
  // one filled-in specific is the difference that matters, not all six.
  const slots = [
    p.name,
    p.goal,
    p.interests.length ? "y" : "",
    Object.values(p.specifics).some(Boolean) ? "y" : "",
    p.avoid,
  ];
  const filled = slots.filter(Boolean).length / slots.length;
  const knowsAnything = Boolean(p.name || p.goal || p.interests.length);

  const toggle = (id: string) =>
    actions.setInterests(
      p.interests.includes(id) ? p.interests.filter((x) => x !== id) : [...p.interests, id],
    );

  return (
    <div
      ref={scrollRef}
      className="clarity-scroll absolute inset-0 overflow-y-auto bg-background px-[22px] pb-[118px] pt-[calc(78px_+_var(--safe-t))]"
    >
      <h1 className="text-[24px] font-extrabold tracking-[-0.6px]">What Clarity knows</h1>
      <p className="mt-2 text-[13.5px] leading-[1.45] text-muted-foreground">
        Everything the opening conversation turned up. Your digest is built from this, so changing
        something here changes what you get tomorrow.
      </p>

      <div className="mt-4 flex items-center gap-3">
        <span className="h-[6px] flex-1 overflow-hidden rounded-full bg-[hsl(var(--muted))]">
          <motion.span
            className="block h-full rounded-full"
            style={{ background: "var(--spice-grad)" }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.round(filled * 100)}%` }}
            transition={{ duration: DUR.slow, ease: EASE_OUT }}
          />
        </span>
        <span className="readout flex-none text-[12px] font-bold text-spice-200">
          {Math.round(filled * 100)}%
        </span>
      </div>

      {!knowsAnything && (
        <div className="sietch-card-warm mt-4 p-4">
          <div className="text-[14.5px] font-bold">Nothing learned yet</div>
          <p className="mt-1 text-[13px] leading-[1.45] text-muted-foreground">
            Run the conversation and this fills itself in. You can also just type it here.
          </p>
          <div className="mt-3">
            <PrimaryAction
              onClick={() => actions.go("onboarding")}
              tooltip="Talk to Clarity and let it fill this in"
              className="h-[46px] text-[14.5px]"
            >
              Have the conversation
            </PrimaryAction>
          </div>
        </div>
      )}

      <Field
        label="Name"
        value={p.name}
        placeholder="What to call you"
        onCommit={(v) => actions.setProfile({ name: v })}
      />

      <Field
        label="Trying to"
        hint="What you're spending the reclaimed time on. Quoted back at you when it helps."
        value={p.goal}
        placeholder="What you're working toward"
        multiline
        onCommit={(v) => actions.setProfile({ goal: v })}
      />

      {/* what gets pulled */}
      <div className="sietch-card mt-3 p-4">
        <div className="eyebrow eyebrow-muted mb-1">Follows</div>
        <p className="mb-3 text-[12.5px] leading-[1.4] text-muted-foreground">
          The categories your digest is built from. Dropping one also forgets what you said you
          wanted inside it.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {INTEREST_CATEGORIES.map((c) => {
            const on = p.interests.includes(c.id);
            return (
              <Tip key={c.id} label={on ? `Stop following ${c.label}` : c.blurb}>
                <button
                  onClick={() => toggle(c.id)}
                  aria-pressed={on}
                  className={`flex min-h-[38px] items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-semibold transition-colors ${
                    on
                      ? "border-spice-400/45 bg-spice-400/[0.12] text-spice-100"
                      : "border-sand-line text-muted-foreground"
                  }`}
                >
                  {on && <Check size={11} />}
                  {c.label}
                </button>
              </Tip>
            );
          })}
        </div>
      </div>

      {/* the specifics, one per followed category */}
      {followed.map((c, i) => (
        <motion.div
          key={c.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DUR.base, ease: EASE_OUT, delay: stagger(i) }}
        >
          <Field
            label={`Inside ${c.label}`}
            hint={c.ask}
            value={p.specifics[c.id] ?? ""}
            placeholder="In your own words"
            onCommit={(v) =>
              actions.setProfile({ specifics: { ...p.specifics, [c.id]: v } })
            }
          />
        </motion.div>
      ))}

      <Field
        label="Less of"
        hint="Filtered out of the headline list. It cannot un-write a summary that already mentions it."
        value={p.avoid}
        placeholder="What you want less of"
        multiline
        onCommit={(v) => actions.setProfile({ avoid: v })}
      />

      {/* forget everything */}
      <div className="mt-6 border-t border-sand-line pt-4">
        {confirmForget ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={SPRING.crisp}
            className="rounded-[14px] border border-destructive/35 bg-destructive/[0.07] p-3.5 text-center"
          >
            <div className="text-[14px] font-semibold">Forget all of it?</div>
            <div className="mt-1 text-[12.5px] text-muted-foreground">
              The profile and today's digest go, and you start onboarding again. Your history,
              projects and to-dos stay.
            </div>
            <div className="mt-3 flex gap-2">
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
          </motion.div>
        ) : (
          <Tip label="Delete everything Clarity has learned about you">
            <button
              onClick={() => setConfirmForget(true)}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-[12px] border border-sand-line text-[13.5px] font-semibold text-muted-foreground transition-colors hover:text-destructive"
            >
              <Trash size={15} /> Forget everything
            </button>
          </Tip>
        )}
      </div>

      <SyncHint progress={sync.progress} syncing={sync.syncing} />
    </div>
  );
}
