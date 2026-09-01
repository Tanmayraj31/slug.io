import { Router } from "express";
import {
  loginController,
  logoutController,
  meController,
  refreshController,
  registerController,
} from "./auth.controller.js";
import { requireAuth } from "./auth.middleware.js";
import { apiRateLimiter, authRateLimiter } from "../../common/security/rate-limit.js";

const authRouter = Router();

authRouter.post("/register", authRateLimiter, registerController);
authRouter.post("/login", authRateLimiter, loginController);
authRouter.post("/refresh", authRateLimiter, refreshController);
authRouter.post("/logout", apiRateLimiter, logoutController);
authRouter.get("/me", requireAuth, apiRateLimiter, meController);

export default authRouter;
