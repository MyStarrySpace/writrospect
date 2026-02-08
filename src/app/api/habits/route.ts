import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack";
import prisma from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/utils/user";
import { HabitStatus } from "@prisma/client";

// GET /api/habits - List habits
export async function GET(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getOrCreateUser(user.id, user.primaryEmail || "");

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as HabitStatus | null;
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where = {
      userId: dbUser.id,
      ...(status && { status }),
    };

    const habits = await prisma.habit.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        sourceEntry: {
          select: { id: true, date: true, content: true },
        },
        strategies: {
          select: { id: true, strategy: true, worked: true },
        },
      },
    });

    const total = await prisma.habit.count({ where });

    return NextResponse.json({
      habits,
      total,
      hasMore: offset + habits.length < total,
    });
  } catch (error) {
    console.error("Error fetching habits:", error);
    return NextResponse.json(
      { error: "Failed to fetch habits" },
      { status: 500 }
    );
  }
}

// POST /api/habits - Create a new habit
export async function POST(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getOrCreateUser(user.id, user.primaryEmail || "");
    const body = await request.json();

    if (!body.what || body.what.trim().length === 0) {
      return NextResponse.json(
        { error: "Habit description is required" },
        { status: 400 }
      );
    }

    const habit = await prisma.habit.create({
      data: {
        userId: dbUser.id,
        what: body.what.trim(),
        why: body.why?.trim() || null,
        complexity: body.complexity || 3,
        motivationType: body.motivationType || "intrinsic",
        status: "active",
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        sourceEntryId: body.sourceEntryId || null,
      },
    });

    return NextResponse.json({ habit }, { status: 201 });
  } catch (error) {
    console.error("Error creating habit:", error);
    return NextResponse.json(
      { error: "Failed to create habit" },
      { status: 500 }
    );
  }
}
