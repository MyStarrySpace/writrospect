import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack";
import prisma from "@/lib/prisma";
import stripe from "@/lib/stripe";
import { getOrCreateUser } from "@/lib/utils/user";
import { getOrCreateSubscription } from "@/lib/billing/helpers";
import { TOKEN_PACKS, getTokenPack } from "@/lib/billing/token-packs";
import { checkRateLimit } from "@/lib/rate-limit";

// GET /api/billing/token-packs - Get available token packs
export async function GET() {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimited = await checkRateLimit(user.id, "billing-read");
    if (rateLimited) return rateLimited;

    // Return packs without stripePriceId to the client
    const packs = TOKEN_PACKS.map(({ stripePriceId: _, ...pack }) => pack);
    return NextResponse.json({ packs });
  } catch (error) {
    console.error("Error fetching token packs:", error);
    return NextResponse.json(
      { error: "Failed to fetch token packs" },
      { status: 500 }
    );
  }
}

// POST /api/billing/token-packs - Purchase a token pack via Stripe Checkout
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

    // Only paid plans can buy token packs
    if (subscription.tier === "starter") {
      return NextResponse.json(
        { error: "Upgrade to a paid plan to purchase token packs" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { packId } = body;

    if (!packId) {
      return NextResponse.json(
        { error: "Missing pack ID" },
        { status: 400 }
      );
    }

    const pack = getTokenPack(packId);
    if (!pack || !pack.stripePriceId) {
      return NextResponse.json(
        { error: "Invalid pack ID or pack not configured" },
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

    // Create pending purchase record
    const purchase = await prisma.tokenPurchase.create({
      data: {
        subscriptionId: subscription.id,
        tokenAmount: pack.tokens,
        priceInCents: pack.priceInCents,
        packType: pack.id.replace("pack-", ""),
        status: "pending",
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3434";

    // Create Stripe Checkout session for one-time payment
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "payment",
      line_items: [{ price: pack.stripePriceId, quantity: 1 }],
      success_url: `${appUrl}/settings/billing?pack_success=true`,
      cancel_url: `${appUrl}/settings/billing`,
      metadata: {
        userId: dbUser.id,
        subscriptionId: subscription.id,
        purchaseId: purchase.id,
        packId: pack.id,
        tokenAmount: String(pack.tokens),
      },
    });

    // Store session ID on the purchase
    await prisma.tokenPurchase.update({
      where: { id: purchase.id },
      data: { stripeSessionId: session.id },
    });

    return NextResponse.json({
      checkoutUrl: session.url,
    });
  } catch (error) {
    console.error("Error creating token pack checkout:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
