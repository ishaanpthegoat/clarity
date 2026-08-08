// Clarity — the daily digest.
//
// The whole promise of this screen is that it *ends*. One summary per interest,
// a read time in the header, and a button at the bottom that closes it out.
// There is no infinite list here by design — that is the thing the app exists
// to replace.
import { motion } from "motion/react";
import { useClarity } from "@/lib/clarityStore";
import { categoryLabel } from "@/lib/feeds";
import { greet, goalPhrase, rankHeadlines, specificFor } from "@/lib/personalize";
import { DUR, EASE_OUT, stagger } from "@/lib/motion";
import { PrimaryAction } from "../Action";
import { Check, Sparkle } from "../icons";

function Loading() {
  return (
    <div className="flex flex-col gap-3.5" aria-live="polite" aria-busy="true">
      <span className="sr-only">Putting today&rsquo;s digest together</span>
      {[0, 1, 2].map((i) => (
        <div key={i} className="sietch-card p-5">
          <div className="skeleton mb-3 h-3 w-20 rounded-full" />
          <div className="skeleton mb-2 h-4 w-full rounded-full" />
          <div className="skeleton mb-2 h-4 w-[92%] rounded-full" />
          <div className="skeleton h-4 w-[64%] rounded-full" />
        </div>
      ))}
    </div>
  );
}

export default function Digest() {
  const { state, actions, derived } = useClarity();
  const digest = state.digest;
  const done = derived.digestDone;
  const goal = state.profile.goal ? goalPhrase(state.profile.goal) : null;

  return (
    <div className="anim-fadeIn clarity-scroll absolute inset-0 flex flex-col overflow-y-auto bg-background px-[22px] pb-[118px] pt-[calc(78px_+_var(--safe-t))]">
      <div className="mb-1 flex items-baseline justify-between">
        <h1 className="font-display text-[32px] font-semibold uppercase tracking-[0.03em]">
          {greet(state.profile.name).replace(/,.*/, "") === "Good morning"
            ? "Morning read"
            : "Your digest"}
        </h1>
        {digest && (
          <span className="readout text-[12.5px] font-semibold text-spice-300">
            {digest.readMins} min
          </span>
        )}
      </div>
      <p className="mb-6 text-[14.5px] leading-[1.5] text-muted-foreground">
        {done ? (
          <>
            That&rsquo;s you caught up{state.profile.name ? `, ${state.profile.name}` : ""}. It
            refreshes in the morning
            {goal ? <> — the rest of today is for {goal}</> : null}.
          </>
        ) : (
          <>
            Everything you follow, once
            {goal ? <>, so the rest of the day can go on {goal}</> : null}.
          </>
        )}
      </p>

      {state.digestLoading && !digest ? (
        <Loading />
      ) : !digest || digest.entries.length === 0 ? (
        <div className="rounded-[18px] border border-dashed border-sand-line px-5 py-10 text-center">
          <div className="text-[16px] font-semibold">Nothing to read yet</div>
          <p className="mx-auto mt-2 max-w-[260px] text-[14px] leading-[1.5] text-muted-foreground">
            Pick a few things you follow in Settings and tomorrow&rsquo;s digest will
            have something in it.
          </p>
          <button
            onClick={() => actions.go("settings")}
            className="mt-5 h-11 rounded-[13px] border border-spice-400/40 bg-spice-400/[0.12] px-5 text-[13.5px] font-semibold text-spice-200"
          >
            Choose your interests
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3.5">
            {digest.entries.map((entry, i) => {
              // The summary is shared by everyone who follows this category —
              // that is what keeps it cheap. The personalisation happens here,
              // on the result: their own words decide which headlines surface
              // and which disappear, and it costs nothing.
              const specific = specificFor(state.profile, entry.category);
              const { matched, rest, hidden } = rankHeadlines(entry.headlines, state.profile);

              return (
                <motion.section
                  key={entry.category}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: DUR.base, ease: EASE_OUT, delay: stagger(i) }}
                  className="sietch-card p-5"
                  aria-labelledby={`digest-${entry.category}`}
                >
                  <div className="mb-2.5 flex items-baseline justify-between gap-3">
                    <h2 id={`digest-${entry.category}`} className="eyebrow">
                      {categoryLabel(entry.category)}
                    </h2>
                    {specific && (
                      <span className="truncate text-[11.5px] text-muted-foreground">
                        you follow {specific}
                      </span>
                    )}
                  </div>

                  <p className="text-[15.5px] leading-[1.55] text-foreground/90">
                    {entry.summary}
                  </p>

                  {/* Anything matching what they actually said, pulled out of
                      the list so it isn't buried in what fed the summary. */}
                  {matched.length > 0 && (
                    <div className="mt-4 rounded-[14px] border border-spice-400/25 bg-spice-400/[0.07] p-3.5">
                      <div className="eyebrow mb-2 flex items-center gap-1.5 text-[9.5px]">
                        <Sparkle size={11} /> Closest to what you follow
                      </div>
                      <ul className="flex flex-col gap-1.5">
                        {matched.map((h, j) => (
                          <li key={j} className="text-[13.5px] leading-[1.4] text-foreground/90">
                            {h.title}{" "}
                            <span className="text-foreground/45">· {h.source}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {rest.length > 0 && (
                    <div className="mt-4 border-t border-sand-line pt-3.5">
                      <div className="eyebrow eyebrow-muted mb-2 text-[9.5px]">
                        {matched.length ? "Also today" : "What fed this"}
                      </div>
                      <ul className="flex flex-col gap-1.5">
                        {rest.slice(0, 4).map((h, j) => (
                          <li key={j} className="flex gap-2 text-[13px] leading-[1.4]">
                            <span className="mt-[7px] h-1 w-1 flex-none rounded-full bg-spice-400" />
                            <span className="text-muted-foreground">
                              {h.title}{" "}
                              <span className="text-foreground/45">· {h.source}</span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Say it out loud rather than silently dropping things — a
                      filter you can't see is one you can't trust.

                      Worded as "left out of the list" because that is exactly
                      what happens: the summary above is written once for
                      everyone who follows this category, so it may still
                      mention a story the list omits. Claiming it was "hidden"
                      outright would be a promise this design can't keep. */}
                  {hidden > 0 && (
                    <div className="mt-3 text-[12px] leading-[1.45] text-muted-foreground">
                      {hidden} {hidden === 1 ? "story" : "stories"} left out of the list —
                      you asked for less &ldquo;{state.profile.avoid}&rdquo;.
                    </div>
                  )}
                </motion.section>
              );
            })}
          </div>

          <div className="mt-5">
            {done ? (
              <div className="flex items-center justify-center gap-2 rounded-[18px] border border-spice-400/25 bg-spice-400/[0.07] py-4 text-[14px] font-semibold text-spice-200">
                <Check size={15} /> Done for today
              </div>
            ) : (
              <PrimaryAction
                onClick={actions.markDigestRead}
                tooltip="Close today's digest out"
                className="h-[54px] text-[16px]"
              >
                That&rsquo;s me caught up
              </PrimaryAction>
            )}
          </div>
        </>
      )}
    </div>
  );
}
