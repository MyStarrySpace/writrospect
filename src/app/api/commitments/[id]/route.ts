import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack";
import prisma from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/utils/user";

// GET /api/commitments/[id] - Get a single commitment
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

    const commitment = await prisma.commitment.findFirst({
      where: { id, userId: dbUser.id },
      include: {
        sourceEntry: true,
        strategies: true,
      },
    });

    if (!commitment) {
      return NextResponse.json(
        { error: "Commitment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ commitment });
  } catch (error) {
    console.error("Error fetching commitment:", error);
    return NextResponse.json(
      { error: "Failed to fetch commitment" },
      { status: 500 }
    );
  }
}

// PATCH /api/commitments/[id] - Update a commitment
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
    const existing = await prisma.commitment.findFirst({
      where: { id, userId: dbUser.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Commitment not found" },
        { status: 404 }
      );
    }

    const commitment = await prisma.commitment.update({
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

    return NextResponse.json({ commitment });
  } catch (error) {
    console.error("Error updating commitment:", error);
    return NextResponse.json(
      { error: "Failed to update commitment" },
      { status: 500 }
    );
  }
}

// DELETE /api/commitments/[id] - Delete a commitment
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
    const existing = await prisma.commitment.findFirst({
      where: { id, userId: dbUser.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Commitment not found" },
        { status: 404 }
      );
    }

    await prisma.commitment.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting commitment:", error);
    return NextResponse.json(
      { error: "Failed to delete commitment" },
      { status: 500 }
    );
  }
}
