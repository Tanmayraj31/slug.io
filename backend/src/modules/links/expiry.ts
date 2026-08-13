import { ApiError } from "../../common/errors/app.error.js";
import { PlanType } from "../../generated/prisma/client.js";
import type { ResolvedPlan } from "../subscriptions/subscriptions.types.js";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function resolveExpiry(
  requested: string | undefined,
  plan: ResolvedPlan,
  now: Date
): Date {
  if (requested !== undefined) {
    if (plan.type === PlanType.FREE) {
      throw new ApiError(
        403,
        "FEATURE_NOT_AVAILABLE",
        "Custom expiry is not available on the Free plan."
      );
    }

    const parsed = new Date(requested);
    if (Number.isNaN(parsed.getTime()) || parsed <= now) {
      throw new ApiError(
        400,
        "VALIDATION_ERROR",
        "expiresAt must be a valid future date."
      );
    }

    const maxDays = plan.maxExpiryDays;
    if (maxDays === null) {
      throw new ApiError(500, "PLAN_NOT_CONFIGURED", "The plan has no maximum expiry configured.");
    }

    const maxExpiry = new Date(now.getTime() + maxDays * MS_PER_DAY);
    if (parsed > maxExpiry) {
      throw new ApiError(
        403,
        "PLAN_LIMIT_REACHED",
        `Expiry cannot exceed ${maxDays} days from now.`
      );
    }

    return parsed;
  }

  const maxDays = plan.maxExpiryDays;
  if (maxDays === null) {
    throw new ApiError(500, "PLAN_NOT_CONFIGURED", "The plan has no maximum expiry configured.");
  }

  return new Date(now.getTime() + maxDays * MS_PER_DAY);
}
