import { prisma } from "../../database/prisma.js";

export async function findLinkForAnalytics(linkId: number, userId: number) {
  return prisma.link.findFirst({
    where: { id: linkId, userId },
    select: { id: true, totalClicks: true },
  });
}

export async function aggregateClicksOverTime(linkId: number, since: Date) {
  const rows = await prisma.clickEvent.findMany({
    where: { linkId, clickedAt: { gte: since } },
    select: { clickedAt: true },
    orderBy: { clickedAt: "asc" },
  });

  const map = new Map<string, number>();
  for (const row of rows) {
    const date = row.clickedAt.toISOString().slice(0, 10);
    map.set(date, (map.get(date) ?? 0) + 1);
  }

  return Array.from(map, ([date, clicks]) => ({ date, clicks }));
}

export async function aggregateByField(
  linkId: number,
  since: Date,
  field: "referrer" | "browser" | "operatingSystem" | "deviceType" | "countryCode",
) {
  const rows = await prisma.clickEvent.groupBy({
    by: [field],
    where: { linkId, clickedAt: { gte: since } },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });

  return rows.map((row) => ({
    label: row[field] as string | null,
    clicks: row._count.id,
  }));
}