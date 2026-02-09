"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { PricingCard } from "./PricingCard";
import { TIERS, TIER_ORDER } from "@/lib/billing/tiers";
import type { BillingCycle } from "@/lib/types/billing";

interface PricingTableProps {
  currentTier?: string;
  onSelectTier: (tierId: string, billingCycle: BillingCycle) => void;
  isLoading?: boolean;
}

export function PricingTable({
  currentTier,
  onSelectTier,
  isLoading = false,
}: PricingTableProps) {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");

  return (
    <div>
      {/* Billing cycle toggle */}
      <div className="mb-8 flex justify-center">
        <div
          className="inline-flex rounded-xl p-1"
          style={{
            background: "var(--background)",
            boxShadow: "var(--neu-shadow-inset)",
          }}
        >
          <button
            onClick={() => setBillingCycle("monthly")}
            className="relative rounded-lg px-4 py-2 text-sm font-medium transition-all"
            style={{
              color: billingCycle === "monthly" ? "var(--foreground)" : "var(--accent)",
              background: billingCycle === "monthly" ? "var(--background)" : "transparent",
              boxShadow: billingCycle === "monthly" ? "var(--neu-shadow-sm)" : "none",
            }}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle("annual")}
            className="relative rounded-lg px-4 py-2 text-sm font-medium transition-all"
            style={{
              color: billingCycle === "annual" ? "var(--foreground)" : "var(--accent)",
              background: billingCycle === "annual" ? "var(--background)" : "transparent",
              boxShadow: billingCycle === "annual" ? "var(--neu-shadow-sm)" : "none",
            }}
          >
            Annual
            <span
              className="ml-1 rounded-full px-2 py-0.5 text-xs"
              style={{
                background: "var(--accent-primary)",
                color: "var(--background)",
              }}
            >
              Save 17%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {TIER_ORDER.map((tierId, index) => (
          <motion.div
            key={tierId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <PricingCard
              tier={TIERS[tierId]}
              billingCycle={billingCycle}
              currentTier={currentTier}
              onSelect={(id) => onSelectTier(id, billingCycle)}
              isLoading={isLoading}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
