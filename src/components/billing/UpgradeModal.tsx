"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronLeft, CreditCard, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { PricingTable } from "./PricingTable";
import { TIERS } from "@/lib/billing/tiers";
import type { SubscriptionTier, BillingCycle } from "@/lib/types/billing";

type Step = "select" | "payment" | "success";

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

  const handleSelectTier = (tierId: string, cycle: BillingCycle) => {
    if (tierId === currentTier) return;
    setSelectedTier(tierId as SubscriptionTier);
    setBillingCycle(cycle);
    setStep("payment");
  };

  const handleBack = () => {
    setStep("select");
    setSelectedTier(null);
  };

  const handleConfirm = async () => {
    setIsProcessing(true);
    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsProcessing(false);
    setStep("success");
  };

  const handleClose = () => {
    // Reset state on close
    setStep("select");
    setSelectedTier(null);
    setIsProcessing(false);
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

        {step === "payment" && tier && (
          <motion.div
            key="payment"
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

            {/* Payment placeholder */}
            <div
              className="mb-6 rounded-xl border-2 border-dashed p-8 text-center"
              style={{ borderColor: "var(--accent-soft)" }}
            >
              <CreditCard
                className="mx-auto mb-3 h-10 w-10"
                style={{ color: "var(--accent)" }}
              />
              <p
                className="text-sm"
                style={{ color: "var(--accent)" }}
              >
                Payment form will be here in Phase 2
                <br />
                (Stripe Elements integration)
              </p>
            </div>

            {/* Trial info */}
            <div
              className="mb-6 flex items-center gap-2 rounded-lg p-3 text-sm"
              style={{
                background: "linear-gradient(135deg, #d6e5f5 0%, #b3cce6 100%)",
                color: "#3d5a80",
              }}
            >
              <Check className="h-4 w-4 flex-shrink-0" />
              <span>
                Start with a 7-day free trial. Cancel anytime.
              </span>
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={handleBack}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                isLoading={isProcessing}
                className="flex-1"
              >
                Start Free Trial
              </Button>
            </div>
          </motion.div>
        )}

        {step === "success" && tier && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="py-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
              style={{
                background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                boxShadow: "var(--neu-shadow)",
              }}
            >
              <Check className="h-8 w-8 text-white" />
            </motion.div>

            <h2
              className="mb-2 text-xl font-semibold"
              style={{ color: "var(--foreground)" }}
            >
              Welcome to {tier.name}!
            </h2>
            <p
              className="mb-6 text-sm"
              style={{ color: "var(--accent)" }}
            >
              Your 7-day free trial has started. Enjoy {tier.monthlyTokens.toLocaleString()} tokens per month.
            </p>

            <Button onClick={handleClose}>
              Get Started
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}
