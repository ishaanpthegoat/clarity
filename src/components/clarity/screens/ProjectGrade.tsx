// Clarity — the project grader.
//
// Photograph what you're building, get it scored against a fixed rubric with
// one concrete next step. The rubric is shown *before* you shoot, on purpose:
// a score you can't predict the shape of is a slot machine, not feedback.
//
// Capture goes through a plain file input with `capture` set, which opens the
// camera on a phone and the picker on a desktop — no permissions dance, no
// getUserMedia teardown bugs, and it works inside a Capacitor webview.
import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useClarity } from "@/lib/clarityStore";
import { GRADE_RUBRIC } from "@/lib/clarityData";
import { GRADER_IS_LIVE } from "@/lib/grader";
import { DUR, EASE_OUT, SPRING, stagger } from "@/lib/motion";
import { GradeSkeleton } from "../Skeletons";
import { IconAction, PrimaryAction, Tip } from "../Action";
import { note } from "@/lib/feedback";
import { Camera, Check, ChevronLeft, Sparkle } from "../icons";

/** Longest edge, in pixels, that we send anywhere. */
const MAX_EDGE = 1024;

/**
 * Read a photo and shrink it before it becomes a data URL.
 *
 * A modern phone camera produces 4-8MB per shot; inlined as base64 that is
 * ~11MB of string. Downscaling first keeps the request sane and, on the local
 * path, keeps us from hashing megabytes for no reason.
 */
function readAndShrink(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("That file isn't an image"));
      img.onload = () => {
        const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          // No 2D context is vanishingly rare, but falling back to the full
          // image beats failing the whole flow.
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/** The score, drawn as a ring that fills once on arrival. */
function ScoreRing({ score }: { score: number }) {
  const R = 46;
  const C = 2 * Math.PI * R;
  return (
    <div className="relative grid h-[124px] w-[124px] place-items-center">
      <svg width={124} height={124} viewBox="0 0 124 124" className="absolute -rotate-90">
        <defs>
          <linearGradient id="gradeRing" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f5c542" />
            <stop offset="100%" stopColor="#e2620f" />
          </linearGradient>
        </defs>
        <circle cx="62" cy="62" r={R} fill="none" stroke="hsl(var(--muted))" strokeWidth="9" />
        <motion.circle
          cx="62"
          cy="62"
          r={R}
          fill="none"
          stroke="url(#gradeRing)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={C}
          initial={{ strokeDashoffset: C }}
          animate={{ strokeDashoffset: C - (C * score) / 100 }}
          transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.1 }}
        />
      </svg>
      <motion.div
        className="readout text-[38px] font-bold leading-none tracking-[-0.02em]"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={SPRING.bouncy}
      >
        {score}
      </motion.div>
      <div className="absolute bottom-[18px] text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
        / 100
      </div>
    </div>
  );
}

export default function ProjectGrade() {
  const { state, actions } = useClarity();
  const fileRef = useRef<HTMLInputElement>(null);
  const [reading, setReading] = useState(false);

  const project = state.projects.find((p) => p.id === state.gradeProjectId);
  const grade = state.gradeResult;

  const pick = async (file?: File) => {
    if (!file) return;
    setReading(true);
    try {
      const dataUrl = await readAndShrink(file);
      actions.setGradePhoto(dataUrl);
    } catch {
      note("Couldn't read that photo", "Try another shot.");
    } finally {
      setReading(false);
      // Let the same file be chosen twice in a row.
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-background px-[22px] pb-8 pt-[calc(78px_+_var(--safe-t))]">
      <div className="mb-5 flex items-center gap-3.5">
        <IconAction
          icon={<ChevronLeft size={18} />}
          label="Back"
          tooltip="Back to projects"
          onClick={actions.closeGrade}
          side="bottom"
        />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[22px] font-extrabold tracking-[-0.5px]">
            {project?.title ?? "Grade a project"}
          </h1>
          <div className="mt-0.5 text-[12.5px] text-muted-foreground">
            {GRADER_IS_LIVE ? "Scored by the model" : "Scored on-device"}
          </div>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        aria-label="Take a photo of your project"
        onChange={(e) => void pick(e.target.files?.[0])}
      />

      <div className="clarity-scroll flex min-h-0 flex-1 flex-col overflow-y-auto">
        <AnimatePresence mode="wait" initial={false}>
          {/* ── what you're being scored on ── */}
          {state.gradeStage === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: DUR.base, ease: EASE_OUT }}
              className="flex flex-1 flex-col"
            >
              <div
                className="grid flex-1 place-items-center rounded-[24px]"
                style={{
                  border: "2px dashed hsl(var(--spice-400) / .32)",
                  background:
                    "radial-gradient(80% 60% at 50% 40%, hsl(var(--spice-400) / .08), rgba(255,255,255,.02))",
                }}
              >
                <div className="flex flex-col items-center px-8 text-center">
                  <span
                    className="grid h-[86px] w-[86px] place-items-center rounded-full"
                    style={{ background: "hsl(var(--spice-400) / .12)" }}
                  >
                    <Camera size={36} />
                  </span>
                  <div className="mt-5 text-[18px] font-bold">Show it what you've built</div>
                  <p className="mt-2 max-w-[260px] text-[14px] leading-[1.5] text-muted-foreground">
                    A screen, a sketch, a workbench — whatever the project actually looks like right now.
                  </p>
                </div>
              </div>

              <div className="eyebrow eyebrow-muted mb-2.5 mt-5">Scored on</div>
              <div className="grid grid-cols-2 gap-2">
                {GRADE_RUBRIC.map((r, i) => (
                  <motion.div
                    key={r.key}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: DUR.base, ease: EASE_OUT, delay: stagger(i) }}
                    className="rounded-[14px] border border-sand-line raise p-3"
                  >
                    <div className="text-[13.5px] font-bold">{r.label}</div>
                    <div className="mt-1 text-[11.5px] leading-[1.35] text-muted-foreground">{r.hint}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── review the shot ── */}
          {state.gradeStage === "camera" && state.gradePhoto && (
            <motion.div
              key="camera"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: DUR.base, ease: EASE_OUT }}
              className="flex flex-1 flex-col"
            >
              <div className="relative min-h-0 flex-1 overflow-hidden rounded-[24px] border border-sand-line">
                <img
                  src={state.gradePhoto}
                  alt="The project you're about to have graded"
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="mt-4 text-center text-[13.5px] leading-[1.45] text-muted-foreground">
                Clear enough to judge? Retake it if the light's fighting you.
              </p>
            </motion.div>
          )}

          {/* ── grading ── */}
          {state.gradeStage === "grading" && (
            <motion.div
              key="grading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: DUR.fast }}
              className="flex flex-1 flex-col"
            >
              {state.gradePhoto && (
                <div className="relative mb-4 h-[168px] overflow-hidden rounded-[20px] border border-sand-line">
                  <img src={state.gradePhoto} alt="" className="h-full w-full object-cover opacity-45" />
                  {/* A scan line, so the wait has a direction. */}
                  <motion.div
                    className="absolute inset-x-0 h-[2px]"
                    style={{ background: "var(--spice-grad-bright)", boxShadow: "0 0 18px hsl(var(--spice-400))" }}
                    animate={{ top: ["4%", "96%", "4%"] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                  />
                </div>
              )}
              <div className="mb-4 flex items-center gap-2.5">
                <span className="anim-spin h-4 w-4 rounded-full border-2 border-spice-400/25 border-t-spice-400" />
                <span className="text-[15px] font-semibold">Looking at your project…</span>
              </div>
              <GradeSkeleton />
            </motion.div>
          )}

          {/* ── the verdict ── */}
          {state.gradeStage === "result" && grade && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: DUR.base, ease: EASE_OUT }}
              className="flex flex-1 flex-col"
            >
              <div className="flex flex-col items-center">
                <ScoreRing score={grade.score} />
                <div className="mt-4 max-w-[290px] text-center text-[19px] font-bold leading-[1.3]">
                  {grade.headline}
                </div>
              </div>

              <div className="sietch-card mt-6 p-5">
                <div className="eyebrow eyebrow-muted mb-3.5">The breakdown</div>
                <div className="flex flex-col gap-3">
                  {GRADE_RUBRIC.map((r, i) => (
                    <div key={r.key} className="flex items-center gap-3">
                      <span className="w-[60px] flex-none text-[12.5px] font-semibold text-muted-foreground">
                        {r.label}
                      </span>
                      <span className="h-[6px] flex-1 overflow-hidden rounded-full bg-[hsl(var(--muted))]">
                        <motion.span
                          className="block h-full rounded-full"
                          style={{ background: "var(--spice-grad)" }}
                          initial={{ width: 0 }}
                          animate={{ width: `${grade.rubric[r.key] ?? 0}%` }}
                          transition={{ duration: DUR.slow, ease: EASE_OUT, delay: 0.15 + stagger(i, 0.07) }}
                        />
                      </span>
                      <span className="readout w-[28px] flex-none text-right text-[12.5px] font-bold text-spice-200">
                        {grade.rubric[r.key] ?? 0}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {grade.strengths.length > 0 && (
                <div className="mt-3.5 flex flex-col gap-2">
                  {grade.strengths.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2.5 rounded-[14px] border border-sand-line raise p-3.5"
                    >
                      <span className="mt-px flex-none text-spice-400"><Check size={14} /></span>
                      <span className="text-[13.5px] leading-[1.45]">{s}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="sietch-card-warm mt-3.5 p-4">
                <div className="eyebrow mb-2 flex items-center gap-1.5">
                  <Sparkle size={12} /> Do this next
                </div>
                <p className="text-[14.5px] leading-[1.5]">{grade.nextStep}</p>
              </div>

              {!GRADER_IS_LIVE && (
                <p className="mt-4 text-center text-[11.5px] leading-[1.45] text-muted-foreground">
                  Scored on-device against the rubric. Point <code>VITE_GRADER_ENDPOINT</code> at a
                  server holding your model key to have a model judge the photo instead.
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── the action for whichever stage you're in ── */}
      <div className="mt-4 flex flex-none flex-col gap-2.5">
        {state.gradeStage === "intro" && (
          <PrimaryAction
            onClick={() => fileRef.current?.click()}
            busy={reading}
            tooltip="Open your camera and photograph this project"
          >
            <span className="flex items-center gap-2">
              <Camera size={18} /> Take a photo
            </span>
          </PrimaryAction>
        )}

        {state.gradeStage === "camera" && (
          <>
            <PrimaryAction onClick={actions.runGrade} tooltip="Send this photo to be scored">
              Grade it
            </PrimaryAction>
            <PrimaryAction
              variant="quiet"
              onClick={() => fileRef.current?.click()}
              busy={reading}
              tooltip="Take a different photo"
              className="h-[50px] text-[15px]"
            >
              Retake
            </PrimaryAction>
          </>
        )}

        {state.gradeStage === "result" && (
          <>
            <PrimaryAction onClick={actions.closeGrade} tooltip="Back to your projects">
              Done
            </PrimaryAction>
            <Tip label="Photograph it again and get a fresh score">
              <button
                onClick={actions.resetGrade}
                className="h-11 w-full rounded-[14px] text-[14px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                Grade another shot
              </button>
            </Tip>
          </>
        )}
      </div>
    </div>
  );
}
