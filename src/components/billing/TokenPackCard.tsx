"use client";

import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { ClientTokenPack } from "@/lib/billing/token-packs-client";
import { formatPackPrice } from "@/lib/billing/token-packs-client";

interface TokenPackCardProps {
  pack: ClientTokenPack;
  onPurchase: (packId: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function TokenPackCard({
  pack,
  onPurchase,
  isLoading = false,
  disabled = false,
}: TokenPackCardProps) {
  const formatTokens = (tokens: number) => {
    if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(tokens % 1000 === 0 ? 0 : 1)}k`;
    }
    return tokens.toString();
  };

  return (
    <motion.div
      whileHover={disabled ? undefined : { scale: 1.02 }}
      className="relative flex flex-col items-center rounded-xl p-4"
      style={{
        background: "var(--background)",
        boxShadow: pack.popular ? "var(--neu-shadow)" : "var(--neu-shadow-sm)",
        border: pack.popular ? "1px solid var(--accent-primary)" : "none",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {pack.popular && (
        <div
          className="absolute -top-2 rounded-full px-2 py-0.5 text-[10px] font-medium"
          style={{
            background: "var(--foreground)",
            color: "var(--background)",
          }}
        >
          Best Value
        </div>
      )}

      <div className="mb-2 flex items-center gap-1">
        <Zap className="h-4 w-4" style={{ color: "var(--accent-primary)" }} />
        <span className="text-lg font-bold" style={{ color: "var(--foreground)" }}>
          {formatTokens(pack.tokens)}
        </span>
      </div>

      <Button
        size="sm"
        variant="secondary"
        onClick={() => onPurchase(pack.id)}
        isLoading={isLoading}
        disabled={disabled || isLoading}
        className="w-full"
      >
        {formatPackPrice(pack.priceInCents)}
      </Button>
    </motion.div>
  );
}
