import { TimeContext } from "@prisma/client";

export function getTimeContext(date: Date): TimeContext {
  const hour = date.getHours();

  if (hour >= 5 && hour < 8) return "early_morning";
  if (hour >= 8 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "late_night";
}

export function getTimeContextWithTimezone(date: Date, timezone?: string | null): TimeContext {
  if (!timezone) {
    return getTimeContext(date);
  }

  try {
    // Get the hour in the user's timezone
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      hour12: false,
    });
    const hourStr = formatter.format(date);
    const hour = parseInt(hourStr, 10);

    if (hour >= 5 && hour < 8) return "early_morning";
    if (hour >= 8 && hour < 12) return "morning";
    if (hour >= 12 && hour < 17) return "afternoon";
    if (hour >= 17 && hour < 21) return "evening";
    return "late_night";
  } catch {
    // If timezone conversion fails, fall back to local time
    return getTimeContext(date);
  }
}

export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
}

export function getTimeContextLabel(context: TimeContext): string {
  const labels: Record<TimeContext, string> = {
    early_morning: "Early Morning",
    morning: "Morning",
    afternoon: "Afternoon",
    evening: "Evening",
    late_night: "Late Night",
  };
  return labels[context];
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
