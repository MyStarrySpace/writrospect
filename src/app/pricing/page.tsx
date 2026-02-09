"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, MessageSquare, Target, Brain, Users, Zap } from "lucide-react";
import { PricingTable } from "@/components/billing";
import type { BillingCycle, SubscriptionTier } from "@/lib/types/billing";

const features = [
  {
    icon: MessageSquare,
    title: "AI-Powered Journaling",
    description: "Get personalized insights and prompts based on your entries.",
  },
  {
    icon: Target,
    title: "Goal Tracking",
    description: "Set and track goals with evidence-based frameworks.",
  },
  {
    icon: Brain,
    title: "Habit Formation",
    description: "Build lasting habits with behavioral science principles.",
  },
  {
    icon: Sparkles,
    title: "Smart Insights",
    description: "Discover patterns and connections in your reflections.",
  },
  {
    icon: Users,
    title: "Team Features",
    description: "Share goals and support each other on the Team plan.",
  },
  {
    icon: Zap,
    title: "Priority Processing",
    description: "Get faster AI responses on paid plans.",
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectTier = async (tierId: string, billingCycle: BillingCycle) => {
    if (tierId === "starter") {
      // Free tier - redirect to sign up
      router.push("/handler/sign-up");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/billing/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier: tierId as SubscriptionTier,
          billingCycle,
        }),
      });

      const data = await res.json();
      if (data.checkoutSession?.url) {
        router.push(data.checkoutSession.url);
      }
    } catch (error) {
      console.error("Error selecting tier:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen px-4 py-16"
      style={{ background: "var(--background)" }}
    >
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <h1
            className="mb-4 text-4xl font-bold md:text-5xl"
            style={{ color: "var(--foreground)" }}
          >
            Choose Your Journey
          </h1>
          <p
            className="mx-auto max-w-2xl text-lg"
            style={{ color: "var(--accent)" }}
          >
            Start free and upgrade when you need more AI tokens.
            All plans include a 7-day free trial for paid tiers.
          </p>
        </motion.div>

        {/* Pricing Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-20"
        >
          <PricingTable onSelectTier={handleSelectTier} isLoading={isLoading} />
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-16"
        >
          <h2
            className="mb-8 text-center text-2xl font-semibold"
            style={{ color: "var(--foreground)" }}
          >
            What's Included
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="rounded-xl p-6"
                  style={{
                    background: "var(--background)",
                    boxShadow: "var(--neu-shadow)",
                  }}
                >
                  <div
                    className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
                    style={{
                      background: "var(--shadow-light)",
                      boxShadow: "var(--neu-shadow-sm)",
                    }}
                  >
                    <Icon
                      className="h-6 w-6"
                      style={{ color: "var(--accent-primary)" }}
                    />
                  </div>
                  <h3
                    className="mb-2 font-medium"
                    style={{ color: "var(--foreground)" }}
                  >
                    {feature.title}
                  </h3>
                  <p
                    className="text-sm"
                    style={{ color: "var(--accent)" }}
                  >
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2
            className="mb-8 text-center text-2xl font-semibold"
            style={{ color: "var(--foreground)" }}
          >
            Frequently Asked Questions
          </h2>
          <div className="mx-auto max-w-3xl space-y-4">
            {[
              {
                q: "What are tokens?",
                a: "Tokens are the units we use to measure AI usage. Each AI interaction (prompts, insights, suggestions) uses tokens. Longer conversations use more tokens.",
              },
              {
                q: "What happens when I run out of tokens?",
                a: "On Starter, AI features pause until your monthly reset. On paid plans, you can buy token packs or enable overage billing to keep using AI.",
              },
              {
                q: "Can I change plans anytime?",
                a: "Yes! Upgrade anytime and your new plan starts immediately. Downgrade at the end of your billing cycle.",
              },
              {
                q: "Do unused tokens roll over?",
                a: "Monthly token allocations reset each billing cycle. Purchased token packs do not expire.",
              },
            ].map((faq, index) => (
              <div
                key={index}
                className="rounded-xl p-5"
                style={{
                  background: "var(--background)",
                  boxShadow: "var(--neu-shadow)",
                }}
              >
                <h4
                  className="mb-2 font-medium"
                  style={{ color: "var(--foreground)" }}
                >
                  {faq.q}
                </h4>
                <p
                  className="text-sm"
                  style={{ color: "var(--accent)" }}
                >
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
