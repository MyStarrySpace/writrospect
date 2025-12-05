import { Client } from "@upstash/qstash";
import prisma from "@/lib/prisma";
import { ReminderChannel } from "@prisma/client";

// Initialize QStash client
const qstash = process.env.QSTASH_TOKEN
  ? new Client({ token: process.env.QSTASH_TOKEN })
  : null;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export interface ScheduleReminderOptions {
  userId: string;
  taskId: string;
  channel: ReminderChannel;
  scheduledFor: Date;
  message: string;
}

// Schedule a reminder via QStash
export async function scheduleReminder(
  options: ScheduleReminderOptions
): Promise<{ success: boolean; reminderId?: string; error?: string }> {
  if (!qstash) {
    console.error("QStash not configured");
    return { success: false, error: "Scheduler not configured" };
  }

  try {
    // Calculate delay in seconds
    const delaySeconds = Math.max(0, Math.floor((options.scheduledFor.getTime() - Date.now()) / 1000));

    // Create the reminder record first
    const reminder = await prisma.scheduledReminder.create({
      data: {
        userId: options.userId,
        taskId: options.taskId,
        channel: options.channel,
        scheduledFor: options.scheduledFor,
        message: options.message,
        status: "scheduled",
      },
    });

    // Schedule with QStash
    const response = await qstash.publishJSON({
      url: `${APP_URL}/api/notifications/send`,
      body: {
        reminderId: reminder.id,
        userId: options.userId,
        taskId: options.taskId,
        channel: options.channel,
        message: options.message,
      },
      delay: delaySeconds,
      retries: 3,
    });

    // Update reminder with QStash message ID
    await prisma.scheduledReminder.update({
      where: { id: reminder.id },
      data: { externalId: response.messageId },
    });

    return { success: true, reminderId: reminder.id };
  } catch (error) {
    console.error("Schedule reminder error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to schedule reminder",
    };
  }
}

// Cancel a scheduled reminder
export async function cancelReminder(reminderId: string): Promise<{ success: boolean; error?: string }> {
  if (!qstash) {
    return { success: false, error: "Scheduler not configured" };
  }

  try {
    const reminder = await prisma.scheduledReminder.findUnique({
      where: { id: reminderId },
    });

    if (!reminder) {
      return { success: false, error: "Reminder not found" };
    }

    if (reminder.externalId) {
      // Cancel in QStash
      await qstash.messages.delete(reminder.externalId);
    }

    // Update status
    await prisma.scheduledReminder.update({
      where: { id: reminderId },
      data: { status: "cancelled" },
    });

    return { success: true };
  } catch (error) {
    console.error("Cancel reminder error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to cancel reminder",
    };
  }
}

// Schedule reminders for a task based on user preferences
export async function scheduleTaskReminders(
  userId: string,
  task: {
    id: string;
    what: string;
    dueDate: Date;
    dueTime?: string | null;
    urgency: string;
  }
): Promise<{ success: boolean; reminders: string[]; error?: string }> {
  try {
    // Get user's notification preferences
    const prefs = await prisma.notificationPreferences.findUnique({
      where: { userId },
    });

    if (!prefs) {
      return { success: true, reminders: [] }; // No preferences set
    }

    const reminders: string[] = [];
    const reminderTime = calculateReminderTime(task.dueDate, task.dueTime, prefs.reminderLeadTime);

    // Check quiet hours
    if (isInQuietHours(reminderTime, prefs.quietHoursStart, prefs.quietHoursEnd)) {
      // Adjust to end of quiet hours
      const adjusted = adjustForQuietHours(reminderTime, prefs.quietHoursEnd);
      if (adjusted > task.dueDate) {
        // Don't schedule if quiet hours would push past due date
        return { success: true, reminders: [] };
      }
    }

    const message = `Reminder: ${task.what}${task.dueTime ? ` at ${task.dueTime}` : ""}`;

    // Schedule push notification
    if (prefs.pushEnabled && prefs.pushTaskReminders) {
      const result = await scheduleReminder({
        userId,
        taskId: task.id,
        channel: "push",
        scheduledFor: reminderTime,
        message,
      });
      if (result.success && result.reminderId) {
        reminders.push(result.reminderId);
      }
    }

    // Schedule SMS (only for urgent tasks if smsUrgentOnly is true)
    if (prefs.smsEnabled && prefs.smsVerified && prefs.smsTaskReminders) {
      const isUrgent = task.urgency === "now" || task.urgency === "today";
      if (!prefs.smsUrgentOnly || isUrgent) {
        const result = await scheduleReminder({
          userId,
          taskId: task.id,
          channel: "sms",
          scheduledFor: reminderTime,
          message,
        });
        if (result.success && result.reminderId) {
          reminders.push(result.reminderId);
        }
      }
    }

    return { success: true, reminders };
  } catch (error) {
    console.error("Schedule task reminders error:", error);
    return {
      success: false,
      reminders: [],
      error: error instanceof Error ? error.message : "Failed to schedule reminders",
    };
  }
}

// Cancel all reminders for a task
export async function cancelTaskReminders(taskId: string): Promise<{ success: boolean; cancelled: number }> {
  try {
    const reminders = await prisma.scheduledReminder.findMany({
      where: { taskId, status: "scheduled" },
    });

    let cancelled = 0;
    for (const reminder of reminders) {
      const result = await cancelReminder(reminder.id);
      if (result.success) cancelled++;
    }

    return { success: true, cancelled };
  } catch (error) {
    console.error("Cancel task reminders error:", error);
    return { success: false, cancelled: 0 };
  }
}

// Helper: Calculate reminder time based on due date/time and lead time
function calculateReminderTime(dueDate: Date, dueTime: string | null | undefined, leadTimeMinutes: number): Date {
  let reminderTime = new Date(dueDate);

  if (dueTime) {
    // Parse time string
    const lower = dueTime.toLowerCase().trim();
    const timeMatch = lower.match(/^(\d{1,2}):?(\d{2})?\s*(am|pm)?$/i);

    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2] || "0");
      const period = timeMatch[3]?.toLowerCase();

      if (period === "pm" && hours < 12) hours += 12;
      if (period === "am" && hours === 12) hours = 0;

      reminderTime.setHours(hours, minutes, 0, 0);
    } else {
      const simpleMatch = lower.match(/^(\d{1,2})\s*(am|pm)$/i);
      if (simpleMatch) {
        let hours = parseInt(simpleMatch[1]);
        const period = simpleMatch[2].toLowerCase();

        if (period === "pm" && hours < 12) hours += 12;
        if (period === "am" && hours === 12) hours = 0;

        reminderTime.setHours(hours, 0, 0, 0);
      }
    }
  } else {
    // Default to 9 AM for all-day tasks
    reminderTime.setHours(9, 0, 0, 0);
  }

  // Subtract lead time
  reminderTime = new Date(reminderTime.getTime() - leadTimeMinutes * 60 * 1000);

  return reminderTime;
}

// Helper: Check if time is in quiet hours
function isInQuietHours(time: Date, quietStart: string | null, quietEnd: string | null): boolean {
  if (!quietStart || !quietEnd) return false;

  const hour = time.getHours();
  const minute = time.getMinutes();
  const currentMinutes = hour * 60 + minute;

  const [startH, startM] = quietStart.split(":").map(Number);
  const [endH, endM] = quietEnd.split(":").map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  // Handle overnight quiet hours (e.g., 22:00 to 08:00)
  if (startMinutes > endMinutes) {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }

  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

// Helper: Adjust time to end of quiet hours
function adjustForQuietHours(time: Date, quietEnd: string | null): Date {
  if (!quietEnd) return time;

  const [endH, endM] = quietEnd.split(":").map(Number);
  const adjusted = new Date(time);
  adjusted.setHours(endH, endM, 0, 0);

  // If adjusted time is before original, it's the next day
  if (adjusted <= time) {
    adjusted.setDate(adjusted.getDate() + 1);
  }

  return adjusted;
}
