// Clarity — the project workspace.
//
// A project used to be a title in a picker. This is the rest of it: where it
// stands, how far along, what you were thinking last time, every grade it has
// been given, and the tasks it put on your list.
//
// Notes save optimistically on every keystroke — there is no Save button,
// because a Save button on a notes field is just a way to lose notes.
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useClarity } from "@/lib/clarityStore";
import type { Project, ProjectStatus } from "@/lib/clarityData";
import { GRADE_RUBRIC } from "@/lib/clarityData";
import { runOptimistic, simulateWrite } from "@/lib/optimistic";
import { DUR, EASE_OUT, SPRING, stagger } from "@/lib/motion";
import { Slider } from "@/components/ui/slider";
import Sheet from "./Sheet";
import { ChipAction, PrimaryAction, Tip } from "./Action";
import { formatDayLabel } from "@/lib/clarityStats";
import { Camera, Check, Sparkle, Trash } from "./icons";

const STATUSES: { id: ProjectStatus; label: string; tooltip: string }[] = [
  { id: "idea", label: "Idea", tooltip: "Written down, not started" },
  { id: "active", label: "Active", tooltip: "You're working on this now" },
  { id: "done", label: "Done", tooltip: "Finished — sets progress to 100%" },
];

function GradeCard({ grade, index }: { grade: Project["grades"][number]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DUR.base, ease: EASE_OUT, delay: stagger(index) }}
      className="rounded-[16px] border border-sand-line raise p-4"
    >
      <div className="flex items-center gap-3">
        <span
          className="readout grid h-11 w-11 flex-none place-items-center rounded-full text-[16px] font-bold text-[hsl(var(--primary-foreground))]"
          style={{ background: "var(--spice-grad)" }}
        >
          {grade.score}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-bold leading-[1.3]">{grade.headline}</div>
          <div className="mt-0.5 text-[12px] text-muted-foreground">{formatDayLabel(grade.day)}</div>
        </div>
      </div>
      <div className="mt-3.5 flex flex-col gap-2">
        {GRADE_RUBRIC.map((r) => (
          <div key={r.key} className="flex items-center gap-2.5">
            <span className="w-[54px] flex-none text-[11.5px] font-semibold text-muted-foreground">
              {r.label}
            </span>
            <span className="h-[5px] flex-1 overflow-hidden rounded-full bg-[hsl(var(--muted))]">
              <motion.span
                className="block h-full rounded-full"
                style={{ background: "var(--spice-grad)" }}
                initial={{ width: 0 }}
                animate={{ width: `${grade.rubric[r.key] ?? 0}%` }}
                transition={{ duration: DUR.slow, ease: EASE_OUT, delay: 0.05 }}
              />
            </span>
            <span className="readout w-[26px] flex-none text-right text-[11.5px] font-bold text-spice-200">
              {grade.rubric[r.key] ?? 0}
            </span>
          </div>
        ))}
      </div>
      {grade.nextStep && (
        <p className="mt-3.5 border-t border-sand-line pt-3 text-[13px] leading-[1.45] text-muted-foreground">
          {grade.nextStep}
        </p>
      )}
    </motion.div>
  );
}

export default function ProjectSheet({
  project,
  onClose,
  pickedForWeek,
}: {
  project: Project | null;
  onClose: () => void;
  pickedForWeek: boolean;
}) {
  const { state, actions } = useClarity();
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Re-seed the local draft whenever a different project opens.
  useEffect(() => {
    setNotes(project?.notes ?? "");
    setConfirmDelete(false);
  }, [project?.id, project?.notes]);

  if (!project) return <Sheet open={false} onClose={onClose} title="" children={null} />;

  const linked = state.todos.filter((t) => t.projectId === project.id);

  const saveNotes = (value: string) => {
    const previous = project.notes;
    setNotes(value);
    void runOptimistic({
      apply: () => actions.setProjectNotes(project.id, value),
      rollback: () => {
        actions.setProjectNotes(project.id, previous);
        setNotes(previous);
      },
      commit: () => simulateWrite(200),
      errorMessage: "Notes didn't save",
    }).then((ok) => {
      if (ok !== null) {
        setSaved(true);
        window.setTimeout(() => setSaved(false), 1400);
      }
    });
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title={project.title}
      subtitle={
        project.adoptedFrom
          ? `${project.desc || "No description"} · from ${project.adoptedFrom}`
          : project.desc || "No description yet"
      }
      footer={
        <PrimaryAction
          onClick={() => actions.openGrader(project.id)}
          tooltip="Photograph this project and have it scored"
        >
          <span className="flex items-center gap-2">
            <Camera size={17} /> Grade this project
          </span>
        </PrimaryAction>
      }
    >
      {/* status */}
      <div className="eyebrow eyebrow-muted mb-2.5">Status</div>
      <div className="flex gap-1.5">
        {STATUSES.map((s) => (
          <ChipAction
            key={s.id}
            active={project.status === s.id}
            onClick={() => actions.setProjectStatus(project.id, s.id)}
            tooltip={s.tooltip}
            className="flex-1"
          >
            {s.label}
          </ChipAction>
        ))}
      </div>

      {/* progress */}
      <div className="mt-6 flex items-baseline justify-between">
        <label htmlFor="proj-progress" className="eyebrow eyebrow-muted">
          Progress
        </label>
        <output htmlFor="proj-progress" className="readout text-[20px] font-bold text-spice-200">
          {project.progress}%
        </output>
      </div>
      <Slider
        id="proj-progress"
        value={[project.progress]}
        min={0}
        max={100}
        step={5}
        onValueChange={(v) => actions.setProjectProgress(project.id, v[0])}
        aria-label={`${project.title} progress`}
        aria-valuetext={`${project.progress} percent`}
        className="mt-2"
      />

      {/* notes */}
      <div className="mt-6 flex items-center justify-between">
        <label htmlFor="proj-notes" className="eyebrow eyebrow-muted">
          Working notes
        </label>
        <motion.span
          className="flex items-center gap-1 text-[11.5px] font-semibold text-spice-200"
          initial={false}
          animate={{ opacity: saved ? 1 : 0 }}
          transition={{ duration: DUR.fast }}
        >
          <Check size={11} /> Saved
        </motion.span>
      </div>
      <textarea
        id="proj-notes"
        value={notes}
        onChange={(e) => saveNotes(e.target.value)}
        placeholder="What's the next real step? What's blocking it?"
        name="notes"
        rows={4}
        maxLength={2000}
        className="clarity-scroll mt-2 w-full resize-none rounded-[14px] border border-sand-line raise p-3.5 text-[14.5px] leading-[1.5] text-foreground outline-none placeholder:text-muted-foreground focus:border-spice-400/50"
      />

      {/* linked to-dos */}
      {linked.length > 0 && (
        <>
          <div className="eyebrow eyebrow-muted mb-2.5 mt-6">
            On your list ({linked.filter((t) => t.done).length}/{linked.length})
          </div>
          <div className="flex flex-col gap-1.5">
            {linked.map((t) => (
              <button
                key={t.id}
                onClick={() => actions.toggleTodo(t.id)}
                aria-pressed={t.done}
                aria-label={`${t.done ? "Un-tick" : "Tick"} ${t.text}`}
                className="flex min-h-[44px] items-center gap-3 rounded-[12px] border border-sand-line raise px-3.5 text-left"
              >
                <motion.span
                  className="grid h-[20px] w-[20px] flex-none place-items-center rounded-[6px] border-2 text-white"
                  animate={{
                    borderColor: t.done ? "hsl(31 87% 55%)" : "rgba(255,255,255,.22)",
                    backgroundColor: t.done ? "hsl(26 88% 48%)" : "rgba(0,0,0,0)",
                  }}
                  transition={SPRING.crisp}
                >
                  {t.done && <Check size={11} />}
                </motion.span>
                <span
                  className="flex-1 text-[14px]"
                  style={{
                    opacity: t.done ? 0.5 : 1,
                    textDecoration: t.done ? "line-through" : undefined,
                  }}
                >
                  {t.text}
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* grades */}
      <div className="eyebrow eyebrow-muted mb-2.5 mt-6 flex items-center gap-1.5">
        <Sparkle size={12} /> Grade history
      </div>
      {project.grades.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-sand-line px-4 py-6 text-center text-[13.5px] leading-[1.45] text-muted-foreground">
          Not graded yet. Photograph it and find out where it actually stands.
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {project.grades.map((g, i) => (
            <GradeCard key={g.id + i} grade={g} index={i} />
          ))}
        </div>
      )}

      {/* danger zone */}
      <div className="mt-7 border-t border-sand-line pt-4">
        {confirmDelete ? (
          <div className="rounded-[14px] border border-destructive/35 bg-destructive/[0.07] p-3.5 text-center">
            <div className="text-[14px] font-semibold">
              Delete &ldquo;{project.title}&rdquo;?
            </div>
            <div className="mt-1 text-[12.5px] text-muted-foreground">
              {project.grades.length} grade{project.grades.length === 1 ? "" : "s"} and your notes go with it.
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="h-11 flex-1 rounded-[12px] border border-sand-line text-[13.5px] font-semibold"
              >
                Keep it
              </button>
              <button
                onClick={() => {
                  actions.deleteProject(project.id);
                  onClose();
                }}
                className="h-11 flex-1 rounded-[12px] bg-destructive/85 text-[13.5px] font-semibold text-white"
              >
                Delete
              </button>
            </div>
          </div>
        ) : (
          <Tip label="Remove this project and everything attached to it">
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-[12px] text-[13.5px] font-semibold text-muted-foreground transition-colors hover:text-destructive"
            >
              <Trash size={14} /> Delete project
            </button>
          </Tip>
        )}
      </div>

      {pickedForWeek && (
        <div className="mt-3 text-center text-[12px] text-spice-200">
          This is one of your 3 for the week.
        </div>
      )}
    </Sheet>
  );
}
