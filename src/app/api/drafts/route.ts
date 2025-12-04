import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack";
import prisma from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/utils/user";

// GET /api/drafts - Fetch user's drafts
export async function GET() {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getOrCreateUser(user.id, user.primaryEmail || "");

    const drafts = await prisma.journalDraft.findMany({
      where: {
        userId: dbUser.id,
        restoredToEntryId: null, // Only show unrestored drafts
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({
      drafts: drafts.map((draft) => ({
        id: draft.id,
        content: draft.content,
        reason: draft.reason,
        createdAt: draft.createdAt.toISOString(),
        preview: draft.content.length > 100
          ? draft.content.slice(0, 100) + "..."
          : draft.content,
      })),
    });
  } catch (error) {
    console.error("Error fetching drafts:", error);
    return NextResponse.json(
      { error: "Failed to fetch drafts" },
      { status: 500 }
    );
  }
}

// POST /api/drafts - Create a new draft
export async function POST(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getOrCreateUser(user.id, user.primaryEmail || "");
    const body = await request.json();

    if (!body.content?.trim()) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const draft = await prisma.journalDraft.create({
      data: {
        userId: dbUser.id,
        content: body.content.trim(),
        reason: body.reason || null,
        sourceEntryId: body.sourceEntryId || null,
      },
    });

    return NextResponse.json({
      draft: {
        id: draft.id,
        content: draft.content,
        reason: draft.reason,
        createdAt: draft.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error creating draft:", error);
    return NextResponse.json(
      { error: "Failed to create draft" },
      { status: 500 }
    );
  }
}

// DELETE /api/drafts?id=xxx - Delete a draft
export async function DELETE(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getOrCreateUser(user.id, user.primaryEmail || "");
    const { searchParams } = new URL(request.url);
    const draftId = searchParams.get("id");

    if (!draftId) {
      return NextResponse.json(
        { error: "Draft ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const draft = await prisma.journalDraft.findFirst({
      where: { id: draftId, userId: dbUser.id },
    });

    if (!draft) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    await prisma.journalDraft.delete({
      where: { id: draftId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting draft:", error);
    return NextResponse.json(
      { error: "Failed to delete draft" },
      { status: 500 }
    );
  }
}
