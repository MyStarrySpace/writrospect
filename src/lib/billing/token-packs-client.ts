/**
 * Token Pack Definitions (Client-safe)
 *
 * Public token pack data safe for client-side imports.
 * Does NOT include stripePriceId or other server-only fields.
 */

export interface ClientTokenPack {
  id: string;
  name: string;
  tokens: number;
  priceInCents: number;
  popular?: boolean;
}

export const TOKEN_PACKS: ClientTokenPack[] = [
  {
    id: "pack-small",
    name: "Small Pack",
    tokens: 500,
    priceInCents: 299,
  },
  {
    id: "pack-medium",
    name: "Medium Pack",
    tokens: 2000,
    priceInCents: 999,
    popular: true,
  },
  {
    id: "pack-large",
    name: "Large Pack",
    tokens: 5000,
    priceInCents: 1999,
  },
];

export function formatPackPrice(priceInCents: number): string {
  return `$${(priceInCents / 100).toFixed(2)}`;
}

export function getTokensPerDollar(pack: ClientTokenPack): number {
  return Math.round(pack.tokens / (pack.priceInCents / 100));
}
