import { Router } from "express";
import { login, me, register, updateProfile } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

export const authRouter = Router();
authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.get("/me", authenticate, me);
authRouter.get("/profile", authenticate, me);
authRouter.put("/profile", authenticate, updateProfile);

