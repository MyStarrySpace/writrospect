import prisma from "@/lib/prisma";
import { CommitmentStatus, MotivationType } from "@prisma/client";
import Anthropic from "@anthropic-ai/sdk";

// Tool definitions for Claude
export const commitmentTools: Anthropic.Tool[] = [
  {
    name: "create_commitment",
    description:
      "Create a new commitment that the user has expressed. Use this when the user mentions something they want to do, plan to do, or commit to doing. Capture the intent immediately - it can be fleshed out into a SMART goal later. Maturity 0-1 is fine for quick captures.",
    input_schema: {
      type: "object" as const,
      properties: {
        what: {
          type: "string",
          description: "A clear, brief description of the commitment",
        },
        why: {
          type: "string",
          description: "The underlying motivation or reason (if known) - covers 'Relevant' in SMART",
        },
        complexity: {
          type: "number",
          description:
            "Complexity from 1-5 (1=trivial like send an email, 5=major project)",
        },
        motivation_type: {
          type: "string",
          enum: [
            "intrinsic",
            "extrinsic",
            "obligation",
            "curiosity",
            "growth",
            "maintenance",
          ],
          description: "The type of motivation driving this commitment",
        },
        // SMART goal fields (all optional - fill what you know)
        specific_details: {
          type: "string",
          description: "Detailed breakdown of what needs to be done (optional, for fleshing out later)",
        },
        success_criteria: {
          type: "string",
          description: "How will we know it's done? Measurable outcome (optional)",
        },
        requirements: {
          type: "array",
          items: { type: "string" },
          description: "What resources, skills, or conditions are needed (optional)",
        },
        due_date: {
          type: "string",
          description: "ISO date string if a deadline was mentioned (optional)",
        },
        timeframe: {
          type: "string",
          description: "Rough timeframe like 'this week', 'by end of month' (optional)",
        },
      },
      required: ["what", "complexity", "motivation_type"],
    },
  },
  {
    name: "update_commitment",
    description:
      "Update an existing commitment. Use to change status, add outcomes, or flesh out SMART goal details.",
    input_schema: {
      type: "object" as const,
      properties: {
        commitment_id: {
          type: "string",
          description: "The ID of the commitment to update",
        },
        status: {
          type: "string",
          enum: ["active", "completed", "abandoned", "paused"],
          description: "New status for the commitment",
        },
        outcome: {
          type: "string",
          description: "What actually happened (for completed/abandoned)",
        },
        learned: {
          type: "string",
          description: "Lessons learned from this commitment",
        },
        // SMART fields for fleshing out
        specific_details: {
          type: "string",
          description: "Detailed breakdown of what needs to be done",
        },
        success_criteria: {
          type: "string",
          description: "How will we know it's done? Measurable outcome",
        },
        requirements: {
          type: "array",
          items: { type: "string" },
          description: "What resources, skills, or conditions are needed",
        },
        due_date: {
          type: "string",
          description: "ISO date string for deadline",
        },
        timeframe: {
          type: "string",
          description: "Rough timeframe like 'this week', 'by end of month'",
        },
      },
      required: ["commitment_id"],
    },
  },
  {
    name: "list_commitments",
    description:
      "List the user's current commitments. Use this to check what commitments exist before creating duplicates or when the user asks about their commitments.",
    input_schema: {
      type: "object" as const,
      properties: {
        status: {
          type: "string",
          enum: ["active", "completed", "abandoned", "paused", "all"],
          description: "Filter by status (default: active)",
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
export async function executeCommitmentTool(
  userId: string,
  toolName: string,
  toolInput: Record<string, unknown>,
  entryId?: string
): Promise<string> {
  switch (toolName) {
    case "create_commitment":
      return createCommitment(userId, toolInput, entryId);
    case "update_commitment":
      return updateCommitment(userId, toolInput);
    case "list_commitments":
      return listCommitments(userId, toolInput);
    default:
      return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }
}

// Calculate maturity score based on filled SMART fields (0-5)
function calculateMaturity(data: {
  what?: string;
  why?: string | null;
  specificDetails?: string | null;
  successCriteria?: string | null;
  requirements?: string[];
  dueDate?: Date | null;
  timeframe?: string | null;
}): number {
  let score = 0;
  // Basic capture (what) = 1 point
  if (data.what) score += 1;
  // Relevant (why) = 1 point
  if (data.why) score += 1;
  // Specific (detailed breakdown) = 1 point
  if (data.specificDetails) score += 1;
  // Measurable (success criteria) = 1 point
  if (data.successCriteria) score += 1;
  // Achievable (requirements known) OR Time-bound = 1 point
  if ((data.requirements && data.requirements.length > 0) || data.dueDate || data.timeframe) score += 1;
  return Math.min(score, 5);
}

async function createCommitment(
  userId: string,
  input: Record<string, unknown>,
  entryId?: string
): Promise<string> {
  try {
    // Check for similar existing commitments to avoid duplicates
    const existing = await prisma.commitment.findMany({
      where: {
        userId,
        status: "active",
        what: {
          contains: String(input.what).substring(0, 50),
          mode: "insensitive",
        },
      },
      take: 3,
    });

    if (existing.length > 0) {
      return JSON.stringify({
        warning: "Similar commitments already exist",
        existing: existing.map((c) => ({
          id: c.id,
          what: c.what,
          status: c.status,
          maturity: c.maturity,
          createdAt: c.createdAt.toISOString(),
        })),
        action: "Did not create new commitment. Please use update_commitment if you want to modify existing ones.",
      });
    }

    const requirements = Array.isArray(input.requirements)
      ? input.requirements.map(String)
      : [];

    const commitmentData = {
      userId,
      what: String(input.what),
      why: input.why ? String(input.why) : null,
      complexity: Number(input.complexity) || 3,
      motivationType: (input.motivation_type as MotivationType) || "intrinsic",
      specificDetails: input.specific_details ? String(input.specific_details) : null,
      successCriteria: input.success_criteria ? String(input.success_criteria) : null,
      requirements,
      dueDate: input.due_date ? new Date(String(input.due_date)) : null,
      timeframe: input.timeframe ? String(input.timeframe) : null,
      sourceEntryId: entryId || null,
      maturity: 0, // Will be calculated below
    };

    commitmentData.maturity = calculateMaturity(commitmentData);

    const commitment = await prisma.commitment.create({
      data: commitmentData,
    });

    return JSON.stringify({
      success: true,
      commitment: {
        id: commitment.id,
        what: commitment.what,
        why: commitment.why,
        complexity: commitment.complexity,
        maturity: commitment.maturity,
        motivationType: commitment.motivationType,
        dueDate: commitment.dueDate?.toISOString(),
        timeframe: commitment.timeframe,
        status: commitment.status,
      },
      hint: commitment.maturity < 3 ? "This commitment can be fleshed out later into a SMART goal." : null,
    });
  } catch (error) {
    console.error("Error creating commitment:", error);
    return JSON.stringify({ error: "Failed to create commitment" });
  }
}

async function updateCommitment(
  userId: string,
  input: Record<string, unknown>
): Promise<string> {
  try {
    const commitmentId = String(input.commitment_id);

    // Verify ownership
    const existing = await prisma.commitment.findFirst({
      where: { id: commitmentId, userId },
    });

    if (!existing) {
      return JSON.stringify({ error: "Commitment not found" });
    }

    const updateData: {
      status?: CommitmentStatus;
      outcome?: string;
      learned?: string;
      specificDetails?: string;
      successCriteria?: string;
      requirements?: string[];
      dueDate?: Date;
      timeframe?: string;
      maturity?: number;
    } = {};

    if (input.status) updateData.status = input.status as CommitmentStatus;
    if (input.outcome) updateData.outcome = String(input.outcome);
    if (input.learned) updateData.learned = String(input.learned);
    if (input.specific_details) updateData.specificDetails = String(input.specific_details);
    if (input.success_criteria) updateData.successCriteria = String(input.success_criteria);
    if (input.requirements && Array.isArray(input.requirements)) {
      updateData.requirements = input.requirements.map(String);
    }
    if (input.due_date) updateData.dueDate = new Date(String(input.due_date));
    if (input.timeframe) updateData.timeframe = String(input.timeframe);

    // Recalculate maturity with merged data
    const mergedData = {
      what: existing.what,
      why: existing.why,
      specificDetails: updateData.specificDetails ?? existing.specificDetails,
      successCriteria: updateData.successCriteria ?? existing.successCriteria,
      requirements: updateData.requirements ?? existing.requirements,
      dueDate: updateData.dueDate ?? existing.dueDate,
      timeframe: updateData.timeframe ?? existing.timeframe,
    };
    updateData.maturity = calculateMaturity(mergedData);

    const updated = await prisma.commitment.update({
      where: { id: commitmentId },
      data: updateData,
    });

    return JSON.stringify({
      success: true,
      commitment: {
        id: updated.id,
        what: updated.what,
        status: updated.status,
        maturity: updated.maturity,
        outcome: updated.outcome,
        learned: updated.learned,
      },
      maturityChange: updated.maturity !== existing.maturity
        ? `Maturity: ${existing.maturity} → ${updated.maturity}/5`
        : null,
    });
  } catch (error) {
    console.error("Error updating commitment:", error);
    return JSON.stringify({ error: "Failed to update commitment" });
  }
}

async function listCommitments(
  userId: string,
  input: Record<string, unknown>
): Promise<string> {
  try {
    const statusFilter = input.status || "active";
    const limit = Number(input.limit) || 10;

    const where: { userId: string; status?: CommitmentStatus } = { userId };
    if (statusFilter !== "all") {
      where.status = statusFilter as CommitmentStatus;
    }

    const commitments = await prisma.commitment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const needsFleshing = commitments.filter((c) => c.maturity < 3 && c.status === "active");

    return JSON.stringify({
      count: commitments.length,
      commitments: commitments.map((c) => ({
        id: c.id,
        what: c.what,
        why: c.why,
        status: c.status,
        maturity: c.maturity,
        complexity: c.complexity,
        motivationType: c.motivationType,
        dueDate: c.dueDate?.toISOString(),
        timeframe: c.timeframe,
        createdAt: c.createdAt.toISOString(),
        daysOld: Math.floor(
          (Date.now() - c.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        ),
      })),
      hint: needsFleshing.length > 0
        ? `${needsFleshing.length} commitment(s) could be fleshed out into SMART goals.`
        : null,
    });
  } catch (error) {
    console.error("Error listing commitments:", error);
    return JSON.stringify({ error: "Failed to list commitments" });
  }
}
