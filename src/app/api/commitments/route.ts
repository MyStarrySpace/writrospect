import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack";
import prisma from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/utils/user";
import { CommitmentStatus } from "@prisma/client";

// GET /api/commitments - List commitments
export async function GET(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getOrCreateUser(user.id, user.primaryEmail || "");

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as CommitmentStatus | null;
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where = {
      userId: dbUser.id,
      ...(status && { status }),
    };

    const commitments = await prisma.commitment.findMany({
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

    const total = await prisma.commitment.count({ where });

    return NextResponse.json({
      commitments,
      total,
      hasMore: offset + commitments.length < total,
    });
  } catch (error) {
    console.error("Error fetching commitments:", error);
    return NextResponse.json(
      { error: "Failed to fetch commitments" },
      { status: 500 }
    );
  }
}

// POST /api/commitments - Create a new commitment
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
        { error: "Commitment description is required" },
        { status: 400 }
      );
    }

    const commitment = await prisma.commitment.create({
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

    return NextResponse.json({ commitment }, { status: 201 });
  } catch (error) {
    console.error("Error creating commitment:", error);
    return NextResponse.json(
      { error: "Failed to create commitment" },
      { status: 500 }
    );
  }
}
