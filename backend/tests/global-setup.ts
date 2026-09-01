import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import dotenv from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PlanType, PrismaClient } from "../src/generated/prisma/client.js";

dotenv.config({ path: ".env.test", override: true });

const databaseUrl = (() => {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL is required to run tests.");
  }

  return url;
})();

async function createTestDatabaseIfMissing(): Promise<void> {
  const parsed = new URL(databaseUrl);
  const databaseName = parsed.pathname.slice(1);
  const maintenanceUrl = new URL(databaseUrl);
  maintenanceUrl.pathname = "/postgres";
  maintenanceUrl.search = "";

  const { default: pg } = await import("pg");
  const pool = new pg.Pool({ connectionString: maintenanceUrl.toString() });
  try {
    const existing = await pool.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [databaseName]
    );
    if (existing.rowCount === 0) {
      await pool.query(`CREATE DATABASE "${databaseName}"`);
    }
  } finally {
    await pool.end();
  }
}

function runMigrations(): void {
  const prismaCli = resolve(process.cwd(), "node_modules/prisma/build/index.js");
  execFileSync(process.execPath, [prismaCli, "migrate", "deploy"], {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
  });
}

async function seedPlans(): Promise<void> {
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

  try {
    await prisma.$transaction(
      plans.map((plan) =>
        prisma.plan.upsert({
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
    );
  } finally {
    await prisma.$disconnect();
  }
}

export default async function globalSetup(): Promise<() => Promise<void>> {
  await createTestDatabaseIfMissing();
  runMigrations();
  await seedPlans();
  return async () => {};
}