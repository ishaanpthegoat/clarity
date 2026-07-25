// Clarity — the Daily Read, now a tab of its own.
//
// Two things the tab has to get right:
//
//   • Opening it never shows a chooser. Today's read is already on screen,
//     because the whole point is that there is exactly one thing to read today.
//   • Tapping "record my understanding" anywhere else in the app lands you
//     *here*, already recording. The hand-off is the feature; a card on Home
//     that opens a modal would have been a different, worse thing.
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useClarity } from "@/lib/clarityStore";
import { ARTICLES, ARTICLE_DAYS, todaysArticle, type Article } from "@/lib/clarityData";
import { DUR, EASE_OUT, SPRING, stagger } from "@/lib/motion";
import { ArticleSkeleton } from "../Skeletons";
import { IconAction, PrimaryAction, Tip } from "../Action";
import { Check } from "../icons";

/** The Mon–Thu rail. Tapping a day switches the read. */
function Schedule({ currentId, doneIds }: { currentId: string; doneIds: string[] }) {
  const { actions } = useClarity();
  const todayId = todaysArticle().id;

  return (
    <div className="flex items-center gap-1.5">
      {ARTICLE_DAYS.map((d, idx) => {
        const article = ARTICLES[idx];
        if (!article) return null;
        const isCurrent = article.id === currentId;
        const isToday = article.id === todayId;
        const isDone = doneIds.includes(article.id);
        return (
          <Tip
            key={d}
            label={`${article.title}${isDone ? " — done" : ""}${isToday ? " (today)" : ""}`}
          >
            <button
              onClick={() => actions.openArticle(article.id)}
              aria-label={`Read ${d}: ${article.title}`}
              aria-current={isCurrent ? "true" : undefined}
              className="grid h-11 w-11 place-items-center"
            >
              <motion.span
                className="grid h-[28px] w-[28px] place-items-center rounded-full text-[10.5px] font-bold"
                animate={{
                  backgroundColor: isDone
                    ? "hsl(26 88% 48%)"
                    : isCurrent
                      ? "hsl(31 87% 55% / 0.18)"
                      : "rgba(255,255,255,.05)",
                  borderColor: isCurrent ? "hsl(31 87% 55% / 0.55)" : "rgba(255,255,255,.08)",
                  color: isDone ? "#fff" : isCurrent ? "hsl(44 90% 61%)" : "hsl(31 10% 50%)",
                  scale: isCurrent ? 1 : 0.94,
                }}
                transition={SPRING.crisp}
                style={{ borderWidth: 1, borderStyle: "solid" }}
              >
                {isDone ? <Check size={12} /> : d[0]}
              </motion.span>
            </button>
          </Tip>
        );
      })}
    </div>
  );
}

/** Record stage — a paced take, not an open-ended camera. */
function RecordStage({ article }: { article: Article }) {
  const { actions } = useClarity();
  const [recording, setRecording] = useState(false);
  const [secs, setSecs] = useState(0);

  useEffect(() => {
    if (!recording) return;
    const id = window.setInterval(() => setSecs((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [recording]);

  const mmss = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
  // 30s is the floor for a real explanation; under it, people recite the title.
  const longEnough = secs >= 10;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-3">
        <IconAction
          icon={<Check size={16} />}
          label="Read"
          tooltip="Back to the article"
          onClick={() => actions.openArticle(article.id)}
          side="bottom"
        />
        <p className="flex-1 text-[14px] leading-[1.45] text-muted-foreground">
          In 30–60 seconds, explain it in your own words. Teaching it back is how it sticks.
        </p>
      </div>

      <div
        className="relative mt-4 flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden rounded-[24px]"
        style={{
          border: "2px dashed hsl(var(--spice-400) / .35)",
          background: "radial-gradient(80% 60% at 50% 40%,hsl(var(--spice-400) / .08),rgba(255,255,255,.02))",
        }}
      >
        <AnimatePresence>
          {recording && (
            <motion.div
              className="absolute left-4 top-4 flex items-center gap-2"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: DUR.fast, ease: EASE_OUT }}
            >
              <motion.span
                className="h-2.5 w-2.5 rounded-full bg-destructive"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              />
              <span className="readout text-[13px] font-semibold">{mmss}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          className="grid h-[92px] w-[92px] place-items-center rounded-full"
          style={{ background: "hsl(var(--spice-400) / .12)" }}
          animate={recording ? { scale: [1, 1.06, 1] } : { scale: 1 }}
          transition={recording ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : SPRING.smooth}
        >
          <span className="text-[40px]">🎥</span>
        </motion.div>
        <div className="mt-4 px-6 text-center text-[14px] font-medium text-muted-foreground">
          {recording ? "Recording your understanding…" : "Front camera · tap record when ready"}
        </div>
      </div>

      <div className="mt-5 flex flex-none flex-col items-center">
        <Tip label={recording ? "Stop recording and send it to be checked" : "Start recording your explanation"}>
          <button
            onClick={() => (recording ? actions.submitArticleVideo() : setRecording(true))}
            aria-label={recording ? "Stop and submit recording" : "Start recording"}
            className="grid h-[74px] w-[74px] place-items-center rounded-full border-4 border-white/15"
          >
            <motion.span
              className="bg-destructive"
              animate={{
                width: recording ? 26 : 52,
                height: recording ? 26 : 52,
                borderRadius: recording ? 7 : 26,
                backgroundColor: recording ? "#ffffff" : "hsl(8 75% 52%)",
              }}
              transition={SPRING.crisp}
            />
          </button>
        </Tip>
        <div className="mt-3 h-4 text-[12px] text-muted-foreground">
          {recording
            ? longEnough
              ? "Tap to stop & submit"
              : "Keep going — a few more seconds"
            : "Tap to record"}
        </div>
      </div>
    </div>
  );
}

export default function Articles() {
  const { state, actions } = useClarity();

  // The tab always resolves to something readable, so it never opens empty.
  const article: Article =
    ARTICLES.find((a) => a.id === state.currentArticleId) ?? todaysArticle();
  const done = state.articlesDone.includes(article.id);

  // A brief skeleton when you switch reads — the body is swapping under you,
  // and a hard cut between two walls of text is disorienting.
  const [loading, setLoading] = useState(false);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setLoading(true);
    const t = window.setTimeout(() => setLoading(false), 260);
    return () => window.clearTimeout(t);
  }, [article.id]);

  return (
    <div className="absolute inset-0 flex flex-col bg-background px-[22px] pb-[112px] pt-[calc(78px_+_var(--safe-t))]">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h1 className="text-[24px] font-extrabold tracking-[-0.6px]">
          {article.id === todaysArticle().id ? "Today's read" : `${article.day}'s read`}
        </h1>
        <span className="text-[12px] text-muted-foreground">
          {state.articlesDone.length}/4 this week
        </span>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {/* READ */}
        {state.articleStage === "read" && (
          <motion.div
            key={`read-${article.id}-${loading}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DUR.fast, ease: EASE_OUT }}
            className="clarity-scroll flex min-h-0 flex-1 flex-col overflow-y-auto"
          >
            {loading ? (
              <ArticleSkeleton />
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <Schedule currentId={article.id} doneIds={state.articlesDone} />
                  <span className="text-[12px] text-muted-foreground">
                    {done ? "Done" : `${article.readMins} min read`}
                  </span>
                </div>
                <div className="text-[11px] font-bold tracking-[2px] text-spice-400">{article.category}</div>
                <h2 className="mt-2 text-[27px] font-extrabold leading-[1.15] tracking-[-0.7px]">
                  {article.title}
                </h2>
                <div className="mt-2 text-[13px] text-muted-foreground">{article.source}</div>
                <div className="mt-5 flex flex-col gap-4 pb-4">
                  {article.body.map((p, i) => (
                    <motion.p
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: DUR.base, ease: EASE_OUT, delay: stagger(i, 0.05) }}
                      className="text-[16px] leading-[1.65] text-foreground/80"
                    >
                      {p}
                    </motion.p>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* RECORD */}
        {state.articleStage === "record" && (
          <motion.div
            key="record"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: DUR.base, ease: EASE_OUT }}
            className="flex min-h-0 flex-1 flex-col"
          >
            <RecordStage article={article} />
          </motion.div>
        )}

        {/* ANALYZING */}
        {state.articleStage === "analyzing" && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DUR.fast }}
            className="flex flex-1 flex-col items-center justify-center gap-6"
          >
            <div className="anim-spin h-[58px] w-[58px] rounded-full border-4 border-spice-400/[0.18] border-t-spice-400" />
            <div className="text-[17px] font-semibold text-foreground/90">Checking your understanding…</div>
            <div className="text-[13.5px] text-muted-foreground">Listening to what you explained</div>
          </motion.div>
        )}

        {/* DONE */}
        {state.articleStage === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={SPRING.bouncy}
            className="flex flex-1 flex-col items-center justify-center text-center"
          >
            <motion.div
              className="grid h-24 w-24 place-items-center rounded-full"
              style={{ background: "var(--spice-grad)", boxShadow: "0 0 60px hsl(var(--spice-400) / .5)" }}
              initial={{ scale: 0.5, rotate: -12 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={SPRING.bouncy}
            >
              <Check size={44} />
            </motion.div>
            <div className="mt-6 text-[26px] font-extrabold tracking-[-0.5px]">You get it.</div>
            <p className="mt-2.5 max-w-[280px] text-[15px] leading-[1.5] text-muted-foreground">
              Clear, in your own words. That&rsquo;s {state.articlesDone.length} of 4 reads done this week.
            </p>
            <div className="mt-8 w-full">
              <PrimaryAction onClick={actions.finishArticle} tooltip="Back to the reading list">
                Done
              </PrimaryAction>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The read stage's action, pinned under the scroll area. */}
      {state.articleStage === "read" && !loading && (
        <div className="mt-3 flex-none">
          {done ? (
            <PrimaryAction
              variant="quiet"
              onClick={() => actions.go("home")}
              tooltip="You've already explained this one back"
              className="h-[50px] text-[15px]"
            >
              Done for today — back home
            </PrimaryAction>
          ) : (
            <PrimaryAction
              onClick={() => actions.startArticleRecord(article.id)}
              tooltip="Record a short video explaining this article in your own words"
            >
              I&rsquo;ve read it — record my understanding
            </PrimaryAction>
          )}
        </div>
      )}
    </div>
  );
}
