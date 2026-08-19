import { prisma } from "../../database/prisma.js";

export async function findLinkForAnalytics(linkId:number, userId:number) {
    return prisma.link.findFirst({
    where: { id: linkId, userId },
    select: { id: true, totalClicks: true },
  });
}