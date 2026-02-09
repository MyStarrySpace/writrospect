"use client";

import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { TierDefinition, BillingCycle } from "@/lib/types/billing";
import { getMonthlyPriceForCycle, getAnnualSavingsPercent } from "@/lib/billing/tiers";

interface PricingCardProps {
  tier: TierDefinition;
  billingCycle: BillingCycle;
  currentTier?: string;
  onSelect: (tierId: string) => void;
  isLoading?: boolean;
}

export function PricingCard({
  tier,
  billingCycle,
  currentTier,
  onSelect,
  isLoading = false,
}: PricingCardProps) {
  const isCurrent = currentTier === tier.id;
  const monthlyPrice = getMonthlyPriceForCycle(tier, billingCycle);
  const savingsPercent = getAnnualSavingsPercent(tier);

  const formatTokens = (tokens: number) => {
    if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(0)}k`;
    }
    return tokens.toString();
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="relative flex flex-col rounded-2xl p-6"
      style={{
        background: "var(--background)",
        boxShadow: tier.popular ? "var(--neu-shadow-lg)" : "var(--neu-shadow)",
        border: tier.popular ? "2px solid var(--accent-primary)" : "none",
      }}
    >
      {/* Popular badge */}
      {tier.popular && (
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-medium"
          style={{
            background: "var(--foreground)",
            color: "var(--background)",
          }}
        >
          Most Popular
        </div>
      )}

      {/* Header */}
      <div className="mb-4">
        <h3
          className="text-xl font-semibold"
          style={{ color: "var(--foreground)" }}
        >
          {tier.name}
        </h3>
        <p
          className="mt-1 text-sm"
          style={{ color: "var(--accent)" }}
        >
          {tier.description}
        </p>
      </div>

      {/* Pricing */}
      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span
            className="text-4xl font-bold"
            style={{ color: "var(--foreground)" }}
          >
            ${monthlyPrice.toFixed(2)}
          </span>
          <span style={{ color: "var(--accent)" }}>/mo</span>
        </div>
        {billingCycle === "annual" && tier.monthlyPrice > 0 && (
          <p
            className="mt-1 text-sm"
            style={{ color: "var(--accent-primary)" }}
          >
            Save {savingsPercent}% with annual billing
          </p>
        )}
        {tier.monthlyPrice === 0 && (
          <p
            className="mt-1 text-sm"
            style={{ color: "var(--accent)" }}
          >
            Free forever
          </p>
        )}
      </div>

      {/* Tokens */}
      <div
        className="mb-6 rounded-xl p-3"
        style={{
          background: "var(--shadow-light)",
          boxShadow: "var(--neu-shadow-inset-sm)",
        }}
      >
        <div className="text-center">
          <span
            className="text-2xl font-bold"
            style={{ color: "var(--foreground)" }}
          >
            {formatTokens(tier.monthlyTokens)}
          </span>
          <span
            className="ml-1 text-sm"
            style={{ color: "var(--accent)" }}
          >
            tokens/month
          </span>
        </div>
      </div>

      {/* Features */}
      <ul className="mb-6 flex-1 space-y-3">
        {tier.features.map((feature) => (
          <li key={feature.name} className="flex items-start gap-2">
            {feature.included ? (
              <Check
                className="mt-0.5 h-4 w-4 flex-shrink-0"
                style={{ color: "#22c55e" }}
              />
            ) : (
              <X
                className="mt-0.5 h-4 w-4 flex-shrink-0"
                style={{ color: "var(--accent)" }}
              />
            )}
            <span
              className="text-sm"
              style={{
                color: feature.included ? "var(--foreground)" : "var(--accent)",
              }}
            >
              {feature.name}
              {feature.limit && feature.included && (
                <span style={{ color: "var(--accent)" }}> ({feature.limit})</span>
              )}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Button
        variant={isCurrent ? "secondary" : "primary"}
        onClick={() => onSelect(tier.id)}
        disabled={isCurrent || isLoading}
        isLoading={isLoading}
        className="w-full"
      >
        {isCurrent
          ? "Current Plan"
          : tier.monthlyPrice === 0
          ? "Get Started"
          : "Start 7-day Trial"}
      </Button>

      {tier.monthlyPrice > 0 && !isCurrent && (
        <p
          className="mt-2 text-center text-xs"
          style={{ color: "var(--accent)" }}
        >
          No credit card required for trial
        </p>
      )}
    </motion.div>
  );
}
