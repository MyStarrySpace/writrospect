import Anthropic from "@anthropic-ai/sdk";

// Classification result from Haiku router
export interface EntryClassification {
  commitments: string[];
  tasks: string[];
  strategies: string[];
  people: string[];
  unresolved_pronouns: {
    detected: boolean;
    pronouns: string[];
    context_hint: string | null;
  };
  mood: string | null;
  entry_type: "checkin" | "reflection" | "vent" | "planning" | "update";
  is_requesting_stats: boolean;
  reply_model: {
    model: "model_simple" | "model_intermediate" | "model_complex";
    thinking: boolean;
  };
}

// What context the main model needs (derived from classification)
export interface RoutingDecision {
  model: "model_simple" | "model_intermediate" | "model_complex";
  thinking: boolean;
  context: {
    entries: boolean;      // Recent journal entries
    commitments: boolean;  // Open commitments
    strategies: boolean;   // Past strategies
    people: boolean;       // People tracking
    patterns: boolean;     // Success model, tone prefs
  };
  needsTools: boolean;     // Whether commitment/task tools may be needed
  classification?: EntryClassification; // Full classification for downstream use
  reasoning?: string;      // For debugging
}

// Summarize chat history to reduce tokens
export interface ChatSummary {
  summary: string;
  messageCount: number;
  topics: string[];
}

const CLASSIFIER_PROMPT = `You are a journal entry classifier. Analyze the user's journal entry and return ONLY a JSON object with the following structure:

{
  "commitments": [],
  "tasks": [],
  "strategies": [],
  "people": [],
  "unresolved_pronouns": {
    "detected": boolean,
    "pronouns": [],
    "context_hint": "string or null"
  },
  "mood": "string or null",
  "entry_type": "checkin" | "reflection" | "vent" | "planning" | "update",
  "is_requesting_stats": boolean,
  "reply_model": {
    "model": "model_simple" | "model_intermediate" | "model_complex",
    "thinking": boolean
  }
}

Definitions:

COMMITMENTS vs TASKS:
- commitments: Intentions or promises that lack specific details ("I should delegate more", "I need to be better about following up", "I want to work on my relationship")
- tasks: Specific actionable items with clear completion criteria ("fill out the 2026-2027 FAFSA", "ask him to handle the Christmas gift situation", "email Maddie by Friday")
- An entry can have both. Extract each as a separate string.
- When a commitment is detected, the system should ask clarifying questions to convert it into a task.

COMMITMENTS vs STRATEGIES:
- commitments: One-time or ongoing intentions WITHOUT conditional triggers ("I should delegate more", "I need to call mom", "I want to exercise more")
- strategies: Conditional rules or principles with a WHEN/IF trigger ("When I mess up, name how it affects his goals", "If I catch myself taking on his tasks, pause and redirect")

The test: Does it have a trigger condition?
- "I should apologize better" → commitment (no trigger)
- "When I mess up, I should apologize by naming impact" → strategy (has trigger: "when I mess up")

Do NOT extract the same content as both. If it has a trigger condition, it's a strategy only.

STRATEGIES:
- Approaches, systems, or principles for handling situations
- Examples: "When I mess up, name how it affects HIS goals, not just mine", "Pause before saying I'll handle it"
- Extract as strings describing the strategy

PEOPLE:
- Named individuals or relationship references
- Include name if given, otherwise the relationship ("boyfriend", "friend Maddie", "coworker")
- Do NOT extract pronouns (he, she, his, her, they, them) as people
- If only pronouns are used with no clear referent in this entry, set "unresolved_pronouns" flag

Examples:

Entry: "his goals, not mine"
Output:
"people": [],
"unresolved_pronouns": {
  "detected": true,
  "pronouns": ["his"],
  "context_hint": "possessive reference in relationship context, likely partner"
}

Entry: "Maddie encouraged me and she was really supportive"
Output:
"people": ["Maddie"],
"unresolved_pronouns": {
  "detected": false,
  "pronouns": [],
  "context_hint": null
}

MOOD:
- Detected emotional state if apparent
- Options: anxious, energized, tired, frustrated, hopeful, reflective, guilty, neutral, mixed
- null if unclear

IS_REQUESTING_STATS:
- true if user seems to need encouragement, asks how they're doing, wants progress update, or expresses doubt about their progress
- Examples: "Am I even improving?", "I feel like I'm not getting anywhere", "How have I been doing?"

REPLY_MODEL:
- model: "model_simple" for simple acknowledgments, task extraction, quick check-ins. "model_intermediate" for emotional processing, complex patterns, sensitive topics, relationship issues, deeper reflection. "model_complex" for highly nuanced situations requiring maximum capability.
- thinking: true if the response requires careful reasoning about sensitive/complex topics (relationship dynamics, mental health, nuanced feedback). false for straightforward responses

Return ONLY valid JSON. No explanation or preamble.`;

let routerClient: Anthropic | null = null;

function getRouterClient(): Anthropic {
  if (!routerClient) {
    routerClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return routerClient;
}

// Classify a message using Haiku and derive routing decision
export async function classifyAndRoute(message: string): Promise<RoutingDecision> {
  const client = getRouterClient();

  try {
    const response = await client.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 512,
      system: CLASSIFIER_PROMPT,
      messages: [
        {
          role: "user",
          content: message,
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";

    // Parse the classification - handle potential markdown code blocks
    let jsonText = text.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const classification = JSON.parse(jsonText) as EntryClassification;

    // Derive routing decision from classification
    const hasExtractableContent =
      classification.tasks.length > 0 ||
      classification.commitments.length > 0 ||
      classification.strategies.length > 0;

    const needsPeopleContext = classification.people.length > 0 || classification.unresolved_pronouns?.detected;
    const needsEntriesContext =
      classification.is_requesting_stats ||
      classification.entry_type === "reflection";
    const needsStrategiesContext = classification.strategies.length > 0;

    return {
      model: classification.reply_model.model,
      thinking: classification.reply_model.thinking,
      context: {
        entries: needsEntriesContext,
        commitments: hasExtractableContent,
        strategies: needsStrategiesContext,
        people: needsPeopleContext,
        patterns: true, // Always include for tone matching
      },
      needsTools: hasExtractableContent,
      classification,
      reasoning: `Entry type: ${classification.entry_type}, mood: ${classification.mood || "unknown"}`,
    };
  } catch (error) {
    console.error("Classifier error, defaulting to model_intermediate:", error);
    // Default to model_intermediate with full context on error
    return {
      model: "model_intermediate",
      thinking: false,
      context: {
        entries: true,
        commitments: true,
        strategies: true,
        people: true,
        patterns: true,
      },
      needsTools: true,
      reasoning: "Classifier error - using safe defaults",
    };
  }
}

// Legacy function for compatibility - now calls classifyAndRoute
export async function routeMessage(
  message: string,
  _recentMessages: { role: string; content: string }[] = []
): Promise<RoutingDecision> {
  return classifyAndRoute(message);
}

// Quick heuristic check before calling classifier (saves API call for obvious cases)
// Only catches VERY simple cases - everything else goes to the Haiku classifier
export function quickRouteCheck(message: string): RoutingDecision | null {
  const lower = message.toLowerCase().trim();

  // Very short messages (under 30 chars) with no complex content
  if (message.length < 30) {
    const simplePatterns = [
      /^(hi|hey|hello|morning|night|thanks|thank you|ok|okay|sure|yep|yeah|nope|no|yes|bye|goodbye|gn|gm)\.?!?$/i,
      /^good (morning|night|evening|afternoon)\.?!?$/i,
      /^(sounds good|got it|understood|makes sense|will do)\.?!?$/i,
    ];
    for (const pattern of simplePatterns) {
      if (pattern.test(lower)) {
        return {
          model: "model_simple",
          thinking: false,
          context: { entries: false, commitments: false, strategies: false, people: false, patterns: true },
          needsTools: false,
          reasoning: "Simple greeting/acknowledgment - no classifier needed",
        };
      }
    }
  }

  // Everything else goes to the Haiku classifier for proper analysis
  return null;
}

// Summarize older chat messages to reduce token count
const SUMMARIZER_PROMPT = `Summarize this conversation concisely, preserving:
1. Key topics discussed
2. Any commitments made or mentioned
3. Emotional context/tone
4. Important decisions or conclusions

Keep it under 150 words. Focus on what's needed for context, not verbatim content.
Output format:
SUMMARY: [your summary]
TOPICS: [comma-separated list]`;

export async function summarizeChatHistory(
  messages: { role: string; content: string }[]
): Promise<ChatSummary> {
  if (messages.length < 6) {
    // Not enough messages to warrant summarization
    return {
      summary: "",
      messageCount: messages.length,
      topics: [],
    };
  }

  const client = getRouterClient();

  // Take older messages (keep last 4 as-is)
  const toSummarize = messages.slice(0, -4);
  const formatted = toSummarize
    .map((m) => `${m.role}: ${m.content.slice(0, 200)}${m.content.length > 200 ? "..." : ""}`)
    .join("\n");

  try {
    const response = await client.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 256,
      system: SUMMARIZER_PROMPT,
      messages: [{ role: "user", content: formatted }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";

    // Parse response (using [\s\S] instead of /s flag for ES compatibility)
    const summaryMatch = text.match(/SUMMARY:\s*([\s\S]+?)(?=TOPICS:|$)/);
    const topicsMatch = text.match(/TOPICS:\s*([\s\S]+)/);

    return {
      summary: summaryMatch?.[1]?.trim() || text,
      messageCount: toSummarize.length,
      topics: topicsMatch?.[1]?.split(",").map((t) => t.trim()).filter(Boolean) || [],
    };
  } catch (error) {
    console.error("Summarization error:", error);
    return {
      summary: "",
      messageCount: 0,
      topics: [],
    };
  }
}

// Compress journal entries for context
export function compressEntries(
  entries: { content: string; date: Date; timeContext: string }[],
  maxEntries: number = 3
): string[] {
  return entries.slice(0, maxEntries).map((e) => {
    const dateStr = new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const preview = e.content.length > 100 ? e.content.slice(0, 100) + "..." : e.content;
    return `${dateStr} (${e.timeContext}): ${preview}`;
  });
}

// Compress commitments for context
export function compressCommitments(
  commitments: { what: string; status: string; complexity: number; createdAt: Date }[],
  maxCommitments: number = 5
): string[] {
  return commitments.slice(0, maxCommitments).map((c) => {
    const daysOld = Math.floor((Date.now() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    return `[${c.status}] ${c.what.slice(0, 50)}${c.what.length > 50 ? "..." : ""} (${daysOld}d)`;
  });
}
