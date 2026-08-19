import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { createLinkController, deleteLinkController, getLinkByIdController, listLinksController, updateLinkStatusController } from "./links.controller.js";
import { getLinkAnalyticsController } from "../analytics/analytics.controller.js";
const linksRouter = Router();

linksRouter.post("/", requireAuth, createLinkController);
linksRouter.get("/", requireAuth, listLinksController);
linksRouter.get("/:id", requireAuth, getLinkByIdController);
linksRouter.patch("/:id/status", requireAuth, updateLinkStatusController);
linksRouter.delete("/:id", requireAuth, deleteLinkController);
linksRouter.get("/:id/analytics", requireAuth, getLinkAnalyticsController);
export default linksRouter;
