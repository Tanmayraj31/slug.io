import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { apiRateLimiter } from "../../common/security/rate-limit.js";
import { createLinkController, deleteLinkController, getLinkByIdController, listLinksController, updateLinkStatusController } from "./links.controller.js";
import { getLinkAnalyticsController } from "../analytics/analytics.controller.js";
const linksRouter = Router();

linksRouter.post("/", requireAuth, apiRateLimiter, createLinkController);
linksRouter.get("/", requireAuth, apiRateLimiter, listLinksController);
linksRouter.get("/:id", requireAuth, apiRateLimiter, getLinkByIdController);
linksRouter.patch("/:id/status", requireAuth, apiRateLimiter, updateLinkStatusController);
linksRouter.delete("/:id", requireAuth, apiRateLimiter, deleteLinkController);
linksRouter.get("/:id/analytics", requireAuth, apiRateLimiter, getLinkAnalyticsController);
export default linksRouter;
