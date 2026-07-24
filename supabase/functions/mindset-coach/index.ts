import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
// Use anon key (not service-role) — content_library + micro_actions are public-read tables.
// Service-role would bypass RLS unnecessarily and create a much larger blast radius if abused.
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";

const ALLOWED_ORIGINS = [
  "https://mindlock-daily-unlock.lovable.app",
  "https://mindlock.app",
  "capacitor://localhost",
  "http://localhost",
  "http://localhost:5173",
  "http://localhost:8081",
  "http://localhost:8082",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

const getTimeOfDay = () => {
  const h = new Date().getUTCHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
};

function blockerToCategories(blockers: string[]): string[] {
  const map: Record<string, string[]> = {
    "Anxiety": ["anxiety", "stress", "breathing", "mental-health", "state-control"],
    "Procrastination": ["discipline", "execution", "habits", "procrastination", "focus"],
    "Self-Doubt": ["self-worth", "courage", "identity", "belief"],
    "Burnout": ["resilience", "health", "happiness", "state-control"],
    "Lack of Focus": ["focus", "habits", "discipline", "neuroscience"],
    "Fear": ["courage", "fear", "resilience", "faith", "belief"],
  };
  const cats = new Set<string>();
  for (const b of blockers) {
    const mapped = map[b] || ["resilience", "mindset"];
    mapped.forEach(c => cats.add(c));
  }
  return [...cats];
}

function goalToCategories(goals: string[]): string[] {
  const map: Record<string, string[]> = {
    "Career": ["execution", "discipline", "growth"],
    "Fitness": ["health", "discipline", "habits"],
    "Relationships": ["relationships", "self-worth"],
    "Mental Health": ["mental-health", "mindset", "anxiety", "self-worth"],
    "Wealth": ["execution", "discipline", "growth"],
    "Creativity": ["purpose", "growth"],
  };
  const cats = new Set<string>();
  for (const g of goals) {
    const mapped = map[g] || ["growth", "mindset"];
    mapped.forEach(c => cats.add(c));
  }
  return [...cats];
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getDisplayType(item: any): string {
  if (item.type === "quote") return "quote";
  if (item.type === "principle") return "affirmation";
  if (item.type === "technique") {
    const c = (item.content || "").toLowerCase();
    // Only classify as breathwork if the content itself is about breathing
    // (category tag alone is not enough — it may be a general mental-health technique)
    if (c.includes("breath") || c.includes("inhale") || c.includes("exhale")) {
      return "breathwork";
    }
    return "challenge";
  }
  return "affirmation";
}

/** Sanitize user-provided strings before prompt injection */
function sanitizeForPrompt(input: string): string {
  return input
    .replace(/ignore\s+(all\s+)?previous\s*(instructions)?/gi, "")
    .replace(/system\s*prompt/gi, "")
    .replace(/you\s+are\s+now/gi, "")
    .replace(/disregard/gi, "")
    .replace(/pretend\s+to\s+be/gi, "")
    .replace(/\n/g, " ")
    .trim()
    .slice(0, 200);
}

function sanitizeArray(arr: string[]): string[] {
  return arr.map(s => sanitizeForPrompt(s)).filter(Boolean);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders(req) });
  }

  try {
    const { name, goals, blockers, feeling, streak, excludeIds, recentMicroActions, checkInNumber } = await req.json();
    const timeOfDay = getTimeOfDay();
    const userName = sanitizeForPrompt(name || "friend");
    const userGoals = sanitizeArray(goals || []);
    const userBlockers = sanitizeArray(blockers || []);
    const mood = Math.max(1, Math.min(5, Number(feeling) || 3));
    const isFirstCheckIn = checkInNumber === 1;

    const relevantCategories = [
      ...blockerToCategories(userBlockers),
      ...goalToCategories(userGoals),
    ];

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // === ALL DB QUERIES IN PARALLEL ===
    const [quotesRes, principlesRes, techniquesRes, microActionsRes] = await Promise.all([
      supabase.from("content_library").select("*")
        .eq("type", "quote")
        .lte("mood_min", mood).gte("mood_max", mood)
        .overlaps("categories", relevantCategories)
        .limit(30),
      supabase.from("content_library").select("*")
        .eq("type", "principle")
        .lte("mood_min", mood).gte("mood_max", mood)
        .overlaps("categories", relevantCategories)
        .limit(30),
      supabase.from("content_library").select("*")
        .eq("type", "technique")
        .lte("mood_min", mood).gte("mood_max", mood)
        .overlaps("categories", relevantCategories)
        .limit(30),
      supabase.from("micro_actions").select("*")
        .lte("mood_min", mood)
        .gte("mood_max", mood),
    ]);

    // Filter out recently shown content
    const idsToExclude = new Set(excludeIds || []);
    const filterExcluded = (items: any[]) => items.filter(i => !idsToExclude.has(i.id));

    // ── Server-side topical relevance filter ──
    // Remove domain-specific content that doesn't match the user's goals
    const FITNESS_CONTENT_WORDS = [
      "push-up", "pushup", "push up", "squat", "plank", "burpee",
      "jumping jack", "workout", "gym", "deadlift", "bench press",
      "pull-up", "pullup", "crunch", "cardio", "sprint", "bodyweight",
    ];
    const FINANCE_CONTENT_WORDS = [
      "bank account", "balance", "expense", "redirect that money",
      "invest ", "portfolio", "stock market", "dividend", "net worth",
      "passive income", "real estate", "trading", "financial",
    ];

    const goalsLower = userGoals.map(g => g.toLowerCase());
    const hasFitnessGoal = goalsLower.includes("fitness");
    const hasWealthGoal = goalsLower.includes("wealth");

    const filterTopicMismatch = (items: any[]) => {
      return items.filter(item => {
        const contentLower = (item.content || "").toLowerCase();
        // If user doesn't have a Fitness goal, remove fitness-specific content
        if (!hasFitnessGoal && FITNESS_CONTENT_WORDS.some(w => contentLower.includes(w))) {
          return false;
        }
        // If user doesn't have a Wealth goal, remove finance-specific content
        if (!hasWealthGoal && FINANCE_CONTENT_WORDS.some(w => contentLower.includes(w))) {
          return false;
        }
        return true;
      });
    };

    const quotes = shuffle(filterTopicMismatch(filterExcluded(quotesRes.data || [])));
    const principles = shuffle(filterTopicMismatch(filterExcluded(principlesRes.data || [])));
    const techniques = shuffle(filterTopicMismatch(filterExcluded(techniquesRes.data || [])));

    let microActionPool = shuffle(microActionsRes.data || []);

    // Topical filter — don't give fitness-specific actions ("drop and do 10 push-ups")
    // to users who didn't pick a Fitness goal. Movement is fine for everyone; gym-framing
    // is not. Same FITNESS_CONTENT_WORDS list used for content filtering.
    microActionPool = microActionPool.filter((a: any) => {
      const text = (a.text || '').toLowerCase();
      if (!hasFitnessGoal && FITNESS_CONTENT_WORDS.some(w => text.includes(w))) return false;
      if (!hasWealthGoal && FINANCE_CONTENT_WORDS.some(w => text.includes(w))) return false;
      return true;
    });

    // Prefer actions that match user's blockers
    const blockerMatches = microActionPool.filter(
      (a: any) => a.blockers && a.blockers.some((b: string) => userBlockers.includes(b))
    );
    const nonBlockerMatches = microActionPool.filter(
      (a: any) => !a.blockers || !a.blockers.some((b: string) => userBlockers.includes(b))
    );
    // Put blocker-relevant actions first
    microActionPool = [...shuffle(blockerMatches), ...shuffle(nonBlockerMatches)];

    // Filter out recently shown micro-actions (by text match)
    const recentTexts = new Set((recentMicroActions || []).map((t: string) => t.toLowerCase()));
    microActionPool = microActionPool.filter((a: any) => !recentTexts.has(a.text.toLowerCase()));

    // On check-in #1 (morning), exclude reflection-past micro-actions since nothing has happened yet.
    // Reflection-past actions: "best thing that happened today", "something you did today", "win from today", etc.
    if (isFirstCheckIn) {
      const reflectionPastKeywords = [
        "best thing", "best thing that happened", "happened today", "something that happened",
        "did today", "you did", "accomplished today", "win from", "from today",
        "about your day", "from the day", "about today"
      ];
      microActionPool = microActionPool.filter((a: any) => {
        const text = (a.text || '').toLowerCase();
        return !reflectionPastKeywords.some(kw => text.includes(kw));
      });
    }

    const MICRO_ACTION_FALLBACKS = [
      "Take 3 deep breaths. On each exhale, let go of one thing weighing on you.",
      "Write down one thing you're proud of today — you earned it.",
      "Stand up, stretch your arms overhead, and hold for 10 deep breaths.",
      "Name the emotion you are feeling out loud right now — just label it.",
      "Fill up a glass of water and drink the whole thing right now.",
    ];

    // Detect if content and micro-action are instruction duplicates (both tell you to do the same thing).
    // E.g., "breathe deeply" content + "take 3 deep breaths" action = duplication.
    const isInstructionDuplicate = (contentText: string, actionText: string): boolean => {
      const cLower = contentText.toLowerCase();
      const aLower = actionText.toLowerCase();
      // Fitness duplication
      if (cLower.includes("push-up") && aLower.includes("push-up")) return true;
      if (cLower.includes("squat") && aLower.includes("squat")) return true;
      // Breathwork duplication
      if (cLower.includes("breath") && aLower.includes("breath")) return true;
      if (cLower.includes("exhale") && aLower.includes("exhale")) return true;
      // Writing duplication
      if (cLower.includes("write down") && aLower.includes("write down")) return true;
      // Speaking duplication
      if (cLower.includes("say") && aLower.includes("say")) return true;
      if (cLower.includes("speak") && aLower.includes("speak")) return true;
      return false;
    };

    // Modality variety: after content is chosen, pick a micro-action whose modality
    // differs from the content's modality (e.g., physical challenge → non-physical action).
    // This prevents pairing two of the same modality back-to-back.
    //
    // micro_actions.category → modality map:
    //   physical → physical | breathwork/cold/environment → sensory
    //   cognitive/digital/visualization → cognitive | gratitude → reflective
    //   social/accountability → social
    const microActionCategoryToModality = (cat: string | null | undefined): string => {
      if (!cat) return 'cognitive';
      const m: Record<string, string> = {
        physical: 'physical',
        breathwork: 'sensory', cold: 'sensory', environment: 'sensory',
        cognitive: 'cognitive', digital: 'cognitive', visualization: 'cognitive',
        gratitude: 'reflective',
        social: 'social', accountability: 'social',
      };
      return m[cat] || 'cognitive';
    };

    // Pick a micro-action, preferring one whose modality ≠ excludeModality.
    // If no alternative exists, fall back to the original pool order (never return nothing).
    const pickMicroAction = (excludeModality: string | null | undefined): string => {
      if (microActionPool.length === 0) {
        return MICRO_ACTION_FALLBACKS[Math.floor(Math.random() * MICRO_ACTION_FALLBACKS.length)];
      }
      if (!excludeModality) return microActionPool[0].text;

      const differentModality = microActionPool.filter(
        (a: any) => microActionCategoryToModality(a.category) !== excludeModality
      );
      if (differentModality.length > 0) return differentModality[0].text;
      // All candidates same modality — accept it rather than returning nothing
      return microActionPool[0].text;
    };

    console.log(`Pool: ${quotes.length}q, ${principles.length}p, ${techniques.length}t | Micro-actions: ${microActionPool.length} available for mood ${mood}`);

    // Build content pool
    const pool: any[] = [
      ...principles.slice(0, 4),
      ...techniques.slice(0, 4),
      ...quotes.slice(0, 4),
    ];

    if (pool.length < 10) {
      const remaining = [...principles.slice(4), ...techniques.slice(4), ...quotes.slice(4)];
      shuffle(remaining);
      while (pool.length < 10 && remaining.length > 0) {
        pool.push(remaining.pop());
      }
    }

    shuffle(pool);

    // Use Gemini to pick BOTH content AND a coherent micro-action (one prompt, one call).
    // We show Gemini ~12 micro-action candidates (blocker-matched first) so it can
    // pick a pair that makes semantic sense — e.g. morning-plan content must NOT pair
    // with an end-of-day reflection action.
    if (pool.length > 0 && GEMINI_API_KEY) {
      const options = pool.map((c, i) => {
        const label = c.type === 'technique' ? 'TECHNIQUE' : c.type === 'principle' ? 'AFFIRMATION' : 'QUOTE';
        return `${i + 1}. [${label}] "${c.content}" \u2014 ${c.author}`;
      }).join("\n");

      const maCandidates = microActionPool.slice(0, 12);
      const maOptions = maCandidates.map((a: any, i: number) =>
        `${i + 1}. "${a.text}"`
      ).join("\n");

      const moodToneGuide = mood >= 4
        ? `CRITICAL TONE: User is feeling GREAT (${mood}/5). Content MUST amplify their energy. Pick content that celebrates momentum, pushes them to level up, or reinforces their winning identity. NEVER pick consolation content ("you are not behind", "you are not broken", "it's okay to struggle") — they don't need comfort, they need CHAMPIONSHIP ENERGY. Think: legacy, dominance, compound growth, raising the bar.`
        : mood <= 2
        ? `CRITICAL TONE: User is feeling LOW (${mood}/5). Content should be compassionate, grounding, and validating. Pick content that acknowledges struggle without being preachy. Think: "you're not alone", "showing up is the win", gentle encouragement. AVOID aggressive push content ("grind harder", "no excuses", "stop being weak").`
        : `TONE: User is feeling NEUTRAL (${mood}/5). Pick content that provides steady encouragement and actionable motivation. Balance between supportive and challenging.`;

      const prompt = `Pick a coherent PAIR for ${userName}: one MOTIVATIONAL content item + one MICRO-ACTION the user will do right now.

About them:
- Goals: ${userGoals.join(", ") || "general growth"}
- Blockers: ${userBlockers.join(", ") || "none specified"}
- Mood: ${mood}/5 (1=struggling, 5=on fire)
- Streak: ${streak || 0} days
- Time: ${timeOfDay}

${moodToneGuide}

CONTENT options (pick ONE number):
${options}

MICRO-ACTION options (pick ONE number):
${maOptions}

RULES for the CONTENT pick:
1. TOPICAL RELEVANCE is the #1 priority. The content MUST relate to the user's actual goals (${userGoals.join(", ") || "general growth"}). Do NOT pick fitness/exercise content (push-ups, workouts, gym) for users without Fitness goals. Do NOT pick relationship content for users without Relationship goals.
2. TONE MATCH is the #2 priority. Match the energy level to their mood.
3. PREFER quotes and affirmations. Only pick a TECHNIQUE if deeply relevant to their goals.

RULES for the MICRO-ACTION pick (pick AFTER the content):
4. COHERENCE with the content is mandatory. The pair must make sense read together.
   - If the CONTENT asks the user to PLAN the day ahead ("three things you will accomplish", "what is your goal today", forward-looking), DO NOT pick an action that reflects on a completed day ("one win from today", "something you did well today"). Those contradict.
   - If the CONTENT asks the user to REFLECT on what already happened, do not pick an action about planning the future.
   - If the CONTENT is a specific technique ("close your eyes and breathe"), the action should NOT repeat the same instruction.
5. MODALITY VARIETY is secondary — prefer an action that uses a different mode (physical / cognitive / reflective / sensory / social) from the content when that's possible without breaking coherence.
6. The action must be something the user can physically do in under 2 minutes, right now.`;

      try {
        const response = await fetch(GEMINI_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            systemInstruction: { parts: [{ text: `You are a content curator for a mindset app. Your job is to pick a coherent PAIR — motivational content + a micro-action — that belongs together. The content must be topically relevant to the user's goals and tone-matched to their mood. The micro-action must be semantically coherent with the content (do not pair "plan your day" content with "reflect on today" actions — they contradict). Respond ONLY with valid JSON containing selectedContentOption (integer) and selectedMicroActionOption (integer).` }] },
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema: {
                type: "OBJECT",
                properties: {
                  selectedContentOption: { type: "INTEGER" },
                  selectedMicroActionOption: { type: "INTEGER" },
                },
                required: ["selectedContentOption", "selectedMicroActionOption"],
              },
              temperature: 0.7,
              maxOutputTokens: 96,
              thinkingConfig: { thinkingBudget: 0 },
            },
          }),
        });

        if (response.ok) {
          const geminiData = await response.json();
          const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const selection = JSON.parse(rawText);
            const contentIdx = (selection.selectedContentOption || 1) - 1;
            const chosen = pool[Math.min(Math.max(contentIdx, 0), pool.length - 1)];

            // Use Gemini's micro-action pick when valid; otherwise fall back to modality heuristic.
            // Also check for instruction duplication — if content and action both tell you to do the same
            // thing (e.g., both say "breathe"), reject and use modality heuristic instead.
            let microAction: string;
            const maIdx = (selection.selectedMicroActionOption || 0) - 1;
            if (maIdx >= 0 && maIdx < maCandidates.length) {
              const candidateAction = maCandidates[maIdx].text;
              if (isInstructionDuplicate(chosen.content, candidateAction)) {
                // Duplication detected — fall back to modality heuristic for a different action
                microAction = pickMicroAction(chosen.modality);
              } else {
                microAction = candidateAction;
              }
            } else {
              microAction = pickMicroAction(chosen.modality);
            }

            const displayType = getDisplayType(chosen);
            const showAuthor = !["MindLock Coach", "MindLock Philosophy", "Neuroscience", "Mindfulness Practice", "CBT Technique", "Expressive Writing", "Meditation Practice", "Positive Psychology", "Exercise Science", "Expressive Writing Research", "Sports Psychology", "Unknown"].includes(chosen.author);

            return new Response(JSON.stringify({
              type: displayType,
              content: chosen.content,
              author: showAuthor ? chosen.author : undefined,
              microAction,
              contentId: chosen.id,
            }), {
              headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
            });
          }
        }
      } catch (aiErr) {
        console.error("AI selection error:", aiErr);
      }
    }

    // Fallback: random content + DB micro-action
    if (pool.length > 0) {
      const chosen = pool[Math.floor(Math.random() * pool.length)];
      const displayType = getDisplayType(chosen);
      const showAuthor = !["MindLock Coach", "MindLock Philosophy", "Neuroscience", "Unknown"].includes(chosen.author);
      return new Response(JSON.stringify({
        type: displayType,
        content: chosen.content,
        author: showAuthor ? chosen.author : undefined,
        microAction: pickMicroAction(chosen.modality),
        contentId: chosen.id,
      }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      type: "affirmation",
      content: "You showed up today. That says more about you than any obstacle ever could.",
      microAction: pickMicroAction(null),
    }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({
      type: "affirmation",
      content: "You have power over your mind \u2014 not outside events. Realize this, and you will find strength.",
      author: "Marcus Aurelius",
      microAction: "Write down one thing you're proud of today — you earned it.",
    }), {
      status: 200,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
