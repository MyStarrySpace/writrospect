import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack";
import prisma from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/utils/user";

// GET /api/user/success-model - Get user success model
export async function GET() {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getOrCreateUser(user.id, user.primaryEmail || "");

    return NextResponse.json({ successModel: dbUser.successModel });
  } catch (error) {
    console.error("Error fetching success model:", error);
    return NextResponse.json(
      { error: "Failed to fetch success model" },
      { status: 500 }
    );
  }
}

// PUT /api/user/success-model - Update user success model
export async function PUT(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getOrCreateUser(user.id, user.primaryEmail || "");
    const body = await request.json();

    const successModel = await prisma.userSuccessModel.update({
      where: { userId: dbUser.id },
      data: {
        complexityPreference: body.complexityPreference,
        completionConditions: body.completionConditions,
        failureConditions: body.failureConditions,
        notes: body.notes,
      },
    });

    return NextResponse.json({ successModel });
  } catch (error) {
    console.error("Error updating success model:", error);
    return NextResponse.json(
      { error: "Failed to update success model" },
      { status: 500 }
    );
  }
}
