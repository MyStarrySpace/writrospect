import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack";
import prisma from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/utils/user";
import { RelationshipType } from "@prisma/client";

// GET /api/people - List all people for the user
export async function GET(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getOrCreateUser(user.id, user.primaryEmail || "");

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const sortBy = searchParams.get("sortBy") || "lastMentioned";

    const orderBy: Record<string, "desc" | "asc"> = {};
    if (sortBy === "lastMentioned") {
      orderBy.lastMentioned = "desc";
    } else if (sortBy === "mentionCount") {
      orderBy.mentionCount = "desc";
    } else if (sortBy === "name") {
      orderBy.name = "asc";
    }

    const people = await prisma.person.findMany({
      where: { userId: dbUser.id },
      orderBy,
      take: limit,
      skip: offset,
      include: {
        sentimentHistory: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    const total = await prisma.person.count({
      where: { userId: dbUser.id },
    });

    return NextResponse.json({
      people,
      total,
      hasMore: offset + people.length < total,
    });
  } catch (error) {
    console.error("Error fetching people:", error);
    return NextResponse.json(
      { error: "Failed to fetch people" },
      { status: 500 }
    );
  }
}

// POST /api/people - Create a new person
export async function POST(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getOrCreateUser(user.id, user.primaryEmail || "");
    const body = await request.json();

    if (!body.name || body.name.trim().length === 0) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    // Check if person already exists
    const existingPerson = await prisma.person.findUnique({
      where: {
        userId_name: {
          userId: dbUser.id,
          name: body.name.trim(),
        },
      },
    });

    if (existingPerson) {
      return NextResponse.json(
        { error: "A person with this name already exists" },
        { status: 409 }
      );
    }

    const person = await prisma.person.create({
      data: {
        userId: dbUser.id,
        name: body.name.trim(),
        relationship: (body.relationship as RelationshipType) || "other",
        notes: body.notes?.trim() || null,
        unresolvedItems: body.unresolvedItems || [],
      },
      include: {
        sentimentHistory: true,
      },
    });

    return NextResponse.json({ person }, { status: 201 });
  } catch (error) {
    console.error("Error creating person:", error);
    return NextResponse.json(
      { error: "Failed to create person" },
      { status: 500 }
    );
  }
}
