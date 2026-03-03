import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import stripe from "@/lib/stripe";
import prisma from "@/lib/prisma";
import { TIERS } from "@/lib/billing/tiers";
import type { SubscriptionTier } from "@/lib/types/billing";

// Disable Next.js body parsing — we need the raw body for signature verification
export const dynamic = "force-dynamic";

async function getRawBody(request: NextRequest): Promise<Buffer> {
  const arrayBuffer = await request.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function POST(request: NextRequest) {
  const rawBody = await getRawBody(request);
  const signature = request.headers.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Idempotency check — skip events we've already processed
  const existing = await prisma.stripeEvent.findUnique({
    where: { id: event.id },
  });
  if (existing) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        break;
    }

    // Record event as processed
    await prisma.stripeEvent.create({
      data: { id: event.id, type: event.type },
    });
  } catch (error) {
    console.error(`Error handling webhook event ${event.type}:`, error);
    // Return 200 to prevent Stripe retries on handler errors
    // The event was NOT recorded, so a retry will re-attempt processing
    return NextResponse.json({ received: true, error: "Handler failed" });
  }

  return NextResponse.json({ received: true });
}

/**
 * Compute subscription period dates from Stripe subscription.
 * Since `current_period_start/end` was removed in recent API versions,
 * we derive period from `billing_cycle_anchor` and `start_date`.
 */
function getSubscriptionPeriodDates(sub: Stripe.Subscription): { periodStart: Date; periodEnd: Date } {
  // Use the latest invoice's period if available
  const invoice = sub.latest_invoice;
  if (invoice && typeof invoice !== "string" && invoice.period_start && invoice.period_end) {
    return {
      periodStart: new Date(invoice.period_start * 1000),
      periodEnd: new Date(invoice.period_end * 1000),
    };
  }

  // Fallback: compute from billing_cycle_anchor
  const anchor = new Date(sub.billing_cycle_anchor * 1000);
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), anchor.getDate());
  if (periodStart > now) {
    periodStart.setMonth(periodStart.getMonth() - 1);
  }
  const periodEnd = new Date(periodStart);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  return { periodStart, periodEnd };
}

/**
 * Handle checkout.session.completed
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const metadata = session.metadata || {};

  if (session.mode === "subscription") {
    const { subscriptionId, tier, billingCycle } = metadata;
    if (!subscriptionId || !tier) return;

    const stripeSubscription = session.subscription as string;
    const sub = await stripe.subscriptions.retrieve(stripeSubscription, {
      expand: ["latest_invoice"],
    });

    const validTiers = ["starter", "growth", "team"];
    if (!validTiers.includes(tier)) return;
    const tierDef = TIERS[tier as SubscriptionTier];

    const { periodStart, periodEnd } = getSubscriptionPeriodDates(sub);

    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        stripeSubscriptionId: stripeSubscription,
        tier: tier as SubscriptionTier,
        status: "active",
        billingCycle: billingCycle || "monthly",
        stripePriceId: sub.items.data[0]?.price?.id || null,
        monthlyTokenAllocation: tierDef.monthlyTokens,
        overageEnabled: tier !== "starter",
        overageRatePerToken: tier === "growth" ? 0.0002 : tier === "team" ? 0.00015 : null,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
      },
    });

    // Create token usage for the new period
    const normalizedStart = new Date(periodStart);
    normalizedStart.setHours(0, 0, 0, 0);

    await prisma.tokenUsage.upsert({
      where: {
        subscriptionId_periodStart: {
          subscriptionId,
          periodStart: normalizedStart,
        },
      },
      create: {
        subscriptionId,
        periodStart: normalizedStart,
        periodEnd,
        tokensAllocated: tierDef.monthlyTokens,
      },
      update: {
        tokensAllocated: tierDef.monthlyTokens,
        periodEnd,
      },
    });
  } else if (session.mode === "payment") {
    // Token pack purchase — use DB record for token amount, not metadata
    const { purchaseId } = metadata;
    if (!purchaseId) return;

    const purchase = await prisma.tokenPurchase.findUnique({
      where: { id: purchaseId },
    });
    if (!purchase || purchase.status === "completed") return;

    const tokens = purchase.tokenAmount;
    const subscriptionId = purchase.subscriptionId;

    // Mark purchase completed
    await prisma.tokenPurchase.update({
      where: { id: purchaseId },
      data: {
        status: "completed",
        stripePaymentIntentId: session.payment_intent as string | null,
      },
    });

    // Credit tokens to current usage period
    if (subscriptionId && tokens > 0) {
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
      });

      if (subscription?.currentPeriodStart) {
        const periodStart = new Date(subscription.currentPeriodStart);
        periodStart.setHours(0, 0, 0, 0);

        await prisma.tokenUsage.updateMany({
          where: {
            subscriptionId,
            periodStart,
          },
          data: {
            tokensFromPacks: { increment: tokens },
          },
        });
      }
    }
  }
}

/**
 * Handle customer.subscription.updated
 */
async function handleSubscriptionUpdated(sub: Stripe.Subscription) {
  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: sub.id },
  });

  if (!subscription) return;

  const statusMap: Record<string, string> = {
    active: "active",
    trialing: "trialing",
    past_due: "past_due",
    canceled: "canceled",
    unpaid: "past_due",
    incomplete: "past_due",
    incomplete_expired: "expired",
    paused: "active",
  };

  const { periodStart, periodEnd } = getSubscriptionPeriodDates(sub);

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: (statusMap[sub.status] || "active") as "active" | "trialing" | "past_due" | "canceled" | "expired",
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    },
  });
}

/**
 * Handle customer.subscription.deleted — revert to starter tier
 */
async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: sub.id },
  });

  if (!subscription) return;

  const now = new Date();
  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      tier: "starter",
      status: "active",
      stripeSubscriptionId: null,
      billingCycle: null,
      stripePriceId: null,
      monthlyTokenAllocation: TIERS.starter.monthlyTokens,
      overageEnabled: false,
      overageRatePerToken: null,
      cancelAtPeriodEnd: false,
      currentPeriodStart: new Date(now.getFullYear(), now.getMonth(), 1),
      currentPeriodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
    },
  });
}

/**
 * Handle invoice.payment_succeeded — create new TokenUsage for renewed period
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  // Get the subscription ID from parent.subscription_details
  const stripeSubId = invoice.parent?.subscription_details?.subscription;
  if (!stripeSubId || typeof stripeSubId !== "string") return;

  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: stripeSubId },
  });

  if (!subscription) return;

  // Use invoice period dates
  const periodStart = new Date(invoice.period_start * 1000);
  const periodEnd = new Date(invoice.period_end * 1000);
  periodStart.setHours(0, 0, 0, 0);

  // Update subscription period
  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      status: "active",
    },
  });

  // Create or update token usage for new period
  await prisma.tokenUsage.upsert({
    where: {
      subscriptionId_periodStart: {
        subscriptionId: subscription.id,
        periodStart,
      },
    },
    create: {
      subscriptionId: subscription.id,
      periodStart,
      periodEnd,
      tokensAllocated: subscription.monthlyTokenAllocation,
    },
    update: {
      periodEnd,
      tokensAllocated: subscription.monthlyTokenAllocation,
    },
  });
}

/**
 * Handle invoice.payment_failed — mark status as past_due
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const stripeSubId = invoice.parent?.subscription_details?.subscription;
  if (!stripeSubId || typeof stripeSubId !== "string") return;

  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: stripeSubId },
    data: { status: "past_due" },
  });
}
