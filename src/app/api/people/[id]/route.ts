import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack";
import prisma from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/utils/user";
import { RelationshipType, Sentiment } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/people/[id] - Get a specific person
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getOrCreateUser(user.id, user.primaryEmail || "");
    const { id } = await params;

    const person = await prisma.person.findFirst({
      where: {
        id,
        userId: dbUser.id,
      },
      include: {
        sentimentHistory: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!person) {
      return NextResponse.json({ error: "Person not found" }, { status: 404 });
    }

    return NextResponse.json({ person });
  } catch (error) {
    console.error("Error fetching person:", error);
    return NextResponse.json(
      { error: "Failed to fetch person" },
      { status: 500 }
    );
  }
}

// PATCH /api/people/[id] - Update a person
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getOrCreateUser(user.id, user.primaryEmail || "");
    const { id } = await params;
    const body = await request.json();

    // Verify ownership
    const existingPerson = await prisma.person.findFirst({
      where: {
        id,
        userId: dbUser.id,
      },
    });

    if (!existingPerson) {
      return NextResponse.json({ error: "Person not found" }, { status: 404 });
    }

    // Build update data
    const updateData: {
      name?: string;
      relationship?: RelationshipType;
      notes?: string | null;
      unresolvedItems?: string[];
      lastMentioned?: Date;
      mentionCount?: { increment: number };
    } = {};

    if (body.name !== undefined) {
      updateData.name = body.name.trim();
    }
    if (body.relationship !== undefined) {
      updateData.relationship = body.relationship as RelationshipType;
    }
    if (body.notes !== undefined) {
      updateData.notes = body.notes?.trim() || null;
    }
    if (body.unresolvedItems !== undefined) {
      updateData.unresolvedItems = body.unresolvedItems;
    }
    if (body.incrementMention) {
      updateData.lastMentioned = new Date();
      updateData.mentionCount = { increment: 1 };
    }

    const person = await prisma.person.update({
      where: { id },
      data: updateData,
      include: {
        sentimentHistory: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    return NextResponse.json({ person });
  } catch (error) {
    console.error("Error updating person:", error);
    return NextResponse.json(
      { error: "Failed to update person" },
      { status: 500 }
    );
  }
}

// DELETE /api/people/[id] - Delete a person
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getOrCreateUser(user.id, user.primaryEmail || "");
    const { id } = await params;

    // Verify ownership
    const existingPerson = await prisma.person.findFirst({
      where: {
        id,
        userId: dbUser.id,
      },
    });

    if (!existingPerson) {
      return NextResponse.json({ error: "Person not found" }, { status: 404 });
    }

    await prisma.person.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting person:", error);
    return NextResponse.json(
      { error: "Failed to delete person" },
      { status: 500 }
    );
  }
}
