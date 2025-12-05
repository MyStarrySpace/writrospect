import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack";
import prisma from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/utils/user";
import { DEFAULT_THEME_ID, THEME_PRESETS, CUSTOM_THEME_ID } from "@/lib/theme-presets";

// GET /api/user/theme - Get user's theme settings
export async function GET() {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getOrCreateUser(user.id, user.primaryEmail || "");

    return NextResponse.json({
      themeId: dbUser.bannerTheme || DEFAULT_THEME_ID,
      colorMode: "system", // For now, always use system - could add to User model later
    });
  } catch (error) {
    console.error("Error fetching theme:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch theme settings", details: errorMessage },
      { status: 500 }
    );
  }
}

// PUT /api/user/theme - Update user's theme settings
export async function PUT(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getOrCreateUser(user.id, user.primaryEmail || "");
    const body = await request.json();
    const { themeId, colorMode } = body;

    // Validate themeId if provided (allow custom theme or preset themes)
    if (themeId) {
      const isCustom = themeId === CUSTOM_THEME_ID;
      const validTheme = THEME_PRESETS.find((t) => t.id === themeId);
      if (!isCustom && !validTheme) {
        return NextResponse.json(
          { error: "Invalid theme ID" },
          { status: 400 }
        );
      }
    }

    // Update user's theme
    const updatedUser = await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        bannerTheme: themeId || dbUser.bannerTheme,
        // colorMode could be stored in UserEngagementPreferences or User model
      },
    });

    return NextResponse.json({
      themeId: updatedUser.bannerTheme || DEFAULT_THEME_ID,
      colorMode: colorMode || "system",
    });
  } catch (error) {
    console.error("Error updating theme:", error);
    return NextResponse.json(
      { error: "Failed to update theme settings" },
      { status: 500 }
    );
  }
}
