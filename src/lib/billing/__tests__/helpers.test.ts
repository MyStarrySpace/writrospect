import { describe, it, expect, vi, afterEach } from "vitest";
import { calculateUsageStats } from "../helpers";

describe("calculateUsageStats", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function makeUsage(overrides: Record<string, unknown> = {}) {
    return {
      tokensAllocated: 10000,
      tokensUsed: 5000,
      tokensFromPacks: 0,
      overageTokensUsed: 0,
      periodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      ...overrides,
    };
  }

  function makeSubscription(overrides: Record<string, unknown> = {}) {
    return {
      monthlyTokenAllocation: 10000,
      overageRatePerToken: null,
      ...overrides,
    };
  }

  it("calculates basic usage stats correctly", () => {
    const stats = calculateUsageStats(makeSubscription(), makeUsage());

    expect(stats.tokensUsed).toBe(5000);
    expect(stats.tokensAllocated).toBe(10000);
    expect(stats.tokensFromPacks).toBe(0);
    expect(stats.tokensRemaining).toBe(5000);
    expect(stats.percentageUsed).toBe(50);
    expect(stats.isAt80Percent).toBe(false);
    expect(stats.isAt100Percent).toBe(false);
  });

  it("includes token packs in total available", () => {
    const stats = calculateUsageStats(
      makeSubscription(),
      makeUsage({ tokensFromPacks: 5000, tokensUsed: 12000 })
    );

    // Total available = 10000 + 5000 = 15000
    expect(stats.tokensRemaining).toBe(3000);
    expect(stats.percentageUsed).toBe(80);
    expect(stats.isAt80Percent).toBe(true);
  });

  it("flags 80% threshold", () => {
    const stats = calculateUsageStats(
      makeSubscription(),
      makeUsage({ tokensUsed: 8000 })
    );

    expect(stats.isAt80Percent).toBe(true);
    expect(stats.isAt100Percent).toBe(false);
  });

  it("flags 100% threshold", () => {
    const stats = calculateUsageStats(
      makeSubscription(),
      makeUsage({ tokensUsed: 10000 })
    );

    expect(stats.isAt80Percent).toBe(true);
    expect(stats.isAt100Percent).toBe(true);
  });

  it("caps percentageUsed at 100", () => {
    const stats = calculateUsageStats(
      makeSubscription(),
      makeUsage({ tokensUsed: 15000 })
    );

    expect(stats.percentageUsed).toBe(100);
  });

  it("does not allow negative tokens remaining", () => {
    const stats = calculateUsageStats(
      makeSubscription(),
      makeUsage({ tokensUsed: 15000 })
    );

    expect(stats.tokensRemaining).toBe(0);
  });

  it("handles 0 allocated tokens without division error", () => {
    const stats = calculateUsageStats(
      makeSubscription(),
      makeUsage({ tokensAllocated: 0, tokensUsed: 0 })
    );

    expect(stats.percentageUsed).toBe(0);
  });

  it("calculates days until reset", () => {
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now);
    // Future end date but as a Date object, not timestamp
    vi.spyOn(Date.prototype, "getTime").mockRestore;

    const stats = calculateUsageStats(
      makeSubscription(),
      makeUsage({
        periodEnd: new Date(now + 10 * 24 * 60 * 60 * 1000),
      })
    );

    expect(stats.daysUntilReset).toBe(10);
  });

  it("returns overage tokens used", () => {
    const stats = calculateUsageStats(
      makeSubscription(),
      makeUsage({ overageTokensUsed: 500 })
    );

    expect(stats.overageTokensUsed).toBe(500);
  });
});
