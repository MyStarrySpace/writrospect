import {
  BASE_MODULE,
  TONE_MODULE,
  TIME_AWARENESS_MODULE,
  COMPLEXITY_MODULE,
  INTEREST_TRACKING_MODULE,
  PEOPLE_MODULE,
  HABIT_FOCUS_MODULE,
  ENCOURAGEMENT_MODULE,
  CRISIS_MODULE,
  QUICK_MODE_MODULE,
  COGNITIVE_OVERLOAD_MODULE,
  IDENTITY_MODULE,
} from "./modules";

export type PromptMode = "standard" | "quick" | "encouragement" | "crisis";

interface RouterContext {
  // Content analysis
  messageContent: string;

  // User state
  hasOpenHabits: boolean;
  hasPeople: boolean;
  hasSilentPeople: boolean;
  hasRecentEntries: boolean;

  // Preferences
  interactionMode: "thinking_partner" | "functional" | "balanced";
  complexityPreference: "simple" | "moderate" | "complex" | "adaptive";

  // Session context
  timeContext: "early_morning" | "morning" | "afternoon" | "evening" | "late_night";

  // Explicit mode override
  mode?: PromptMode;
}

interface RouterResult {
  modules: string[];
  mode: PromptMode;
  reasoning: string[];
}

/**
 * Compute a complexity score for a message based on structural indicators.
 * Higher score = more substantive message that deserves deeper engagement.
 */
function computeComplexityScore(message: string): { score: number; words: number; lines: number; sentences: number } {
  const words = message.trim().split(/\s+/).filter(w => w.length > 0);
  const lines = message.split(/\n/).filter(l => l.trim().length > 0);
  const sentences = message.split(/[.!?]+/).filter(s => s.trim().length > 0);

  let score = 0;
  score += Math.min(words.length / 5, 5);   // up to 5 from words (25+ words = max)
  score += Math.min(lines.length, 3);        // up to 3 from lines
  score += Math.min(sentences.length, 3);    // up to 3 from sentences

  return { score, words: words.length, lines: lines.length, sentences: sentences.length };
}

// Nuance indicators - words/phrases suggesting depth or reflection that
// existing signal lists might miss. These help catch substantive messages
// that don't contain exact keywords like "goal", "habit", "overwhelmed" etc.
const nuanceIndicators = [
  // Reflective/processing
  "realized", "wondering", "thinking about", "noticed that", "feel like",
  "struggling with", "trying to figure", "been thinking", "not sure why",
  "makes me think", "occurred to me", "looking back", "reflecting",
  // Emotional processing (not distress/crisis level)
  "frustrated", "anxious", "excited", "proud", "disappointed",
  "confused", "conflicted", "mixed feelings", "torn",
  "grateful", "uneasy", "restless", "stuck",
  // Self-analysis
  "tendency", "i always", "i never", "every time i",
  "the reason", "part of me", "on one hand",
  // Growth/change
  "getting better", "used to be",
  "different now", "setback", "learning to",
  // Depth/meaning
  "matters to me", "important to me", "care about",
  "meaningful", "purpose", "fulfilling",
];

// Minimum complexity score to consider fallback module injection.
// Roughly equivalent to 2+ non-trivial lines (~15+ words, 2+ sentences).
const COMPLEXITY_THRESHOLD = 5;

export function routePrompt(context: RouterContext): RouterResult {
  const modules: string[] = [BASE_MODULE];
  const reasoning: string[] = [];
  let mode: PromptMode = context.mode || "standard";
  let contentModuleMatched = false;

  // Analyze message content for emotional signals
  const lowerContent = context.messageContent.toLowerCase();
  const complexity = computeComplexityScore(context.messageContent);
  const crisisSignals = [
    "want to die",
    "kill myself",
    "end it",
    "can't go on",
    "no point",
    "give up",
    "hopeless",
    "worthless",
  ];
  const distressSignals = [
    "overwhelmed",
    "can't cope",
    "falling apart",
    "breaking down",
    "exhausted",
    "burned out",
    "at my limit",
  ];
  const overloadSignals = [
    "so much to do",
    "don't know where to start",
    "too much",
    "can't decide",
    "everything at once",
    "drowning in",
    "spinning",
    "all over the place",
  ];
  const quickSignals = [
    "quick",
    "brief",
    "short",
    "just want to say",
    "checking in",
    "update:",
    "done:",
  ];
  const identitySignals = [
    // Planning and future
    "going to",
    "want to",
    "plan to",
    "planning",
    "tomorrow",
    "tonight",
    "this week",
    "next week",
    "by the end of",
    "goal",
    "goals",
    // Habits and commitments
    "habit",
    "routine",
    "commit",
    "commitment",
    "stick to",
    "keep doing",
    "start doing",
    "stop doing",
    // Follow-up and accountability
    "how did",
    "did you",
    "did i",
    "followed through",
    "didn't do",
    "forgot to",
    "missed",
    "failed",
    "succeeded",
    // Identity language
    "kind of person",
    "type of person",
    "who i am",
    "who i want to be",
    "becoming",
    "i am someone",
    "i'm not someone",
  ];

  // Check for crisis mode
  if (crisisSignals.some((signal) => lowerContent.includes(signal))) {
    mode = "crisis";
    modules.push(CRISIS_MODULE);
    reasoning.push("Crisis signals detected - prioritizing safety and empathy");
    contentModuleMatched = true;
  }

  // Check for distress (but not crisis)
  if (
    mode !== "crisis" &&
    distressSignals.some((signal) => lowerContent.includes(signal))
  ) {
    mode = "encouragement";
    modules.push(ENCOURAGEMENT_MODULE);
    reasoning.push("Distress signals detected - adding encouragement support");
    contentModuleMatched = true;
  }

  // Check for cognitive overload (many items, decision paralysis)
  const hasOverloadSignal = overloadSignals.some((signal) =>
    lowerContent.includes(signal)
  );
  // Count potential items (bullet points, numbered lists, "and" conjunctions, commas)
  const bulletCount = (context.messageContent.match(/^[-*•]\s/gm) || []).length;
  const numberedCount = (context.messageContent.match(/^\d+\.\s/gm) || []).length;
  const itemCount = bulletCount + numberedCount;
  const hasLongList = itemCount > 3 || context.messageContent.length > 500;

  if (
    mode !== "crisis" &&
    mode !== "encouragement" &&
    (hasOverloadSignal || (hasLongList && itemCount > 5))
  ) {
    modules.push(COGNITIVE_OVERLOAD_MODULE);
    reasoning.push(
      `Cognitive overload detected (signals: ${hasOverloadSignal}, items: ${itemCount})`
    );
    contentModuleMatched = true;
  }

  // Check for quick mode
  if (
    mode === "standard" &&
    quickSignals.some((signal) => lowerContent.includes(signal))
  ) {
    mode = "quick";
    modules.push(QUICK_MODE_MODULE);
    reasoning.push("Quick entry signals detected - using concise mode");
    contentModuleMatched = true;
  }

  // Always include tone module (unless crisis mode)
  if (mode !== "crisis") {
    modules.push(TONE_MODULE);
    reasoning.push("Including standard tone guidelines");
  }

  // Time awareness for late night entries
  if (context.timeContext === "late_night" || context.timeContext === "early_morning") {
    modules.push(TIME_AWARENESS_MODULE);
    reasoning.push(`Late hour entry (${context.timeContext}) - including time awareness`);
  }

  // Complexity module based on preference
  if (context.complexityPreference !== "adaptive") {
    modules.push(COMPLEXITY_MODULE);
    reasoning.push(`User has specific complexity preference: ${context.complexityPreference}`);
  }

  // Interest tracking based on interaction mode
  if (context.interactionMode === "thinking_partner") {
    modules.push(INTEREST_TRACKING_MODULE);
    reasoning.push("User prefers thinking partner mode - including interest tracking");
  }

  // People module if they have tracked relationships
  if (context.hasPeople) {
    modules.push(PEOPLE_MODULE);
    reasoning.push("User has tracked relationships - including people awareness");
  }

  // Habit focus if they have open habits
  if (context.hasOpenHabits) {
    modules.push(HABIT_FOCUS_MODULE);
    reasoning.push("User has active habits - including habit focus");
  }

  // Identity module for planning, goals, habits, follow-ups, or identity language
  const hasIdentitySignal = identitySignals.some((signal) =>
    lowerContent.includes(signal)
  );
  if (hasIdentitySignal || context.hasOpenHabits) {
    modules.push(IDENTITY_MODULE);
    reasoning.push("Planning/identity context detected - including identity development principles");
    if (hasIdentitySignal) contentModuleMatched = true;
  }

  // --- Complexity-based fallback ---
  // If the message is substantive (high complexity score) but pattern matching
  // didn't trigger any content-driven modules, check for nuance indicators.
  // This catches reflective, emotionally rich, or analytical messages that
  // don't happen to contain exact signal keywords.
  if (!contentModuleMatched && complexity.score >= COMPLEXITY_THRESHOLD) {
    const matchedNuance = nuanceIndicators.filter((indicator) =>
      lowerContent.includes(indicator)
    );

    if (matchedNuance.length > 0) {
      // Add identity module for deeper engagement (if not already added via hasOpenHabits)
      if (!modules.includes(IDENTITY_MODULE)) {
        modules.push(IDENTITY_MODULE);
      }
      // Add interest tracking for thinking-partner-style engagement (if not already added)
      if (!modules.includes(INTEREST_TRACKING_MODULE)) {
        modules.push(INTEREST_TRACKING_MODULE);
      }
      reasoning.push(
        `Complexity fallback: substantive message (score: ${complexity.score.toFixed(1)}, words: ${complexity.words}, lines: ${complexity.lines}) with nuance indicators [${matchedNuance.slice(0, 3).join(", ")}${matchedNuance.length > 3 ? ", ..." : ""}] but no pattern match - adding deeper engagement modules`
      );
    }
  }

  return { modules, mode, reasoning };
}

export function buildModularPrompt(context: RouterContext): string {
  const { modules, mode, reasoning } = routePrompt(context);

  // Join modules with separators
  const prompt = modules.join("\n\n---\n\n");

  // Log reasoning for debugging
  if (process.env.NODE_ENV === "development") {
    const { score, words, lines } = computeComplexityScore(context.messageContent);
    console.log("Prompt routing:", { mode, reasoning, moduleCount: modules.length, complexity: { score: score.toFixed(1), words, lines } });
  }

  return prompt;
}
