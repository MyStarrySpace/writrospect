import { NextResponse } from "next/server";
import { stackServerApp } from "@/stack";
import { getMockSubscriptionWithUsage, type UsageScenario } from "@/lib/billing/mock-data";

// GET /api/billing/usage - Get current token usage
export async function GET() {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Phase 1: Return mock data
    // Use user ID to deterministically pick a usage scenario
    const userIdHash = user.id.charCodeAt(0) % 5;
    const scenarios: UsageScenario[] = ["low", "medium", "warning", "critical", "over"];
    const scenario = scenarios[userIdHash];

    const subscription = getMockSubscriptionWithUsage("starter", scenario);

    return NextResponse.json({ usage: subscription.usage });
  } catch (error) {
    console.error("Error fetching usage:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage" },
      { status: 500 }
    );
  }
}
