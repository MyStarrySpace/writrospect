import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack";
import prisma from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/utils/user";

// GET /api/goals/[id] - Get a single goal
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

    const goal = await prisma.goal.findFirst({
      where: {
        id,
        userId: dbUser.id,
      },
      include: {
        strategies: {
          select: {
            id: true,
            strategy: true,
            context: true,
            worked: true,
            timesTried: true,
          },
        },
        tasks: {
          select: {
            id: true,
            what: true,
            status: true,
            urgency: true,
            dueDate: true,
          },
        },
        _count: {
          select: {
            strategies: true,
            tasks: true,
          },
        },
      },
    });

    if (!goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    return NextResponse.json({ goal });
  } catch (error) {
    console.error("Error fetching goal:", error);
    return NextResponse.json(
      { error: "Failed to fetch goal" },
      { status: 500 }
    );
  }
}

// PATCH /api/goals/[id] - Update a goal
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
    const existing = await prisma.goal.findFirst({
      where: { id, userId: dbUser.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    const goal = await prisma.goal.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title.trim() }),
        ...(body.description !== undefined && {
          description: body.description?.trim() || null,
        }),
        ...(body.why !== undefined && { why: body.why?.trim() || null }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.progress !== undefined && { progress: body.progress }),
        ...(body.outcome !== undefined && {
          outcome: body.outcome?.trim() || null,
        }),
        ...(body.learned !== undefined && {
          learned: body.learned?.trim() || null,
        }),
      },
      include: {
        _count: {
          select: {
            strategies: true,
            tasks: true,
          },
        },
      },
    });

    return NextResponse.json({ goal });
  } catch (error) {
    console.error("Error updating goal:", error);
    return NextResponse.json(
      { error: "Failed to update goal" },
      { status: 500 }
    );
  }
}

// DELETE /api/goals/[id] - Delete a goal
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
    const existing = await prisma.goal.findFirst({
      where: { id, userId: dbUser.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    // Delete the goal (strategies and tasks will have their goalId set to null due to onDelete: SetNull)
    await prisma.goal.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting goal:", error);
    return NextResponse.json(
      { error: "Failed to delete goal" },
      { status: 500 }
    );
  }
}
