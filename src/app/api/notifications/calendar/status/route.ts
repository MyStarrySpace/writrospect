import { NextResponse } from "next/server";
import { stackServerApp } from "@/stack";
import prisma from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/utils/user";

export async function GET() {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getOrCreateUser(user.id, user.primaryEmail || "");

    const connection = await prisma.calendarConnection.findUnique({
      where: {
        userId_provider: {
          userId: dbUser.id,
          provider: "google",
        },
      },
    });

    if (!connection) {
      return NextResponse.json({ connected: false });
    }

    return NextResponse.json({
      connected: true,
      calendarId: connection.calendarId,
    });
  } catch (error) {
    console.error("Calendar status error:", error);
    return NextResponse.json(
      { error: "Failed to get calendar status" },
      { status: 500 }
    );
  }
}
