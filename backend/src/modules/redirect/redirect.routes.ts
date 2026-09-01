import { Router } from "express";
import { redirectController } from "./redirect.controller.js";
import { redirectRateLimiter } from "../../common/security/rate-limit.js";

const redirectRouter = Router();

redirectRouter.get("/:shortCode", redirectRateLimiter, redirectController);

export default redirectRouter;
