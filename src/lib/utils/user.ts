import prisma from "@/lib/prisma";

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
