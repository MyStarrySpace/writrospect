"use client";

import { useState, useEffect, useCallback } from "react";
import type { SubscriptionWithUsage, SubscriptionTier } from "@/lib/types/billing";

interface UseSubscriptionReturn {
  subscription: SubscriptionWithUsage | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  canUseAI: boolean;
  tierName: string;
}

export function useSubscription(): UseSubscriptionReturn {
  const [subscription, setSubscription] = useState<SubscriptionWithUsage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/billing/subscription");
      if (!res.ok) {
        throw new Error("Failed to fetch subscription");
      }
      const data = await res.json();
      setSubscription(data.subscription);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // User can use AI if they have tokens remaining OR if overage is enabled
  const canUseAI = subscription
    ? subscription.usage.tokensRemaining > 0 ||
      subscription.overageEnabled ||
      subscription.usage.overageTokensUsed > 0
    : false;

  const tierNames: Record<SubscriptionTier, string> = {
    starter: "Starter",
    growth: "Growth",
    team: "Team",
  };

  const tierName = subscription ? tierNames[subscription.tier] : "Free";

  return {
    subscription,
    isLoading,
    error,
    refresh: fetchSubscription,
    canUseAI,
    tierName,
  };
}
