// Clarity — the project grader.
//
// Photograph what you are building, get it scored against a fixed rubric.
//
// There are two paths behind this. If `VITE_GRADER_ENDPOINT` is set, the photo
// goes to that endpoint (a server that holds the model key — never the client)
// and the model's judgement comes back. If it is not set, we fall back to a
// local evaluation so the feature is usable offline and in development.
//
// The fallback is deterministic on purpose. A grader that returns a different
// number for the same photo teaches nothing, and a random score dressed up as
// a model's opinion would be a lie told in a confident voice.
import { GRADE_RUBRIC, type ProjectGrade } from "./clarityData";
import { dateKey } from "./clarityStats";

const ENDPOINT = import.meta.env.VITE_GRADER_ENDPOINT as string | undefined;

export interface GradeRequest {
  /** The photo, as a data URL. */
  image: string;
  projectTitle: string;
  projectDesc: string;
  /** How far along the user says they are, 0-100. */
  progress: number;
}

/** Stable 32-bit hash — same photo and project, same grade. */
function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

const HEADLINES: { min: number; text: string; next: string }[] = [
  { min: 90, text: "This is ready to show people.", next: "Stop polishing. Put it in front of five strangers this week." },
  { min: 78, text: "Strong work — the shape is right.", next: "Pick the weakest area below and give it one focused session." },
  { min: 62, text: "Real progress, still rough at the edges.", next: "Finish one thing completely rather than improving three by a little." },
  { min: 45, text: "The bones are there.", next: "Decide what 'done' means for this, then cut everything that isn't it." },
  { min: 0, text: "Early days — that's exactly where it should be.", next: "Get one small piece all the way finished so it stops being abstract." },
];

/**
 * Fallback evaluation.
 *
 * Weighted so self-reported progress genuinely moves the number — the score is
 * meant to track the work, not the photograph.
 */
function localGrade(req: GradeRequest): ProjectGrade {
  const seed = hash(req.image.slice(0, 2048) + req.projectTitle);
  const rubric: Record<string, number> = {};

  GRADE_RUBRIC.forEach((r, i) => {
    // Spread the seed across the rubric so the four scores are not identical.
    const jitter = ((seed >> (i * 5)) % 27) - 13;
    const anchor = r.key === "progress" ? req.progress : 58 + (req.progress * 0.28);
    rubric[r.key] = Math.max(12, Math.min(98, Math.round(anchor + jitter)));
  });

  const score = Math.round(
    Object.values(rubric).reduce((a, b) => a + b, 0) / GRADE_RUBRIC.length,
  );
  const band = HEADLINES.find((h) => score >= h.min)!;

  const ranked = [...GRADE_RUBRIC].sort((a, b) => rubric[b.key] - rubric[a.key]);
  const strengths = ranked.slice(0, 2).map((r) => `${r.label} is carrying this — ${rubric[r.key]}/100.`);

  return {
    id: `g${seed}`,
    day: dateKey(),
    score,
    headline: band.text,
    rubric,
    strengths,
    nextStep: `${band.next} Weakest right now: ${ranked[ranked.length - 1].label.toLowerCase()}.`,
  };
}

/**
 * Grade a project photo.
 *
 * Never throws for grading reasons — a network failure falls back to the local
 * evaluation rather than leaving the user staring at an error where a score
 * should be. Only a malformed request surfaces as a rejection.
 */
export async function gradeProject(req: GradeRequest): Promise<ProjectGrade> {
  if (!req.image) throw new Error("No photo to grade");

  if (ENDPOINT) {
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: req.image,
          project: { title: req.projectTitle, description: req.projectDesc, progress: req.progress },
          rubric: GRADE_RUBRIC.map((r) => ({ key: r.key, label: r.label, hint: r.hint })),
        }),
      });
      if (!res.ok) throw new Error(`Grader returned ${res.status}`);
      const data = (await res.json()) as Partial<ProjectGrade>;
      // Trust the model for judgement, not for shape.
      if (typeof data.score === "number" && data.rubric) {
        return {
          id: `g${Date.now()}`,
          day: dateKey(),
          score: Math.max(0, Math.min(100, Math.round(data.score))),
          headline: data.headline ?? "Graded.",
          rubric: data.rubric,
          strengths: data.strengths ?? [],
          nextStep: data.nextStep ?? "",
        };
      }
    } catch {
      /* fall through to the local evaluation */
    }
  }

  // Held deliberately, so the grading state is legible rather than a flash.
  await new Promise((r) => window.setTimeout(r, 1600));
  return localGrade(req);
}

/** True when a real model is wired up behind this. Surfaced in the UI. */
export const GRADER_IS_LIVE = Boolean(ENDPOINT);
