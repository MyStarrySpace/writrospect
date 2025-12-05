import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack";
import prisma from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/utils/user";
import { exchangeCodeForTokens, getCalendarList } from "@/lib/notifications/calendar";

export async function GET(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      // Redirect to login
      return NextResponse.redirect(new URL("/handler/sign-in", request.url));
    }

    const dbUser = await getOrCreateUser(user.id, user.primaryEmail || "");

    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const state = searchParams.get("state");

    // Verify state matches user ID (basic CSRF protection)
    if (state !== dbUser.id) {
      return NextResponse.redirect(
        new URL("/settings?error=invalid_state", request.url)
      );
    }

    if (error) {
      return NextResponse.redirect(
        new URL(`/settings?error=${error}`, request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL("/settings?error=no_code", request.url)
      );
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // Save calendar connection
    await prisma.calendarConnection.upsert({
      where: { userId_provider: { userId: dbUser.id, provider: "google" } },
      update: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken || undefined,
        tokenExpiry: tokens.expiry || undefined,
      },
      create: {
        userId: dbUser.id,
        provider: "google",
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken || undefined,
        tokenExpiry: tokens.expiry || undefined,
      },
    });

    // Enable calendar in preferences
    await prisma.notificationPreferences.upsert({
      where: { userId: dbUser.id },
      update: { calendarEnabled: true },
      create: { userId: dbUser.id, calendarEnabled: true },
    });

    // Try to get the primary calendar ID
    try {
      const calendars = await getCalendarList(dbUser.id);
      if (calendars.success && calendars.calendars) {
        const primary = calendars.calendars.find((c) => c.primary);
        if (primary) {
          await prisma.calendarConnection.update({
            where: { userId_provider: { userId: dbUser.id, provider: "google" } },
            data: { calendarId: primary.id },
          });
        }
      }
    } catch {
      // Non-critical, continue anyway
    }

    return NextResponse.redirect(
      new URL("/settings?success=calendar_connected", request.url)
    );
  } catch (error) {
    console.error("Google OAuth callback error:", error);
    return NextResponse.redirect(
      new URL("/settings?error=oauth_failed", request.url)
    );
  }
}
