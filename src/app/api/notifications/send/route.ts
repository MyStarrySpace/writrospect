import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendPushNotification } from "@/lib/push";
import { sendSMS, formatTaskReminderSMS } from "@/lib/notifications/sms";
import { ReminderChannel } from "@prisma/client";

interface NotificationPayload {
  reminderId: string;
  userId: string;
  taskId: string;
  channel: ReminderChannel;
  message: string;
}

async function handler(request: NextRequest) {
  try {
    const payload: NotificationPayload = await request.json();
    const { reminderId, userId, taskId, channel, message } = payload;

    // Get the reminder record
    const reminder = await prisma.scheduledReminder.findUnique({
      where: { id: reminderId },
    });

    if (!reminder || reminder.status !== "scheduled") {
      return NextResponse.json({ error: "Reminder not found or already processed" }, { status: 404 });
    }

    // Get the task details
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        what: true,
        dueTime: true,
        context: true,
        status: true,
      },
    });

    // If task is already completed, mark reminder as cancelled
    if (!task || task.status === "completed") {
      await prisma.scheduledReminder.update({
        where: { id: reminderId },
        data: { status: "cancelled" },
      });
      return NextResponse.json({ success: true, skipped: "task_completed" });
    }

    let success = false;
    let error: string | undefined;

    if (channel === "push") {
      // Send push notification
      const subscriptions = await prisma.pushSubscription.findMany({
        where: { userId },
      });

      for (const sub of subscriptions) {
        const result = await sendPushNotification(
          {
            endpoint: sub.endpoint,
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
          {
            title: "Task Reminder",
            body: message,
            url: "/journal",
            actions: [
              { action: "complete", title: "Done" },
              { action: "snooze", title: "Snooze 15m" },
            ],
          }
        );

        if (result.success) {
          success = true;
        } else if (result.expired) {
          // Remove expired subscription
          await prisma.pushSubscription.delete({ where: { id: sub.id } });
        }
      }

      if (!success && subscriptions.length === 0) {
        error = "No push subscriptions found";
      }
    } else if (channel === "sms") {
      // Send SMS
      const prefs = await prisma.notificationPreferences.findUnique({
        where: { userId },
      });

      if (!prefs?.smsPhoneNumber || !prefs.smsVerified) {
        error = "SMS not configured or verified";
      } else {
        const smsMessage = formatTaskReminderSMS({
          what: task.what,
          dueTime: task.dueTime,
          context: task.context,
        });

        const result = await sendSMS({
          to: prefs.smsPhoneNumber,
          message: smsMessage,
        });

        success = result.success;
        error = result.error;
      }
    }

    // Update reminder status
    await prisma.scheduledReminder.update({
      where: { id: reminderId },
      data: {
        status: success ? "sent" : "failed",
        sentAt: success ? new Date() : null,
        error: error || null,
      },
    });

    return NextResponse.json({ success, error });
  } catch (error) {
    console.error("Send notification error:", error);
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 }
    );
  }
}

// In production, verify QStash signature; in dev, use handler directly
// Note: QStash signature verification requires QSTASH_CURRENT_SIGNING_KEY and QSTASH_NEXT_SIGNING_KEY
// These should be set in production environment
export async function POST(request: NextRequest) {
  // Check if QStash signing keys are configured
  if (
    process.env.NODE_ENV === "production" &&
    process.env.QSTASH_CURRENT_SIGNING_KEY &&
    process.env.QSTASH_NEXT_SIGNING_KEY
  ) {
    // Dynamically import and verify signature in production
    const { verifySignatureAppRouter } = await import("@upstash/qstash/nextjs");
    const verifiedHandler = verifySignatureAppRouter(handler);
    return verifiedHandler(request);
  }

  // In development or if keys not configured, use handler directly
  return handler(request);
}
