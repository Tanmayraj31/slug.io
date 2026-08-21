import { ApiError } from "../../common/errors/app.error.js";
import { resolveActivePlan } from "../subscriptions/subscriptions.service.js";
import {
  findLinkForAnalytics,
  aggregateClicksOverTime,
  aggregateByField,
} from "./analytics.repository.js";
import type { AnalyticsResponseDto, DetailedAnalyticsDto } from "./analytics.types.js";

const RETENTION_DAYS = 90;

export async function getLinkAnalytics(
  linkId: number,
  userId: number,
): Promise<AnalyticsResponseDto> {
  const link = await findLinkForAnalytics(linkId, userId);

  if (!link) {
    throw new ApiError(404, "LINK_NOT_FOUND", "Link not found.");
  }

  const plan = await resolveActivePlan(userId);

  if (!plan.allowsDetailedAnalytics) {
    return { totalClicks: link.totalClicks, detailed: null };
  }

  const since = new Date();
  since.setDate(since.getDate() - RETENTION_DAYS);

  const [clicksOverTime, referrers, browsers, operatingSystems, deviceTypes, countries] =
    await Promise.all([
      aggregateClicksOverTime(link.id, since),
      aggregateByField(link.id, since, "referrer"),
      aggregateByField(link.id, since, "browser"),
      aggregateByField(link.id, since, "operatingSystem"),
      aggregateByField(link.id, since, "deviceType"),
      aggregateByField(link.id, since, "countryCode"),
    ]);

  const detailed: DetailedAnalyticsDto = {
    clicksOverTime,
    referrers: referrers.map((r) => ({ referrer: r.label, clicks: r.clicks })),
    browsers: browsers.map((b) => ({ browser: b.label, clicks: b.clicks })),
    operatingSystems: operatingSystems.map((o) => ({ operatingSystem: o.label, clicks: o.clicks })),
    deviceTypes: deviceTypes.map((d) => ({ deviceType: d.label, clicks: d.clicks })),
    countries: countries.map((c) => ({ countryCode: c.label, clicks: c.clicks })),
  };

  return { totalClicks: link.totalClicks, detailed };
}