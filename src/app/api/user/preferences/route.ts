import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack";
import prisma from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/utils/user";

// GET /api/user/preferences - Get user engagement preferences
export async function GET() {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getOrCreateUser(user.id, user.primaryEmail || "");

    return NextResponse.json({ preferences: dbUser.preferences });
  } catch (error) {
    console.error("Error fetching preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 }
    );
  }
}

// PUT /api/user/preferences - Update user engagement preferences
export async function PUT(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getOrCreateUser(user.id, user.primaryEmail || "");
    const body = await request.json();

    const preferences = await prisma.userEngagementPreferences.update({
      where: { userId: dbUser.id },
      data: {
        interactionMode: body.interactionMode,
        interestTracking: body.interestTracking,
        autoStartChat: body.autoStartChat,
        likes: body.likes,
        dislikes: body.dislikes,
        topicsTheyShare: body.topicsTheyShare,
        notes: body.notes,
      },
    });

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error("Error updating preferences:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}
