import { NextResponse } from "next/server";
import { stackServerApp } from "@/stack";
import { getOrCreateUser } from "@/lib/utils/user";
import {
  getOrCreateSubscription,
  getOrCreateTokenUsage,
  calculateUsageStats,
} from "@/lib/billing/helpers";
import { checkRateLimit } from "@/lib/rate-limit";

// GET /api/billing/usage - Get current token usage
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

    return NextResponse.json({ usage: stats });
  } catch (error) {
    console.error("Error fetching usage:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage" },
      { status: 500 }
    );
  }
}
