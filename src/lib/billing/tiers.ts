/**
 * Subscription Tier Definitions
 *
 * Defines the available subscription tiers with their features and pricing.
 */

import type { TierDefinition, SubscriptionTier } from "@/lib/types/billing";

export const TIERS: Record<SubscriptionTier, TierDefinition> = {
  starter: {
    id: "starter",
    name: "Starter",
    description: "For individuals getting started with journaling",
    monthlyPrice: 0,
    annualPrice: 0,
    monthlyTokens: 1000,
    features: [
      { name: "Basic journaling", included: true },
      { name: "AI prompts & insights", included: true, limit: "1,000 tokens/mo" },
      { name: "Goal tracking", included: true },
      { name: "Habit tracking", included: true },
      { name: "Priority AI responses", included: false },
      { name: "Advanced insights", included: false },
      { name: "Token packs", included: false },
      { name: "Overage billing", included: false },
      { name: "Team features", included: false },
    ],
  },
  growth: {
    id: "growth",
    name: "Growth",
    description: "For dedicated journalers who want deeper insights",
    monthlyPrice: 9.99,
    annualPrice: 99.99,
    monthlyTokens: 10000,
    popular: true,
    features: [
      { name: "Basic journaling", included: true },
      { name: "AI prompts & insights", included: true, limit: "10,000 tokens/mo" },
      { name: "Goal tracking", included: true },
      { name: "Habit tracking", included: true },
      { name: "Priority AI responses", included: true },
      { name: "Advanced insights", included: true },
      { name: "Token packs", included: true },
      { name: "Overage billing", included: true },
      { name: "Team features", included: false },
    ],
  },
  team: {
    id: "team",
    name: "Team",
    description: "For groups who want to grow together",
    monthlyPrice: 24.99,
    annualPrice: 249.99,
    monthlyTokens: 50000,
    teamSize: 5,
    features: [
      { name: "Basic journaling", included: true },
      { name: "AI prompts & insights", included: true, limit: "50,000 tokens/mo" },
      { name: "Goal tracking", included: true },
      { name: "Habit tracking", included: true },
      { name: "Priority AI responses", included: true },
      { name: "Advanced insights", included: true },
      { name: "Token packs", included: true },
      { name: "Overage billing", included: true },
      { name: "Team features", included: true, limit: "Up to 5 members" },
    ],
  },
};

export const TIER_ORDER: SubscriptionTier[] = ["starter", "growth", "team"];

export function getTier(tierId: SubscriptionTier): TierDefinition {
  return TIERS[tierId];
}

export function canUpgradeTo(currentTier: SubscriptionTier, targetTier: SubscriptionTier): boolean {
  const currentIndex = TIER_ORDER.indexOf(currentTier);
  const targetIndex = TIER_ORDER.indexOf(targetTier);
  return targetIndex > currentIndex;
}

export function canDowngradeTo(currentTier: SubscriptionTier, targetTier: SubscriptionTier): boolean {
  const currentIndex = TIER_ORDER.indexOf(currentTier);
  const targetIndex = TIER_ORDER.indexOf(targetTier);
  return targetIndex < currentIndex;
}

export function getMonthlyPriceForCycle(tier: TierDefinition, cycle: "monthly" | "annual"): number {
  if (cycle === "annual") {
    return tier.annualPrice / 12;
  }
  return tier.monthlyPrice;
}

export function getAnnualSavings(tier: TierDefinition): number {
  const monthlyTotal = tier.monthlyPrice * 12;
  return monthlyTotal - tier.annualPrice;
}

export function getAnnualSavingsPercent(tier: TierDefinition): number {
  if (tier.monthlyPrice === 0) return 0;
  const monthlyTotal = tier.monthlyPrice * 12;
  return Math.round(((monthlyTotal - tier.annualPrice) / monthlyTotal) * 100);
}

/**
 * Get the Stripe Price ID for a given tier and billing cycle.
 */
export function getStripePriceId(
  tier: SubscriptionTier,
  cycle: "monthly" | "annual"
): string | null {
  const priceMap: Record<string, string | undefined> = {
    "growth-monthly": process.env.STRIPE_PRICE_GROWTH_MONTHLY,
    "growth-annual": process.env.STRIPE_PRICE_GROWTH_ANNUAL,
    "team-monthly": process.env.STRIPE_PRICE_TEAM_MONTHLY,
    "team-annual": process.env.STRIPE_PRICE_TEAM_ANNUAL,
  };

  return priceMap[`${tier}-${cycle}`] || null;
}
