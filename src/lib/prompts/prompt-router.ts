import {
  BASE_MODULE,
  TONE_MODULE,
  TIME_AWARENESS_MODULE,
  COMPLEXITY_MODULE,
  INTEREST_TRACKING_MODULE,
  PEOPLE_MODULE,
  COMMITMENT_FOCUS_MODULE,
  ENCOURAGEMENT_MODULE,
  CRISIS_MODULE,
  QUICK_MODE_MODULE,
} from "./modules";

export type PromptMode = "standard" | "quick" | "encouragement" | "crisis";

interface RouterContext {
  // Content analysis
  messageContent: string;

  // User state
  hasOpenCommitments: boolean;
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

export function routePrompt(context: RouterContext): RouterResult {
  const modules: string[] = [BASE_MODULE];
  const reasoning: string[] = [];
  let mode: PromptMode = context.mode || "standard";

  // Analyze message content for emotional signals
  const lowerContent = context.messageContent.toLowerCase();
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
  const quickSignals = [
    "quick",
    "brief",
    "short",
    "just want to say",
    "checking in",
    "update:",
    "done:",
  ];

  // Check for crisis mode
  if (crisisSignals.some((signal) => lowerContent.includes(signal))) {
    mode = "crisis";
    modules.push(CRISIS_MODULE);
    reasoning.push("Crisis signals detected - prioritizing safety and empathy");
  }

  // Check for distress (but not crisis)
  if (
    mode !== "crisis" &&
    distressSignals.some((signal) => lowerContent.includes(signal))
  ) {
    mode = "encouragement";
    modules.push(ENCOURAGEMENT_MODULE);
    reasoning.push("Distress signals detected - adding encouragement support");
  }

  // Check for quick mode
  if (
    mode === "standard" &&
    quickSignals.some((signal) => lowerContent.includes(signal))
  ) {
    mode = "quick";
    modules.push(QUICK_MODE_MODULE);
    reasoning.push("Quick entry signals detected - using concise mode");
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

  // Commitment focus if they have open commitments
  if (context.hasOpenCommitments) {
    modules.push(COMMITMENT_FOCUS_MODULE);
    reasoning.push("User has open commitments - including commitment focus");
  }

  return { modules, mode, reasoning };
}

export function buildModularPrompt(context: RouterContext): string {
  const { modules, mode, reasoning } = routePrompt(context);

  // Join modules with separators
  const prompt = modules.join("\n\n---\n\n");

  // Log reasoning for debugging
  if (process.env.NODE_ENV === "development") {
    console.log("Prompt routing:", { mode, reasoning, moduleCount: modules.length });
  }

  return prompt;
}
