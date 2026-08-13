import type { Prisma } from "../../generated/prisma/client.js";

export async function getDailyUsageCount(tx:Prisma.TransactionClient, userId: number, usageDate: Date): Promise<number> {
    const counter = await tx.usageCounter.findUnique({
        where: {userId_usageDate: {userId, usageDate}},
        select:{linksCreated:true}
    });
    return counter?.linksCreated ?? 0;
}

export async function incrementDailyUsage(tx:Prisma.TransactionClient, userId: number, usageDate: Date):Promise<void> {
    await tx.usageCounter.upsert({
        where: {userId_usageDate: {userId, usageDate}},
        create:{
            userId,
            usageDate,
            linksCreated: 1,
        },
        update:{
            linksCreated:{increment: 1}
        },
    });
}