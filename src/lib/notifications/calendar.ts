import { google } from "googleapis";
import prisma from "@/lib/prisma";

// Google OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
);

// Generate OAuth URL for user to authorize
export function getGoogleAuthUrl(state: string): string {
  const scopes = [
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/calendar.readonly",
  ];

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    state,
    prompt: "consent", // Force consent to get refresh token
  });
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(code: string): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiry?: Date;
}> {
  const { tokens } = await oauth2Client.getToken(code);

  return {
    accessToken: tokens.access_token!,
    refreshToken: tokens.refresh_token || undefined,
    expiry: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
  };
}

// Get authenticated calendar client for a user
async function getCalendarClient(userId: string) {
  const connection = await prisma.calendarConnection.findUnique({
    where: { userId_provider: { userId, provider: "google" } },
  });

  if (!connection) {
    throw new Error("No Google Calendar connection found");
  }

  oauth2Client.setCredentials({
    access_token: connection.accessToken,
    refresh_token: connection.refreshToken || undefined,
  });

  // Check if token needs refresh
  if (connection.tokenExpiry && connection.tokenExpiry < new Date()) {
    const { credentials } = await oauth2Client.refreshAccessToken();

    // Update stored tokens
    await prisma.calendarConnection.update({
      where: { id: connection.id },
      data: {
        accessToken: credentials.access_token!,
        tokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
      },
    });

    oauth2Client.setCredentials(credentials);
  }

  return google.calendar({ version: "v3", auth: oauth2Client });
}

// Create a calendar event for a task
export async function createTaskEvent(
  userId: string,
  task: {
    id: string;
    what: string;
    context?: string | null;
    dueDate: Date;
    dueTime?: string | null;
  }
): Promise<{ success: boolean; eventId?: string; error?: string }> {
  try {
    const calendar = await getCalendarClient(userId);
    const connection = await prisma.calendarConnection.findUnique({
      where: { userId_provider: { userId, provider: "google" } },
    });

    // Parse due time or default to all-day event
    let startDateTime: Date;
    let endDateTime: Date;
    let isAllDay = false;

    if (task.dueTime) {
      // Parse time like "9AM", "14:30", "when they open"
      startDateTime = parseTimeString(task.dueDate, task.dueTime);
      endDateTime = new Date(startDateTime.getTime() + 30 * 60 * 1000); // 30 min duration
    } else {
      // All-day event
      isAllDay = true;
      startDateTime = new Date(task.dueDate);
      endDateTime = new Date(task.dueDate);
    }

    const event = {
      summary: task.what,
      description: task.context || `Task from Writrospect\n\nTask ID: ${task.id}`,
      start: isAllDay
        ? { date: startDateTime.toISOString().split("T")[0] }
        : { dateTime: startDateTime.toISOString() },
      end: isAllDay
        ? { date: endDateTime.toISOString().split("T")[0] }
        : { dateTime: endDateTime.toISOString() },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "popup", minutes: 30 },
          { method: "popup", minutes: 10 },
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId: connection?.calendarId || "primary",
      requestBody: event,
    });

    // Save event ID to task
    await prisma.task.update({
      where: { id: task.id },
      data: { calendarEventId: response.data.id },
    });

    return { success: true, eventId: response.data.id || undefined };
  } catch (error) {
    console.error("Calendar event creation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create calendar event",
    };
  }
}

// Update a calendar event
export async function updateTaskEvent(
  userId: string,
  task: {
    id: string;
    what: string;
    context?: string | null;
    dueDate: Date;
    dueTime?: string | null;
    calendarEventId: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const calendar = await getCalendarClient(userId);
    const connection = await prisma.calendarConnection.findUnique({
      where: { userId_provider: { userId, provider: "google" } },
    });

    let startDateTime: Date;
    let endDateTime: Date;
    let isAllDay = false;

    if (task.dueTime) {
      startDateTime = parseTimeString(task.dueDate, task.dueTime);
      endDateTime = new Date(startDateTime.getTime() + 30 * 60 * 1000);
    } else {
      isAllDay = true;
      startDateTime = new Date(task.dueDate);
      endDateTime = new Date(task.dueDate);
    }

    const event = {
      summary: task.what,
      description: task.context || `Task from Writrospect`,
      start: isAllDay
        ? { date: startDateTime.toISOString().split("T")[0] }
        : { dateTime: startDateTime.toISOString() },
      end: isAllDay
        ? { date: endDateTime.toISOString().split("T")[0] }
        : { dateTime: endDateTime.toISOString() },
    };

    await calendar.events.update({
      calendarId: connection?.calendarId || "primary",
      eventId: task.calendarEventId,
      requestBody: event,
    });

    return { success: true };
  } catch (error) {
    console.error("Calendar event update error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update calendar event",
    };
  }
}

// Delete a calendar event
export async function deleteTaskEvent(
  userId: string,
  eventId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const calendar = await getCalendarClient(userId);
    const connection = await prisma.calendarConnection.findUnique({
      where: { userId_provider: { userId, provider: "google" } },
    });

    await calendar.events.delete({
      calendarId: connection?.calendarId || "primary",
      eventId,
    });

    return { success: true };
  } catch (error) {
    console.error("Calendar event deletion error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete calendar event",
    };
  }
}

// Get user's calendars list
export async function getCalendarList(userId: string): Promise<{
  success: boolean;
  calendars?: Array<{ id: string; name: string; primary: boolean }>;
  error?: string;
}> {
  try {
    const calendar = await getCalendarClient(userId);
    const response = await calendar.calendarList.list();

    const calendars = (response.data.items || []).map((cal) => ({
      id: cal.id!,
      name: cal.summary || cal.id!,
      primary: cal.primary || false,
    }));

    return { success: true, calendars };
  } catch (error) {
    console.error("Calendar list error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get calendars",
    };
  }
}

// Parse time string to Date
function parseTimeString(baseDate: Date, timeString: string): Date {
  const result = new Date(baseDate);
  const lower = timeString.toLowerCase().trim();

  // Handle common formats
  const timeMatch = lower.match(/^(\d{1,2}):?(\d{2})?\s*(am|pm)?$/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2] || "0");
    const period = timeMatch[3]?.toLowerCase();

    if (period === "pm" && hours < 12) hours += 12;
    if (period === "am" && hours === 12) hours = 0;

    result.setHours(hours, minutes, 0, 0);
    return result;
  }

  // Handle "9AM", "10PM" format
  const simpleMatch = lower.match(/^(\d{1,2})\s*(am|pm)$/i);
  if (simpleMatch) {
    let hours = parseInt(simpleMatch[1]);
    const period = simpleMatch[2].toLowerCase();

    if (period === "pm" && hours < 12) hours += 12;
    if (period === "am" && hours === 12) hours = 0;

    result.setHours(hours, 0, 0, 0);
    return result;
  }

  // Default to 9 AM if we can't parse
  result.setHours(9, 0, 0, 0);
  return result;
}
