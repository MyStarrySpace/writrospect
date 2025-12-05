import Anthropic from "@anthropic-ai/sdk";

// What context the main model needs
export interface RoutingDecision {
  model: "haiku" | "sonnet";
  context: {
    entries: boolean;      // Recent journal entries
    commitments: boolean;  // Open commitments
    strategies: boolean;   // Past strategies
    people: boolean;       // People tracking
    patterns: boolean;     // Success model, tone prefs
  };
  needsTools: boolean;     // Whether commitment tools may be needed
  reasoning?: string;      // For debugging
}

// Summarize chat history to reduce tokens
export interface ChatSummary {
  summary: string;
  messageCount: number;
  topics: string[];
}

const ROUTER_PROMPT = `You are a routing classifier. Analyze the user message and recent context to decide:
1. Which model should handle this (haiku for simple, sonnet for complex)
2. What context is needed from the database

Respond with ONLY valid JSON, no other text:
{
  "model": "haiku" | "sonnet",
  "context": {
    "entries": true/false,
    "commitments": true/false,
    "strategies": true/false,
    "people": true/false,
    "patterns": true/false
  },
  "needsTools": true/false,
  "reasoning": "brief explanation"
}

ROUTING RULES:
- Use HAIKU for: greetings, acknowledgments, short check-ins, simple questions, emotional support
- Use SONNET for: pattern analysis, complex entries, planning, when tools are needed

CONTEXT RULES:
- entries: needed when discussing past entries, patterns, or comparing to history
- commitments: needed when creating/updating/discussing commitments, or asking "what am I working on"
- strategies: needed when discussing what works/doesn't work, or suggesting approaches
- people: needed when specific people are mentioned or relationship context matters
- patterns: needed for personalized responses, tone matching, success model

TOOLS RULES:
- needsTools: true if user expresses intent to do something, mentions a commitment, or asks about commitments`;

let routerClient: Anthropic | null = null;

function getRouterClient(): Anthropic {
  if (!routerClient) {
    routerClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return routerClient;
}

export async function routeMessage(
  message: string,
  recentMessages: { role: string; content: string }[] = []
): Promise<RoutingDecision> {
  const client = getRouterClient();

  // Build minimal context for router
  const contextSummary = recentMessages.length > 0
    ? `Recent conversation:\n${recentMessages.slice(-3).map(m => `${m.role}: ${m.content.slice(0, 100)}...`).join("\n")}`
    : "No prior conversation";

  try {
    const response = await client.messages.create({
      model: "claude-3-5-haiku-latest",
      max_tokens: 256,
      system: ROUTER_PROMPT,
      messages: [
        {
          role: "user",
          content: `${contextSummary}\n\nNew message to classify:\n"${message}"`,
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const decision = JSON.parse(text) as RoutingDecision;
    return decision;
  } catch (error) {
    console.error("Router error, defaulting to full context:", error);
    // Default to sonnet with full context on error
    return {
      model: "sonnet",
      context: {
        entries: true,
        commitments: true,
        strategies: true,
        people: true,
        patterns: true,
      },
      needsTools: true,
      reasoning: "Router error - using safe defaults",
    };
  }
}

// Quick heuristic check before calling router (saves API call for obvious cases)
export function quickRouteCheck(message: string): RoutingDecision | null {
  const lower = message.toLowerCase().trim();

  // Very short messages - likely simple
  if (message.length < 20) {
    const simplePatterns = [
      /^(hi|hey|hello|morning|night|thanks|ok|okay|sure|yep|yeah|nope|no|yes)\.?$/i,
      /^good (morning|night|evening|afternoon)\.?$/i,
    ];
    for (const pattern of simplePatterns) {
      if (pattern.test(lower)) {
        return {
          model: "haiku",
          context: { entries: false, commitments: false, strategies: false, people: false, patterns: true },
          needsTools: false,
          reasoning: "Simple greeting/acknowledgment",
        };
      }
    }
  }

  // "I'm stuck" mode - needs full context for proactive check-in
  if (lower.includes("i'm stuck") || lower.includes("feeling blocked") || lower.includes("help getting unstuck")) {
    return {
      model: "sonnet",
      context: { entries: true, commitments: true, strategies: true, people: false, patterns: true },
      needsTools: true,
      reasoning: "Stuck mode - needs full context for proactive analysis",
    };
  }

  // Commitment keywords - needs tools and context
  const commitmentKeywords = [
    "commit", "promise", "going to", "will do", "need to", "have to", "should",
    "plan to", "want to", "working on", "what am i", "my commitments", "track"
  ];
  if (commitmentKeywords.some(kw => lower.includes(kw))) {
    return {
      model: "sonnet",
      context: { entries: false, commitments: true, strategies: false, people: false, patterns: true },
      needsTools: true,
      reasoning: "Commitment-related message",
    };
  }

  // Long entries likely need full analysis
  if (message.length > 500) {
    return {
      model: "sonnet",
      context: { entries: true, commitments: true, strategies: true, people: false, patterns: true },
      needsTools: true,
      reasoning: "Long entry needs full analysis",
    };
  }

  // Can't determine - use router
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
      model: "claude-3-5-haiku-latest",
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
