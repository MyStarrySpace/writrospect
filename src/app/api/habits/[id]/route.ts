import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack";
import prisma from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/utils/user";

// GET /api/habits/[id] - Get a single habit
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

    const habit = await prisma.habit.findFirst({
      where: { id, userId: dbUser.id },
      include: {
        sourceEntry: true,
        strategies: true,
      },
    });

    if (!habit) {
      return NextResponse.json(
        { error: "Habit not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ habit });
  } catch (error) {
    console.error("Error fetching habit:", error);
    return NextResponse.json(
      { error: "Failed to fetch habit" },
      { status: 500 }
    );
  }
}

// PATCH /api/habits/[id] - Update a habit
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
    const existing = await prisma.habit.findFirst({
      where: { id, userId: dbUser.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Habit not found" },
        { status: 404 }
      );
    }

    const habit = await prisma.habit.update({
      where: { id },
      data: {
        what: body.what,
        why: body.why,
        complexity: body.complexity,
        motivationType: body.motivationType,
        status: body.status,
        outcome: body.outcome,
        conditionsWhenCompleted: body.conditionsWhenCompleted,
        learned: body.learned,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      },
      include: {
        sourceEntry: true,
        strategies: true,
      },
    });

    return NextResponse.json({ habit });
  } catch (error) {
    console.error("Error updating habit:", error);
    return NextResponse.json(
      { error: "Failed to update habit" },
      { status: 500 }
    );
  }
}

// DELETE /api/habits/[id] - Delete a habit
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
    const existing = await prisma.habit.findFirst({
      where: { id, userId: dbUser.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Habit not found" },
        { status: 404 }
      );
    }

    await prisma.habit.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting habit:", error);
    return NextResponse.json(
      { error: "Failed to delete habit" },
      { status: 500 }
    );
  }
}
