import prisma from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

// Tool definitions for strategy management
export const strategyTools: Anthropic.Tool[] = [
  {
    name: "create_strategy",
    description:
      "Create a new strategy when the user mentions an approach, technique, framework, or principle they want to try or have found useful. Strategies are reusable approaches that can be applied to multiple habits. Examples: 'Ray Dalio's radical transparency', 'using AI as a stress-testing partner', 'building systems instead of relying on willpower', 'time-boxing work sessions'.",
    input_schema: {
      type: "object" as const,
      properties: {
        strategy: {
          type: "string",
          description: "Description of the strategy/approach/technique",
        },
        context: {
          type: "string",
          description: "When/where/how this strategy is applied (e.g., 'when making decisions', 'for building habits', 'during project planning')",
        },
        complexity: {
          type: "number",
          description: "Complexity from 1-5 (1=simple rule/principle, 5=elaborate system)",
        },
        source: {
          type: "string",
          description: "Where this strategy came from (e.g., 'Ray Dalio Principles', 'personal discovery', 'therapy')",
        },
        notes: {
          type: "string",
          description: "Additional observations or details about why this might work for them",
        },
        habit_ids: {
          type: "array",
          items: { type: "string" },
          description: "IDs of related habits this strategy applies to (optional)",
        },
      },
      required: ["strategy", "context"],
    },
  },
  {
    name: "update_strategy",
    description:
      "Update an existing strategy. Use this to record whether it worked, add notes from experience, or mark it as tried again.",
    input_schema: {
      type: "object" as const,
      properties: {
        strategy_id: {
          type: "string",
          description: "The ID of the strategy to update",
        },
        worked: {
          type: "boolean",
          description: "Whether the strategy worked (true), didn't work (false), or leave null if still testing",
        },
        notes: {
          type: "string",
          description: "Observations about effectiveness or how it was applied",
        },
        tried_again: {
          type: "boolean",
          description: "Set to true to increment timesTried and update lastTried",
        },
        habit_ids: {
          type: "array",
          items: { type: "string" },
          description: "IDs of habits to link this strategy to",
        },
      },
      required: ["strategy_id"],
    },
  },
  {
    name: "list_strategies",
    description:
      "List the user's recorded strategies. Use this to check what approaches they've tried, find strategies that worked, or avoid suggesting something they've already tried.",
    input_schema: {
      type: "object" as const,
      properties: {
        worked: {
          type: "string",
          enum: ["true", "false", "untested", "all"],
          description: "Filter by effectiveness (default: all)",
        },
        limit: {
          type: "number",
          description: "Maximum number to return (default: 10)",
        },
      },
      required: [],
    },
  },
];

// Tool execution handlers
export async function executeStrategyTool(
  userId: string,
  toolName: string,
  toolInput: Record<string, unknown>
): Promise<string> {
  switch (toolName) {
    case "create_strategy":
      return createStrategy(userId, toolInput);
    case "update_strategy":
      return updateStrategy(userId, toolInput);
    case "list_strategies":
      return listStrategies(userId, toolInput);
    default:
      return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }
}

async function createStrategy(
  userId: string,
  input: Record<string, unknown>
): Promise<string> {
  try {
    const strategyText = String(input.strategy);

    // Check for similar existing strategies to avoid duplicates
    const existing = await prisma.strategy.findMany({
      where: {
        userId,
        strategy: {
          contains: strategyText.substring(0, 50),
          mode: "insensitive",
        },
      },
      take: 3,
    });

    if (existing.length > 0) {
      return JSON.stringify({
        warning: "Similar strategies already exist",
        existing: existing.map((s) => ({
          id: s.id,
          strategy: s.strategy,
          context: s.context,
          worked: s.worked,
          timesTried: s.timesTried,
        })),
        action: "Did not create new strategy. Use update_strategy to modify existing ones or add notes.",
      });
    }

    const strategy = await prisma.strategy.create({
      data: {
        userId,
        strategy: strategyText,
        context: String(input.context),
        complexity: Number(input.complexity) || 3,
        notes: input.notes ? String(input.notes) : null,
        worked: null, // Not yet tested
        timesTried: 1,
        lastTried: new Date(),
        relatedHabits: input.habit_ids && Array.isArray(input.habit_ids)
          ? { connect: (input.habit_ids as string[]).map((id) => ({ id })) }
          : undefined,
      },
      include: {
        relatedHabits: {
          select: { id: true, what: true },
        },
      },
    });

    return JSON.stringify({
      success: true,
      strategy: {
        id: strategy.id,
        strategy: strategy.strategy,
        context: strategy.context,
        complexity: strategy.complexity,
        notes: strategy.notes,
        worked: strategy.worked,
        timesTried: strategy.timesTried,
        relatedHabits: strategy.relatedHabits,
      },
    });
  } catch (error) {
    console.error("Error creating strategy:", error);
    return JSON.stringify({ error: "Failed to create strategy" });
  }
}

async function updateStrategy(
  userId: string,
  input: Record<string, unknown>
): Promise<string> {
  try {
    const strategyId = String(input.strategy_id);

    // Verify ownership
    const existing = await prisma.strategy.findFirst({
      where: { id: strategyId, userId },
    });

    if (!existing) {
      return JSON.stringify({ error: "Strategy not found" });
    }

    const updateData: {
      worked?: boolean | null;
      notes?: string;
      timesTried?: number;
      lastTried?: Date;
      relatedHabits?: { connect: { id: string }[] };
    } = {};

    if (input.worked !== undefined) {
      updateData.worked = input.worked === null ? null : Boolean(input.worked);
    }

    if (input.notes) {
      // Append to existing notes
      updateData.notes = existing.notes
        ? `${existing.notes}\n\n---\n\n${String(input.notes)}`
        : String(input.notes);
    }

    if (input.tried_again) {
      updateData.timesTried = existing.timesTried + 1;
      updateData.lastTried = new Date();
    }

    if (input.habit_ids && Array.isArray(input.habit_ids)) {
      updateData.relatedHabits = {
        connect: (input.habit_ids as string[]).map((id) => ({ id })),
      };
    }

    const updated = await prisma.strategy.update({
      where: { id: strategyId },
      data: updateData,
      include: {
        relatedHabits: {
          select: { id: true, what: true },
        },
      },
    });

    return JSON.stringify({
      success: true,
      strategy: {
        id: updated.id,
        strategy: updated.strategy,
        context: updated.context,
        worked: updated.worked,
        timesTried: updated.timesTried,
        lastTried: updated.lastTried.toISOString(),
        notes: updated.notes,
        relatedHabits: updated.relatedHabits,
      },
    });
  } catch (error) {
    console.error("Error updating strategy:", error);
    return JSON.stringify({ error: "Failed to update strategy" });
  }
}

async function listStrategies(
  userId: string,
  input: Record<string, unknown>
): Promise<string> {
  try {
    const workedFilter = input.worked || "all";
    const limit = Number(input.limit) || 10;

    const where: { userId: string; worked?: boolean | null } = { userId };

    if (workedFilter === "true") {
      where.worked = true;
    } else if (workedFilter === "false") {
      where.worked = false;
    } else if (workedFilter === "untested") {
      where.worked = null;
    }
    // "all" means no filter on worked

    const strategies = await prisma.strategy.findMany({
      where,
      orderBy: { lastTried: "desc" },
      take: limit,
      include: {
        relatedHabits: {
          select: { id: true, what: true, status: true },
        },
      },
    });

    const workedStrategies = strategies.filter((s) => s.worked === true);
    const failedStrategies = strategies.filter((s) => s.worked === false);
    const untestedStrategies = strategies.filter((s) => s.worked === null);

    return JSON.stringify({
      count: strategies.length,
      summary: {
        worked: workedStrategies.length,
        failed: failedStrategies.length,
        untested: untestedStrategies.length,
      },
      strategies: strategies.map((s) => ({
        id: s.id,
        strategy: s.strategy,
        context: s.context,
        complexity: s.complexity,
        worked: s.worked,
        timesTried: s.timesTried,
        lastTried: s.lastTried.toISOString(),
        notes: s.notes,
        relatedHabits: s.relatedHabits,
      })),
      hint: workedStrategies.length > 0
        ? `${workedStrategies.length} strategies have worked before - consider applying them to new challenges.`
        : null,
    });
  } catch (error) {
    console.error("Error listing strategies:", error);
    return JSON.stringify({ error: "Failed to list strategies" });
  }
}
