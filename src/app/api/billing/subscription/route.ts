import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack";
import { getMockSubscriptionWithUsage, type UsageScenario } from "@/lib/billing/mock-data";
import type { SubscriptionTier, BillingCycle } from "@/lib/types/billing";

// GET /api/billing/subscription - Get current subscription with usage
export async function GET() {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Phase 1: Return mock data
    // In Phase 2, this will fetch from database/Stripe
    // For demo purposes, use user ID to deterministically pick a scenario
    const userIdHash = user.id.charCodeAt(0) % 5;
    const scenarios: UsageScenario[] = ["low", "medium", "warning", "critical", "over"];
    const scenario = scenarios[userIdHash];

    // Default to starter tier for Phase 1
    const subscription = getMockSubscriptionWithUsage("starter", scenario);

    return NextResponse.json({ subscription });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}

// POST /api/billing/subscription - Create/update subscription (upgrade intent)
export async function POST(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { tier, billingCycle } = body as {
      tier: SubscriptionTier;
      billingCycle: BillingCycle;
    };

    if (!tier || !billingCycle) {
      return NextResponse.json(
        { error: "Missing tier or billing cycle" },
        { status: 400 }
      );
    }

    // Phase 1: Return mock checkout session
    // In Phase 2, this will create a Stripe checkout session
    const mockCheckoutSession = {
      url: `/settings/billing?upgrade_success=true&tier=${tier}`,
      sessionId: `mock_session_${Date.now()}`,
    };

    return NextResponse.json({
      checkoutSession: mockCheckoutSession,
    });
  } catch (error) {
    console.error("Error creating subscription:", error);
    return NextResponse.json(
      { error: "Failed to create subscription" },
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

    const body = await request.json();
    const { overageEnabled } = body;

    // Phase 1: Return success with mock data
    // In Phase 2, this will update the database
    return NextResponse.json({
      success: true,
      overageEnabled: overageEnabled ?? false,
    });
  } catch (error) {
    console.error("Error updating subscription:", error);
    return NextResponse.json(
      { error: "Failed to update subscription" },
      { status: 500 }
    );
  }
}
