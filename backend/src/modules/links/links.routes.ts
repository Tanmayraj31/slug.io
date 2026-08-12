import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { createLinkController } from "./links.controller.js";

const linksRouter = Router();

linksRouter.post("/", requireAuth, createLinkController);

export default linksRouter;
