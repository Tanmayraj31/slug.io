import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../database/prisma.js";

export interface ClickData {
  referrer: string | null;
  userAgent: string | null;
  browser: string | null;
  operatingSystem: string | null;
  deviceType: string | null;
}

export async function findLinkByShortCode(
  shortCode: string
): Promise<Prisma.LinkModel | null> {
  return prisma.link.findFirst({ where: { shortCode } });
}

export async function recordClick(
  tx: Prisma.TransactionClient,
  linkId: number,
  data: ClickData
): Promise<void> {
  await tx.clickEvent.create({
    data: {
      linkId,
      referrer: data.referrer,
      userAgent: data.userAgent,
      browser: data.browser,
      operatingSystem: data.operatingSystem,
      deviceType: data.deviceType,
    },
  });

  await tx.link.update({
    where: { id: linkId },
    data: { totalClicks: { increment: 1 } },
  });
}
