"use client";

import { CreditCard, Calendar, TrendingUp, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { UsageBar } from "./UsageBar";
import type { SubscriptionWithUsage } from "@/lib/types/billing";
import { TIERS } from "@/lib/billing/tiers";

interface BillingSectionProps {
  subscription: SubscriptionWithUsage;
  onManageBilling: () => void;
  onUpgrade: () => void;
}

export function BillingSection({
  subscription,
  onManageBilling,
  onUpgrade,
}: BillingSectionProps) {
  const tier = TIERS[subscription.tier];
  const { usage } = subscription;

  const formatDate = (date: Date | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusBadge = () => {
    const styles: Record<string, { bg: string; color: string; label: string }> = {
      active: {
        bg: "linear-gradient(135deg, #d4f0e0 0%, #a8dbc4 100%)",
        color: "#2d6a4f",
        label: "Active",
      },
      trialing: {
        bg: "linear-gradient(135deg, #d6e5f5 0%, #b3cce6 100%)",
        color: "#3d5a80",
        label: "Trial",
      },
      past_due: {
        bg: "linear-gradient(135deg, #ffecd2 0%, #f5d0a9 100%)",
        color: "#a66321",
        label: "Past Due",
      },
      canceled: {
        bg: "linear-gradient(135deg, #fde2e4 0%, #f5c6cb 100%)",
        color: "#9b2c3d",
        label: "Canceled",
      },
      expired: {
        bg: "var(--shadow-dark)",
        color: "var(--accent)",
        label: "Expired",
      },
    };

    const status = styles[subscription.status] || styles.active;

    return (
      <span
        className="rounded-full px-2.5 py-0.5 text-xs font-medium"
        style={{ background: status.bg, color: status.color }}
      >
        {status.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Plan Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{
              background: "var(--shadow-light)",
              boxShadow: "var(--neu-shadow-sm)",
            }}
          >
            <CreditCard className="h-5 w-5" style={{ color: "var(--accent-primary)" }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-medium" style={{ color: "var(--foreground)" }}>
                {tier.name}
              </h4>
              {getStatusBadge()}
            </div>
            <p className="text-sm" style={{ color: "var(--accent)" }}>
              {tier.monthlyPrice === 0 ? "Free plan" : `$${tier.monthlyPrice}/month`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {tier.monthlyPrice > 0 && (
            <Button size="sm" variant="secondary" onClick={onManageBilling}>
              Manage
            </Button>
          )}
          {subscription.tier !== "team" && (
            <Button
              size="sm"
              variant="primary"
              onClick={onUpgrade}
              leftIcon={<TrendingUp className="h-4 w-4" />}
            >
              Upgrade
            </Button>
          )}
        </div>
      </div>

      {/* Trial info */}
      {subscription.status === "trialing" && subscription.trialEndsAt && (
        <div
          className="flex items-center gap-2 rounded-lg p-3 text-sm"
          style={{
            background: "linear-gradient(135deg, #d6e5f5 0%, #b3cce6 100%)",
            color: "#3d5a80",
          }}
        >
          <Clock className="h-4 w-4 flex-shrink-0" />
          <span>Trial ends {formatDate(subscription.trialEndsAt)}</span>
        </div>
      )}

      {/* Cancel pending */}
      {subscription.cancelAtPeriodEnd && (
        <div
          className="flex items-center gap-2 rounded-lg p-3 text-sm"
          style={{
            background: "linear-gradient(135deg, #ffecd2 0%, #f5d0a9 100%)",
            color: "#a66321",
          }}
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>Subscription ends {formatDate(subscription.currentPeriodEnd)}</span>
        </div>
      )}

      {/* Usage */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
            Token Usage
          </h4>
          <span className="text-xs" style={{ color: "var(--accent)" }}>
            Resets in {usage.daysUntilReset} {usage.daysUntilReset === 1 ? "day" : "days"}
          </span>
        </div>

        <UsageBar
          tokensUsed={usage.tokensUsed}
          tokensAllocated={usage.tokensAllocated}
          tokensFromPacks={usage.tokensFromPacks}
          percentageUsed={usage.percentageUsed}
        />

        {usage.overageTokensUsed > 0 && (
          <p className="mt-2 text-xs" style={{ color: "#a66321" }}>
            +{usage.overageTokensUsed.toLocaleString()} overage tokens used
          </p>
        )}
      </div>

      {/* Billing period */}
      <div className="flex items-center gap-2 text-xs" style={{ color: "var(--accent)" }}>
        <Calendar className="h-3.5 w-3.5" />
        <span>
          {formatDate(subscription.currentPeriodStart)} – {formatDate(subscription.currentPeriodEnd)}
        </span>
      </div>
    </div>
  );
}
