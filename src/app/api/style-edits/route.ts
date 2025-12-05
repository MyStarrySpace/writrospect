import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack";
import prisma from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/utils/user";

// POST /api/style-edits - Update style edit feedback (accept/reject)
export async function POST(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getOrCreateUser(user.id, user.primaryEmail || "");
    const body = await request.json();
    const { editId, accepted, feedback } = body;

    if (!editId) {
      return NextResponse.json(
        { error: "Edit ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership and update
    const styleEdit = await prisma.styleEdit.findFirst({
      where: { id: editId, userId: dbUser.id },
    });

    if (!styleEdit) {
      return NextResponse.json({ error: "Style edit not found" }, { status: 404 });
    }

    // Update the style edit with feedback
    const updated = await prisma.styleEdit.update({
      where: { id: editId },
      data: {
        accepted,
        userFeedback: feedback || null,
      },
    });

    // If accepted, learn from this edit to update user's writing style
    if (accepted) {
      await learnFromStyleEdit(dbUser.id, styleEdit);
    }

    return NextResponse.json({
      success: true,
      styleEdit: {
        id: updated.id,
        accepted: updated.accepted,
      },
    });
  } catch (error) {
    console.error("Error updating style edit:", error);
    return NextResponse.json(
      { error: "Failed to update style edit" },
      { status: 500 }
    );
  }
}

// Learn from accepted style edits to update user's writing style preferences
async function learnFromStyleEdit(userId: string, edit: {
  editType: string;
  originalText: string;
  suggestedText: string;
}) {
  try {
    // Get or create user's writing style
    let writingStyle = await prisma.userWritingStyle.findUnique({
      where: { userId },
    });

    if (!writingStyle) {
      writingStyle = await prisma.userWritingStyle.create({
        data: { userId },
      });
    }

    // Analyze the edit to learn preferences
    const original = edit.originalText.toLowerCase();
    const suggested = edit.suggestedText.toLowerCase();

    const updates: Record<string, boolean | string[]> = {};

    // Learn formatting preferences
    if (edit.editType === "structure") {
      // Check if they prefer bullet points
      if (suggested.includes("- ") || suggested.includes("• ")) {
        updates.prefersBulletPoints = true;
      }
      // Check if they prefer markdown
      if (suggested.includes("**") || suggested.includes("##") || suggested.includes("__")) {
        updates.prefersMarkdown = true;
      }
    }

    if (edit.editType === "conciseness") {
      // If the suggested text is notably shorter, they prefer short sentences
      if (suggested.length < original.length * 0.75) {
        updates.prefersShortSentences = true;
      }
    }

    // Extract voice samples from accepted edits
    if (edit.editType === "voice" || edit.editType === "tone") {
      // Add the suggested text as a voice sample (limit to reasonable length)
      if (edit.suggestedText.length <= 200) {
        const currentSamples = writingStyle.voiceSamples || [];
        if (currentSamples.length < 10 && !currentSamples.includes(edit.suggestedText)) {
          updates.voiceSamples = [...currentSamples, edit.suggestedText];
        }
      }
    }

    // Learn custom rules from patterns
    // e.g., if they consistently prefer "I feel" over "I am feeling"
    if (Object.keys(updates).length > 0) {
      await prisma.userWritingStyle.update({
        where: { userId },
        data: updates,
      });
    }
  } catch (error) {
    console.error("Error learning from style edit:", error);
    // Don't throw - this is a non-critical operation
  }
}

// GET /api/style-edits - Get user's writing style preferences
export async function GET() {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getOrCreateUser(user.id, user.primaryEmail || "");

    // Get writing style
    const writingStyle = await prisma.userWritingStyle.findUnique({
      where: { userId: dbUser.id },
    });

    // Get recent style edits for context
    const recentEdits = await prisma.styleEdit.findMany({
      where: { userId: dbUser.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        editType: true,
        accepted: true,
        createdAt: true,
      },
    });

    // Calculate acceptance rates by edit type
    const editStats = recentEdits.reduce((acc, edit) => {
      if (!acc[edit.editType]) {
        acc[edit.editType] = { total: 0, accepted: 0 };
      }
      acc[edit.editType].total++;
      if (edit.accepted) acc[edit.editType].accepted++;
      return acc;
    }, {} as Record<string, { total: number; accepted: number }>);

    return NextResponse.json({
      writingStyle: writingStyle || null,
      editStats,
    });
  } catch (error) {
    console.error("Error fetching writing style:", error);
    return NextResponse.json(
      { error: "Failed to fetch writing style" },
      { status: 500 }
    );
  }
}
