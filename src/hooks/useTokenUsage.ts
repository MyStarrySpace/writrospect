"use client";

import { useMemo } from "react";
import type { UsageStats } from "@/lib/types/billing";
import { useSubscription } from "./useSubscription";

interface UseTokenUsageReturn {
  usage: UsageStats | null;
  isLoading: boolean;
  percentageUsed: number;
  isWarningLevel: boolean;
  isCriticalLevel: boolean;
  isOverLimit: boolean;
  statusColor: "green" | "yellow" | "red";
  tokensRemaining: number;
  daysUntilReset: number;
}

export function useTokenUsage(): UseTokenUsageReturn {
  const { subscription, isLoading } = useSubscription();

  const usage = subscription?.usage ?? null;

  const result = useMemo(() => {
    if (!usage) {
      return {
        percentageUsed: 0,
        isWarningLevel: false,
        isCriticalLevel: false,
        isOverLimit: false,
        statusColor: "green" as const,
        tokensRemaining: 0,
        daysUntilReset: 0,
      };
    }

    const { percentageUsed, isAt80Percent, isAt100Percent, tokensRemaining, daysUntilReset } = usage;

    let statusColor: "green" | "yellow" | "red" = "green";
    if (isAt100Percent) {
      statusColor = "red";
    } else if (isAt80Percent) {
      statusColor = "yellow";
    }

    return {
      percentageUsed,
      isWarningLevel: isAt80Percent && !isAt100Percent,
      isCriticalLevel: isAt100Percent,
      isOverLimit: usage.overageTokensUsed > 0,
      statusColor,
      tokensRemaining,
      daysUntilReset,
    };
  }, [usage]);

  return {
    usage,
    isLoading,
    ...result,
  };
}
