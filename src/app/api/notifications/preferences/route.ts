import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack";
import prisma from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/utils/user";

// GET - Fetch notification preferences
export async function GET() {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getOrCreateUser(user.id, user.primaryEmail || "");

    const prefs = await prisma.notificationPreferences.findUnique({
      where: { userId: dbUser.id },
    });

    // Return defaults if no preferences set
    if (!prefs) {
      return NextResponse.json({
        pushEnabled: false,
        pushTaskReminders: true,
        pushDailyDigest: false,
        smsEnabled: false,
        smsPhoneNumber: null,
        smsVerified: false,
        smsTaskReminders: true,
        smsUrgentOnly: true,
        calendarEnabled: false,
        calendarAutoSync: true,
        quietHoursStart: null,
        quietHoursEnd: null,
        reminderLeadTime: 30,
      });
    }

    return NextResponse.json(prefs);
  } catch (error) {
    console.error("Error fetching notification preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 }
    );
  }
}

// PUT - Update notification preferences
export async function PUT(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getOrCreateUser(user.id, user.primaryEmail || "");
    const body = await request.json();

    // Extract only allowed fields
    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      "pushEnabled",
      "pushTaskReminders",
      "pushDailyDigest",
      "smsEnabled",
      "smsTaskReminders",
      "smsUrgentOnly",
      "calendarEnabled",
      "calendarAutoSync",
      "quietHoursStart",
      "quietHoursEnd",
      "reminderLeadTime",
    ];

    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field];
      }
    }

    const prefs = await prisma.notificationPreferences.upsert({
      where: { userId: dbUser.id },
      update: updateData,
      create: {
        userId: dbUser.id,
        ...updateData,
      },
    });

    return NextResponse.json(prefs);
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}
