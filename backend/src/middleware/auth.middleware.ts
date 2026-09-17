import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/environment.js";

export interface AuthRequest extends Request { userId?: string }

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ message: "Authentication required" });
  try {
    req.userId = (jwt.verify(token, env.jwtSecret) as { userId: string }).userId;
    next();
  } catch { return res.status(401).json({ message: "Invalid or expired token" }); }
};
