import type { Response } from "express";
import { Op } from "sequelize";
import { User } from "../models/User.js";
import { AdminActivity, logPlatformActivity } from "../models/AdminActivity.js";
import { ResumeAnalysis } from "../models/ResumeAnalysis.js";
import { Roadmap } from "../models/Roadmap.js";
import { CodingAttempt } from "../models/CodingAttempt.js";
import { InterviewSessionModel } from "../models/InterviewSession.js";
import { GithubAnalysisModel } from "../models/GithubAnalysis.js";
import { JobActivity } from "../models/JobActivity.js";
import type { AuthRequest } from "../middleware/auth.middleware.js";
import { getAllUserStores, getUserStoreData } from "../services/progress.service.js";
import { DEFAULT_JOBS, getSavedJobIds } from "../services/job.service.js";

// Global platform configuration store
let platformSettings = {
  platformName: "Career Orbit",
  supportEmail: "support@careerorbit.com",
  maintenanceMode: false,
};

// GET /api/admin/stats
export const getAdminStats = async (req: AuthRequest, res: Response) => {
  try {
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { status: "active" } });

    // Real database counts
    const dbResumes = await ResumeAnalysis.count();
    const dbInterviews = await InterviewSessionModel.count();
    const dbCoding = await CodingAttempt.count();
    const dbGithub = await GithubAnalysisModel.count();
    const dbRoadmaps = await Roadmap.count();

    // Module usage counts aggregated from real database and in-memory fallback
    const userStores = getAllUserStores();
    let cacheResumes = 0;
    let cacheInterviews = 0;
    let cacheCoding = 0;
    let cacheGithub = 0;
    let cacheRoadmaps = 0;

    userStores.forEach((store) => {
      if (store.resumeAnalysis) cacheResumes++;
      if (store.githubAnalysis) cacheGithub++;
      if (store.roadmap) cacheRoadmaps++;
      cacheInterviews += store.interviewHistory?.length || 0;
      cacheCoding += store.codingHistory?.length || 0;
    });

    const resumeLogs = await AdminActivity.count({ where: { module: "resume" } });
    const interviewLogs = await AdminActivity.count({ where: { module: "interview" } });
    const codingLogs = await AdminActivity.count({ where: { module: "coding" } });
    const githubLogs = await AdminActivity.count({ where: { module: "github" } });
    const roadmapLogs = await AdminActivity.count({ where: { module: "roadmap" } });

    const resumesAnalyzed = Math.max(dbResumes, cacheResumes, resumeLogs);
    const mockInterviews = Math.max(dbInterviews, cacheInterviews, interviewLogs);
    const codingProblemsSolved = Math.max(dbCoding, cacheCoding, codingLogs);
    const githubProfilesAnalyzed = Math.max(dbGithub, cacheGithub, githubLogs);
    const roadmapsCreated = Math.max(dbRoadmaps, cacheRoadmaps, roadmapLogs);

    // Registration trend (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentUsers = await User.findAll({
      where: {
        createdAt: {
          [Op.gte]: sevenDaysAgo,
        },
      },
      attributes: ["createdAt"],
    });

    const registrationMap: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      registrationMap[key] = 0;
    }

    recentUsers.forEach((u) => {
      const dateKey = new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (registrationMap[dateKey] !== undefined) {
        registrationMap[dateKey]++;
      }
    });

    const registrationTrend = Object.entries(registrationMap).map(([date, count]) => ({
      date,
      users: count,
    }));

    // Module usage chart data
    const moduleUsage = [
      { name: "Resume", count: resumesAnalyzed },
      { name: "Interview", count: mockInterviews },
      { name: "Coding", count: codingProblemsSolved },
      { name: "Roadmap", count: roadmapsCreated },
      { name: "GitHub", count: githubProfilesAnalyzed },
    ];

    // Recent activity stream
    const recentActivity = await AdminActivity.findAll({
      order: [["created_at", "DESC"]],
      limit: 10,
    });

    return res.json({
      stats: {
        totalUsers,
        activeUsers,
        resumesAnalyzed,
        mockInterviews,
        codingProblemsSolved,
        githubProfilesAnalyzed,
        roadmapsCreated,
      },
      charts: {
        registrationTrend,
        moduleUsage,
      },
      recentActivity,
      totalUsers,
      activeUsers,
      resumesAnalyzed,
      mockInterviews,
      codingProblemsSolved,
      githubProfilesAnalyzed,
      roadmapsCreated,
      registrationTrend,
      moduleUsage,
    });
  } catch (err: any) {
    console.error("Admin stats error:", err);
    return res.status(500).json({ message: "Failed to retrieve admin stats", error: err.message });
  }
};

// GET /api/admin/users
export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const search = String(req.query.search || req.query.q || "").trim();
    const roleFilter = String(req.query.role || "ALL").toUpperCase();

    const where: any = {};

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (roleFilter === "USERS" || roleFilter === "USER") {
      where.role = "USER";
    } else if (roleFilter === "ADMINS" || roleFilter === "ADMIN") {
      where.role = "ADMIN";
    }

    const users = await User.findAll({
      where,
      attributes: ["id", "name", "email", "role", "status", "createdAt", "updatedAt", "targetRole"],
      order: [["createdAt", "DESC"]],
    });

    return res.json({
      users: users.map((u) => {
        const rawCreated = (u as any).createdAt || (u as any).created_at || (u as any).dataValues?.created_at;
        const rawUpdated = (u as any).updatedAt || (u as any).updated_at || (u as any).dataValues?.updated_at;
        
        const createdDate = rawCreated && !isNaN(new Date(rawCreated).getTime())
          ? new Date(rawCreated).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
          : "Recently";

        const lastActivity = rawUpdated && !isNaN(new Date(rawUpdated).getTime())
          ? new Date(rawUpdated).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
          : "Recently";

        return {
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          status: u.status,
          createdDate,
          lastActivity,
          targetRole: u.targetRole,
        };
      }),
    });
  } catch (err: any) {
    console.error("Get users error:", err);
    return res.status(500).json({ message: "Failed to load users", error: err.message });
  }
};

// GET /api/admin/users/:id
export const getUserDetails = async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const user = await User.findByPk(id, {
      attributes: ["id", "name", "email", "role", "status", "createdAt", "updatedAt", "targetRole", "experienceLevel"],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Query real DB records for this user
    const resumeCount = await ResumeAnalysis.count({ where: { userId: id } });
    const interviewCount = await InterviewSessionModel.count({ where: { userId: id } });
    const codingCount = await CodingAttempt.count({ where: { userId: id } });
    const roadmapRecord = await Roadmap.findOne({ where: { userId: id } });
    const githubRecord = await GithubAnalysisModel.findOne({ where: { userId: id } });
    const jobsSavedCount = await JobActivity.count({ where: { userId: id, isSaved: true } });

    // In-memory fallback overlay
    const store = getUserStoreData(id);

    let roadmapProgress = 0;
    const roadmapPhases = roadmapRecord?.phases || store?.roadmap?.phases;
    if (Array.isArray(roadmapPhases) && roadmapPhases.length > 0) {
      let total = 0;
      let completed = 0;
      roadmapPhases.forEach((p: any) => {
        const items = p.topics || p.milestones || [];
        total += items.length;
        completed += items.filter((i: any) => i.completed).length;
      });
      roadmapProgress = total > 0 ? Math.round((completed / total) * 100) : 0;
    }

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        targetRole: user.targetRole,
        experienceLevel: user.experienceLevel,
        createdDate: new Date(user.createdAt).toLocaleDateString("en-US", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        lastActivity: new Date(user.updatedAt).toLocaleDateString("en-US", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
      },
      activityMetrics: {
        resumeAnalyses: Math.max(resumeCount, store?.resumeAnalysis ? 1 : 0),
        mockInterviews: Math.max(interviewCount, store?.interviewHistory?.length || 0),
        codingProblemsSolved: Math.max(codingCount, store?.codingHistory?.length || 0),
        roadmapProgress,
        jobMatchesSaved: jobsSavedCount,
        githubAnalyses: Math.max(githubRecord ? 1 : 0, store?.githubAnalysis ? 1 : 0),
      },
    });
  } catch (err: any) {
    console.error("Get user details error:", err);
    return res.status(500).json({ message: "Failed to load user details", error: err.message });
  }
};

// PATCH /api/admin/users/:id/role
export const updateUserRole = async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const { role } = req.body;

    if (!role || !["USER", "ADMIN"].includes(role)) {
      return res.status(400).json({ message: "Role must be 'USER' or 'ADMIN'" });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.role = role;
    await user.save();

    await logPlatformActivity({
      userId: req.userId,
      userName: req.user?.name || "Admin",
      action: `Changed role of user "${user.name}" (${user.email}) to ${role}`,
      module: "admin",
    });

    return res.json({ message: `Role updated to ${role}`, user: { id: user.id, role: user.role } });
  } catch (err: any) {
    console.error("Update role error:", err);
    return res.status(500).json({ message: "Failed to update role", error: err.message });
  }
};

// PATCH /api/admin/users/:id/status
export const updateUserStatus = async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const { status } = req.body;

    if (!status || !["active", "disabled"].includes(status)) {
      return res.status(400).json({ message: "Status must be 'active' or 'disabled'" });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.status = status;
    await user.save();

    await logPlatformActivity({
      userId: req.userId,
      userName: req.user?.name || "Admin",
      action: `${status === "disabled" ? "Disabled" : "Enabled"} account of "${user.name}" (${user.email})`,
      module: "admin",
    });

    return res.json({ message: `Account status updated to ${status}`, user: { id: user.id, status: user.status } });
  } catch (err: any) {
    console.error("Update status error:", err);
    return res.status(500).json({ message: "Failed to update status", error: err.message });
  }
};

// GET /api/admin/resumes
export const getResumeAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const dbResumes = await ResumeAnalysis.findAll({ order: [["created_at", "DESC"]] });

    let totalScore = 0;
    const skillCounts: Record<string, number> = {};
    const gapCounts: Record<string, number> = {};

    dbResumes.forEach((r) => {
      if (r.atsScore) totalScore += Number(r.atsScore);
      if (Array.isArray(r.jobMatch?.matchedSkills)) {
        r.jobMatch.matchedSkills.forEach((s: string) => {
          skillCounts[s] = (skillCounts[s] || 0) + 1;
        });
      }
      if (Array.isArray(r.missingSkills)) {
        r.missingSkills.forEach((g: string) => {
          gapCounts[g] = (gapCounts[g] || 0) + 1;
        });
      }
    });

    const totalResumes = dbResumes.length;
    const averageScore = totalResumes > 0 ? Math.round(totalScore / totalResumes) : 0;

    const topSkills = Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name]) => name);

    const commonSkillGaps = Object.entries(gapCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name]) => name);

    return res.json({
      totalResumesAnalyzed: totalResumes,
      averageAtsScore: averageScore,
      topSkills,
      commonSkillGaps,
      recentResumes: dbResumes.slice(0, 5),
    });
  } catch (err: any) {
    console.error("Resume analytics error:", err);
    return res.status(500).json({ message: "Failed to load resume analytics", error: err.message });
  }
};

// GET /api/admin/interviews
export const getInterviewAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const dbSessions = await InterviewSessionModel.findAll({ order: [["created_at", "DESC"]] });

    const totalInterviews = dbSessions.length;
    const completed = dbSessions.filter((s) => s.score > 0).length;

    let sumScores = 0;
    let sumComm = 0;
    const weakAreaCounts: Record<string, number> = {};

    dbSessions.forEach((s) => {
      sumScores += s.score || 0;
      sumComm += s.communicationScore || Math.round(s.score * 0.95);
      if (Array.isArray(s.weakAreas)) {
        s.weakAreas.forEach((w) => {
          weakAreaCounts[w] = (weakAreaCounts[w] || 0) + 1;
        });
      }
    });

    const avgScore = completed > 0 ? Math.round(sumScores / completed) : 0;
    const avgCommunication = completed > 0 ? Math.round(sumComm / completed) : 0;

    const weakAreas = Object.entries(weakAreaCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([area, count]) => ({ area, count }));

    return res.json({
      totalInterviews,
      completedInterviews: completed,
      averageInterviewScore: avgScore,
      averageCommunicationScore: avgCommunication,
      commonWeakAreas: weakAreas,
      recentSessions: dbSessions.slice(0, 6),
    });
  } catch (err: any) {
    console.error("Interview analytics error:", err);
    return res.status(500).json({ message: "Failed to load interview analytics", error: err.message });
  }
};

// GET /api/admin/coding
export const getCodingAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const dbAttempts = await CodingAttempt.findAll({ order: [["created_at", "DESC"]] });

    const totalSolved = dbAttempts.filter((r) => r.passed).length;
    const totalGenerated = dbAttempts.length;

    let scoreSum = 0;
    const topicCount: Record<string, number> = {};
    const difficultyCount: Record<string, number> = { Easy: 0, Medium: 0, Hard: 0 };

    dbAttempts.forEach((r) => {
      scoreSum += r.score || 0;
      if (r.topic) {
        topicCount[r.topic] = (topicCount[r.topic] || 0) + 1;
      }
      if (r.difficulty && difficultyCount[r.difficulty] !== undefined) {
        difficultyCount[r.difficulty]++;
      }
    });

    const averageScore = dbAttempts.length > 0 ? Math.round(scoreSum / dbAttempts.length) : 0;

    const practicedTopics = Object.entries(topicCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([topic, count]) => ({ topic, count }));

    return res.json({
      totalProblemsGenerated: totalGenerated,
      problemsSolved: totalSolved,
      averageScore,
      mostPracticedTopics: practicedTopics,
      difficultyBreakdown: {
        easy: difficultyCount.Easy || 0,
        medium: difficultyCount.Medium || 0,
        hard: difficultyCount.Hard || 0,
      },
    });
  } catch (err: any) {
    console.error("Coding analytics error:", err);
    return res.status(500).json({ message: "Failed to load coding analytics", error: err.message });
  }
};

// GET /api/admin/roadmaps
export const getRoadmapAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const dbRoadmaps = await Roadmap.findAll({ order: [["updated_at", "DESC"]] });

    const roleCounts: Record<string, number> = {};
    let totalProgress = 0;

    dbRoadmaps.forEach((r) => {
      if (r.targetRole) {
        roleCounts[r.targetRole] = (roleCounts[r.targetRole] || 0) + 1;
      }
      if (Array.isArray(r.phases)) {
        let comp = 0;
        let tot = 0;
        r.phases.forEach((p: any) => {
          const items = p.topics || p.milestones || [];
          tot += items.length;
          comp += items.filter((i: any) => i.completed).length;
        });
        if (tot > 0) totalProgress += (comp / tot) * 100;
      }
    });

    const totalRoadmaps = dbRoadmaps.length;
    const avgProgress = totalRoadmaps > 0 ? Math.round(totalProgress / totalRoadmaps) : 0;

    const popularRoles = Object.entries(roleCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([role, count]) => ({ role, count }));

    return res.json({
      totalRoadmapsCreated: totalRoadmaps,
      averageCompletion: avgProgress,
      mostPopularTargetRoles: popularRoles,
      averageRoadmapProgress: avgProgress,
    });
  } catch (err: any) {
    console.error("Roadmap analytics error:", err);
    return res.status(500).json({ message: "Failed to load roadmap analytics", error: err.message });
  }
};

// GET /api/admin/jobs
export const getJobAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const dbJobs = await JobActivity.findAll({ order: [["created_at", "DESC"]] });
    const savedJobsCount = dbJobs.filter((j) => j.isSaved).length;

    const locationCount: Record<string, number> = {};
    const roleCount: Record<string, number> = {};

    dbJobs.forEach((job) => {
      if (job.location) {
        const loc = job.location.split(",")[0].trim();
        locationCount[loc] = (locationCount[loc] || 0) + 1;
      }
      if (job.role) {
        roleCount[job.role] = (roleCount[job.role] || 0) + 1;
      }
    });

    // If few job searches yet, also aggregate locations from available platform listings
    if (Object.keys(locationCount).length === 0) {
      DEFAULT_JOBS.forEach((job) => {
        const loc = job.location.split(",")[0].trim();
        locationCount[loc] = (locationCount[loc] || 0) + 1;
        roleCount[job.title] = (roleCount[job.title] || 0) + 1;
      });
    }

    const commonLocations = Object.entries(locationCount)
      .sort((a, b) => b[1] - a[1])
      .map(([location, count]) => ({ location, count }));

    const mostSearchedRoles = Object.entries(roleCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([role, count]) => ({ role, count }));

    return res.json({
      totalJobSearches: dbJobs.length,
      savedJobs: savedJobsCount,
      mostSearchedRoles,
      mostCommonLocations: commonLocations,
    });
  } catch (err: any) {
    console.error("Job analytics error:", err);
    return res.status(500).json({ message: "Failed to load job analytics", error: err.message });
  }
};

// GET /api/admin/github
export const getGithubAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const dbGithub = await GithubAnalysisModel.findAll({ order: [["created_at", "DESC"]] });

    let scoreSum = 0;
    const techCounts: Record<string, number> = {};

    dbGithub.forEach((g) => {
      if (g.overallScore) scoreSum += Number(g.overallScore);
      if (Array.isArray(g.skills)) {
        g.skills.forEach((s: any) => {
          const name = typeof s === "string" ? s : s.skill;
          if (name) techCounts[name] = (techCounts[name] || 0) + 1;
        });
      }
    });

    const totalProfiles = dbGithub.length;
    const avgScore = totalProfiles > 0 ? Math.round(scoreSum / totalProfiles) : 0;

    const commonTech = Object.entries(techCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([tech]) => tech);

    const recommendations = [
      "Improve README files with clear architecture, live demo links, and installation steps",
      "Add automated CI/CD workflows and unit test coverage to top repositories",
      "Organize repositories with relevant tags and clear commit descriptions",
      "Pin top production-ready full-stack projects to the user profile",
    ];

    return res.json({
      profilesAnalyzed: totalProfiles,
      averagePortfolioScore: avgScore,
      mostCommonTechnologies: commonTech,
      commonRecommendations: totalProfiles > 0 ? recommendations : [],
    });
  } catch (err: any) {
    console.error("GitHub analytics error:", err);
    return res.status(500).json({ message: "Failed to load GitHub analytics", error: err.message });
  }
};

// GET /api/admin/activity
export const getPlatformActivity = async (req: AuthRequest, res: Response) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const offset = (page - 1) * limit;

    const { count, rows } = await AdminActivity.findAndCountAll({
      order: [["created_at", "DESC"]],
      limit,
      offset,
    });

    return res.json({
      total: count,
      page,
      limit,
      activities: rows,
    });
  } catch (err: any) {
    console.error("Activity log error:", err);
    return res.status(500).json({ message: "Failed to retrieve activity stream", error: err.message });
  }
};

// GET /api/admin/settings
export const getPlatformSettings = async (req: AuthRequest, res: Response) => {
  try {
    const adminUser = await User.findByPk(req.userId, { attributes: ["name", "email", "role"] });

    return res.json({
      adminProfile: {
        name: adminUser?.name || "Admin",
        email: adminUser?.email || "admin@careerorbit.com",
        role: adminUser?.role || "ADMIN",
      },
      platform: {
        name: platformSettings.platformName,
        supportEmail: platformSettings.supportEmail,
        maintenanceMode: platformSettings.maintenanceMode,
      },
    });
  } catch (err: any) {
    console.error("Get settings error:", err);
    return res.status(500).json({ message: "Failed to load settings", error: err.message });
  }
};

// POST /api/admin/settings
export const updatePlatformSettings = async (req: AuthRequest, res: Response) => {
  try {
    const { platformName, supportEmail, maintenanceMode } = req.body;

    if (platformName) platformSettings.platformName = platformName;
    if (supportEmail) platformSettings.supportEmail = supportEmail;
    if (typeof maintenanceMode === "boolean") platformSettings.maintenanceMode = maintenanceMode;

    await logPlatformActivity({
      userId: req.userId,
      userName: req.user?.name || "Admin",
      action: `Updated platform settings (Platform: ${platformSettings.platformName})`,
      module: "settings",
    });

    return res.json({
      message: "Platform settings updated successfully",
      platform: platformSettings,
    });
  } catch (err: any) {
    console.error("Update settings error:", err);
    return res.status(500).json({ message: "Failed to update settings", error: err.message });
  }
};
