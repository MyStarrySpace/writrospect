import { describe, it, expect } from "vitest";
import {
  getTimeContext,
  getTimeContextWithTimezone,
  formatRelativeDate,
  getTimeContextLabel,
} from "../time";

describe("getTimeContext", () => {
  it("returns early_morning for 5-7am", () => {
    expect(getTimeContext(new Date(2024, 0, 1, 5, 0))).toBe("early_morning");
    expect(getTimeContext(new Date(2024, 0, 1, 7, 59))).toBe("early_morning");
  });

  it("returns morning for 8-11am", () => {
    expect(getTimeContext(new Date(2024, 0, 1, 8, 0))).toBe("morning");
    expect(getTimeContext(new Date(2024, 0, 1, 11, 59))).toBe("morning");
  });

  it("returns afternoon for 12-4pm", () => {
    expect(getTimeContext(new Date(2024, 0, 1, 12, 0))).toBe("afternoon");
    expect(getTimeContext(new Date(2024, 0, 1, 16, 59))).toBe("afternoon");
  });

  it("returns evening for 5-8pm", () => {
    expect(getTimeContext(new Date(2024, 0, 1, 17, 0))).toBe("evening");
    expect(getTimeContext(new Date(2024, 0, 1, 20, 59))).toBe("evening");
  });

  it("returns late_night for 9pm-4am", () => {
    expect(getTimeContext(new Date(2024, 0, 1, 21, 0))).toBe("late_night");
    expect(getTimeContext(new Date(2024, 0, 1, 23, 59))).toBe("late_night");
    expect(getTimeContext(new Date(2024, 0, 1, 0, 0))).toBe("late_night");
    expect(getTimeContext(new Date(2024, 0, 1, 4, 59))).toBe("late_night");
  });

  it("handles boundary at exactly 5am", () => {
    expect(getTimeContext(new Date(2024, 0, 1, 4, 59))).toBe("late_night");
    expect(getTimeContext(new Date(2024, 0, 1, 5, 0))).toBe("early_morning");
  });
});

describe("getTimeContextWithTimezone", () => {
  it("falls back to getTimeContext when no timezone provided", () => {
    const date = new Date(2024, 0, 1, 10, 0);
    expect(getTimeContextWithTimezone(date)).toBe("morning");
    expect(getTimeContextWithTimezone(date, null)).toBe("morning");
  });

  it("converts time using timezone", () => {
    // Create a UTC date and test with a known timezone
    const utcDate = new Date("2024-01-01T14:00:00Z"); // 2pm UTC
    // In America/New_York (UTC-5 in January), this is 9am
    const result = getTimeContextWithTimezone(utcDate, "America/New_York");
    expect(result).toBe("morning");
  });

  it("falls back gracefully on invalid timezone", () => {
    const date = new Date(2024, 0, 1, 10, 0);
    // Invalid timezone should fall back to local time
    const result = getTimeContextWithTimezone(date, "Invalid/Timezone");
    expect(result).toBe(getTimeContext(date));
  });
});

describe("formatRelativeDate", () => {
  it('returns "Today" for today\'s date', () => {
    const now = new Date();
    expect(formatRelativeDate(now.toISOString())).toBe("Today");
  });

  it('returns "Yesterday" for yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    // Set to same time to ensure diffDays calculation works
    yesterday.setHours(new Date().getHours());
    expect(formatRelativeDate(yesterday.toISOString())).toBe("Yesterday");
  });

  it('returns "X days ago" for 2-6 days', () => {
    // Use a fixed offset to avoid boundary issues with Math.floor
    const now = new Date();
    const date = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000 - 1000);
    expect(formatRelativeDate(date.toISOString())).toBe("3 days ago");
  });

  it('returns "X weeks ago" for 7-29 days', () => {
    const now = new Date();
    const date = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000 - 1000);
    expect(formatRelativeDate(date.toISOString())).toBe("2 weeks ago");
  });

  it("returns formatted date for 30+ days", () => {
    const date = new Date();
    date.setDate(date.getDate() - 60);
    const result = formatRelativeDate(date.toISOString());
    // Should return a locale-formatted date string, not "X weeks ago"
    expect(result).not.toContain("weeks ago");
    expect(result).not.toContain("days ago");
  });
});

describe("getTimeContextLabel", () => {
  it("returns correct labels for all time contexts", () => {
    expect(getTimeContextLabel("early_morning")).toBe("Early Morning");
    expect(getTimeContextLabel("morning")).toBe("Morning");
    expect(getTimeContextLabel("afternoon")).toBe("Afternoon");
    expect(getTimeContextLabel("evening")).toBe("Evening");
    expect(getTimeContextLabel("late_night")).toBe("Late Night");
  });
});
