/**
 * Billing Helpers
 *
 * Database helpers for subscription and token usage management.
 */

import prisma from "@/lib/prisma";
import type { UsageStats } from "@/lib/types/billing";
import { TIERS } from "./tiers";

/**
 * Get or create a subscription for a user.
 * Returns the subscription with current token usage.
 */
export async function getOrCreateSubscription(userId: string) {
  let subscription = await prisma.subscription.findUnique({
    where: { userId },
    include: { tokenUsage: true },
  });

  if (!subscription) {
    subscription = await prisma.subscription.create({
      data: {
        userId,
        tier: "starter",
        status: "active",
        monthlyTokenAllocation: TIERS.starter.monthlyTokens,
        currentPeriodStart: getPeriodStart(),
        currentPeriodEnd: getPeriodEnd(),
      },
      include: { tokenUsage: true },
    });
  }

  return subscription;
}

/**
 * Get or create token usage for the current billing period.
 */
export async function getOrCreateTokenUsage(
  subscriptionId: string,
  periodStart: Date,
  periodEnd: Date,
  tokensAllocated: number
) {
  // Normalize to start of day for comparison
  const normalizedStart = new Date(periodStart);
  normalizedStart.setHours(0, 0, 0, 0);

  let usage = await prisma.tokenUsage.findUnique({
    where: {
      subscriptionId_periodStart: {
        subscriptionId,
        periodStart: normalizedStart,
      },
    },
  });

  if (!usage) {
    usage = await prisma.tokenUsage.create({
      data: {
        subscriptionId,
        periodStart: normalizedStart,
        periodEnd,
        tokensAllocated,
      },
    });
  }

  return usage;
}

/**
 * Calculate usage stats from subscription and token usage data.
 */
export function calculateUsageStats(
  subscription: { monthlyTokenAllocation: number; overageRatePerToken: unknown },
  usage: {
    tokensAllocated: number;
    tokensUsed: number;
    tokensFromPacks: number;
    overageTokensUsed: number;
    periodEnd: Date;
  }
): UsageStats {
  const totalAvailable = usage.tokensAllocated + usage.tokensFromPacks;
  const tokensRemaining = Math.max(0, totalAvailable - usage.tokensUsed);
  const percentageUsed =
    totalAvailable > 0 ? (usage.tokensUsed / totalAvailable) * 100 : 0;

  const now = new Date();
  const diff = usage.periodEnd.getTime() - now.getTime();
  const daysUntilReset = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));

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
    daysUntilReset,
  };
}

/** Get the start of the current billing period (1st of the month). */
function getPeriodStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

/** Get the end of the current billing period (last day of the month). */
function getPeriodEnd(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
}
