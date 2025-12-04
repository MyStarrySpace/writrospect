import prisma from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

// Tool definitions for journal-related suggestions
export const journalTools: Anthropic.Tool[] = [
  {
    name: "suggest_entry_addition",
    description:
      "Suggest content to add to the current journal entry. Use this when the conversation reveals insights, reflections, or details that would be valuable to capture in the entry itself. The user will see the suggestion and can choose to accept or dismiss it.",
    input_schema: {
      type: "object" as const,
      properties: {
        content: {
          type: "string",
          description:
            "The content to suggest adding to the entry. Should be written from the user's perspective (first person). Keep it concise but meaningful.",
        },
        reason: {
          type: "string",
          description:
            "Brief explanation of why this would be valuable to add (shown to user)",
        },
        position: {
          type: "string",
          enum: ["append", "prepend"],
          description:
            "Where to suggest adding the content (append = end of entry, prepend = beginning). Default: append",
        },
      },
      required: ["content", "reason"],
    },
  },
  {
    name: "suggest_new_entry",
    description:
      "Suggest creating a new journal entry from conversation content. Use this when the user shares something substantial that deserves its own entry - especially after a time gap, or when the topic has shifted significantly from the original entry. Creates a draft the user can review and post.",
    input_schema: {
      type: "object" as const,
      properties: {
        content: {
          type: "string",
          description:
            "The suggested content for the new entry. Should be written from the user's perspective (first person). Capture the essence of what they shared.",
        },
        reason: {
          type: "string",
          description:
            "Brief explanation of why this should be a separate entry (shown to user)",
        },
        conditions: {
          type: "array",
          items: { type: "string" },
          description:
            "Optional mood/condition tags to suggest for the entry (e.g., 'tired', 'motivated', 'stressed')",
        },
      },
      required: ["content", "reason"],
    },
  },
];

// Tool execution handlers
export async function executeJournalTool(
  userId: string,
  toolName: string,
  toolInput: Record<string, unknown>,
  entryId?: string
): Promise<string> {
  switch (toolName) {
    case "suggest_entry_addition":
      return suggestEntryAddition(userId, toolInput, entryId);
    case "suggest_new_entry":
      return suggestNewEntry(userId, toolInput, entryId);
    default:
      return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }
}

async function suggestEntryAddition(
  userId: string,
  input: Record<string, unknown>,
  entryId?: string
): Promise<string> {
  try {
    if (!entryId) {
      return JSON.stringify({
        error: "No entry selected to add content to",
        suggestion: "Use suggest_new_entry instead to create a new entry",
      });
    }

    // Verify the entry exists and belongs to user
    const entry = await prisma.journalEntry.findFirst({
      where: { id: entryId, userId },
    });

    if (!entry) {
      return JSON.stringify({ error: "Entry not found" });
    }

    const content = String(input.content);
    const reason = String(input.reason);
    const position = (input.position as string) || "append";

    // Store as a special type of draft that references the entry
    const draft = await prisma.journalDraft.create({
      data: {
        userId,
        content,
        reason: `Addition suggestion: ${reason}`,
        sourceEntryId: entryId,
      },
    });

    return JSON.stringify({
      success: true,
      type: "entry_addition",
      suggestion: {
        id: draft.id,
        content,
        reason,
        position,
        targetEntryId: entryId,
      },
      message: "Suggestion created - user will see an option to add this to their entry",
    });
  } catch (error) {
    console.error("Error suggesting entry addition:", error);
    return JSON.stringify({ error: "Failed to create suggestion" });
  }
}

async function suggestNewEntry(
  userId: string,
  input: Record<string, unknown>,
  entryId?: string
): Promise<string> {
  try {
    const content = String(input.content);
    const reason = String(input.reason);
    const conditions = (input.conditions as string[]) || [];

    // Create a draft for the new entry
    const draft = await prisma.journalDraft.create({
      data: {
        userId,
        content,
        reason: `New entry suggestion: ${reason}`,
        sourceEntryId: entryId || null,
      },
    });

    return JSON.stringify({
      success: true,
      type: "new_entry",
      suggestion: {
        id: draft.id,
        content,
        reason,
        suggestedConditions: conditions,
      },
      message: "Draft created - user will see an option to create this as a new entry",
    });
  } catch (error) {
    console.error("Error suggesting new entry:", error);
    return JSON.stringify({ error: "Failed to create suggestion" });
  }
}
