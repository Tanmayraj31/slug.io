import { prisma } from "../../src/database/prisma.js";

export async function clearDatabase(): Promise<void> {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "users", "subscriptions", "links", "click_events", "usage_counters", "refresh_tokens" RESTART IDENTITY CASCADE'
  );
}