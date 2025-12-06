import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neon } from "@neondatabase/serverless";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // Use Neon serverless adapter in production (Vercel)
  if (process.env.VERCEL) {
    const sql = neon(process.env.DATABASE_URL!);
    const adapter = new PrismaNeon(sql);
    return new PrismaClient({ adapter });
  }

  // Use standard connection for local development
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
