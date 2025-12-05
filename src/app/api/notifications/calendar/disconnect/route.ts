import { NextResponse } from "next/server";
import { stackServerApp } from "@/stack";
import prisma from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/utils/user";

export async function POST() {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getOrCreateUser(user.id, user.primaryEmail || "");

    // Delete the calendar connection
    await prisma.calendarConnection.deleteMany({
      where: {
        userId: dbUser.id,
        provider: "google",
      },
    });

    // Disable calendar in preferences
    await prisma.notificationPreferences.update({
      where: { userId: dbUser.id },
      data: {
        calendarEnabled: false,
        calendarAutoSync: false,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Calendar disconnect error:", error);
    return NextResponse.json(
      { error: "Failed to disconnect calendar" },
      { status: 500 }
    );
  }
}
