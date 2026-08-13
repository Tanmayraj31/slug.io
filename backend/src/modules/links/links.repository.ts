import { Prisma, LinkStatus } from "../../generated/prisma/client.js";
import { prisma } from "../../database/prisma.js";
import { generateShortCode } from "./short-code.js";
import { getDailyUsageCount, incrementDailyUsage } from "../usage/usage.repository.js";
import type { ResolvedPlan } from "../subscriptions/subscriptions.types.js";
import { ApiError } from "../../common/errors/app.error.js";

export interface CreateLinkData {
  userId: number;
  originalUrl: string;
  isCustom: boolean;
}

export interface CreateLinkWithLimitsData extends CreateLinkData {
  plan: ResolvedPlan;
  usageDate: Date;
  expiresAt: Date;
}

const MAX_CODE_ATTEMPTS = 5;

function isShortCodeCollision(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    Array.isArray(error.meta?.target) &&
    error.meta.target.includes("short_code")
  );
}

export async function lockUserRow(tx:Prisma.TransactionClient, userId: number,): Promise<void> {
  await tx.$queryRaw`SELECT id FROM "users" WHERE id = ${userId} FOR UPDATE`;
}

export async function countActiveLinks(tx: Prisma.TransactionClient, userId: number):Promise<number>{
  return tx.link.count({
    where:{
      userId,
      status: LinkStatus.ACTIVE,
      OR:[{expiresAt:null},{expiresAt:{gt: new Date() }}]
    }
  })
}

export async function findReusableLinks(
  tx: Prisma.TransactionClient,
  userId: number,
  originalUrl: string,
  now: Date
): Promise<Prisma.LinkModel | null> {
  return tx.link.findFirst({
    where: {
      userId,
      originalUrl,
      status: LinkStatus.ACTIVE,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createLinkWithLimits(
  data: CreateLinkWithLimitsData
): Promise<Prisma.LinkModel> {
  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
    try {

      return await prisma.$transaction(async (tx)=>{
        await lockUserRow(tx, data.userId);

        const existing = await findReusableLinks(tx, data.userId, data.originalUrl, new Date());
        if (existing) return existing;

        const  usedToday = await getDailyUsageCount(tx,data.userId, data.usageDate);
        if(usedToday>= data.plan.dailyLinkLimit){
          throw new ApiError(403, "PLAN_LIMIT_REACHED","Daily link limit reached");
        }

        const activeLink = await countActiveLinks(tx, data.userId);
        if(activeLink >= data.plan.activeLinkLimit){
          throw new ApiError(403, "PLAN_LIMIT_REACHED","Active link limit reached");
        }
        const link = await tx.link.create({
          data: {
            userId: data.userId,
            originalUrl: data.originalUrl,
            shortCode: generateShortCode(),
            isCustom: data.isCustom,
            status: LinkStatus.ACTIVE,
            expiresAt: data.expiresAt,
          },
        });

        await incrementDailyUsage(tx, data.userId, data.usageDate);

        return link;
        

      })

    } catch (error) {
      // Only retry on a short_code unique violation; let any other error propagate.
      if (isShortCodeCollision(error)) continue;
      throw error;
    }
  }

  throw new Error("Failed to generate a unique short code.");
}
