import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, PlanType } from "../src/generated/prisma/client.js";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to seed plans.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const plans = [
  {
    type: PlanType.FREE,
    dailyLinkLimit: 10,
    activeLinkLimit: 30,
    maxExpiryDays: 7,
    allowsCustomAlias: false,
    allowsDetailedAnalytics: false,
  },
  {
    type: PlanType.PRO,
    dailyLinkLimit: 500,
    activeLinkLimit: 10_000,
    maxExpiryDays: 365,
    allowsCustomAlias: true,
    allowsDetailedAnalytics: true,
  },
] as const;

async function main() {
  await prisma.$transaction(
    plans.map((plan)=> prisma.plan.upsert({
      where: { type: plan.type },
        create: plan,
        update: {
          dailyLinkLimit: plan.dailyLinkLimit,
          activeLinkLimit: plan.activeLinkLimit,
          maxExpiryDays: plan.maxExpiryDays,
          allowsCustomAlias: plan.allowsCustomAlias,
          allowsDetailedAnalytics: plan.allowsDetailedAnalytics,
        },
    })
  )
  )
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
