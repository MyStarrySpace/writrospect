"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, Zap, TrendingUp, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface UsageWarningBannerProps {
  percentageUsed: number;
  overageEnabled: boolean;
  tier: string;
  onBuyTokens: () => void;
  onEnableOverage: () => void;
  onUpgrade: () => void;
}

export function UsageWarningBanner({
  percentageUsed,
  overageEnabled,
  tier,
  onBuyTokens,
  onEnableOverage,
  onUpgrade,
}: UsageWarningBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  const isAt80 = percentageUsed >= 80 && percentageUsed < 100;
  const isAt100 = percentageUsed >= 100;

  // Don't show if below 80% or if user dismissed (for 80% warning only)
  if (percentageUsed < 80 || (isAt80 && isDismissed)) {
    return null;
  }

  const isStarter = tier === "starter";
  const canBuyTokens = !isStarter;
  const canEnableOverage = !isStarter && !overageEnabled;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="mb-4 rounded-xl p-4"
        style={{
          background: isAt100
            ? "linear-gradient(135deg, #fde2e4 0%, #f5c6cb 100%)"
            : "linear-gradient(135deg, #ffecd2 0%, #f5d0a9 100%)",
          boxShadow: "var(--neu-shadow-sm)",
        }}
      >
        <div className="flex items-start gap-3">
          <AlertTriangle
            className="mt-0.5 h-5 w-5 flex-shrink-0"
            style={{ color: isAt100 ? "#9b2c3d" : "#a66321" }}
          />
          <div className="flex-1">
            <h4
              className="font-medium"
              style={{ color: isAt100 ? "#9b2c3d" : "#a66321" }}
            >
              {isAt100
                ? "Token limit reached"
                : "Approaching token limit"}
            </h4>
            <p
              className="mt-1 text-sm"
              style={{ color: isAt100 ? "#9b2c3d" : "#a66321", opacity: 0.9 }}
            >
              {isAt100
                ? overageEnabled
                  ? "You're using overage tokens. Consider buying a token pack or upgrading your plan."
                  : "AI features are paused. Enable overage billing, buy tokens, or upgrade to continue."
                : `You've used ${Math.round(percentageUsed)}% of your monthly tokens.`}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {canBuyTokens && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={onBuyTokens}
                  leftIcon={<ShoppingCart className="h-4 w-4" />}
                >
                  Buy Tokens
                </Button>
              )}
              {canEnableOverage && isAt100 && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={onEnableOverage}
                  leftIcon={<Zap className="h-4 w-4" />}
                >
                  Enable Overage
                </Button>
              )}
              <Button
                size="sm"
                variant="primary"
                onClick={onUpgrade}
                leftIcon={<TrendingUp className="h-4 w-4" />}
              >
                Upgrade Plan
              </Button>
            </div>
          </div>

          {isAt80 && !isAt100 && (
            <button
              onClick={() => setIsDismissed(true)}
              className="rounded-lg p-1 transition-colors hover:bg-black/5"
            >
              <X className="h-4 w-4" style={{ color: "#a66321" }} />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
