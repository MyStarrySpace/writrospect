import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack";
import prisma from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/utils/user";

// GET /api/strategies - List strategies
export async function GET(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getOrCreateUser(user.id, user.primaryEmail || "");

    const { searchParams } = new URL(request.url);
    const worked = searchParams.get("worked");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where = {
      userId: dbUser.id,
      ...(worked !== null && { worked: worked === "true" }),
    };

    const strategies = await prisma.strategy.findMany({
      where,
      orderBy: { lastTried: "desc" },
      take: limit,
      skip: offset,
      include: {
        relatedCommitments: {
          select: { id: true, what: true, status: true },
        },
      },
    });

    const total = await prisma.strategy.count({ where });

    return NextResponse.json({
      strategies,
      total,
      hasMore: offset + strategies.length < total,
    });
  } catch (error) {
    console.error("Error fetching strategies:", error);
    return NextResponse.json(
      { error: "Failed to fetch strategies" },
      { status: 500 }
    );
  }
}

// POST /api/strategies - Create a new strategy
export async function POST(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getOrCreateUser(user.id, user.primaryEmail || "");
    const body = await request.json();

    if (!body.strategy || body.strategy.trim().length === 0) {
      return NextResponse.json(
        { error: "Strategy description is required" },
        { status: 400 }
      );
    }

    if (!body.context || body.context.trim().length === 0) {
      return NextResponse.json(
        { error: "Context is required" },
        { status: 400 }
      );
    }

    const strategy = await prisma.strategy.create({
      data: {
        userId: dbUser.id,
        strategy: body.strategy.trim(),
        context: body.context.trim(),
        complexity: body.complexity || 3,
        notes: body.notes?.trim() || null,
        worked: null,
        timesTried: 1,
        lastTried: new Date(),
        relatedCommitments: body.commitmentIds
          ? { connect: body.commitmentIds.map((id: string) => ({ id })) }
          : undefined,
      },
      include: {
        relatedCommitments: true,
      },
    });

    return NextResponse.json({ strategy }, { status: 201 });
  } catch (error) {
    console.error("Error creating strategy:", error);
    return NextResponse.json(
      { error: "Failed to create strategy" },
      { status: 500 }
    );
  }
}
