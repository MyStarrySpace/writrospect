/**
 * Billing Types
 *
 * TypeScript types for subscription billing, token usage, and related features.
 */

export type SubscriptionTier = "starter" | "growth" | "team";

export type SubscriptionStatus = "active" | "trialing" | "past_due" | "canceled" | "expired";

export type BillingCycle = "monthly" | "annual";

export interface TierFeature {
  name: string;
  included: boolean;
  limit?: string | number;
}

export interface TierDefinition {
  id: SubscriptionTier;
  name: string;
  description: string;
  monthlyPrice: number; // in dollars
  annualPrice: number; // in dollars (yearly total)
  monthlyTokens: number;
  features: TierFeature[];
  popular?: boolean;
  teamSize?: number;
}

export interface TokenPack {
  id: string;
  name: string;
  tokens: number;
  priceInCents: number;
  popular?: boolean;
  stripePriceId?: string;
}

export interface Subscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  trialEndsAt: Date | null;
  cancelAtPeriodEnd: boolean;
  monthlyTokenAllocation: number;
  overageEnabled: boolean;
  overageRatePerToken: number | null;
}

export interface TokenUsage {
  id: string;
  subscriptionId: string;
  periodStart: Date;
  periodEnd: Date;
  tokensAllocated: number;
  tokensUsed: number;
  tokensFromPacks: number;
  overageTokensUsed: number;
  warnedAt80Percent: boolean;
}

export interface TokenPurchase {
  id: string;
  subscriptionId: string;
  tokenAmount: number;
  priceInCents: number;
  packType: string;
  status: string;
  purchasedAt: Date;
}

export interface UsageStats {
  tokensUsed: number;
  tokensAllocated: number;
  tokensFromPacks: number;
  tokensRemaining: number;
  percentageUsed: number;
  isAt80Percent: boolean;
  isAt100Percent: boolean;
  overageTokensUsed: number;
  periodEnd: Date;
  daysUntilReset: number;
}

export interface SubscriptionWithUsage extends Subscription {
  usage: UsageStats;
}

// API response types
export interface SubscriptionResponse {
  subscription: Subscription | null;
  usage: UsageStats | null;
}

export interface TokenPacksResponse {
  packs: TokenPack[];
}

// Upgrade/downgrade types
export interface UpgradeIntent {
  targetTier: SubscriptionTier;
  billingCycle: BillingCycle;
}

export interface CheckoutSession {
  url: string;
  sessionId: string;
}
