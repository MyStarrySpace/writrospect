import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack";
import prisma from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/utils/user";

// Preset profile images available
const PRESET_IMAGES = [
  "/images/profile/Icon-1-light.jpg",
  "/images/profile/Icon-1-dark.jpg",
  "/images/profile/Icon-2-light.jpg",
  "/images/profile/Icon-2-dark.jpg",
  "/images/profile/Icon-3-light.jpg",
  "/images/profile/Icon-3-dark.jpg",
  "/images/profile/Icon-4-light.jpg",
  "/images/profile/Icon-4-dark.jpg",
];

export async function GET() {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getOrCreateUser(user.id, user.primaryEmail || "");

    return NextResponse.json({
      profileImage: dbUser.profileImage,
      presets: PRESET_IMAGES,
    });
  } catch (error) {
    console.error("Error fetching profile image:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile image" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getOrCreateUser(user.id, user.primaryEmail || "");
    const body = await request.json();
    const { profileImage } = body;

    // Validate that it's either a preset, a valid URL, or a data URL
    if (profileImage !== null && profileImage !== undefined) {
      const isPreset = PRESET_IMAGES.includes(profileImage);
      const isValidUrl = typeof profileImage === "string" &&
        (profileImage.startsWith("http://") ||
         profileImage.startsWith("https://") ||
         profileImage.startsWith("/") ||
         profileImage.startsWith("data:image/"));

      if (!isPreset && !isValidUrl) {
        return NextResponse.json(
          { error: "Invalid profile image" },
          { status: 400 }
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: dbUser.id },
      data: { profileImage: profileImage || null },
    });

    return NextResponse.json({
      profileImage: updatedUser.profileImage,
    });
  } catch (error) {
    console.error("Error updating profile image:", error);
    return NextResponse.json(
      { error: "Failed to update profile image" },
      { status: 500 }
    );
  }
}
