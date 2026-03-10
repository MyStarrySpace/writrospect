import { describe, it, expect } from "vitest";
import {
  getTier,
  canUpgradeTo,
  canDowngradeTo,
  getMonthlyPriceForCycle,
  getAnnualSavings,
  getAnnualSavingsPercent,
  TIERS,
  TIER_ORDER,
} from "../tiers";

describe("TIERS", () => {
  it("has all three tiers defined", () => {
    expect(TIERS.starter).toBeDefined();
    expect(TIERS.growth).toBeDefined();
    expect(TIERS.team).toBeDefined();
  });

  it("starter tier is free", () => {
    expect(TIERS.starter.monthlyPrice).toBe(0);
    expect(TIERS.starter.annualPrice).toBe(0);
  });

  it("growth tier has correct pricing", () => {
    expect(TIERS.growth.monthlyPrice).toBe(9.99);
    expect(TIERS.growth.annualPrice).toBe(99.99);
  });

  it("team tier has correct pricing", () => {
    expect(TIERS.team.monthlyPrice).toBe(24.99);
    expect(TIERS.team.annualPrice).toBe(249.99);
  });

  it("tiers have increasing token allocations", () => {
    expect(TIERS.starter.monthlyTokens).toBeLessThan(TIERS.growth.monthlyTokens);
    expect(TIERS.growth.monthlyTokens).toBeLessThan(TIERS.team.monthlyTokens);
  });

  it("growth tier is marked as popular", () => {
    expect(TIERS.growth.popular).toBe(true);
  });

  it("team tier has a team size", () => {
    expect(TIERS.team.teamSize).toBe(5);
  });
});

describe("TIER_ORDER", () => {
  it("has correct order", () => {
    expect(TIER_ORDER).toEqual(["starter", "growth", "team"]);
  });
});

describe("getTier", () => {
  it("returns the correct tier definition", () => {
    expect(getTier("starter")).toBe(TIERS.starter);
    expect(getTier("growth")).toBe(TIERS.growth);
    expect(getTier("team")).toBe(TIERS.team);
  });
});

describe("canUpgradeTo", () => {
  it("allows upgrading from lower to higher tier", () => {
    expect(canUpgradeTo("starter", "growth")).toBe(true);
    expect(canUpgradeTo("starter", "team")).toBe(true);
    expect(canUpgradeTo("growth", "team")).toBe(true);
  });

  it("does not allow upgrading to same tier", () => {
    expect(canUpgradeTo("starter", "starter")).toBe(false);
    expect(canUpgradeTo("growth", "growth")).toBe(false);
  });

  it("does not allow upgrading to lower tier", () => {
    expect(canUpgradeTo("growth", "starter")).toBe(false);
    expect(canUpgradeTo("team", "growth")).toBe(false);
    expect(canUpgradeTo("team", "starter")).toBe(false);
  });
});

describe("canDowngradeTo", () => {
  it("allows downgrading from higher to lower tier", () => {
    expect(canDowngradeTo("growth", "starter")).toBe(true);
    expect(canDowngradeTo("team", "starter")).toBe(true);
    expect(canDowngradeTo("team", "growth")).toBe(true);
  });

  it("does not allow downgrading to same tier", () => {
    expect(canDowngradeTo("starter", "starter")).toBe(false);
  });

  it("does not allow downgrading to higher tier", () => {
    expect(canDowngradeTo("starter", "growth")).toBe(false);
    expect(canDowngradeTo("growth", "team")).toBe(false);
  });
});

describe("getMonthlyPriceForCycle", () => {
  it("returns monthly price for monthly cycle", () => {
    expect(getMonthlyPriceForCycle(TIERS.growth, "monthly")).toBe(9.99);
  });

  it("returns annualized monthly price for annual cycle", () => {
    const annualMonthly = getMonthlyPriceForCycle(TIERS.growth, "annual");
    expect(annualMonthly).toBeCloseTo(99.99 / 12, 2);
  });

  it("returns 0 for starter tier regardless of cycle", () => {
    expect(getMonthlyPriceForCycle(TIERS.starter, "monthly")).toBe(0);
    expect(getMonthlyPriceForCycle(TIERS.starter, "annual")).toBe(0);
  });
});

describe("getAnnualSavings", () => {
  it("calculates correct savings for growth tier", () => {
    const expected = 9.99 * 12 - 99.99;
    expect(getAnnualSavings(TIERS.growth)).toBeCloseTo(expected, 2);
  });

  it("calculates correct savings for team tier", () => {
    const expected = 24.99 * 12 - 249.99;
    expect(getAnnualSavings(TIERS.team)).toBeCloseTo(expected, 2);
  });

  it("returns 0 for starter tier", () => {
    expect(getAnnualSavings(TIERS.starter)).toBe(0);
  });
});

describe("getAnnualSavingsPercent", () => {
  it("returns 0 for free tier", () => {
    expect(getAnnualSavingsPercent(TIERS.starter)).toBe(0);
  });

  it("returns correct percentage for paid tiers", () => {
    const growthPercent = getAnnualSavingsPercent(TIERS.growth);
    // 9.99 * 12 = 119.88, savings = 119.88 - 99.99 = 19.89
    // percent = 19.89 / 119.88 * 100 ≈ 17
    expect(growthPercent).toBeGreaterThan(0);
    expect(growthPercent).toBeLessThanOrEqual(100);
  });

  it("returns an integer", () => {
    expect(Number.isInteger(getAnnualSavingsPercent(TIERS.growth))).toBe(true);
  });
});
