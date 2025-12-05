import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack";
import prisma from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/utils/user";
import { TaskStatus } from "@prisma/client";

// GET /api/tasks - List tasks
export async function GET(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getOrCreateUser(user.id, user.primaryEmail || "");

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as TaskStatus | null;
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where = {
      userId: dbUser.id,
      ...(status && { status }),
    };

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [
        // Sort by urgency (now > today > this_week > whenever)
        { urgency: "asc" },
        // Then by due date (soonest first)
        { dueDate: "asc" },
        // Then by creation date (newest first)
        { createdAt: "desc" },
      ],
      take: limit,
      skip: offset,
      include: {
        relatedCommitment: {
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

    const total = await prisma.task.count({ where });

    return NextResponse.json({
      tasks,
      total,
      hasMore: offset + tasks.length < total,
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Create a new task
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
        { error: "Task description is required" },
        { status: 400 }
      );
    }

    const task = await prisma.task.create({
      data: {
        userId: dbUser.id,
        what: body.what.trim(),
        context: body.context?.trim() || null,
        urgency: body.urgency || "whenever",
        status: "pending",
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        dueTime: body.dueTime?.trim() || null,
        relatedCommitmentId: body.relatedCommitmentId || null,
        relatedPersonId: body.relatedPersonId || null,
        sourceEntryId: body.sourceEntryId || null,
      },
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
