"use client";

import { motion } from "framer-motion";

interface UsageBarProps {
  tokensUsed: number;
  tokensAllocated: number;
  tokensFromPacks?: number;
  percentageUsed: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export function UsageBar({
  tokensUsed,
  tokensAllocated,
  tokensFromPacks = 0,
  percentageUsed,
  showLabel = true,
  size = "md",
}: UsageBarProps) {
  const totalAvailable = tokensAllocated + tokensFromPacks;
  const clampedPercentage = Math.min(100, percentageUsed);

  // Determine color based on usage level
  const getGradient = () => {
    if (percentageUsed >= 100) {
      return "linear-gradient(90deg, #ef4444 0%, #dc2626 100%)";
    }
    if (percentageUsed >= 80) {
      return "linear-gradient(90deg, #f59e0b 0%, #d97706 100%)";
    }
    return "linear-gradient(90deg, #22c55e 0%, #16a34a 100%)";
  };

  const sizeStyles = {
    sm: { height: 6, borderRadius: 3 },
    md: { height: 10, borderRadius: 5 },
    lg: { height: 14, borderRadius: 7 },
  };

  const { height, borderRadius } = sizeStyles[size];

  const formatNumber = (n: number) => {
    if (n >= 1000) {
      return `${(n / 1000).toFixed(1)}k`;
    }
    return n.toString();
  };

  return (
    <div className="w-full">
      {showLabel && (
        <div className="mb-2 flex items-center justify-between text-sm">
          <span style={{ color: "var(--foreground)" }}>
            {formatNumber(tokensUsed)} / {formatNumber(totalAvailable)} tokens
          </span>
          <span style={{ color: "var(--accent)" }}>
            {Math.round(percentageUsed)}%
          </span>
        </div>
      )}
      <div
        className="w-full overflow-hidden"
        style={{
          height,
          borderRadius,
          background: "var(--shadow-dark)",
          boxShadow: "var(--neu-shadow-inset-sm)",
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clampedPercentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{
            height: "100%",
            borderRadius,
            background: getGradient(),
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        />
      </div>
      {tokensFromPacks > 0 && showLabel && (
        <p className="mt-1 text-xs" style={{ color: "var(--accent)" }}>
          Includes {formatNumber(tokensFromPacks)} tokens from packs
        </p>
      )}
    </div>
  );
}
