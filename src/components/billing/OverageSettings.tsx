"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";

interface OverageSettingsProps {
  overageEnabled: boolean;
  overageRate: number | null;
  tier: string;
  onToggleOverage: (enabled: boolean) => Promise<void>;
}

export function OverageSettings({
  overageEnabled,
  overageRate,
  tier,
  onToggleOverage,
}: OverageSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isStarter = tier === "starter";

  const handleToggle = async () => {
    if (isStarter) return;
    setIsLoading(true);
    try {
      await onToggleOverage(!overageEnabled);
    } finally {
      setIsLoading(false);
    }
  };

  const formatRate = (rate: number) => {
    const per1k = rate * 1000;
    return `$${per1k.toFixed(2)}`;
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{
            background: overageEnabled
              ? "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
              : "var(--shadow-light)",
          }}
        >
          <Zap
            className="h-4 w-4"
            style={{ color: overageEnabled ? "#fff" : "var(--accent)" }}
          />
        </div>
        <div>
          <h4 className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
            Overage Billing
          </h4>
          <p className="text-xs" style={{ color: "var(--accent)" }}>
            {isStarter
              ? "Available on paid plans"
              : overageEnabled
              ? `${overageRate ? formatRate(overageRate) : "$0.20"}/1k tokens after limit`
              : "Keep using AI after your limit"}
          </p>
        </div>
      </div>

      <button
        onClick={handleToggle}
        disabled={isStarter || isLoading}
        className="relative h-6 w-11 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        style={{
          background: overageEnabled ? "#22c55e" : "var(--shadow-dark)",
          boxShadow: "var(--neu-shadow-inset-sm)",
        }}
      >
        <motion.div
          animate={{ x: overageEnabled ? 20 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute top-1 h-4 w-4 rounded-full"
          style={{
            background: "var(--background)",
            boxShadow: "var(--neu-shadow-sm)",
          }}
        />
      </button>
    </div>
  );
}
