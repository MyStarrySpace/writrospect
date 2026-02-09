/**
 * Mock Billing Data
 *
 * Mock data for subscription and usage display during Phase 1 (UI/UX shell).
 * This will be replaced with real Stripe integration in Phase 2.
 */

import type {
  Subscription,
  TokenUsage,
  UsageStats,
  SubscriptionWithUsage,
  SubscriptionTier,
} from "@/lib/types/billing";
import { TIERS } from "./tiers";

// Generate dates for current billing period
function getCurrentPeriodDates() {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return { periodStart, periodEnd };
}

function getDaysUntilReset(periodEnd: Date): number {
  const now = new Date();
  const diff = periodEnd.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// Mock subscription data - can be modified for testing different states
export const MOCK_SUBSCRIPTIONS: Record<string, Subscription> = {
  starter: {
    id: "sub_starter_001",
    userId: "user_001",
    tier: "starter",
    status: "active",
    currentPeriodStart: getCurrentPeriodDates().periodStart,
    currentPeriodEnd: getCurrentPeriodDates().periodEnd,
    trialEndsAt: null,
    cancelAtPeriodEnd: false,
    monthlyTokenAllocation: 1000,
    overageEnabled: false,
    overageRatePerToken: null,
  },
  growth: {
    id: "sub_growth_001",
    userId: "user_002",
    tier: "growth",
    status: "active",
    currentPeriodStart: getCurrentPeriodDates().periodStart,
    currentPeriodEnd: getCurrentPeriodDates().periodEnd,
    trialEndsAt: null,
    cancelAtPeriodEnd: false,
    monthlyTokenAllocation: 10000,
    overageEnabled: true,
    overageRatePerToken: 0.0002,
  },
  growthTrial: {
    id: "sub_growth_trial",
    userId: "user_003",
    tier: "growth",
    status: "trialing",
    currentPeriodStart: getCurrentPeriodDates().periodStart,
    currentPeriodEnd: getCurrentPeriodDates().periodEnd,
    trialEndsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    cancelAtPeriodEnd: false,
    monthlyTokenAllocation: 10000,
    overageEnabled: false,
    overageRatePerToken: null,
  },
  team: {
    id: "sub_team_001",
    userId: "user_004",
    tier: "team",
    status: "active",
    currentPeriodStart: getCurrentPeriodDates().periodStart,
    currentPeriodEnd: getCurrentPeriodDates().periodEnd,
    trialEndsAt: null,
    cancelAtPeriodEnd: false,
    monthlyTokenAllocation: 50000,
    overageEnabled: true,
    overageRatePerToken: 0.00015,
  },
};

// Different usage scenarios for testing
export type UsageScenario = "low" | "medium" | "warning" | "critical" | "over";

export function getMockUsageForScenario(
  subscription: Subscription,
  scenario: UsageScenario
): TokenUsage {
  const { periodStart, periodEnd } = getCurrentPeriodDates();
  const allocated = subscription.monthlyTokenAllocation;

  const usagePercents: Record<UsageScenario, number> = {
    low: 0.25,
    medium: 0.55,
    warning: 0.85,
    critical: 0.98,
    over: 1.15,
  };

  const percent = usagePercents[scenario];
  const tokensUsed = Math.floor(allocated * Math.min(percent, 1));
  const overageUsed = percent > 1 ? Math.floor(allocated * (percent - 1)) : 0;

  return {
    id: `usage_${subscription.id}`,
    subscriptionId: subscription.id,
    periodStart,
    periodEnd,
    tokensAllocated: allocated,
    tokensUsed,
    tokensFromPacks: 0,
    overageTokensUsed: overageUsed,
    warnedAt80Percent: percent >= 0.8,
  };
}

export function calculateUsageStats(
  subscription: Subscription,
  usage: TokenUsage
): UsageStats {
  const totalAvailable = usage.tokensAllocated + usage.tokensFromPacks;
  const totalUsed = usage.tokensUsed + usage.overageTokensUsed;
  const tokensRemaining = Math.max(0, totalAvailable - usage.tokensUsed);
  const percentageUsed = totalAvailable > 0 ? (usage.tokensUsed / totalAvailable) * 100 : 0;

  return {
    tokensUsed: usage.tokensUsed,
    tokensAllocated: usage.tokensAllocated,
    tokensFromPacks: usage.tokensFromPacks,
    tokensRemaining,
    percentageUsed: Math.min(100, percentageUsed),
    isAt80Percent: percentageUsed >= 80,
    isAt100Percent: percentageUsed >= 100,
    overageTokensUsed: usage.overageTokensUsed,
    periodEnd: usage.periodEnd,
    daysUntilReset: getDaysUntilReset(usage.periodEnd),
  };
}

// Default mock data function - returns a starter subscription with medium usage
export function getDefaultMockSubscription(): SubscriptionWithUsage {
  const subscription = MOCK_SUBSCRIPTIONS.starter;
  const usage = getMockUsageForScenario(subscription, "medium");
  const stats = calculateUsageStats(subscription, usage);

  return {
    ...subscription,
    usage: stats,
  };
}

// Get mock subscription by tier with specified usage scenario
export function getMockSubscriptionWithUsage(
  tier: SubscriptionTier,
  scenario: UsageScenario = "medium"
): SubscriptionWithUsage {
  const subscription = { ...MOCK_SUBSCRIPTIONS[tier] };
  subscription.monthlyTokenAllocation = TIERS[tier].monthlyTokens;

  const usage = getMockUsageForScenario(subscription, scenario);
  const stats = calculateUsageStats(subscription, usage);

  return {
    ...subscription,
    usage: stats,
  };
}
