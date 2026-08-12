import type { PlanType } from "../../generated/prisma/client.js";

export interface PlanLimits {
  dailyLinkLimit: number;
  activeLinkLimit: number;
  maxExpiryDays: number | null;
  allowsCustomAlias: boolean;
  allowsDetailedAnalytics: boolean;
}

export interface ResolvedPlan extends PlanLimits {
  type: PlanType;
}
