import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack";
import prisma from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/utils/user";

// GET /api/goals - List goals
export async function GET(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getOrCreateUser(user.id, user.primaryEmail || "");

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as "active" | "completed" | "paused" | "abandoned" | null;
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where = {
      userId: dbUser.id,
      ...(status && { status }),
    };

    const goals = await prisma.goal.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        _count: {
          select: {
            strategies: true,
            tasks: true,
          },
        },
      },
    });

    const total = await prisma.goal.count({ where });

    return NextResponse.json({
      goals,
      total,
      hasMore: offset + goals.length < total,
    });
  } catch (error) {
    console.error("Error fetching goals:", error);
    return NextResponse.json(
      { error: "Failed to fetch goals" },
      { status: 500 }
    );
  }
}

// POST /api/goals - Create a new goal
export async function POST(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getOrCreateUser(user.id, user.primaryEmail || "");
    const body = await request.json();

    if (!body.title || body.title.trim().length === 0) {
      return NextResponse.json(
        { error: "Goal title is required" },
        { status: 400 }
      );
    }

    const goal = await prisma.goal.create({
      data: {
        userId: dbUser.id,
        title: body.title.trim(),
        description: body.description?.trim() || null,
        why: body.why?.trim() || null,
        status: "active",
        progress: 0,
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

    return NextResponse.json({ goal }, { status: 201 });
  } catch (error) {
    console.error("Error creating goal:", error);
    return NextResponse.json(
      { error: "Failed to create goal" },
      { status: 500 }
    );
  }
}
