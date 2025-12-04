import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack";
import prisma from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/utils/user";

// GET /api/user/timezone - Get user timezone
export async function GET() {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getOrCreateUser(user.id, user.primaryEmail || "");

    return NextResponse.json({ timezone: dbUser.timezone });
  } catch (error) {
    console.error("Error fetching timezone:", error);
    return NextResponse.json(
      { error: "Failed to fetch timezone" },
      { status: 500 }
    );
  }
}

// PUT /api/user/timezone - Update user timezone
export async function PUT(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getOrCreateUser(user.id, user.primaryEmail || "");
    const body = await request.json();

    // Validate timezone is a valid IANA timezone
    try {
      Intl.DateTimeFormat(undefined, { timeZone: body.timezone });
    } catch {
      return NextResponse.json(
        { error: "Invalid timezone" },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: dbUser.id },
      data: { timezone: body.timezone },
    });

    return NextResponse.json({ timezone: updatedUser.timezone });
  } catch (error) {
    console.error("Error updating timezone:", error);
    return NextResponse.json(
      { error: "Failed to update timezone" },
      { status: 500 }
    );
  }
}
