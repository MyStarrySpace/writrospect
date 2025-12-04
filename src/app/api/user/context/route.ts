import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack";
import prisma from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/utils/user";

// GET /api/user/context - Get user context
export async function GET() {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getOrCreateUser(user.id, user.primaryEmail || "");

    return NextResponse.json({ context: dbUser.context });
  } catch (error) {
    console.error("Error fetching user context:", error);
    return NextResponse.json(
      { error: "Failed to fetch user context" },
      { status: 500 }
    );
  }
}

// PUT /api/user/context - Update user context
export async function PUT(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getOrCreateUser(user.id, user.primaryEmail || "");
    const body = await request.json();

    const context = await prisma.userContext.update({
      where: { userId: dbUser.id },
      data: {
        about: body.about,
        lifeCircumstances: body.lifeCircumstances,
        knownFactors: body.knownFactors,
        suspectedFactors: body.suspectedFactors,
        resourceConstraints: body.resourceConstraints,
        workingConditions: body.workingConditions,
        failurePatterns: body.failurePatterns,
        notes: body.notes,
      },
    });

    return NextResponse.json({ context });
  } catch (error) {
    console.error("Error updating user context:", error);
    return NextResponse.json(
      { error: "Failed to update user context" },
      { status: 500 }
    );
  }
}
