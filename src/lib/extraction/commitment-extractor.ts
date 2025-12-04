import Anthropic from "@anthropic-ai/sdk";
import { MotivationType } from "@prisma/client";

// Lazy initialization to ensure env vars are loaded
let anthropicClient: Anthropic | null = null;

function getClient(): Anthropic {
  if (!anthropicClient) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY environment variable is not set");
    }
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropicClient;
}

export interface ExtractedCommitment {
  what: string;
  why?: string;
  complexity: number; // 1-5
  motivationType: MotivationType;
  dueDate?: string; // ISO date string if mentioned
  relatedPerson?: string; // Name of person if commitment is related to someone
}

export interface ExtractedPerson {
  name: string;
  relationship?: string;
  sentiment?: "positive" | "neutral" | "stressed" | "conflicted" | "negative";
  context?: string; // What was said about them
}

export interface ExtractionResult {
  commitments: ExtractedCommitment[];
  people: ExtractedPerson[];
  emotionalState?: string;
  keyTopics: string[];
}

const EXTRACTION_PROMPT = `You are analyzing a journal entry to extract structured data. Extract the following:

1. COMMITMENTS: Any promises, intentions, plans, or things the user said they would do. Include:
   - what: The specific commitment (brief, actionable description)
   - why: The underlying motivation if mentioned
   - complexity: 1-5 scale (1=trivial like "send an email", 5=major project)
   - motivationType: one of "intrinsic", "extrinsic", "obligation", "curiosity", "growth", "maintenance"
   - dueDate: ISO date string if a specific date/time is mentioned (use YYYY-MM-DD format)
   - relatedPerson: Name of person if the commitment involves someone specific

2. PEOPLE: Any people mentioned by name. Include:
   - name: The person's name
   - relationship: Inferred relationship type (partner, friend, family, coworker, acquaintance, other)
   - sentiment: The user's apparent sentiment toward them in this entry (positive, neutral, stressed, conflicted, negative)
   - context: Brief context of what was mentioned about them

3. EMOTIONAL_STATE: A brief description of the user's overall emotional state in the entry

4. KEY_TOPICS: Main topics or themes discussed (max 5)

Respond ONLY with valid JSON in this exact format:
{
  "commitments": [...],
  "people": [...],
  "emotionalState": "...",
  "keyTopics": [...]
}

If no commitments or people are found, use empty arrays. Be conservative - only extract clear, explicit commitments, not vague wishes or desires.`;

export async function extractFromEntry(
  entryContent: string,
  additionalContext?: string
): Promise<ExtractionResult> {
  const userMessage = additionalContext
    ? `Context: ${additionalContext}\n\nJournal Entry:\n${entryContent}`
    : `Journal Entry:\n${entryContent}`;

  try {
    const client = getClient();
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: EXTRACTION_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    if (response.content[0].type !== "text") {
      throw new Error("Unexpected response format");
    }

    const result = JSON.parse(response.content[0].text) as ExtractionResult;

    // Validate and normalize the result
    return {
      commitments: (result.commitments || []).map((c) => ({
        what: c.what || "",
        why: c.why,
        complexity: Math.min(5, Math.max(1, c.complexity || 3)),
        motivationType: validateMotivationType(c.motivationType),
        dueDate: c.dueDate,
        relatedPerson: c.relatedPerson,
      })),
      people: (result.people || []).map((p) => ({
        name: p.name || "",
        relationship: p.relationship,
        sentiment: validateSentiment(p.sentiment),
        context: p.context,
      })),
      emotionalState: result.emotionalState,
      keyTopics: result.keyTopics || [],
    };
  } catch (error) {
    console.error("Extraction error:", error);
    // Return empty result on failure
    return {
      commitments: [],
      people: [],
      keyTopics: [],
    };
  }
}

function validateMotivationType(type: string | undefined): MotivationType {
  const validTypes: MotivationType[] = [
    "intrinsic",
    "extrinsic",
    "obligation",
    "curiosity",
    "growth",
    "maintenance",
  ];
  if (type && validTypes.includes(type as MotivationType)) {
    return type as MotivationType;
  }
  return "intrinsic";
}

function validateSentiment(
  sentiment: string | undefined
): "positive" | "neutral" | "stressed" | "conflicted" | "negative" | undefined {
  const validSentiments = ["positive", "neutral", "stressed", "conflicted", "negative"];
  if (sentiment && validSentiments.includes(sentiment)) {
    return sentiment as "positive" | "neutral" | "stressed" | "conflicted" | "negative";
  }
  return undefined;
}
