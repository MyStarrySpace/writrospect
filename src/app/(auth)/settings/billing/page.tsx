"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  BillingSection,
  OverageSettings,
  TokenPackCard,
  UpgradeModal,
  UsageWarningBanner,
  TeamFeaturesSection,
} from "@/components/billing";
import { useSubscription } from "@/hooks/useSubscription";
import { TOKEN_PACKS } from "@/lib/billing/token-packs-client";
import { useToast } from "@/components/ui/Toast";

export default function BillingSettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { subscription, isLoading, refresh } = useSubscription();
  const { addToast } = useToast();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [purchasingPack, setPurchasingPack] = useState<string | null>(null);
  const [showTokenPacks, setShowTokenPacks] = useState(false);

  useEffect(() => {
    const checkoutSuccess = searchParams.get("checkout_success");
    const packSuccess = searchParams.get("pack_success");
    const tier = searchParams.get("tier");

    if (checkoutSuccess === "true" && tier) {
      addToast("success", `Upgraded to ${tier.charAt(0).toUpperCase() + tier.slice(1)} plan!`);
      router.replace("/settings/billing");
      refresh();
    } else if (packSuccess === "true") {
      addToast("success", "Token pack purchased! Tokens will be credited shortly.");
      router.replace("/settings/billing");
      refresh();
    }
  }, [searchParams, addToast, router, refresh]);

  const handleBuyTokens = async (packId: string) => {
    setPurchasingPack(packId);
    try {
      const res = await fetch("/api/billing/token-packs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      });

      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        addToast("error", data.error || "Failed to purchase tokens");
      }
    } catch {
      addToast("error", "Failed to purchase tokens");
    } finally {
      setPurchasingPack(null);
    }
  };

  const handleToggleOverage = async (enabled: boolean) => {
    try {
      const res = await fetch("/api/billing/subscription", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ overageEnabled: enabled }),
      });

      const data = await res.json();
      if (data.success) {
        addToast("success", enabled ? "Overage billing enabled" : "Overage billing disabled");
        refresh();
      } else {
        throw new Error("Failed to update");
      }
    } catch (error) {
      addToast("error", "Failed to update overage settings");
      throw error;
    }
  };

  const handleManageBilling = async () => {
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        addToast("error", data.error || "Failed to open billing portal");
      }
    } catch {
      addToast("error", "Failed to open billing portal");
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-32 rounded" style={{ background: "var(--shadow-dark)" }} />
          <div className="h-48 rounded-xl" style={{ background: "var(--shadow-dark)" }} />
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="mx-auto max-w-2xl">
        <p style={{ color: "var(--accent)" }}>Unable to load subscription.</p>
      </div>
    );
  }

  const canBuyTokens = subscription.tier !== "starter";
  const isTeamPlan = subscription.tier === "team";

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/settings"
        className="mb-4 inline-flex items-center gap-1 text-sm transition-colors hover:opacity-70"
        style={{ color: "var(--accent)" }}
      >
        <ArrowLeft className="h-4 w-4" />
        Settings
      </Link>

      <PageHeader
        title="Billing"
        description="Manage your subscription and usage."
      />

      <UsageWarningBanner
        percentageUsed={subscription.usage.percentageUsed}
        overageEnabled={subscription.overageEnabled}
        tier={subscription.tier}
        onBuyTokens={() => setShowTokenPacks(true)}
        onEnableOverage={() => handleToggleOverage(true)}
        onUpgrade={() => setShowUpgradeModal(true)}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardContent className="space-y-6 py-6">
            {/* Plan & Usage */}
            <BillingSection
              subscription={subscription}
              onManageBilling={handleManageBilling}
              onUpgrade={() => setShowUpgradeModal(true)}
            />

            {/* Divider */}
            <hr style={{ borderColor: "var(--shadow-dark)" }} />

            {/* Overage Settings */}
            <OverageSettings
              overageEnabled={subscription.overageEnabled}
              overageRate={subscription.overageRatePerToken}
              tier={subscription.tier}
              onToggleOverage={handleToggleOverage}
            />

            {/* Token Packs (for paid plans) */}
            {canBuyTokens && (
              <>
                <hr style={{ borderColor: "var(--shadow-dark)" }} />

                <div>
                  <button
                    onClick={() => setShowTokenPacks(!showTokenPacks)}
                    className="flex w-full items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-lg"
                        style={{ background: "var(--shadow-light)" }}
                      >
                        <ShoppingCart className="h-4 w-4" style={{ color: "var(--accent-primary)" }} />
                      </div>
                      <div className="text-left">
                        <h4 className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                          Buy Token Packs
                        </h4>
                        <p className="text-xs" style={{ color: "var(--accent)" }}>
                          Get more tokens instantly
                        </p>
                      </div>
                    </div>
                    <span
                      className="text-sm"
                      style={{ color: "var(--accent-primary)" }}
                    >
                      {showTokenPacks ? "Hide" : "Show"}
                    </span>
                  </button>

                  {showTokenPacks && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      className="mt-4 grid gap-3 sm:grid-cols-3"
                    >
                      {TOKEN_PACKS.map((pack) => (
                        <TokenPackCard
                          key={pack.id}
                          pack={pack}
                          onPurchase={handleBuyTokens}
                          isLoading={purchasingPack === pack.id}
                          disabled={purchasingPack !== null && purchasingPack !== pack.id}
                        />
                      ))}
                    </motion.div>
                  )}
                </div>
              </>
            )}

            {/* Divider */}
            <hr style={{ borderColor: "var(--shadow-dark)" }} />

            {/* Team Features */}
            <TeamFeaturesSection
              isTeamPlan={isTeamPlan}
              onUpgrade={() => setShowUpgradeModal(true)}
            />
          </CardContent>
        </Card>
      </motion.div>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentTier={subscription.tier}
      />
    </div>
  );
}
