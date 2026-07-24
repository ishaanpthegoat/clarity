// Clarity — Daily Read. Read the article, then record a short video explaining your understanding.
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useClarity } from "@/lib/clarityStore";
import { ARTICLES, ARTICLE_DAYS, type Article } from "@/lib/clarityData";
import { ChevronLeft, Check } from "../icons";

const TODAY = "WED";

function Schedule({ done }: { done: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      {ARTICLE_DAYS.map((d) => {
        const isToday = d === TODAY;
        const isDone = done && isToday;
        return (
          <span
            key={d}
            className="grid h-[26px] w-[26px] place-items-center rounded-full text-[10px] font-bold"
            style={{
              background: isDone ? "#8b6bff" : isToday ? "rgba(139,107,255,.16)" : "rgba(255,255,255,.05)",
              border: "1px solid " + (isToday ? "rgba(139,107,255,.5)" : "rgba(255,255,255,.08)"),
              color: isDone ? "#fff" : isToday ? "#c4b2ff" : "#55555f",
            }}
          >
            {isDone ? "✓" : d[0]}
          </span>
        );
      })}
    </div>
  );
}

function RecordStage() {
  const { actions } = useClarity();
  const [recording, setRecording] = useState(false);
  const [secs, setSecs] = useState(0);

  useEffect(() => {
    if (!recording) return;
    const id = window.setInterval(() => setSecs((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [recording]);

  const mmss = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;

  return (
    <div className="flex flex-1 flex-col">
      <div className="text-[14.5px] leading-[1.5] text-[#8a8a97]">
        In 30–60 seconds, explain the article in your own words. Teaching it back is how it sticks.
      </div>
      <div
        className="relative mt-5 flex flex-1 flex-col items-center justify-center overflow-hidden rounded-[24px]"
        style={{ border: "2px dashed rgba(139,107,255,.35)", background: "radial-gradient(80% 60% at 50% 40%,rgba(139,107,255,.08),rgba(255,255,255,.02))" }}
      >
        {recording && (
          <div className="absolute left-4 top-4 flex items-center gap-2">
            <motion.span
              className="h-2.5 w-2.5 rounded-full bg-[#ff5e6c]"
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span className="clarity-tab-num text-[13px] font-semibold text-white">{mmss}</span>
          </div>
        )}
        <div className="grid h-[92px] w-[92px] place-items-center rounded-full" style={{ background: "rgba(139,107,255,.12)" }}>
          <span className="text-[40px]">🎥</span>
        </div>
        <div className="mt-4 text-[14px] font-medium text-[#8a7fb5]">
          {recording ? "Recording your understanding…" : "Front camera · tap record when ready"}
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center">
        {!recording ? (
          <button onClick={() => setRecording(true)} className="grid h-[74px] w-[74px] place-items-center rounded-full border-4 border-white/15">
            <span className="h-[52px] w-[52px] rounded-full bg-[#ff5e6c]" />
          </button>
        ) : (
          <button onClick={actions.submitArticleVideo} className="grid h-[74px] w-[74px] place-items-center rounded-full border-4 border-white/15">
            <span className="h-[26px] w-[26px] rounded-[6px] bg-white" />
          </button>
        )}
        <div className="mt-3 text-[12px] text-[#55555f]">{recording ? "Tap to stop & submit" : "Tap to record"}</div>
      </div>
    </div>
  );
}

export default function Articles() {
  const { state, actions } = useClarity();
  const article: Article = ARTICLES.find((a) => a.id === (state.currentArticleId ?? "ar-wed")) ?? ARTICLES[2];
  const done = state.articlesDone.includes(article.id);

  return (
    <div className="anim-fadeIn absolute inset-0 flex flex-col bg-black px-[22px] pb-[112px] pt-[78px]">
      <div className="mb-4 flex items-center gap-3.5">
        <button onClick={() => actions.go("home")} className="grid h-10 w-10 flex-none place-items-center rounded-[13px] border border-white/[0.08] bg-white/[0.05] text-[#c9c9d4]">
          <ChevronLeft size={18} />
        </button>
        <span className="text-[24px] font-extrabold tracking-[-0.6px]">Today's read</span>
      </div>

      {/* READ */}
      {state.articleStage === "read" && (
        <div className="clarity-scroll flex flex-1 flex-col overflow-y-auto">
          <div className="mb-4 flex items-center justify-between">
            <Schedule done={done} />
            <span className="text-[12px] text-[#8a8a97]">{done ? "Done for today" : `${article.readMins} min read`}</span>
          </div>
          <div className="text-[11px] font-bold tracking-[2px] text-[#a394ff]">{article.category}</div>
          <div className="mt-2 text-[27px] font-extrabold leading-[1.15] tracking-[-0.7px]">{article.title}</div>
          <div className="mt-2 text-[13px] text-[#8a8a97]">{article.source}</div>
          <div className="mt-5 flex flex-col gap-4 pb-4">
            {article.body.map((p, i) => (
              <p key={i} className="text-[16px] leading-[1.65] text-[#cbc6da]">{p}</p>
            ))}
          </div>
        </div>
      )}

      {/* RECORD */}
      {state.articleStage === "record" && <RecordStage />}

      {/* ANALYZING */}
      {state.articleStage === "analyzing" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6">
          <div className="anim-spin h-[58px] w-[58px] rounded-full border-4 border-[rgba(139,107,255,.18)] border-t-[#9d7bff]" />
          <div className="text-[17px] font-semibold text-[#dcdce4]">Checking your understanding…</div>
          <div className="text-[13.5px] text-[#8a8a97]">Listening to what you explained</div>
        </div>
      )}

      {/* DONE */}
      {state.articleStage === "done" && (
        <div className="anim-pop-in flex flex-1 flex-col items-center justify-center text-center">
          <div className="grid h-24 w-24 place-items-center rounded-full" style={{ background: "linear-gradient(135deg,#9d7bff,#6a4bd6)", boxShadow: "0 0 60px rgba(139,107,255,.5)" }}>
            <Check size={44} />
          </div>
          <div className="mt-6 text-[26px] font-extrabold tracking-[-0.5px]">You get it.</div>
          <div className="mt-2.5 max-w-[280px] text-[15px] leading-[1.5] text-[#8a8a97]">
            Clear, in your own words. That's {state.articlesDone.length} of 4 reads done this week.
          </div>
          <button
            onClick={actions.finishArticle}
            className="mt-8 h-[54px] w-full rounded-[16px] text-[16px] font-bold text-white"
            style={{ background: "linear-gradient(135deg,#9d7bff,#6a4bd6)" }}
          >
            Done
          </button>
        </div>
      )}

      {/* sticky CTA for read stage */}
      {state.articleStage === "read" && !done && (
        <button
          onClick={actions.startArticleRecord}
          className="mt-3 h-[56px] w-full rounded-[18px] text-[16px] font-bold text-white"
          style={{ background: "linear-gradient(135deg,#9d7bff,#6a4bd6)" }}
        >
          I've read it — record my understanding
        </button>
      )}
      {state.articleStage === "read" && done && (
        <button
          onClick={() => actions.go("home")}
          className="mt-3 h-[54px] w-full rounded-[16px] border border-white/[0.08] bg-white/[0.05] text-[15px] font-semibold text-[#c9c9d4]"
        >
          Back home
        </button>
      )}
    </div>
  );
}
