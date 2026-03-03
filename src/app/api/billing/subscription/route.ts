import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack";
import prisma from "@/lib/prisma";
import stripe from "@/lib/stripe";
import { getOrCreateUser } from "@/lib/utils/user";
import {
  getOrCreateSubscription,
  getOrCreateTokenUsage,
  calculateUsageStats,
} from "@/lib/billing/helpers";
import { getStripePriceId, TIERS } from "@/lib/billing/tiers";
import { checkRateLimit } from "@/lib/rate-limit";
import type { SubscriptionTier, BillingCycle } from "@/lib/types/billing";

// GET /api/billing/subscription - Get current subscription with usage
export async function GET() {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimited = await checkRateLimit(user.id, "billing-read");
    if (rateLimited) return rateLimited;

    const dbUser = await getOrCreateUser(user.id, user.primaryEmail || "");
    const subscription = await getOrCreateSubscription(dbUser.id);

    const periodStart =
      subscription.currentPeriodStart ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const periodEnd =
      subscription.currentPeriodEnd ?? new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59);

    const usage = await getOrCreateTokenUsage(
      subscription.id,
      periodStart,
      periodEnd,
      subscription.monthlyTokenAllocation
    );

    const stats = calculateUsageStats(subscription, usage);

    return NextResponse.json({
      subscription: {
        tier: subscription.tier,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        trialEndsAt: subscription.trialEndsAt,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        monthlyTokenAllocation: subscription.monthlyTokenAllocation,
        overageEnabled: subscription.overageEnabled,
        overageRatePerToken: subscription.overageRatePerToken
          ? Number(subscription.overageRatePerToken)
          : null,
        usage: stats,
      },
    });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}

// POST /api/billing/subscription - Create Stripe Checkout Session for upgrade
export async function POST(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimited = await checkRateLimit(user.id, "billing-mutation");
    if (rateLimited) return rateLimited;

    const dbUser = await getOrCreateUser(user.id, user.primaryEmail || "");
    const subscription = await getOrCreateSubscription(dbUser.id);

    const body = await request.json();
    const { tier, billingCycle } = body as {
      tier: SubscriptionTier;
      billingCycle: BillingCycle;
    };

    const validTiers: SubscriptionTier[] = ["growth", "team"];
    const validCycles: BillingCycle[] = ["monthly", "annual"];

    if (!tier || !billingCycle || !validTiers.includes(tier) || !validCycles.includes(billingCycle)) {
      return NextResponse.json(
        { error: "Invalid tier or billing cycle" },
        { status: 400 }
      );
    }

    const stripePriceId = getStripePriceId(tier, billingCycle);
    if (!stripePriceId) {
      return NextResponse.json(
        { error: "Stripe price not configured for this plan" },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    let stripeCustomerId = subscription.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.primaryEmail || undefined,
        metadata: { userId: dbUser.id },
      });
      stripeCustomerId = customer.id;

      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { stripeCustomerId },
      });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3434";

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "subscription",
      line_items: [{ price: stripePriceId, quantity: 1 }],
      success_url: `${appUrl}/settings/billing?checkout_success=true&tier=${tier}`,
      cancel_url: `${appUrl}/settings/billing`,
      metadata: {
        userId: dbUser.id,
        subscriptionId: subscription.id,
        tier,
        billingCycle,
      },
    });

    return NextResponse.json({
      checkoutSession: {
        url: session.url,
        sessionId: session.id,
      },
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

// PATCH /api/billing/subscription - Update subscription settings
export async function PATCH(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimited = await checkRateLimit(user.id, "billing-mutation");
    if (rateLimited) return rateLimited;

    const dbUser = await getOrCreateUser(user.id, user.primaryEmail || "");
    const subscription = await getOrCreateSubscription(dbUser.id);

    const body = await request.json();
    const { overageEnabled } = body;

    if (typeof overageEnabled === "boolean") {
      if (overageEnabled && subscription.tier === "starter") {
        return NextResponse.json(
          { error: "Overage billing is not available on the Starter plan" },
          { status: 403 }
        );
      }
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { overageEnabled },
      });
    }

    return NextResponse.json({
      success: true,
      overageEnabled: overageEnabled ?? subscription.overageEnabled,
    });
  } catch (error) {
    console.error("Error updating subscription:", error);
    return NextResponse.json(
      { error: "Failed to update subscription" },
      { status: 500 }
    );
  }
}

// DELETE /api/billing/subscription - Cancel subscription at period end
export async function DELETE() {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimited = await checkRateLimit(user.id, "billing-mutation");
    if (rateLimited) return rateLimited;

    const dbUser = await getOrCreateUser(user.id, user.primaryEmail || "");
    const subscription = await getOrCreateSubscription(dbUser.id);

    if (!subscription.stripeSubscriptionId) {
      return NextResponse.json(
        { error: "No active Stripe subscription" },
        { status: 400 }
      );
    }

    // Cancel at period end (don't immediately terminate)
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { cancelAtPeriodEnd: true },
    });

    return NextResponse.json({ success: true, cancelAtPeriodEnd: true });
  } catch (error) {
    console.error("Error canceling subscription:", error);
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}
