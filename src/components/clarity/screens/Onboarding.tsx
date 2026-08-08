// Clarity — first-run onboarding.
//
// A conversation, not a quiz. Three things keep it on the right side of that
// line, and all three were mistakes in the first version of this screen:
//
//   1. **One bubble per bot turn.** The acknowledgement and the next question
//      are fused into a single utterance. Posting "Noted." and then a separate
//      question is how a form advances, not how a person talks.
//   2. **Nothing gates the conversation.** Interests are typed in your own
//      words; the category chips are suggestions sitting above the input that
//      fill the box when tapped. The previous version made you clear a
//      chip-picker screen before you could say anything.
//   3. **It asks once, broadly.** The old flow interrogated every category one
//      at a time — "What in tech, exactly?", then "What in sports, exactly?" —
//      which is four questions where one will do.
//
// The order is deliberate too: the goal comes before the interests, so the bot
// is established as something helping you get somewhere before it asks what to
// put in your feed. Everything after that is framed against the goal.
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useClarity } from "@/lib/clarityStore";
import { INTEREST_CATEGORIES, categoryLabel, matchCategories } from "@/lib/feeds";
import { chatReply, type ChatTurn, type UserProfile } from "@/lib/aiService";
import { DUR, EASE_OUT, SPRING } from "@/lib/motion";
import { ArrowUpRight } from "../icons";

type Step = "name" | "goal" | "interests" | "refine" | "done";

const OPENER =
  "Hey — I'm Clarity.\n\nMost people end up here because their phone is quietly eating time they'd rather spend on something else. I'm going to hand that time back, and give you one short read a day instead of the endless scroll.\n\nWhat should I call you?";

export default function Onboarding() {
  const { actions } = useClarity();

  const [turns, setTurns] = useState<ChatTurn[]>([{ role: "bot", text: OPENER }]);
  const [step, setStep] = useState<Step>("name");
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);

  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    interests: [],
    specifics: {},
    goal: "",
    avoid: "",
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [turns, typing]);

  // Refocus once the bot finishes composing. The input is disabled while it
  // types (see below), and a disabled field drops focus.
  useEffect(() => {
    if (!typing && step !== "done") inputRef.current?.focus();
  }, [typing, step]);

  const say = (role: ChatTurn["role"], text: string) =>
    setTurns((t) => [...t, { role, text }]);

  /** Bot turns pause first — an instant reply reads like a lookup, not a person. */
  const botSays = async (text: string, ms = 560) => {
    setTyping(true);
    await new Promise((r) => setTimeout(r, ms));
    setTyping(false);
    say("bot", text);
  };

  async function submit(raw?: string) {
    const value = (raw ?? draft).trim();
    if (!value || typing) return;

    say("user", value);
    setDraft("");
    const history = [...turns, { role: "user" as const, text: value }];

    if (step === "name") {
      const name = value.split(/\s+/)[0].replace(/[^\p{L}\p{N}'-]/gu, "");
      setProfile((p) => ({ ...p, name }));
      await botSays(
        `Good to meet you, ${name || "you"}.\n\nSo before anything else — if the scrolling stopped tomorrow, what would you want that time going into instead?`,
      );
      setStep("goal");
      return;
    }

    if (step === "goal") {
      setProfile((p) => ({ ...p, goal: value }));
      // The bot reacts to the goal, then asks the next thing in the same breath.
      setTyping(true);
      const reply = await chatReply(history, value);
      setTyping(false);
      say(
        "bot",
        `${reply.message}\n\nI still want you in the loop on things you actually care about though — just once a day rather than all day. What do you like keeping up with?`,
      );
      setStep("interests");
      return;
    }

    if (step === "interests") {
      const matched = matchCategories(value);

      if (!matched.length) {
        // Couldn't place it. Ask rather than guess — a wrong digest on day one
        // is worse than one more turn here.
        await botSays(
          "I'm not sure what to pull for that one. Try it another way, or tap one of the suggestions below — they're broad on purpose.",
          420,
        );
        return;
      }

      setProfile((p) => ({ ...p, interests: matched }));
      const named = matched.map(categoryLabel).join(" and ");

      setTyping(true);
      const reply = await chatReply(history, value);
      setTyping(false);
      say(
        "bot",
        `${reply.message}\n\nI've got you down for ${named}. Anything particular inside that I should watch for — a team, a company, a topic? Skip it if not.`,
      );
      setStep("refine");
      return;
    }

    if (step === "refine") {
      finish(value);
    }
  }

  /** A chip fills the box rather than submitting — the words stay theirs. */
  function addChip(label: string) {
    setDraft((d) => (d.trim() ? `${d.replace(/,\s*$/, "")}, ${label}` : label));
    inputRef.current?.focus();
  }

  function finish(refinement: string) {
    const clean = refinement.trim();
    const primary = profile.interests[0];
    actions.finishOnboarding({
      ...profile,
      specifics: clean && primary ? { [primary]: clean } : {},
    });
  }

  const placeholder =
    step === "name"
      ? "Your name"
      : step === "goal"
        ? "Whatever you keep meaning to get to"
        : step === "interests"
          ? "In your own words"
          : "A team, a company, a topic";

  const progress =
    step === "name" ? 0.08 : step === "goal" ? 0.34 : step === "interests" ? 0.64 : 0.88;

  return (
    <div className="absolute inset-0 flex flex-col bg-background">
      <h1 className="sr-only">Setting up Clarity</h1>

      <div
        className="absolute left-0 right-0 z-20 h-[3px] bg-[hsl(var(--muted))]"
        style={{ top: "calc(52px + var(--safe-t))" }}
      >
        <motion.div
          data-progress
          className="h-full rounded-r-full"
          style={{ background: "var(--spice-grad)" }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: DUR.slow, ease: EASE_OUT }}
        />
      </div>

      {/* transcript */}
      <div
        ref={scrollRef}
        role="log"
        aria-live="polite"
        aria-label="Setup conversation"
        className="clarity-scroll flex-1 overflow-y-auto px-5 pb-4 pt-[calc(72px_+_var(--safe-t))]"
      >
        <div className="flex flex-col gap-3">
          {turns.map((turn, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={SPRING.crisp}
              className={turn.role === "bot" ? "self-start" : "self-end"}
              style={{ maxWidth: "86%" }}
            >
              {/* The e2e suite asserts one bubble per bot turn — the property
                  that keeps this reading as talk rather than a form — so the
                  role needs a stable hook that isn't a utility class. */}
              <div
                data-turn={turn.role}
                className={
                  turn.role === "bot"
                    ? "sietch-card whitespace-pre-line rounded-[18px] rounded-bl-[6px] px-4 py-3 text-[15px] leading-[1.5]"
                    : "spice-grad whitespace-pre-line rounded-[18px] rounded-br-[6px] px-4 py-3 text-[15px] font-semibold leading-[1.5] text-[hsl(var(--primary-foreground))]"
                }
              >
                {turn.text}
              </div>
            </motion.div>
          ))}

          <AnimatePresence>
            {typing && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="sietch-card flex w-[58px] items-center justify-center gap-1 self-start rounded-[18px] rounded-bl-[6px] px-4 py-4"
              >
                {[0, 1, 2].map((d) => (
                  <motion.span
                    key={d}
                    className="h-[6px] w-[6px] rounded-full bg-spice-300"
                    animate={{ opacity: [0.25, 1, 0.25] }}
                    transition={{ duration: 1.1, repeat: Infinity, delay: d * 0.18 }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* answer area — always a text box, never a gate */}
      <div
        className="flex-none border-t border-sand-line px-5 pt-3"
        style={{ paddingBottom: "max(20px, env(safe-area-inset-bottom))" }}
      >
        {step === "interests" && (
          <div className="clarity-scroll -mx-1 mb-2.5 flex gap-2 overflow-x-auto px-1 pb-1">
            {INTEREST_CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => addChip(c.label)}
                className="h-9 flex-none rounded-full border border-sand-line px-3.5 text-[13px] font-medium text-muted-foreground transition-colors hover:border-spice-400/40 hover:text-foreground"
              >
                {c.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2.5">
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void submit();
            }}
            placeholder={placeholder}
            aria-label={placeholder}
            maxLength={160}
            // Disabled while the bot composes. Without this an Enter pressed
            // in that window was swallowed by the guard in `submit` — the text
            // stayed in the box, nothing happened, and nothing said why.
            // This is a guided flow, so answering a question that hasn't been
            // asked yet has no meaning; making the wait visible beats
            // pretending the keypress landed.
            disabled={typing}
            className="h-[52px] flex-1 rounded-[16px] border border-sand-line raise px-4 text-[15px] text-foreground outline-none transition-opacity placeholder:text-muted-foreground focus:border-spice-400/50 disabled:opacity-55"
          />
          <button
            onClick={() => void submit()}
            disabled={!draft.trim() || typing}
            aria-label="Send"
            className="spice-grad grid h-[52px] w-[52px] flex-none place-items-center rounded-[16px] text-[hsl(var(--primary-foreground))] disabled:opacity-35"
          >
            <ArrowUpRight size={19} />
          </button>
        </div>

        {step === "refine" && (
          <button
            onClick={() => finish("")}
            className="mt-2 h-11 w-full text-[13.5px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            Nothing specific — I&rsquo;m done
          </button>
        )}
      </div>
    </div>
  );
}
