import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack";
import prisma from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/utils/user";

// GET /api/tasks/[id] - Get a single task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getOrCreateUser(user.id, user.primaryEmail || "");
    const { id } = await params;

    const task = await prisma.task.findFirst({
      where: {
        id,
        userId: dbUser.id,
      },
      include: {
        relatedHabit: {
          select: { id: true, what: true },
        },
        relatedPerson: {
          select: { id: true, name: true },
        },
        sourceEntry: {
          select: { id: true, date: true },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json(
      { error: "Failed to fetch task" },
      { status: 500 }
    );
  }
}

// PATCH /api/tasks/[id] - Update a task
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getOrCreateUser(user.id, user.primaryEmail || "");
    const { id } = await params;
    const body = await request.json();

    // Verify ownership
    const existing = await prisma.task.findFirst({
      where: { id, userId: dbUser.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (body.what !== undefined) {
      updateData.what = body.what.trim();
    }
    if (body.context !== undefined) {
      updateData.context = body.context?.trim() || null;
    }
    if (body.status !== undefined) {
      updateData.status = body.status;
      if (body.status === "completed") {
        updateData.completedAt = new Date();
      }
    }
    if (body.urgency !== undefined) {
      updateData.urgency = body.urgency;
    }
    if (body.dueDate !== undefined) {
      updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    }
    if (body.dueTime !== undefined) {
      updateData.dueTime = body.dueTime?.trim() || null;
    }
    if (body.outcome !== undefined) {
      updateData.outcome = body.outcome?.trim() || null;
    }
    if (body.skippedReason !== undefined) {
      updateData.skippedReason = body.skippedReason?.trim() || null;
    }
    if (body.deferredTo !== undefined) {
      updateData.deferredTo = body.deferredTo ? new Date(body.deferredTo) : null;
    }

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ task });
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id] - Delete a task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getOrCreateUser(user.id, user.primaryEmail || "");
    const { id } = await params;

    // Verify ownership
    const existing = await prisma.task.findFirst({
      where: { id, userId: dbUser.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    await prisma.task.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
