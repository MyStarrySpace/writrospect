import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack";
import { TOKEN_PACKS, getTokenPack } from "@/lib/billing/token-packs";

// GET /api/billing/token-packs - Get available token packs
export async function GET() {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ packs: TOKEN_PACKS });
  } catch (error) {
    console.error("Error fetching token packs:", error);
    return NextResponse.json(
      { error: "Failed to fetch token packs" },
      { status: 500 }
    );
  }
}

// POST /api/billing/token-packs - Purchase a token pack
export async function POST(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    if (!pack) {
      return NextResponse.json(
        { error: "Invalid pack ID" },
        { status: 400 }
      );
    }

    // Phase 1: Return mock purchase result
    // In Phase 2, this will create a Stripe payment intent
    const mockPurchase = {
      id: `purchase_${Date.now()}`,
      packId: pack.id,
      tokens: pack.tokens,
      priceInCents: pack.priceInCents,
      status: "completed",
      purchasedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      purchase: mockPurchase,
    });
  } catch (error) {
    console.error("Error purchasing token pack:", error);
    return NextResponse.json(
      { error: "Failed to purchase token pack" },
      { status: 500 }
    );
  }
}
