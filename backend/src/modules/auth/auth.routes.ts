import { Router } from "express";
import { registerController } from "./auth.controller.js";

const authRouter = Router();

authRouter.post("/register", registerController);

export default authRouter;
