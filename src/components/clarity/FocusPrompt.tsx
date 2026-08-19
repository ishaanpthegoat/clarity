// Clarity — "what's today about?"
//
// Opens the moment the digest is closed out, and only then. That timing is the
// whole idea: you have just spent two minutes on everyone else's priorities,
// which is the most honest possible moment to be asked for your own.
//
// The projects you picked for the week are offered as one tap each, because the
// answer usually already exists — but the field is free text, since some days
// are about something that was never going to be a project.
import { useEffect, useRef, useState } from "react";
import { useClarity } from "@/lib/clarityStore";
import Sheet from "./Sheet";
import { PrimaryAction, Tip } from "./Action";

export default function FocusPrompt() {
  const { state, actions } = useClarity();
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const open = state.focusPromptOpen;
  const weekly = state.projects.filter((p) => state.selProj.includes(p.id) && !p.signature);

  useEffect(() => {
    if (open) {
      setDraft(state.dayFocus || "");
      window.setTimeout(() => inputRef.current?.focus(), 240);
    }
    // Keyed on the sheet opening. Re-seeding when dayFocus changes would wipe
    // whatever they are mid-way through typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const named = draft.trim().length > 0;

  return (
    <Sheet
      open
      onClose={actions.dismissFocusPrompt}
      title="What's today about?"
      subtitle="Name one thing. Everything you lock away is protecting it."
      footer={
        <PrimaryAction
          onClick={() => actions.setDayFocus(draft)}
          disabled={!named}
          tooltip={named ? "Set this as today's focus" : "Name it first"}
        >
          That&rsquo;s today
        </PrimaryAction>
      }
    >
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && named) actions.setDayFocus(draft);
        }}
        placeholder="The one thing that would make today count"
        aria-label="Today's focus"
        className="h-[54px] w-full rounded-[14px] border border-sand-line bg-transparent px-4 text-[16px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/55 focus:border-spice-400/60"
      />

      {weekly.length > 0 && (
        <>
          <div className="eyebrow eyebrow-muted mb-2.5 mt-5">Or one you already picked</div>
          <div className="flex flex-col gap-2">
            {weekly.map((p) => (
              <Tip key={p.id} label={`Make today about ${p.title}`}>
                <button
                  onClick={() => setDraft(p.title)}
                  className="sietch-card card-lift w-full p-3.5 text-left"
                >
                  <span className="block text-[14.5px] font-semibold">{p.title}</span>
                  {p.desc && (
                    <span className="mt-0.5 line-clamp-1 block text-[12.5px] text-muted-foreground">
                      {p.desc}
                    </span>
                  )}
                </button>
              </Tip>
            ))}
          </div>
        </>
      )}

      <button
        onClick={actions.dismissFocusPrompt}
        className="mt-4 h-10 w-full text-[13px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        Not today
      </button>
    </Sheet>
  );
}
