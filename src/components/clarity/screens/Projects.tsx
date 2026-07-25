// Clarity — Projects.
//
// The old screen was one long scroll that mixed picking your week, browsing
// ideas, and reading the community feed. Now each concern owns a section, with
// one deliberate exception: the public ideas feed stays on the main page rather
// than behind a tab, because it is the thing that gives you something to pick
// *from* — burying it would leave an empty picker staring at anyone new.
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useClarity } from "@/lib/clarityStore";
import { PUBLIC_IDEAS, TRENDING, type Project, type ProjectStatus } from "@/lib/clarityData";
import { runOptimistic, simulateWrite } from "@/lib/optimistic";
import { DUR, EASE_OUT, SPRING, stagger } from "@/lib/motion";
import { ChipAction, IconAction, PrimaryAction, Tip } from "../Action";
import { IdeaFeedSkeleton } from "../Skeletons";
import Avatar from "../Avatar";
import ProjectSheet from "../ProjectSheet";
import {
  ArrowUpRight, Camera, Check, HeartFilled, Plus, Sparkle, Target, Users,
} from "../icons";

type SectionId = "week" | "all" | "grade";

const SECTIONS: { id: SectionId; label: string; tooltip: string }[] = [
  { id: "week", label: "This week", tooltip: "The 3 projects you're protecting right now" },
  { id: "all", label: "All", tooltip: "Every project you've written down" },
  { id: "grade", label: "Grade", tooltip: "Photograph a project and have it scored" },
];

const STATUS_STYLE: Record<ProjectStatus, { label: string; className: string }> = {
  idea: { label: "Idea", className: "border-sand-line text-muted-foreground" },
  active: { label: "Active", className: "border-spice-400/45 bg-spice-400/[0.12] text-spice-200" },
  done: { label: "Done", className: "border-emerald-500/40 bg-emerald-500/[0.12] text-emerald-300" },
};

/** A pill row where the selected pill is one sliding shared element. */
function SectionTabs({
  value,
  onChange,
}: {
  value: SectionId;
  onChange: (id: SectionId) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Project sections"
      className="mt-4 flex gap-1 rounded-[15px] border border-sand-line raise p-1"
    >
      {SECTIONS.map((s) => {
        const active = s.id === value;
        return (
          <Tip key={s.id} label={s.tooltip}>
            <button
              role="tab"
              aria-selected={active}
              onClick={() => onChange(s.id)}
              className="relative grid h-11 flex-1 place-items-center rounded-[11px] text-[13.5px] font-semibold"
            >
              {active && (
                <motion.span
                  layoutId="proj-section"
                  className="absolute inset-0 rounded-[11px] border border-spice-400/35 bg-spice-400/[0.14]"
                  transition={SPRING.crisp}
                />
              )}
              <span
                className="relative transition-colors duration-150"
                style={{ color: active ? "hsl(var(--spice-200))" : "hsl(var(--muted-foreground))" }}
              >
                {s.label}
              </span>
            </button>
          </Tip>
        );
      })}
    </div>
  );
}

function StatusChip({ status }: { status: ProjectStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span className={`rounded-full border px-2.5 py-[3px] text-[10.5px] font-bold uppercase tracking-[0.08em] ${s.className}`}>
      {s.label}
    </span>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-[5px] w-full overflow-hidden rounded-full bg-[hsl(var(--muted))]">
      <motion.div
        className="h-full rounded-full"
        style={{ background: "var(--spice-grad)" }}
        initial={false}
        animate={{ width: `${value}%` }}
        transition={{ duration: DUR.base, ease: EASE_OUT }}
      />
    </div>
  );
}

/** One project in the "All" list — opens its workspace sheet. */
function ProjectRow({ project, index }: { project: Project; index: number }) {
  const { actions } = useClarity();
  const lastGrade = project.grades[0];

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DUR.base, ease: EASE_OUT, delay: stagger(index) }}
      onClick={() => actions.openProject(project.id)}
      aria-label={`Open ${project.title}`}
      className="sietch-card card-lift w-full p-4 text-left"
    >
      <div className="flex items-start gap-3">
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[16px] font-bold">{project.title}</span>
          {project.desc && (
            <span className="mt-[3px] line-clamp-2 block text-[13px] leading-[1.4] text-muted-foreground">
              {project.desc}
            </span>
          )}
        </span>
        <StatusChip status={project.status} />
      </div>

      <div className="mt-3.5 flex items-center gap-3">
        <ProgressBar value={project.progress} />
        <span className="readout flex-none text-[12px] font-bold text-spice-200">{project.progress}%</span>
      </div>

      {(lastGrade || project.adoptedFrom) && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-sand-line pt-3">
          {lastGrade && (
            <span className="flex items-center gap-1.5 rounded-full border border-spice-400/25 bg-spice-400/[0.08] px-2.5 py-1 text-[11.5px] font-semibold text-spice-200">
              <Sparkle size={11} /> Graded {lastGrade.score}/100
            </span>
          )}
          {project.adoptedFrom && (
            <span className="text-[11.5px] text-muted-foreground">from {project.adoptedFrom}</span>
          )}
        </div>
      )}
    </motion.button>
  );
}

/** The public ideas feed — the one block that stays on the main page. */
function IdeasFeed() {
  const { state, actions } = useClarity();
  // Cheers are the clearest place in the app to show optimistic writes: the
  // heart fills on the tap, and only un-fills if the write actually fails.
  const [pending, setPending] = useState<string[]>([]);

  const cheerNow = (id: string) => {
    const wasOn = state.cheered.includes(id);
    setPending((p) => [...p, id]);
    void runOptimistic({
      apply: () => actions.cheerIdea(id),
      rollback: () => actions.cheerIdea(id),
      commit: () => simulateWrite(280),
      errorMessage: wasOn ? "Couldn't remove that cheer" : "Couldn't save that cheer",
    }).finally(() => setPending((p) => p.filter((x) => x !== id)));
  };

  if (!state.ideasLoaded) return <IdeaFeedSkeleton count={3} />;

  return (
    <div className="flex flex-col gap-3">
      {PUBLIC_IDEAS.map((idea, i) => {
        const cheered = state.cheered.includes(idea.id);
        const adopted = state.adopted.includes(idea.id);
        return (
          <motion.article
            key={idea.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DUR.base, ease: EASE_OUT, delay: stagger(i) }}
            className="sietch-card p-[18px]"
          >
            <div className="flex items-center gap-3">
              <Avatar initials={idea.initials} hue={idea.hue} size={44} ring={adopted} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[15px] font-bold">{idea.author}</div>
                <div className="mt-px truncate text-[12.5px] text-muted-foreground">{idea.focus}</div>
              </div>
              <Tip label={cheered ? "Remove your cheer" : `Cheer this — ${idea.cheers} others have`}>
                <button
                  onClick={() => cheerNow(idea.id)}
                  aria-pressed={cheered}
                  aria-label={cheered ? `Remove cheer from ${idea.author}` : `Cheer ${idea.author}`}
                  className="flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-[12px] px-2"
                  style={{ opacity: pending.includes(idea.id) ? 0.65 : 1 }}
                >
                  <motion.span
                    animate={{ scale: cheered ? 1 : 0.9 }}
                    transition={SPRING.bouncy}
                    style={{ color: cheered ? "hsl(var(--spice-400))" : "hsl(var(--muted-foreground))" }}
                  >
                    <HeartFilled size={16} />
                  </motion.span>
                  <span
                    className="readout text-[12.5px] font-bold"
                    style={{ color: cheered ? "hsl(var(--spice-200))" : "hsl(var(--muted-foreground))" }}
                  >
                    {idea.cheers + (cheered ? 1 : 0)}
                  </span>
                </button>
              </Tip>
            </div>

            <div className="mt-3.5">
              <div className="text-[15.5px] font-bold leading-[1.3]">{idea.idea}</div>
              <p className="mt-1.5 text-[13.5px] leading-[1.45] text-muted-foreground">{idea.desc}</p>
            </div>

            <div className="mt-3.5 flex items-center gap-2.5 border-t border-sand-line pt-3.5">
              <span className="flex-1 text-[12px] text-muted-foreground">{idea.outcome}</span>
              <Tip
                label={
                  adopted
                    ? "Already in your projects"
                    : `Copy "${idea.idea}" into your own projects`
                }
              >
                <button
                  onClick={() => !adopted && actions.adoptIdea(idea.id)}
                  disabled={adopted}
                  className={`flex h-11 items-center gap-1.5 rounded-[12px] border px-3.5 text-[13px] font-semibold ${
                    adopted
                      ? "border-spice-400/30 text-spice-200"
                      : "border-sand-line raise text-foreground/85 hover:text-foreground"
                  }`}
                >
                  {adopted ? <><Check size={13} /> Added</> : <><Plus size={13} /> Try this</>}
                </button>
              </Tip>
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}

/** Section 1 — pick your three, then the ideas feed underneath. */
function WeekSection() {
  const { state, actions } = useClarity();
  const sel = state.selProj;
  const ready = sel.length === 3;

  return (
    <>
      <div className="mx-0.5 mb-3 mt-6 flex items-center justify-between">
        <span className="eyebrow eyebrow-muted flex items-center gap-1.5">
          <Target size={12} /> Your 3 for this week
        </span>
        <span className="readout text-[13px] font-bold text-spice-200">{sel.length}/3</span>
      </div>

      <div className="flex flex-col gap-2.5">
        {state.projects.slice(0, 8).map((p, i) => {
          const on = sel.includes(p.id);
          return (
            <motion.button
              key={p.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: DUR.base, ease: EASE_OUT, delay: stagger(i) }}
              onClick={() => actions.toggleProject(p.id)}
              aria-pressed={on}
              aria-label={`${on ? "Remove" : "Pick"} ${p.title} for this week`}
              className="flex w-full items-center gap-3 rounded-[16px] p-4 text-left transition-[background-color,border-color] duration-200"
              style={{
                border: `1px solid ${on ? "hsl(var(--spice-400) / .6)" : "hsl(var(--sand-line))"}`,
                background: on ? "hsl(var(--spice-400) / .12)" : "hsl(var(--sietch))",
              }}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[16px] font-bold">{p.title}</span>
                <span className="mt-[3px] line-clamp-1 block text-[13px] text-muted-foreground">{p.desc}</span>
              </span>
              <motion.span
                className="grid h-[26px] w-[26px] flex-none place-items-center rounded-full text-white"
                animate={{
                  borderColor: on ? "hsl(31 87% 55%)" : "rgba(255,255,255,.22)",
                  backgroundColor: on ? "hsl(26 88% 48%)" : "rgba(0,0,0,0)",
                  scale: on ? 1 : 0.92,
                }}
                transition={SPRING.crisp}
                style={{ borderWidth: 2, borderStyle: "solid" }}
              >
                <AnimatePresence>
                  {on && (
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={SPRING.bouncy}
                    >
                      <Check size={13} />
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.span>
            </motion.button>
          );
        })}
      </div>

      <div className="mt-3.5">
        <PrimaryAction
          onClick={actions.confirmProjects}
          disabled={!ready}
          variant={ready ? "spice" : "quiet"}
          tooltip={
            ready
              ? "Lock these 3 in and add them to your to-do list"
              : `Pick ${3 - sel.length} more to lock your week in`
          }
        >
          {ready ? "Lock in my week" : `Pick ${3 - sel.length} more`}
        </PrimaryAction>
      </div>

      <div className="mb-[11px] mt-[30px] text-[11px] font-bold tracking-[2px] text-muted-foreground">
        NEED IDEAS? TRENDING NOW
      </div>
      <div className="flex flex-wrap gap-2">
        {TRENDING.map((t) => (
          <Tip key={t} label={`Add "${t}" to your projects`}>
            <button
              onClick={() => actions.createProject(t)}
              className="grid h-11 place-items-center rounded-full border border-spice-400/25 bg-spice-400/[0.08] px-4 text-[13.5px] font-medium text-spice-200"
            >
              {t}
            </button>
          </Tip>
        ))}
      </div>

      {/* The one section that lives on the main page. */}
      <div className="mb-3 mt-[30px] flex items-center justify-between">
        <span className="eyebrow eyebrow-muted flex items-center gap-1.5">
          <Users size={12} /> Public ideas
        </span>
        <span className="text-[12px] text-muted-foreground">what others are building</span>
      </div>
      <IdeasFeed />
    </>
  );
}

/** Section 2 — the full list, with a way to add your own. */
function AllSection() {
  const { state, actions } = useClarity();
  const [draft, setDraft] = useState("");
  const [filter, setFilter] = useState<ProjectStatus | "all">("all");

  const shown = useMemo(
    () => (filter === "all" ? state.projects : state.projects.filter((p) => p.status === filter)),
    [state.projects, filter],
  );

  const add = () => {
    if (!draft.trim()) return;
    actions.createProject(draft);
    setDraft("");
  };

  return (
    <>
      <div className="mt-6 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Add a project of your own"
          aria-label="New project title"
          name="project"
          maxLength={80}
          className="h-12 flex-1 rounded-[14px] border border-sand-line raise px-4 text-[15px] text-foreground outline-none placeholder:text-muted-foreground focus:border-spice-400/50"
        />
        <Tip label="Add this project to your list">
          <button
            onClick={add}
            disabled={!draft.trim()}
            aria-label="Add project"
            className="spice-grad grid h-12 w-12 flex-none place-items-center rounded-[14px] text-[hsl(var(--primary-foreground))] disabled:opacity-35"
          >
            <Plus size={20} />
          </button>
        </Tip>
      </div>

      <div className="mb-3.5 mt-4 flex gap-1.5">
        {(["all", "active", "idea", "done"] as const).map((f) => (
          <ChipAction
            key={f}
            active={filter === f}
            onClick={() => setFilter(f)}
            tooltip={f === "all" ? "Show every project" : `Show only ${f} projects`}
            className="h-9 flex-1 px-2 text-[12.5px] capitalize"
          >
            {f}
          </ChipAction>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="sietch-card grid place-items-center gap-2 px-5 py-10 text-center">
          <span className="text-[15px] font-semibold">Nothing here yet</span>
          <span className="max-w-[240px] text-[13.5px] leading-[1.45] text-muted-foreground">
            {filter === "all"
              ? "Add a project above, or take one from the ideas feed."
              : `No ${filter} projects right now.`}
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {shown.map((p, i) => (
            <ProjectRow key={p.id} project={p} index={i} />
          ))}
        </div>
      )}
    </>
  );
}

/** Section 3 — photograph a project and have it graded. */
function GradeSection() {
  const { state, actions } = useClarity();
  const graded = state.projects.filter((p) => p.grades.length > 0);

  return (
    <>
      <div className="sietch-card-warm mt-6 p-5">
        <div className="flex items-center gap-3">
          <span className="spice-grad grid h-11 w-11 flex-none place-items-center rounded-[13px] text-[hsl(var(--primary-foreground))]">
            <Camera size={20} />
          </span>
          <div className="flex-1">
            <div className="text-[16px] font-bold">Get your project graded</div>
            <div className="mt-0.5 text-[13px] leading-[1.4] text-muted-foreground">
              Photograph what you've built. It comes back scored, with the one thing to fix next.
            </div>
          </div>
        </div>
      </div>

      <div className="mb-3 mt-6 text-[11px] font-bold tracking-[2px] text-muted-foreground">
        PICK WHAT TO GRADE
      </div>
      <div className="flex flex-col gap-2.5">
        {state.projects.slice(0, 10).map((p, i) => {
          const last = p.grades[0];
          return (
            <motion.button
              key={p.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: DUR.base, ease: EASE_OUT, delay: stagger(i) }}
              onClick={() => actions.openGrader(p.id)}
              aria-label={`Grade ${p.title}`}
              className="sietch-card card-lift flex w-full items-center gap-3 p-4 text-left"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15.5px] font-bold">{p.title}</span>
                <span className="mt-[3px] block text-[12.5px] text-muted-foreground">
                  {last ? `Last graded ${last.score}/100` : "Never graded"}
                </span>
              </span>
              <span className="flex flex-none items-center gap-1.5 rounded-[11px] border border-spice-400/30 bg-spice-400/[0.1] px-3 py-2 text-[12.5px] font-semibold text-spice-200">
                <Camera size={13} /> Shoot
              </span>
            </motion.button>
          );
        })}
      </div>

      {graded.length > 0 && (
        <>
          <div className="mb-3 mt-8 text-[11px] font-bold tracking-[2px] text-muted-foreground">
            RECENT GRADES
          </div>
          <div className="flex flex-col gap-2.5">
            {graded.map((p) => (
              <button
                key={p.id}
                onClick={() => actions.openProject(p.id)}
                aria-label={`See grade history for ${p.title}`}
                className="sietch-card flex w-full items-center gap-3.5 p-4 text-left"
              >
                <span
                  className="readout grid h-12 w-12 flex-none place-items-center rounded-full text-[17px] font-bold text-[hsl(var(--primary-foreground))]"
                  style={{ background: "var(--spice-grad)" }}
                >
                  {p.grades[0].score}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-bold">{p.title}</span>
                  <span className="mt-0.5 line-clamp-1 block text-[12.5px] text-muted-foreground">
                    {p.grades[0].headline}
                  </span>
                </span>
                <ArrowUpRight size={16} />
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}

export default function Projects() {
  const { state, actions, derived } = useClarity();
  const [section, setSection] = useState<SectionId>("week");

  return (
    <div className="absolute inset-0 flex flex-col bg-background">
      <div className="clarity-scroll flex-1 overflow-y-auto px-[22px] pb-[118px] pt-[calc(78px_+_var(--safe-t))]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-[29px] font-extrabold leading-[1.15] tracking-[-0.8px]">Projects</h1>
            <p className="mt-2 max-w-[290px] text-[15px] leading-[1.5] text-muted-foreground">
              Pick 3 to protect this week. Small enough to finish, big enough to matter.
            </p>
          </div>
          <IconAction
            icon={<Sparkle size={16} />}
            label="Grade"
            tooltip="Photograph a project and have it scored"
            onClick={() => setSection("grade")}
            active={section === "grade"}
          />
        </div>

        <SectionTabs value={section} onChange={setSection} />

        {/* Sections cross-fade in place. `mode="wait"` would leave a hole where
            the content is, so they overlap for the length of the swap. */}
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={section}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: DUR.fast, ease: EASE_OUT }}
          >
            {section === "week" && <WeekSection />}
            {section === "all" && <AllSection />}
            {section === "grade" && <GradeSection />}
          </motion.div>
        </AnimatePresence>
      </div>

      <ProjectSheet
        project={derived.openProject}
        onClose={() => actions.openProject(null)}
        pickedForWeek={state.selProj.includes(derived.openProject?.id ?? "")}
      />
    </div>
  );
}
