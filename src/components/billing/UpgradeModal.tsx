"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronLeft, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { PricingTable } from "./PricingTable";
import { TIERS } from "@/lib/billing/tiers";
import type { SubscriptionTier, BillingCycle } from "@/lib/types/billing";

type Step = "select" | "confirm";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: SubscriptionTier;
}

export function UpgradeModal({
  isOpen,
  onClose,
  currentTier,
}: UpgradeModalProps) {
  const [step, setStep] = useState<Step>("select");
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectTier = (tierId: string, cycle: BillingCycle) => {
    if (tierId === currentTier) return;
    setSelectedTier(tierId as SubscriptionTier);
    setBillingCycle(cycle);
    setStep("confirm");
  };

  const handleBack = () => {
    setStep("select");
    setSelectedTier(null);
    setError(null);
  };

  const handleConfirm = async () => {
    if (!selectedTier) return;
    setIsProcessing(true);
    setError(null);

    try {
      const res = await fetch("/api/billing/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: selectedTier, billingCycle }),
      });

      const data = await res.json();
      if (data.checkoutSession?.url) {
        window.location.href = data.checkoutSession.url;
      } else {
        setError(data.error || "Failed to create checkout session");
        setIsProcessing(false);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setStep("select");
    setSelectedTier(null);
    setIsProcessing(false);
    setError(null);
    onClose();
  };

  const tier = selectedTier ? TIERS[selectedTier] : null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl">
      <AnimatePresence mode="wait">
        {step === "select" && (
          <motion.div
            key="select"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h2
              className="mb-6 text-xl font-semibold"
              style={{ color: "var(--foreground)" }}
            >
              Choose Your Plan
            </h2>
            <PricingTable
              currentTier={currentTier}
              onSelectTier={handleSelectTier}
            />
          </motion.div>
        )}

        {step === "confirm" && tier && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <button
              onClick={handleBack}
              className="mb-4 flex items-center gap-1 text-sm transition-colors hover:opacity-70"
              style={{ color: "var(--accent)" }}
            >
              <ChevronLeft className="h-4 w-4" />
              Back to plans
            </button>

            <h2
              className="mb-2 text-xl font-semibold"
              style={{ color: "var(--foreground)" }}
            >
              Upgrade to {tier.name}
            </h2>
            <p
              className="mb-6 text-sm"
              style={{ color: "var(--accent)" }}
            >
              {tier.description}
            </p>

            {/* Order summary */}
            <div
              className="mb-6 rounded-xl p-4"
              style={{
                background: "var(--shadow-light)",
                boxShadow: "var(--neu-shadow-inset-sm)",
              }}
            >
              <h4
                className="mb-3 text-sm font-medium"
                style={{ color: "var(--foreground)" }}
              >
                Order Summary
              </h4>
              <div className="space-y-2 text-sm">
                <div
                  className="flex justify-between"
                  style={{ color: "var(--foreground)" }}
                >
                  <span>{tier.name} Plan ({billingCycle})</span>
                  <span>
                    ${billingCycle === "annual" ? tier.annualPrice : tier.monthlyPrice}
                    {billingCycle === "annual" ? "/year" : "/mo"}
                  </span>
                </div>
                <div
                  className="flex justify-between"
                  style={{ color: "var(--accent)" }}
                >
                  <span>{tier.monthlyTokens.toLocaleString()} tokens/month</span>
                </div>
                {billingCycle === "annual" && (
                  <div
                    className="flex justify-between font-medium"
                    style={{ color: "#22c55e" }}
                  >
                    <span>Annual savings</span>
                    <span>
                      ${(tier.monthlyPrice * 12 - tier.annualPrice).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div
              className="mb-6 flex items-center gap-2 rounded-lg p-3 text-sm"
              style={{
                background: "linear-gradient(135deg, #d6e5f5 0%, #b3cce6 100%)",
                color: "#3d5a80",
              }}
            >
              <Check className="h-4 w-4 flex-shrink-0" />
              <span>
                You'll be redirected to Stripe to complete payment securely. Cancel anytime.
              </span>
            </div>

            {error && (
              <div
                className="mb-4 rounded-lg p-3 text-sm"
                style={{ background: "#fef2f2", color: "#dc2626" }}
              >
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={handleBack}
                className="flex-1"
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                isLoading={isProcessing}
                className="flex-1"
              >
                Continue to Checkout
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}
