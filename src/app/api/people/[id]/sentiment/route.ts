import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack";
import prisma from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/utils/user";
import { Sentiment } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/people/[id]/sentiment - Add a sentiment entry for a person
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getOrCreateUser(user.id, user.primaryEmail || "");
    const { id } = await params;
    const body = await request.json();

    // Verify ownership
    const person = await prisma.person.findFirst({
      where: {
        id,
        userId: dbUser.id,
      },
    });

    if (!person) {
      return NextResponse.json({ error: "Person not found" }, { status: 404 });
    }

    if (!body.sentiment) {
      return NextResponse.json(
        { error: "Sentiment is required" },
        { status: 400 }
      );
    }

    const sentimentEntry = await prisma.personSentiment.create({
      data: {
        personId: id,
        sentiment: body.sentiment as Sentiment,
        context: body.context?.trim() || null,
        entryId: body.entryId || null,
      },
    });

    // Also update the person's lastMentioned and mentionCount
    await prisma.person.update({
      where: { id },
      data: {
        lastMentioned: new Date(),
        mentionCount: { increment: 1 },
      },
    });

    return NextResponse.json({ sentimentEntry }, { status: 201 });
  } catch (error) {
    console.error("Error adding sentiment:", error);
    return NextResponse.json(
      { error: "Failed to add sentiment" },
      { status: 500 }
    );
  }
}

// GET /api/people/[id]/sentiment - Get sentiment history for a person
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getOrCreateUser(user.id, user.primaryEmail || "");
    const { id } = await params;

    // Verify ownership
    const person = await prisma.person.findFirst({
      where: {
        id,
        userId: dbUser.id,
      },
    });

    if (!person) {
      return NextResponse.json({ error: "Person not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");

    const sentimentHistory = await prisma.personSentiment.findMany({
      where: { personId: id },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ sentimentHistory });
  } catch (error) {
    console.error("Error fetching sentiment history:", error);
    return NextResponse.json(
      { error: "Failed to fetch sentiment history" },
      { status: 500 }
    );
  }
}
