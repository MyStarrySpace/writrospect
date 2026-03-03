/**
 * Token Pack Definitions
 *
 * Purchasable token packs for users who need more tokens.
 */

import type { TokenPack } from "@/lib/types/billing";

export const TOKEN_PACKS: TokenPack[] = [
  {
    id: "pack-small",
    name: "Small Pack",
    tokens: 500,
    priceInCents: 299,
    stripePriceId: process.env.STRIPE_PRICE_PACK_SMALL,
  },
  {
    id: "pack-medium",
    name: "Medium Pack",
    tokens: 2000,
    priceInCents: 999,
    popular: true,
    stripePriceId: process.env.STRIPE_PRICE_PACK_MEDIUM,
  },
  {
    id: "pack-large",
    name: "Large Pack",
    tokens: 5000,
    priceInCents: 1999,
    stripePriceId: process.env.STRIPE_PRICE_PACK_LARGE,
  },
];

export function getTokenPack(packId: string): TokenPack | undefined {
  return TOKEN_PACKS.find((pack) => pack.id === packId);
}

export function formatPackPrice(priceInCents: number): string {
  return `$${(priceInCents / 100).toFixed(2)}`;
}

export function getTokensPerDollar(pack: TokenPack): number {
  return Math.round(pack.tokens / (pack.priceInCents / 100));
}
