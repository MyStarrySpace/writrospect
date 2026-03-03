import { NextResponse } from "next/server";
import { stackServerApp } from "@/stack";
import stripe from "@/lib/stripe";
import { getOrCreateUser } from "@/lib/utils/user";
import { getOrCreateSubscription } from "@/lib/billing/helpers";
import { checkRateLimit } from "@/lib/rate-limit";

// POST /api/billing/portal - Create Stripe Customer Portal session
export async function POST() {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimited = await checkRateLimit(user.id, "billing-mutation");
    if (rateLimited) return rateLimited;

    const dbUser = await getOrCreateUser(user.id, user.primaryEmail || "");
    const subscription = await getOrCreateSubscription(dbUser.id);

    if (!subscription.stripeCustomerId) {
      return NextResponse.json(
        { error: "No billing account found. Please subscribe to a plan first." },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3434";

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${appUrl}/settings/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error creating portal session:", error);
    return NextResponse.json(
      { error: "Failed to create billing portal session" },
      { status: 500 }
    );
  }
}
