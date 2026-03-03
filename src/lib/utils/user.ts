import prisma from "@/lib/prisma";
import { TIERS } from "@/lib/billing/tiers";

export async function getOrCreateUser(stackUserId: string, email: string) {
  let user = await prisma.user.findUnique({
    where: { stackUserId },
    include: {
      context: true,
      successModel: true,
      preferences: true,
    },
  });

  if (!user) {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    user = await prisma.user.create({
      data: {
        stackUserId,
        email,
        context: {
          create: {
            about: "",
            lifeCircumstances: "",
            knownFactors: [],
            suspectedFactors: [],
            resourceConstraints: [],
            workingConditions: "",
            failurePatterns: [],
          },
        },
        successModel: {
          create: {
            complexityPreference: "adaptive",
            completionConditions: [],
            failureConditions: [],
          },
        },
        preferences: {
          create: {
            interactionMode: "balanced",
            interestTracking: true,
            likes: [],
            dislikes: [],
            topicsTheyShare: [],
          },
        },
        subscription: {
          create: {
            tier: "starter",
            status: "active",
            monthlyTokenAllocation: TIERS.starter.monthlyTokens,
            currentPeriodStart: periodStart,
            currentPeriodEnd: periodEnd,
          },
        },
      },
      include: {
        context: true,
        successModel: true,
        preferences: true,
      },
    });
  }

  return user;
}
