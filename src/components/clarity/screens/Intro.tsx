// Clarity — first-run scrollytelling.
//
// One pinned stage, five acts, and the scroll position is the only clock. The
// media layer never unmounts; each act's footage and copy cross-fade through
// their slice of `scrollYProgress`, which is what makes it read as one
// continuous film rather than five slides.
//
// Two deliberate calls:
//
//   • The clips autoplay and loop rather than being frame-scrubbed. Scrubbing
//     `currentTime` is the showier trick, but these files are not encoded with
//     dense keyframes, so seeking stutters. Continuous playback under a
//     scroll-driven cross-fade is smoother and reads the same.
//   • Only the act you can actually see is playing. Five decoding 720p videos
//     will drop frames on a mid-range phone; one will not.
import { useEffect, useRef, useState, type RefObject } from "react";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useClarity } from "@/lib/clarityStore";
import LEDLogo from "../LEDLogo";
import { PrimaryAction, Tip } from "../Action";
import { DUR, EASE_OUT, prefersReducedMotion } from "@/lib/motion";
import { publicUrl } from "@/lib/asset";
import { ChevronDown } from "../icons";

type Scene = {
  media: string;
  /** Shown while the video decodes, and used under reduced motion. */
  brand?: boolean;
  kicker?: string;
  title?: string;
  body: string;
  /** Warm the borrowed footage into the spice palette. */
  tint: number;
};

const SCENES: Scene[] = [
  {
    media: publicUrl("/clarity/scene-dunes.mp4"),
    brand: true,
    body: "Get back your clarity.",
    tint: 0.5,
  },
  {
    media: publicUrl("/clarity/scene-pull.mp4"),
    kicker: "THE PROBLEM",
    title: "Your focus is being spent for you",
    body: "The apps are engineered to hold your attention. Willpower alone was never going to win that fight.",
    tint: 0.34,
  },
  {
    media: publicUrl("/clarity/scene-lock.mp4"),
    kicker: "STEP ONE",
    title: "Lock away the noise",
    body: "Put your most distracting apps behind a lock during the hours that actually matter.",
    tint: 0.42,
  },
  {
    media: publicUrl("/clarity/scene-ignite.mp4"),
    kicker: "STEP TWO",
    title: "Give one thing your focus",
    body: "Name a single task for the day. A focus session keeps you honest until it's done.",
    tint: 0.3,
  },
  {
    media: publicUrl("/clarity/scene-dawn.mp4"),
    kicker: "STEP THREE",
    title: "Earn your clarity back",
    body: "Finish focused blocks to unlock time — and watch the day build the way you meant it to.",
    tint: 0.46,
  },
];

const N = SCENES.length;
const SEG = 1 / N;

/**
 * 0-1 scroll progress of a specific element.
 *
 * Motion's `useScroll({ container })` reports zero here — with the track sized
 * in percentages inside an absolutely-positioned scroller it measures no scroll
 * range and silently falls back to the window, which never moves in a fixed
 * device frame. Reading the element directly is a dozen lines and leaves
 * nothing to infer.
 */
function useContainerProgress(ref: RefObject<HTMLElement>): MotionValue<number> {
  const progress = useMotionValue(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const max = el.scrollHeight - el.clientHeight;
      progress.set(max > 0 ? Math.min(1, Math.max(0, el.scrollTop / max)) : 0);
    };

    update();
    el.addEventListener("scroll", update, { passive: true });
    // The track is sized in percentages, so its height only settles once the
    // frame has laid out — and it changes again on rotate.
    const observer = new ResizeObserver(update);
    observer.observe(el);

    return () => {
      el.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [ref, progress]);

  return progress;
}

/**
 * Opacity stops for act `i`.
 *
 * The first act opens already lit and the last one never fades out, so the
 * sequence never begins or ends on a black frame.
 */
function stopsFor(i: number): [number[], number[]] {
  const s = i * SEG;
  if (i === 0) return [[0, SEG * 0.72, SEG * 1.1], [1, 1, 0]];
  if (i === N - 1) return [[s - SEG * 0.42, s + SEG * 0.14, 1], [0, 1, 1]];
  return [
    [s - SEG * 0.42, s + SEG * 0.14, s + SEG * 0.72, s + SEG * 1.1],
    [0, 1, 1, 0],
  ];
}

function Act({
  scene,
  index,
  progress,
  reduced,
}: {
  scene: Scene;
  index: number;
  progress: MotionValue<number>;
  reduced: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stops, values] = stopsFor(index);
  const opacity = useTransform(progress, stops, values);

  // A slow push-in across the act. Small on purpose — anything more and the
  // 9:16 footage starts showing its edges.
  const s = index * SEG;
  const scale = useTransform(
    progress,
    [s - SEG, s + SEG],
    reduced ? [1, 1] : [1.12, 1],
  );

  // Only the visible act decodes. Below the threshold the element is
  // effectively invisible anyway, so nothing is lost by pausing it.
  useMotionValueEvent(opacity, "change", (v) => {
    const el = videoRef.current;
    if (!el) return;
    if (v > 0.06 && !reduced) {
      if (el.paused) void el.play().catch(() => {});
    } else if (!el.paused) {
      el.pause();
    }
  });

  return (
    <motion.div className="absolute inset-0" style={{ opacity }} aria-hidden="true">
      <motion.video
        ref={videoRef}
        className="h-full w-full object-cover"
        style={{ scale }}
        src={scene.media}
        muted
        loop
        playsInline
        preload={index === 0 ? "auto" : "metadata"}
        // The first act is on screen immediately; the rest are started by the
        // opacity listener above once they scroll into range.
        autoPlay={index === 0}
      />
      <div
        className="absolute inset-0 mix-blend-color"
        style={{ background: "linear-gradient(160deg,#f5c542,#c2410c)", opacity: scene.tint }}
      />
    </motion.div>
  );
}

function Copy({
  scene,
  index,
  progress,
  reduced,
  active,
}: {
  scene: Scene;
  index: number;
  progress: MotionValue<number>;
  reduced: boolean;
  /** Only the act on screen is exposed to assistive tech. */
  active: boolean;
}) {
  const [stops, values] = stopsFor(index);
  const opacity = useTransform(progress, stops, values);
  const s = index * SEG;
  // Copy travels slightly faster than the footage behind it — the parallax is
  // what stops the two layers reading as one flat image.
  const y = useTransform(
    progress,
    [s - SEG * 0.5, s + SEG * 0.15, s + SEG * 1.1],
    reduced ? [0, 0, 0] : [34, 0, -34],
  );

  return (
    <motion.div
      className="absolute inset-x-0 bottom-0 px-7 pb-[132px]"
      style={{ opacity, y }}
      // Five stacked acts would otherwise be read out as one wall of text.
      aria-hidden={!active}
    >
      {scene.kicker && <div className="eyebrow">{scene.kicker}</div>}
      {scene.title && (
        <h2 className="font-display mt-2.5 text-[34px] font-semibold uppercase leading-[1.02] tracking-[0.01em]">
          {scene.title}
        </h2>
      )}
      <p
        className={`${scene.title ? "mt-3 " : ""}max-w-[340px] text-[16px] leading-[1.5] text-foreground/85`}
      >
        {scene.body}
      </p>
    </motion.div>
  );
}

export default function Intro() {
  const { actions } = useClarity();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [reduced] = useState(prefersReducedMotion);
  const [act, setAct] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  const scrollYProgress = useContainerProgress(scrollRef);

  // Which act is centred — drives the rail, the brand fade and the final CTA.
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    setAct(Math.min(N - 1, Math.max(0, Math.round(p * (N - 1)))));
    if (p > 0.01) setScrolled(true);
  });

  const brandOpacity = useTransform(scrollYProgress, [0, SEG * 0.55], [1, 0]);
  const hintOpacity = useTransform(scrollYProgress, [0, SEG * 0.3], [1, 0]);
  const onLast = act === N - 1;

  // Under reduced motion the scroll story still works, but nothing should be
  // moving on its own — hold the first frame of each clip instead.
  useEffect(() => {
    if (!reduced) return;
    scrollRef.current?.querySelectorAll("video").forEach((v) => v.pause());
  }, [reduced]);

  /** Jump the scroller to an act — used by the rail. */
  const goToAct = (i: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    el.scrollTo({ top: (i / (N - 1)) * max, behavior: reduced ? "auto" : "smooth" });
  };

  return (
    <div className="absolute inset-0 overflow-hidden bg-background">
      {/* One heading for the whole sequence; each act's title is an h2 under it. */}
      <h1 className="sr-only">Welcome to Clarity</h1>
      <div ref={scrollRef} className="clarity-scroll absolute inset-0 overflow-y-auto overflow-x-hidden">
        {/* The stage. Pinned for the whole scroll; every act lives inside it. */}
        <div className="sticky top-0 overflow-hidden" style={{ height: "100%" }}>
          {SCENES.map((scene, i) => (
            <Act key={scene.media} scene={scene} index={i} progress={scrollYProgress} reduced={reduced} />
          ))}

          {/* Legibility gradient, over the footage and under the words. */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, hsl(20 30% 3% / .38) 0%, hsl(20 30% 3% / .08) 30%, hsl(20 30% 3% / .74) 64%, hsl(var(--void)) 96%)",
            }}
          />

          <motion.div
            className="pointer-events-none absolute inset-x-0 top-[30%] flex flex-col items-center"
            style={{ opacity: brandOpacity }}
          >
            <div style={{ filter: "drop-shadow(0 0 26px hsl(var(--spice-400) / .55))" }}>
              <LEDLogo />
            </div>
          </motion.div>

          {SCENES.map((scene, i) => (
            <Copy
              key={`c${i}`}
              scene={scene}
              index={i}
              progress={scrollYProgress}
              reduced={reduced}
              active={i === act}
            />
          ))}

          {/* Scroll hint — retires the moment it has been obeyed.
              Sits well clear of the copy block above it (which ends at
              pb-[132px]) — a previous 104px offset put the two within a few
              px of each other and they visibly collided on scene 0, whose
              body text has no kicker/title pushing it higher. */}
          {!scrolled && (
            <motion.div
              className="pointer-events-none absolute inset-x-0 bottom-[52px] flex flex-col items-center gap-1.5"
              style={{ opacity: hintOpacity }}
            >
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-foreground/60">
                Scroll
              </span>
              <motion.span
                className="text-foreground/60"
                animate={reduced ? undefined : { y: [0, 5, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              >
                <ChevronDown size={17} />
              </motion.span>
            </motion.div>
          )}
        </div>

        {/* The scroll track. Everything above is pinned, so this is what the
            finger actually moves. */}
        <div style={{ height: `${(N - 1) * 100}%` }} aria-hidden="true" />
      </div>

      {/* ── persistent chrome ── */}
      <Tip label="Skip the intro and go straight to the app" side="bottom">
        <button
          onClick={actions.finishIntro}
          className="absolute right-2 z-20 grid h-11 min-w-11 place-items-center rounded-[12px] px-3 text-[14px] font-semibold text-white/70 transition-colors hover:text-white"
          style={{ top: "calc(52px + var(--safe-t))" }}
        >
          Skip
        </button>
      </Tip>

      {/* Act rail. Each dot is 7px of paint inside a 44px target. */}
      <div className="absolute right-2 top-1/2 z-20 -translate-y-1/2">
        {SCENES.map((_, i) => (
          <Tip key={i} label={`Act ${i + 1} of ${N}`} side="left">
            <button
              onClick={() => goToAct(i)}
              aria-label={`Go to act ${i + 1} of ${N}`}
              aria-current={i === act ? "step" : undefined}
              data-secondary-affordance="true"
              className="grid h-11 w-11 place-items-center"
            >
              <motion.span
                className="block w-[7px] rounded-full"
                animate={{
                  height: i === act ? 22 : 7,
                  backgroundColor:
                    i === act ? "hsl(31 87% 55%)" : "hsl(37 51% 91% / 0.3)",
                }}
                transition={{ duration: DUR.base, ease: EASE_OUT }}
              />
            </button>
          </Tip>
        ))}
      </div>

      {/* The CTA earns its place only once the story has been told. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-7 pb-9">
        <motion.div
          className="pointer-events-auto"
          initial={false}
          animate={{ opacity: onLast ? 1 : 0, y: onLast ? 0 : 16 }}
          transition={{ duration: DUR.base, ease: EASE_OUT }}
          style={{ pointerEvents: onLast ? "auto" : "none" }}
        >
          <PrimaryAction
            onClick={actions.finishIntro}
            tooltip="Finish the intro and open Clarity"
            className="h-[58px] text-[17px]"
          >
            Get started
          </PrimaryAction>
        </motion.div>
      </div>
    </div>
  );
}
