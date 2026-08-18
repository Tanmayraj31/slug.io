import { Router } from "express";
import { redirectController } from "./redirect.controller.js";

const redirectRouter = Router();

redirectRouter.get("/:shortCode", redirectController);

export default redirectRouter;
