import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/auth.middleware.js";
import {
  getAdminStats,
  getUsers,
  getUserDetails,
  updateUserRole,
  updateUserStatus,
  getResumeAnalytics,
  getInterviewAnalytics,
  getCodingAnalytics,
  getRoadmapAnalytics,
  getJobAnalytics,
  getGithubAnalytics,
  getPlatformActivity,
  getPlatformSettings,
  updatePlatformSettings,
} from "../controllers/admin.controller.js";

export const adminRouter = Router();

// All routes are strictly protected by JWT authentication and ADMIN role check
adminRouter.use(authenticate, requireAdmin);

// Dashboard overview stats & charts
adminRouter.get("/stats", getAdminStats);

// User management
adminRouter.get("/users", getUsers);
adminRouter.get("/users/:id", getUserDetails);
adminRouter.patch("/users/:id/role", updateUserRole);
adminRouter.patch("/users/:id/status", updateUserStatus);

// Specialized analytics modules
adminRouter.get("/resumes", getResumeAnalytics);
adminRouter.get("/interviews", getInterviewAnalytics);
adminRouter.get("/coding", getCodingAnalytics);
adminRouter.get("/roadmaps", getRoadmapAnalytics);
adminRouter.get("/jobs", getJobAnalytics);
adminRouter.get("/github", getGithubAnalytics);

// Platform activity stream
adminRouter.get("/activity", getPlatformActivity);

// Settings
adminRouter.get("/settings", getPlatformSettings);
adminRouter.put("/settings", updatePlatformSettings);
