// Clarity — signing a project off.
//
// A checkbox is too cheap for finishing something. Typing your own name takes
// three seconds longer and means something, which is the entire point: the
// moment should cost enough to be worth having.
//
// It opens either because a deadline came round or because you finished early
// and said so. Both end the same way.
import { useEffect, useRef, useState } from "react";
import { useClarity } from "@/lib/clarityStore";
import { formatDayLabel } from "@/lib/clarityStats";
import Sheet from "./Sheet";
import { PrimaryAction } from "./Action";

export default function SignoffSheet() {
  const { state, actions, derived } = useClarity();
  const project = derived.signingProject;
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Default to the name Clarity already knows, but let them overwrite it —
  // a signature is theirs to give, not ours to prefill and lock.
  useEffect(() => {
    if (project) {
      setName(state.profile.name || "");
      window.setTimeout(() => inputRef.current?.focus(), 240);
    }
    // Keyed on which project opened the sheet. Re-running when the profile
    // name changes would overwrite a signature someone is mid-way through typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id]);

  if (!project) return null;

  const signed = name.trim().length >= 2;
  const late = project.dueDate ? project.dueDate < dateKeyNow() : false;
  const early = project.dueDate ? project.dueDate > dateKeyNow() : false;

  return (
    <Sheet
      open
      onClose={actions.dismissSignoff}
      title="Sign it off"
      subtitle={project.title}
      footer={
        <PrimaryAction
          onClick={() => actions.signProject(project.id, name)}
          disabled={!signed}
          tooltip={signed ? "Put your name to this project" : "Type your name first"}
        >
          Sign &amp; close it out
        </PrimaryAction>
      }
    >
      <p className="text-[14.5px] leading-[1.55] text-foreground/85">
        {early
          ? "Finished ahead of the deadline. Write your name and it's done — no need to wait for the date."
          : late
            ? `This was due ${formatDayLabel(project.dueDate!)}. Late is still finished. Write your name.`
            : project.dueDate
              ? "Due today, and you say it's done. Write your name to close it."
              : "You marked this finished. Write your name to close it."}
      </p>

      <div className="mt-5">
        <label
          htmlFor="signature"
          className="mb-2 block text-[11px] font-bold tracking-[2px] text-muted-foreground"
        >
          SIGNATURE
        </label>
        <input
          ref={inputRef}
          id="signature"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && signed) actions.signProject(project.id, name);
          }}
          placeholder="Type your name"
          autoComplete="off"
          className="font-epigraph h-[62px] w-full rounded-[14px] border-b-2 border-sand-line bg-transparent px-1 text-[28px] italic text-foreground outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-spice-400"
        />
        <p className="mt-2.5 text-[12.5px] leading-[1.4] text-muted-foreground">
          This stays on the project. It is the record that you said it was done.
        </p>
      </div>
    </Sheet>
  );
}

/** Today, as a day key. Local, matching how deadlines are stored. */
function dateKeyNow(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
