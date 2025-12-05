import { NextResponse } from "next/server";
import { stackServerApp } from "@/stack";
import { getOrCreateUser } from "@/lib/utils/user";
import { getGoogleAuthUrl } from "@/lib/notifications/calendar";

export async function GET() {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getOrCreateUser(user.id, user.primaryEmail || "");

    // Generate OAuth URL with user ID as state for CSRF protection
    const authUrl = getGoogleAuthUrl(dbUser.id);

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Google OAuth initiation error:", error);
    return NextResponse.json(
      { error: "Failed to initiate Google authorization" },
      { status: 500 }
    );
  }
}
