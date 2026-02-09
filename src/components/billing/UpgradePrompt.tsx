"use client";

import { motion } from "framer-motion";
import { TrendingUp, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface UpgradePromptProps {
  currentTier: string;
  reason?: "token_limit" | "feature" | "general";
  featureName?: string;
  onUpgrade: () => void;
  onDismiss?: () => void;
  compact?: boolean;
}

export function UpgradePrompt({
  currentTier,
  reason = "general",
  featureName,
  onUpgrade,
  onDismiss,
  compact = false,
}: UpgradePromptProps) {
  const getMessage = () => {
    switch (reason) {
      case "token_limit":
        return "Need more tokens? Upgrade for higher limits and overage billing.";
      case "feature":
        return `${featureName || "This feature"} is available on Growth and Team plans.`;
      default:
        return "Unlock more features with an upgraded plan.";
    }
  };

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 rounded-xl p-3"
        style={{
          background: "var(--shadow-light)",
          boxShadow: "var(--neu-shadow-sm)",
        }}
      >
        <Sparkles
          className="h-5 w-5 flex-shrink-0"
          style={{ color: "var(--accent-primary)" }}
        />
        <p
          className="flex-1 text-sm"
          style={{ color: "var(--foreground)" }}
        >
          {getMessage()}
        </p>
        <Button size="sm" onClick={onUpgrade}>
          Upgrade
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl p-6"
      style={{
        background: "linear-gradient(135deg, var(--shadow-light) 0%, var(--background) 100%)",
        boxShadow: "var(--neu-shadow)",
      }}
    >
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute right-3 top-3 rounded-lg p-1 transition-colors hover:bg-black/5"
        >
          <X className="h-4 w-4" style={{ color: "var(--accent)" }} />
        </button>
      )}

      <div className="flex items-start gap-4">
        <div
          className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl"
          style={{
            background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent) 100%)",
            boxShadow: "var(--neu-shadow-sm)",
          }}
        >
          <TrendingUp className="h-6 w-6" style={{ color: "var(--background)" }} />
        </div>

        <div className="flex-1">
          <h4
            className="font-medium"
            style={{ color: "var(--foreground)" }}
          >
            Upgrade Your Plan
          </h4>
          <p
            className="mt-1 text-sm"
            style={{ color: "var(--accent)" }}
          >
            {getMessage()}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={onUpgrade}>
              View Plans
            </Button>
            {onDismiss && (
              <Button variant="ghost" onClick={onDismiss}>
                Maybe Later
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
