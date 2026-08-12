import { Prisma, LinkStatus } from "../../generated/prisma/client.js";
import { prisma } from "../../database/prisma.js";
import { generateShortCode } from "./short-code.js";

export interface CreateLinkData {
  userId: number;
  originalUrl: string;
  isCustom: boolean;
}

const MAX_CODE_ATTEMPTS = 5;

export async function createLinkWithRetry(
  data: CreateLinkData
): Promise<Prisma.LinkModel> {
  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
    try {
      const result = await prisma.link.create({
        data: {
          userId: data.userId,
          originalUrl: data.originalUrl,
          shortCode: generateShortCode(),
          isCustom: data.isCustom,
          status: LinkStatus.ACTIVE,
        },
      });
      return result;
    } catch (error) {
      // Only retry on a short_code unique violation; let any other error propagate.
      const isCodeCollision =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002" &&
        Array.isArray(error.meta?.target) &&
        error.meta.target.includes("short_code");

      if (!isCodeCollision) throw error;
    }
  }

  throw new Error("Failed to generate a unique short code.");
}
