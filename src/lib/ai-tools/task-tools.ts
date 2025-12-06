import prisma from "@/lib/prisma";
import { TaskStatus, TaskUrgency } from "@prisma/client";
import Anthropic from "@anthropic-ai/sdk";

// Tool definitions for Claude - Tasks are specific actions (vs long-term Commitments)
export const taskTools: Anthropic.Tool[] = [
  {
    name: "create_task",
    description:
      "Create a specific, actionable task. Tasks are different from commitments: Tasks are concrete actions with clear completion criteria (e.g., 'Call doctor at 9AM'), while Commitments are ongoing/long-term goals (e.g., 'Help boyfriend stay on track'). Use this for specific things to DO, not for ongoing responsibilities.",
    input_schema: {
      type: "object" as const,
      properties: {
        what: {
          type: "string",
          description: "A clear, specific description of the task to do",
        },
        context: {
          type: "string",
          description: "Additional context or notes about the task",
        },
        urgency: {
          type: "string",
          enum: ["now", "today", "this_week", "whenever"],
          description: "How urgent is this task? (now = must do immediately, today = should do today, this_week = should do this week, whenever = no time pressure)",
        },
        due_date: {
          type: "string",
          description: "ISO date string if there's a specific deadline (optional)",
        },
        due_time: {
          type: "string",
          description: "Specific time like '9AM', 'when they open', 'after lunch' (optional)",
        },
        related_commitment_id: {
          type: "string",
          description: "ID of a related commitment if this task supports a larger goal (optional)",
        },
        related_person_name: {
          type: "string",
          description: "Name of a person this task relates to (optional)",
        },
      },
      required: ["what", "urgency"],
    },
  },
  {
    name: "update_task",
    description:
      "Update an existing task - mark it completed, skipped, or deferred.",
    input_schema: {
      type: "object" as const,
      properties: {
        task_id: {
          type: "string",
          description: "The ID of the task to update",
        },
        status: {
          type: "string",
          enum: ["pending", "completed", "skipped", "deferred"],
          description: "New status for the task",
        },
        outcome: {
          type: "string",
          description: "What actually happened (for completed tasks)",
        },
        skipped_reason: {
          type: "string",
          description: "Why the task was skipped (for skipped tasks)",
        },
        deferred_to: {
          type: "string",
          description: "ISO date string for when the task was rescheduled to (for deferred tasks)",
        },
      },
      required: ["task_id"],
    },
  },
  {
    name: "list_tasks",
    description:
      "List the user's tasks. Use this to check what tasks exist, especially before creating duplicates.",
    input_schema: {
      type: "object" as const,
      properties: {
        status: {
          type: "string",
          enum: ["pending", "completed", "skipped", "deferred", "all"],
          description: "Filter by status (default: pending)",
        },
        urgency: {
          type: "string",
          enum: ["now", "today", "this_week", "whenever", "all"],
          description: "Filter by urgency (default: all)",
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
export async function executeTaskTool(
  userId: string,
  toolName: string,
  toolInput: Record<string, unknown>,
  entryId?: string
): Promise<string> {
  switch (toolName) {
    case "create_task":
      return createTask(userId, toolInput, entryId);
    case "update_task":
      return updateTask(userId, toolInput);
    case "list_tasks":
      return listTasks(userId, toolInput);
    default:
      return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }
}

// Helper to extract key terms from a task description
function extractKeyTerms(text: string): string[] {
  const stopWords = new Set(['a', 'an', 'the', 'to', 'do', 'get', 'make', 'need', 'have', 'out', 'up', 'on', 'for', 'at', 'in', 'my', 'it', 'of']);
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));
}

// Check if two task descriptions are similar enough to be duplicates
function tasksAreSimilar(task1: string, task2: string): boolean {
  const terms1 = extractKeyTerms(task1);
  const terms2 = extractKeyTerms(task2);

  if (terms1.length === 0 || terms2.length === 0) return false;

  // Count matching terms
  const matchCount = terms1.filter(t => terms2.includes(t)).length;

  // If more than half of the terms match, consider it a duplicate
  const minTerms = Math.min(terms1.length, terms2.length);
  return matchCount >= Math.ceil(minTerms * 0.6);
}

async function createTask(
  userId: string,
  input: Record<string, unknown>,
  entryId?: string
): Promise<string> {
  try {
    const newTaskWhat = String(input.what);

    // Check for similar existing tasks to avoid duplicates
    // First get all pending tasks, then do smarter matching
    const allPending = await prisma.task.findMany({
      where: {
        userId,
        status: "pending",
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // Find tasks that are similar using our smarter matching
    const similar = allPending.filter(t => tasksAreSimilar(newTaskWhat, t.what));

    if (similar.length > 0) {
      return JSON.stringify({
        warning: "Similar tasks already exist",
        existing: similar.map((t) => ({
          id: t.id,
          what: t.what,
          status: t.status,
          urgency: t.urgency,
          dueDate: t.dueDate?.toISOString(),
          dueTime: t.dueTime,
          createdAt: t.createdAt.toISOString(),
        })),
        action: "Did not create new task. Please use update_task if you want to modify existing ones, or let the user know the task is already tracked.",
      });
    }

    // Look up related person if provided
    let relatedPersonId: string | null = null;
    if (input.related_person_name) {
      const person = await prisma.person.findFirst({
        where: {
          userId,
          name: {
            equals: String(input.related_person_name),
            mode: "insensitive",
          },
        },
      });
      if (person) {
        relatedPersonId = person.id;
      }
    }

    const task = await prisma.task.create({
      data: {
        userId,
        what: String(input.what),
        context: input.context ? String(input.context) : null,
        urgency: (input.urgency as TaskUrgency) || "whenever",
        dueDate: input.due_date ? new Date(String(input.due_date)) : null,
        dueTime: input.due_time ? String(input.due_time) : null,
        relatedCommitmentId: input.related_commitment_id ? String(input.related_commitment_id) : null,
        relatedPersonId,
        sourceEntryId: entryId || null,
      },
    });

    return JSON.stringify({
      success: true,
      task: {
        id: task.id,
        what: task.what,
        urgency: task.urgency,
        dueDate: task.dueDate?.toISOString(),
        dueTime: task.dueTime,
        status: task.status,
      },
    });
  } catch (error) {
    console.error("Error creating task:", error);
    return JSON.stringify({ error: "Failed to create task" });
  }
}

async function updateTask(
  userId: string,
  input: Record<string, unknown>
): Promise<string> {
  try {
    const taskId = String(input.task_id);

    // Verify ownership
    const existing = await prisma.task.findFirst({
      where: { id: taskId, userId },
    });

    if (!existing) {
      return JSON.stringify({ error: "Task not found" });
    }

    const updateData: {
      status?: TaskStatus;
      outcome?: string;
      skippedReason?: string;
      deferredTo?: Date;
      completedAt?: Date;
    } = {};

    if (input.status) {
      updateData.status = input.status as TaskStatus;
      if (input.status === "completed") {
        updateData.completedAt = new Date();
      }
    }
    if (input.outcome) updateData.outcome = String(input.outcome);
    if (input.skipped_reason) updateData.skippedReason = String(input.skipped_reason);
    if (input.deferred_to) updateData.deferredTo = new Date(String(input.deferred_to));

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
    });

    return JSON.stringify({
      success: true,
      task: {
        id: updated.id,
        what: updated.what,
        status: updated.status,
        outcome: updated.outcome,
        completedAt: updated.completedAt?.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error updating task:", error);
    return JSON.stringify({ error: "Failed to update task" });
  }
}

async function listTasks(
  userId: string,
  input: Record<string, unknown>
): Promise<string> {
  try {
    const statusFilter = input.status || "pending";
    const urgencyFilter = input.urgency || "all";
    const limit = Number(input.limit) || 10;

    const where: { userId: string; status?: TaskStatus; urgency?: TaskUrgency } = { userId };
    if (statusFilter !== "all") {
      where.status = statusFilter as TaskStatus;
    }
    if (urgencyFilter !== "all") {
      where.urgency = urgencyFilter as TaskUrgency;
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [
        { urgency: "asc" }, // now, today, this_week, whenever
        { dueDate: "asc" },
        { createdAt: "desc" },
      ],
      take: limit,
      include: {
        relatedPerson: { select: { name: true } },
        relatedCommitment: { select: { what: true } },
      },
    });

    const urgentCount = tasks.filter((t) => t.urgency === "now" || t.urgency === "today").length;

    return JSON.stringify({
      count: tasks.length,
      urgentCount,
      tasks: tasks.map((t) => ({
        id: t.id,
        what: t.what,
        context: t.context,
        status: t.status,
        urgency: t.urgency,
        dueDate: t.dueDate?.toISOString(),
        dueTime: t.dueTime,
        relatedPerson: t.relatedPerson?.name,
        relatedCommitment: t.relatedCommitment?.what?.slice(0, 50),
        createdAt: t.createdAt.toISOString(),
      })),
      hint: urgentCount > 0 ? `${urgentCount} task(s) need attention soon.` : null,
    });
  } catch (error) {
    console.error("Error listing tasks:", error);
    return JSON.stringify({ error: "Failed to list tasks" });
  }
}
