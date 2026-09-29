import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/environment.js";
import { User } from "../models/User.js";

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
  userStatus?: string;
  userName?: string;
  user?: any;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ message: "Authentication required" });
  try {
    const payload = jwt.verify(token, env.jwtSecret) as { userId: string; role?: string };
    req.userId = payload.userId;

    const user = await User.findByPk(payload.userId, { attributes: ["id", "role", "status"] });
    if (!user) {
      return res.status(401).json({ message: "User account no longer exists." });
    }

    if (user.status === "disabled") {
      return res.status(403).json({ message: "Account disabled. Please contact the administrator." });
    }

    req.userRole = user.role;
    req.userStatus = user.status;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.userRole !== "ADMIN") {
    return res.status(403).json({ message: "Access denied. Administrator privileges required." });
  }
  next();
};

