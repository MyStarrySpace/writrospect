import prisma from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

// Tool definitions for journal-related suggestions
export const journalTools: Anthropic.Tool[] = [
  {
    name: "propose_items",
    description:
      "Propose tasks, habits, or strategies for the user to review and approve. Use this instead of create_task/create_habit/create_strategy when extracting items from journal entries. The user will see a table of proposed items and can approve, modify, or reject each one. This gives them control over what gets tracked.",
    input_schema: {
      type: "object" as const,
      properties: {
        items: {
          type: "array",
          description: "Array of proposed items (tasks, habits, or strategies)",
          items: {
            type: "object",
            properties: {
              item_type: {
                type: "string",
                enum: ["task", "habit", "strategy"],
                description: "The type of item being proposed",
              },
              // Task fields
              what: {
                type: "string",
                description: "Description of the task or habit",
              },
              urgency: {
                type: "string",
                enum: ["now", "today", "this_week", "whenever"],
                description: "For tasks: how urgent (default: whenever)",
              },
              due_date: {
                type: "string",
                description: "For tasks: optional deadline (ISO date)",
              },
              due_time: {
                type: "string",
                description: "For tasks: optional time like '9AM', 'after lunch'",
              },
              context: {
                type: "string",
                description: "Additional context or notes",
              },
              // Habit fields
              why: {
                type: "string",
                description: "For habits: why this matters to them",
              },
              complexity: {
                type: "number",
                description: "For habits: 1-5 scale of how complex/challenging",
              },
              motivation_type: {
                type: "string",
                enum: ["intrinsic", "extrinsic", "obligation", "curiosity", "growth"],
                description: "For habits: what drives this habit",
              },
              // Strategy fields
              strategy: {
                type: "string",
                description: "For strategies: the strategy or approach",
              },
              trigger: {
                type: "string",
                description: "For strategies: when/what triggers using this strategy",
              },
            },
            required: ["item_type"],
          },
        },
      },
      required: ["items"],
    },
  },
  {
    name: "propose_dependencies",
    description:
      "After creating or discussing a task, habit, or goal, propose upstream prerequisites the user might not have considered. Use this to combat 'dependency blindness' — helping users see the preparation steps needed for success. Returns a table of proposed items linked to the parent item.",
    input_schema: {
      type: "object" as const,
      properties: {
        parent_id: {
          type: "string",
          description: "ID of the parent item these dependencies support",
        },
        parent_type: {
          type: "string",
          enum: ["task", "habit", "goal"],
          description: "Type of the parent item",
        },
        parent_title: {
          type: "string",
          description: "Display title of the parent item",
        },
        items: {
          type: "array",
          description: "Array of proposed dependency items (tasks, habits, or strategies)",
          items: {
            type: "object",
            properties: {
              item_type: {
                type: "string",
                enum: ["task", "habit", "strategy"],
                description: "The type of item being proposed",
              },
              what: {
                type: "string",
                description: "Description of the task or habit",
              },
              urgency: {
                type: "string",
                enum: ["now", "today", "this_week", "whenever"],
                description: "For tasks: how urgent (default: whenever)",
              },
              due_date: {
                type: "string",
                description: "For tasks: optional deadline (ISO date)",
              },
              due_time: {
                type: "string",
                description: "For tasks: optional time like '9AM', 'after lunch'",
              },
              context: {
                type: "string",
                description: "Additional context or notes",
              },
              why: {
                type: "string",
                description: "For habits: why this matters to them",
              },
              complexity: {
                type: "number",
                description: "For habits: 1-5 scale of how complex/challenging",
              },
              motivation_type: {
                type: "string",
                enum: ["intrinsic", "extrinsic", "obligation", "curiosity", "growth"],
                description: "For habits: what drives this habit",
              },
              strategy: {
                type: "string",
                description: "For strategies: the strategy or approach",
              },
              trigger: {
                type: "string",
                description: "For strategies: when/what triggers using this strategy",
              },
            },
            required: ["item_type"],
          },
        },
      },
      required: ["parent_id", "parent_type", "parent_title", "items"],
    },
  },
  {
    name: "suggest_style_edit",
    description:
      "Suggest a style edit to improve the journal entry's clarity, tone, or voice. Use this when you notice the entry could be improved stylistically - better word choices, clearer phrasing, more consistent voice, etc. The user will see the suggestion and can accept or reject it. Over time, the system learns from their choices to match their preferred style.",
    input_schema: {
      type: "object" as const,
      properties: {
        original_text: {
          type: "string",
          description: "The original text that could be improved (exact quote from the entry)",
        },
        suggested_text: {
          type: "string",
          description: "The improved version of the text",
        },
        edit_type: {
          type: "string",
          enum: ["grammar", "clarity", "tone", "structure", "voice", "conciseness"],
          description: "What type of improvement this is",
        },
        explanation: {
          type: "string",
          description: "Brief explanation of why this edit improves the entry (shown to user)",
        },
      },
      required: ["original_text", "suggested_text", "edit_type", "explanation"],
    },
  },
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
    case "propose_items":
      return proposeItems(userId, toolInput, entryId);
    case "propose_dependencies":
      return proposeDependencies(userId, toolInput, entryId);
    case "suggest_style_edit":
      return suggestStyleEdit(userId, toolInput, entryId);
    case "suggest_entry_addition":
      return suggestEntryAddition(userId, toolInput, entryId);
    case "suggest_new_entry":
      return suggestNewEntry(userId, toolInput, entryId);
    default:
      return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }
}

interface ProposedItemInput {
  item_type: "task" | "habit" | "strategy";
  what?: string;
  urgency?: string;
  due_date?: string;
  due_time?: string;
  context?: string;
  why?: string;
  complexity?: number;
  motivation_type?: string;
  strategy?: string;
  trigger?: string;
}

async function proposeItems(
  _userId: string,
  input: Record<string, unknown>,
  entryId?: string
): Promise<string> {
  try {
    const rawItems = input.items as ProposedItemInput[];
    if (!rawItems || !Array.isArray(rawItems) || rawItems.length === 0) {
      return JSON.stringify({ error: "No items provided" });
    }

    // Transform items into the suggestion format
    const proposedItems = rawItems.map((item) => {
      if (item.item_type === "task") {
        return {
          itemType: "task" as const,
          what: item.what || "",
          context: item.context,
          urgency: (item.urgency || "whenever") as "now" | "today" | "this_week" | "whenever",
          dueDate: item.due_date,
          dueTime: item.due_time,
        };
      } else if (item.item_type === "habit") {
        return {
          itemType: "habit" as const,
          what: item.what || "",
          why: item.why,
          complexity: item.complexity || 3,
          motivationType: (item.motivation_type || "intrinsic") as "intrinsic" | "extrinsic" | "obligation" | "curiosity" | "growth",
        };
      } else {
        return {
          itemType: "strategy" as const,
          strategy: item.strategy || item.what || "",
          context: item.context || "",
          trigger: item.trigger,
        };
      }
    });

    // Return as a suggestion for the UI to display
    return JSON.stringify({
      success: true,
      type: "proposed_items",
      suggestion: {
        id: `prop-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type: "proposed_items",
        items: proposedItems,
        entryId,
      },
      message: `Proposed ${proposedItems.length} item(s) for review`,
    });
  } catch (error) {
    console.error("Error proposing items:", error);
    return JSON.stringify({ error: "Failed to propose items" });
  }
}

async function proposeDependencies(
  _userId: string,
  input: Record<string, unknown>,
  entryId?: string
): Promise<string> {
  try {
    const parentId = String(input.parent_id);
    const parentType = String(input.parent_type) as "task" | "habit" | "goal";
    const parentTitle = String(input.parent_title);
    const rawItems = input.items as ProposedItemInput[];

    if (!rawItems || !Array.isArray(rawItems) || rawItems.length === 0) {
      return JSON.stringify({ error: "No dependency items provided" });
    }

    // Transform items using the same logic as proposeItems
    const proposedItems = rawItems.map((item) => {
      if (item.item_type === "task") {
        return {
          itemType: "task" as const,
          what: item.what || "",
          context: item.context,
          urgency: (item.urgency || "whenever") as "now" | "today" | "this_week" | "whenever",
          dueDate: item.due_date,
          dueTime: item.due_time,
        };
      } else if (item.item_type === "habit") {
        return {
          itemType: "habit" as const,
          what: item.what || "",
          why: item.why,
          complexity: item.complexity || 3,
          motivationType: (item.motivation_type || "intrinsic") as "intrinsic" | "extrinsic" | "obligation" | "curiosity" | "growth",
        };
      } else {
        return {
          itemType: "strategy" as const,
          strategy: item.strategy || item.what || "",
          context: item.context || "",
          trigger: item.trigger,
        };
      }
    });

    // Return as a proposed_items suggestion with parentItem context
    return JSON.stringify({
      success: true,
      type: "proposed_items",
      suggestion: {
        id: `dep-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type: "proposed_items",
        items: proposedItems,
        entryId,
        parentItem: {
          id: parentId,
          type: parentType,
          title: parentTitle,
        },
      },
      message: `Proposed ${proposedItems.length} dependenc${proposedItems.length === 1 ? "y" : "ies"} for "${parentTitle}"`,
    });
  } catch (error) {
    console.error("Error proposing dependencies:", error);
    return JSON.stringify({ error: "Failed to propose dependencies" });
  }
}

async function suggestStyleEdit(
  userId: string,
  input: Record<string, unknown>,
  entryId?: string
): Promise<string> {
  try {
    const originalText = String(input.original_text);
    const suggestedText = String(input.suggested_text);
    const editType = String(input.edit_type);
    const explanation = String(input.explanation);

    // Create a style edit record
    const styleEdit = await prisma.styleEdit.create({
      data: {
        userId,
        originalText,
        suggestedText,
        editType,
        explanation,
        sourceEntryId: entryId || null,
      },
    });

    return JSON.stringify({
      success: true,
      type: "style_edit",
      suggestion: {
        id: styleEdit.id,
        originalText,
        suggestedText,
        editType,
        explanation,
        targetEntryId: entryId,
      },
      message: "Style edit suggestion created - user will see option to accept or reject",
    });
  } catch (error) {
    console.error("Error suggesting style edit:", error);
    return JSON.stringify({ error: "Failed to create style edit suggestion" });
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
