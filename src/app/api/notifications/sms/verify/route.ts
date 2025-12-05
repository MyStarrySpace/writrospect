import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack";
import prisma from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/utils/user";
import { sendVerificationCode, isValidPhoneNumber, formatPhoneNumber } from "@/lib/notifications/sms";

// Store verification codes temporarily (in production, use Redis or similar)
const verificationCodes = new Map<string, { code: string; expiresAt: number; phoneNumber: string }>();

// POST - Send verification code or verify code
export async function POST(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getOrCreateUser(user.id, user.primaryEmail || "");
    const body = await request.json();

    if (body.action === "send") {
      // Send verification code
      let phoneNumber = body.phoneNumber;

      if (!phoneNumber) {
        return NextResponse.json({ error: "Phone number required" }, { status: 400 });
      }

      // Format phone number
      phoneNumber = formatPhoneNumber(phoneNumber, body.countryCode || "+1");

      if (!isValidPhoneNumber(phoneNumber)) {
        return NextResponse.json({ error: "Invalid phone number format" }, { status: 400 });
      }

      // Generate 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      // Store code with 10-minute expiry
      verificationCodes.set(dbUser.id, {
        code,
        expiresAt: Date.now() + 10 * 60 * 1000,
        phoneNumber,
      });

      // Send SMS
      const result = await sendVerificationCode(phoneNumber, code);

      if (!result.success) {
        return NextResponse.json({ error: result.error || "Failed to send code" }, { status: 500 });
      }

      // Update phone number in preferences (not yet verified)
      await prisma.notificationPreferences.upsert({
        where: { userId: dbUser.id },
        update: { smsPhoneNumber: phoneNumber, smsVerified: false },
        create: { userId: dbUser.id, smsPhoneNumber: phoneNumber, smsVerified: false },
      });

      return NextResponse.json({ success: true, message: "Verification code sent" });
    } else if (body.action === "verify") {
      // Verify code
      const { code } = body;

      if (!code) {
        return NextResponse.json({ error: "Verification code required" }, { status: 400 });
      }

      const stored = verificationCodes.get(dbUser.id);

      if (!stored) {
        return NextResponse.json({ error: "No verification pending. Please request a new code." }, { status: 400 });
      }

      if (Date.now() > stored.expiresAt) {
        verificationCodes.delete(dbUser.id);
        return NextResponse.json({ error: "Code expired. Please request a new code." }, { status: 400 });
      }

      if (stored.code !== code) {
        return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
      }

      // Mark as verified
      await prisma.notificationPreferences.update({
        where: { userId: dbUser.id },
        data: { smsVerified: true, smsEnabled: true },
      });

      // Clean up
      verificationCodes.delete(dbUser.id);

      return NextResponse.json({ success: true, message: "Phone number verified" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("SMS verification error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
