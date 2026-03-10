import { describe, it, expect, vi, afterEach } from "vitest";
import { getRelativeTime } from "../relative-time";

describe("getRelativeTime", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns "just now" for less than 60 seconds ago', () => {
    const now = new Date();
    const thirtySecondsAgo = new Date(now.getTime() - 30 * 1000);
    expect(getRelativeTime(thirtySecondsAgo)).toBe("just now");
  });

  it('returns "1 minute ago" for exactly 1 minute', () => {
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now);
    const oneMinuteAgo = new Date(now - 60 * 1000);
    expect(getRelativeTime(oneMinuteAgo)).toBe("1 minute ago");
  });

  it('returns "X minutes ago" for 2-59 minutes', () => {
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now);
    const fiveMinutesAgo = new Date(now - 5 * 60 * 1000);
    expect(getRelativeTime(fiveMinutesAgo)).toBe("5 minutes ago");
  });

  it('returns "1 hour ago" for exactly 1 hour', () => {
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now);
    const oneHourAgo = new Date(now - 60 * 60 * 1000);
    expect(getRelativeTime(oneHourAgo)).toBe("1 hour ago");
  });

  it('returns "X hours ago" for 2-23 hours', () => {
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now);
    const threeHoursAgo = new Date(now - 3 * 60 * 60 * 1000);
    expect(getRelativeTime(threeHoursAgo)).toBe("3 hours ago");
  });

  it('returns "1 day ago" for exactly 1 day', () => {
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now);
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
    expect(getRelativeTime(oneDayAgo)).toBe("1 day ago");
  });

  it('returns "X days ago" for multiple days', () => {
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now);
    const fiveDaysAgo = new Date(now - 5 * 24 * 60 * 60 * 1000);
    expect(getRelativeTime(fiveDaysAgo)).toBe("5 days ago");
  });

  it("handles singular vs plural correctly", () => {
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now);

    expect(getRelativeTime(new Date(now - 1 * 60 * 1000))).toBe("1 minute ago");
    expect(getRelativeTime(new Date(now - 2 * 60 * 1000))).toBe("2 minutes ago");
    expect(getRelativeTime(new Date(now - 1 * 60 * 60 * 1000))).toBe("1 hour ago");
    expect(getRelativeTime(new Date(now - 2 * 60 * 60 * 1000))).toBe("2 hours ago");
  });
});
