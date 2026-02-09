"use client";

import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import Link from "next/link";
import { useTokenUsage } from "@/hooks/useTokenUsage";

interface SidebarUsageIndicatorProps {
  isCollapsed: boolean;
}

export function SidebarUsageIndicator({ isCollapsed }: SidebarUsageIndicatorProps) {
  const { usage, isLoading, percentageUsed, statusColor, tokensRemaining } = useTokenUsage();

  if (isLoading || !usage) {
    return null;
  }

  const getColorValues = () => {
    switch (statusColor) {
      case "red":
        return { bg: "#ef4444", text: "#ef4444" };
      case "yellow":
        return { bg: "#f59e0b", text: "#f59e0b" };
      default:
        return { bg: "#22c55e", text: "#22c55e" };
    }
  };

  const colors = getColorValues();

  const formatTokens = (n: number) => {
    if (n >= 1000) {
      return `${(n / 1000).toFixed(1)}k`;
    }
    return n.toString();
  };

  if (isCollapsed) {
    return (
      <Link
        href="/settings/billing"
        className="flex justify-center px-2 py-2"
        title={`${tokensRemaining} tokens remaining`}
      >
        <div
          className="relative flex h-10 w-10 items-center justify-center rounded-xl"
          style={{
            background: "var(--background)",
            boxShadow: "var(--neu-shadow-sm)",
          }}
        >
          <Zap className="h-5 w-5" style={{ color: colors.text }} />
          {/* Mini progress ring */}
          <svg
            className="absolute inset-0"
            viewBox="0 0 40 40"
          >
            <circle
              cx="20"
              cy="20"
              r="18"
              fill="none"
              stroke="var(--shadow-dark)"
              strokeWidth="3"
            />
            <circle
              cx="20"
              cy="20"
              r="18"
              fill="none"
              stroke={colors.bg}
              strokeWidth="3"
              strokeDasharray={`${(Math.min(100, percentageUsed) / 100) * 113} 113`}
              strokeLinecap="round"
              transform="rotate(-90 20 20)"
              style={{ transition: "stroke-dasharray 0.3s ease" }}
            />
          </svg>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href="/settings/billing"
      className="mx-3 mb-3 block rounded-xl p-3 transition-all hover:opacity-80"
      style={{
        background: "var(--background)",
        boxShadow: "var(--neu-shadow-sm)",
      }}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4" style={{ color: colors.text }} />
          <span
            className="text-xs font-medium"
            style={{ color: "var(--foreground)" }}
          >
            Tokens
          </span>
        </div>
        <span
          className="text-xs"
          style={{ color: "var(--accent)" }}
        >
          {formatTokens(tokensRemaining)} left
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="h-1.5 w-full overflow-hidden rounded-full"
        style={{
          background: "var(--shadow-dark)",
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, percentageUsed)}%` }}
          transition={{ duration: 0.5 }}
          className="h-full rounded-full"
          style={{ background: colors.bg }}
        />
      </div>
    </Link>
  );
}
