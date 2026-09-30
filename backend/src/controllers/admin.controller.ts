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

// Global platform configuration store
let platformSettings = {
  platformName: "Career Orbit",
  supportEmail: "support@careerorbit.com",
  maintenanceMode: false,
};

// Helper: Batch-fetch User records by userIds safely without type-casting SQL join issues
const getUserMap = async (records: { userId?: string | null }[]) => {
  const userIds = Array.from(new Set(records.map((r) => r.userId).filter(Boolean))) as string[];
  if (userIds.length === 0) return new Map<string, { id: string; name: string; email: string }>();
  const users = await User.findAll({
    where: { id: userIds },
    attributes: ["id", "name", "email"],
  });
  return new Map(users.map((u) => [u.id, { id: u.id, name: u.name, email: u.email }]));
};

// Helper: 7-day registration trend strictly from User.createdAt
const calculate7DayRegistrations = async () => {
  const registrationMap: Record<string, number> = {};
  const dayStarts: { key: string; start: Date; end: Date }[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);

    const end = new Date(d);
    end.setHours(23, 59, 59, 999);

    const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    registrationMap[key] = 0;
    dayStarts.push({ key, start: d, end });
  }

  const oldestDate = dayStarts[0].start;
  const recentUsers = await User.findAll({
    where: {
      createdAt: {
        [Op.gte]: oldestDate,
      },
    },
    attributes: ["createdAt"],
  });

  recentUsers.forEach((u) => {
    const rawDate = new Date(u.createdAt);
    const key = rawDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (registrationMap[key] !== undefined) {
      registrationMap[key]++;
    }
  });

  return dayStarts.map(({ key }) => ({
    date: key,
    users: registrationMap[key] || 0,
  }));
};

// GET /api/admin/stats
export const getAdminStats = async (_req: AuthRequest, res: Response) => {
  try {
    const totalUsers = await User.count();
    
    // Active users: Users with status 'active' in DB
    const activeUsers = await User.count({ where: { status: "active" } });

    // Real database counts only - 0 if no records exist
    const resumesAnalyzed = await ResumeAnalysis.count();
    const mockInterviews = await InterviewSessionModel.count();
    const codingProblemsSolved = await CodingAttempt.count({ where: { passed: true } });
    const githubProfilesAnalyzed = await GithubAnalysisModel.count();
    const roadmapsCreated = await Roadmap.count();
    const jobsSaved = await JobActivity.count({ where: { isSaved: true } });

    // Real registration trend from User.createdAt
    const registrationTrend = await calculate7DayRegistrations();

    // Module usage counts directly from database tables
    const moduleUsage = [
      { name: "Resume Analyzer", count: resumesAnalyzed },
      { name: "Mock Interview", count: mockInterviews },
      { name: "Coding Practice", count: codingProblemsSolved },
      { name: "AI Roadmap", count: roadmapsCreated },
      { name: "Job Match", count: jobsSaved },
      { name: "GitHub Analyzer", count: githubProfilesAnalyzed },
    ];

    // Recent platform activities with populated user info
    const activitiesRaw = await AdminActivity.findAll({
      order: [["created_at", "DESC"]],
      limit: 10,
    });

    const userMap = await getUserMap(activitiesRaw);

    const recentActivity = activitiesRaw.map((item) => {
      const u = item.userId ? userMap.get(item.userId) : null;
      return {
        id: item.id,
        _id: item.id,
        userId: item.userId,
        userName: u?.name || item.userName || "User",
        userEmail: u?.email || item.userEmail || "",
        action: item.action,
        module: item.module,
        result: item.result || (item.score !== null ? `${item.score}` : "Completed"),
        score: item.score,
        status: item.status || "Completed",
        details: item.details,
        createdAt: item.createdAt,
      };
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
        jobsSaved,
      },
      charts: {
        registrationTrend,
        moduleUsage,
      },
      recentActivity,
      // Backward-compatible properties
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

// GET /api/admin/registrations
export const getRegistrations = async (_req: AuthRequest, res: Response) => {
  try {
    const registrationTrend = await calculate7DayRegistrations();
    return res.json({ registrationTrend });
  } catch (err: any) {
    console.error("Registrations trend error:", err);
    return res.status(500).json({ message: "Failed to load registrations trend", error: err.message });
  }
};

// GET /api/admin/module-usage
export const getModuleUsage = async (_req: AuthRequest, res: Response) => {
  try {
    const resumesAnalyzed = await ResumeAnalysis.count();
    const mockInterviews = await InterviewSessionModel.count();
    const codingProblemsSolved = await CodingAttempt.count({ where: { passed: true } });
    const githubProfilesAnalyzed = await GithubAnalysisModel.count();
    const roadmapsCreated = await Roadmap.count();
    const jobsSaved = await JobActivity.count({ where: { isSaved: true } });

    const moduleUsage = [
      { name: "Resume Analyzer", count: resumesAnalyzed },
      { name: "Mock Interview", count: mockInterviews },
      { name: "Coding Practice", count: codingProblemsSolved },
      { name: "AI Roadmap", count: roadmapsCreated },
      { name: "Job Match", count: jobsSaved },
      { name: "GitHub Analyzer", count: githubProfilesAnalyzed },
    ];

    return res.json({ moduleUsage });
  } catch (err: any) {
    console.error("Module usage error:", err);
    return res.status(500).json({ message: "Failed to load module usage", error: err.message });
  }
};

// GET /api/admin/users
export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const search = String(req.query.search || req.query.q || "").trim();
    const roleFilter = String(req.query.role || "ALL").toUpperCase();
    const statusFilter = String(req.query.status || "ALL").toLowerCase();

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

    if (statusFilter === "active" || statusFilter === "disabled") {
      where.status = statusFilter;
    }

    const users = await User.findAll({
      where,
      attributes: ["id", "name", "email", "role", "status", "createdAt", "updatedAt", "targetRole"],
      order: [["createdAt", "DESC"]],
    });

    // Populate per-user database activity counts
    const usersWithStats = await Promise.all(
      users.map(async (u) => {
        const userId = u.id;
        const resumeCount = await ResumeAnalysis.count({ where: { userId } });
        const interviewCount = await InterviewSessionModel.count({ where: { userId } });
        const codingCount = await CodingAttempt.count({ where: { userId } });
        const githubCount = await GithubAnalysisModel.count({ where: { userId } });

        // Get latest activity timestamp for this user
        const latestActivityRecord = await AdminActivity.findOne({
          where: { userId },
          order: [["created_at", "DESC"]],
          attributes: ["createdAt"],
        });

        const effectiveDate = latestActivityRecord?.createdAt || u.updatedAt || u.createdAt;
        const lastActivity = effectiveDate && !isNaN(new Date(effectiveDate).getTime())
          ? new Date(effectiveDate).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
          : "Recently";

        const createdDate = u.createdAt && !isNaN(new Date(u.createdAt).getTime())
          ? new Date(u.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
          : "Recently";

        return {
          id: u.id,
          _id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          status: u.status,
          createdDate,
          createdAt: u.createdAt,
          lastActivity,
          targetRole: u.targetRole || "Software Developer",
          resumeCount,
          interviewCount,
          codingCount,
          githubCount,
          activityCount: resumeCount + interviewCount + codingCount + githubCount,
        };
      })
    );

    return res.json({ users: usersWithStats });
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
      attributes: ["id", "name", "email", "role", "status", "createdAt", "updatedAt", "targetRole", "experienceLevel", "skills", "studyTime"],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 1. Resume records
    const resumesAnalyzed = await ResumeAnalysis.count({ where: { userId: id } });
    const latestResume = await ResumeAnalysis.findOne({
      where: { userId: id },
      order: [["created_at", "DESC"]],
    });
    const latestAtsScore = latestResume?.atsScore || 0;

    // 2. Mock interview records
    const interviewsCompleted = await InterviewSessionModel.count({ where: { userId: id } });
    const userInterviews = await InterviewSessionModel.findAll({ where: { userId: id } });
    const avgInterviewScore = userInterviews.length > 0
      ? Math.round(userInterviews.reduce((acc, s) => acc + (s.score || 0), 0) / userInterviews.length)
      : 0;

    // 3. Coding records
    const codingProblemsSolved = await CodingAttempt.count({ where: { userId: id, passed: true } });
    const totalCodingAttempts = await CodingAttempt.count({ where: { userId: id } });
    const userCodingAttempts = await CodingAttempt.findAll({ where: { userId: id } });
    const avgCodingScore = userCodingAttempts.length > 0
      ? Math.round(userCodingAttempts.reduce((acc, c) => acc + (c.score || 0), 0) / userCodingAttempts.length)
      : 0;

    // 4. Roadmap records
    const roadmapsCreated = await Roadmap.count({ where: { userId: id } });
    const userRoadmap = await Roadmap.findOne({
      where: { userId: id },
      order: [["updated_at", "DESC"]],
    });

    let roadmapProgress = 0;
    if (userRoadmap && Array.isArray(userRoadmap.phases) && userRoadmap.phases.length > 0) {
      let totalMilestones = 0;
      let completedMilestones = 0;
      userRoadmap.phases.forEach((p: any) => {
        const items = p.topics || p.milestones || [];
        totalMilestones += items.length;
        completedMilestones += items.filter((item: any) => item.completed).length;
      });
      roadmapProgress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;
    }

    // 5. GitHub records
    const githubProfilesAnalyzed = await GithubAnalysisModel.count({ where: { userId: id } });
    const latestGithub = await GithubAnalysisModel.findOne({
      where: { userId: id },
      order: [["created_at", "DESC"]],
    });
    const reposAnalyzed = Array.isArray(latestGithub?.repositories) ? latestGithub.repositories.length : 0;

    // 6. Job match records
    const jobSearches = await JobActivity.count({ where: { userId: id } });

    // 7. Recent activity for this specific user
    const recentActivitiesRaw = await AdminActivity.findAll({
      where: { userId: id },
      order: [["created_at", "DESC"]],
      limit: 10,
    });

    const recentActivities = recentActivitiesRaw.map((act) => ({
      id: act.id,
      module: act.module,
      action: act.action,
      result: act.result || (act.score !== null ? `${act.score}` : "Completed"),
      score: act.score,
      status: act.status || "Completed",
      details: act.details,
      createdAt: act.createdAt,
    }));

    const latestAct = recentActivitiesRaw[0];
    const effectiveLastActivity = latestAct?.createdAt || user.updatedAt || user.createdAt;

    return res.json({
      user: {
        id: user.id,
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        targetRole: user.targetRole || "Software Developer",
        experienceLevel: user.experienceLevel || "Student",
        skills: user.skills || [],
        studyTime: user.studyTime || 2,
        createdAt: user.createdAt,
        createdDate: new Date(user.createdAt).toLocaleDateString("en-US", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        lastActivity: new Date(effectiveLastActivity).toLocaleDateString("en-US", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
      },
      careerActivity: {
        resume: {
          analyzed: resumesAnalyzed,
          latestScore: latestAtsScore,
        },
        mockInterview: {
          completed: interviewsCompleted,
          averageScore: avgInterviewScore,
        },
        coding: {
          solved: codingProblemsSolved,
          total: totalCodingAttempts,
          averageScore: avgCodingScore,
        },
        roadmap: {
          created: roadmapsCreated,
          targetRole: userRoadmap?.targetRole || user.targetRole || "Software Developer",
          progress: roadmapProgress,
        },
        github: {
          analyzed: githubProfilesAnalyzed,
          repositoriesAnalyzed: reposAnalyzed,
          latestScore: latestGithub?.overallScore || 0,
        },
        jobMatch: {
          jobSearches,
        },
        // Backward compatibility properties for existing modals
        resumeAnalyses: resumesAnalyzed,
        mockInterviews: interviewsCompleted,
        codingProblems: codingProblemsSolved,
        roadmapProgress: {
          targetRole: userRoadmap?.targetRole || user.targetRole || "Software Developer",
          percentage: roadmapProgress,
        },
        jobMatches: jobSearches,
        githubAnalyses: githubProfilesAnalyzed,
      },
      recentActivity: recentActivities,
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
      userEmail: req.user?.email,
      action: `Changed role of user "${user.name}" (${user.email}) to ${role}`,
      module: "admin",
      result: "Updated",
      status: "Completed",
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
      userEmail: req.user?.email,
      action: `${status === "disabled" ? "Disabled" : "Enabled"} account of "${user.name}" (${user.email})`,
      module: "admin",
      result: status === "disabled" ? "Disabled" : "Active",
      status: "Completed",
    });

    return res.json({ message: `Account status updated to ${status}`, user: { id: user.id, status: user.status } });
  } catch (err: any) {
    console.error("Update status error:", err);
    return res.status(500).json({ message: "Failed to update status", error: err.message });
  }
};

// GET /api/admin/resumes
export const getResumeAnalytics = async (_req: AuthRequest, res: Response) => {
  try {
    const dbResumes = await ResumeAnalysis.findAll({
      order: [["created_at", "DESC"]],
    });

    const userMap = await getUserMap(dbResumes);

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

    const resumes = dbResumes.map((r: any) => {
      const u = r.userId ? userMap.get(r.userId) : null;
      return {
        id: r.id,
        _id: r.id,
        userId: r.userId,
        userName: u?.name || r.candidateName || "Candidate",
        userEmail: u?.email || "N/A",
        fileName: r.fileName,
        candidateName: r.candidateName || u?.name || "Candidate",
        atsScore: r.atsScore || 0,
        createdAt: r.createdAt,
        summary: r.summary || "",
      };
    });

    return res.json({
      totalResumesAnalyzed: totalResumes,
      averageAtsScore: averageScore,
      topSkills,
      commonSkillGaps,
      resumes,
      recentResumes: resumes.slice(0, 5),
    });
  } catch (err: any) {
    console.error("Resume analytics error:", err);
    return res.status(500).json({ message: "Failed to load resume analytics", error: err.message });
  }
};

// GET /api/admin/interviews
export const getInterviewAnalytics = async (_req: AuthRequest, res: Response) => {
  try {
    const dbSessions = await InterviewSessionModel.findAll({
      order: [["created_at", "DESC"]],
    });

    const userMap = await getUserMap(dbSessions);

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

    const interviews = dbSessions.map((s: any) => {
      const u = s.userId ? userMap.get(s.userId) : null;
      return {
        id: s.id,
        _id: s.id,
        userId: s.userId,
        userName: u?.name || "Candidate",
        userEmail: u?.email || "N/A",
        role: s.role || "Software Developer",
        interviewType: s.interviewType || "Mixed",
        score: s.score || 0,
        questionsCount: s.questionsCount || 5,
        status: s.score > 0 ? "Completed" : "In Progress",
        createdAt: s.createdAt,
      };
    });

    return res.json({
      totalInterviews,
      completedInterviews: completed,
      averageInterviewScore: avgScore,
      averageCommunicationScore: avgCommunication,
      commonWeakAreas: weakAreas,
      interviews,
      recentSessions: interviews.slice(0, 6),
    });
  } catch (err: any) {
    console.error("Interview analytics error:", err);
    return res.status(500).json({ message: "Failed to load interview analytics", error: err.message });
  }
};

// GET /api/admin/coding
export const getCodingAnalytics = async (_req: AuthRequest, res: Response) => {
  try {
    const dbAttempts = await CodingAttempt.findAll({
      order: [["created_at", "DESC"]],
    });

    const userMap = await getUserMap(dbAttempts);

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

    const coding = dbAttempts.map((c: any) => {
      const u = c.userId ? userMap.get(c.userId) : null;
      return {
        id: c.id,
        _id: c.id,
        userId: c.userId,
        userName: u?.name || "Candidate",
        userEmail: u?.email || "N/A",
        problemTitle: c.problemTitle || "Coding Problem",
        topic: c.topic || "Algorithms",
        difficulty: c.difficulty || "Easy",
        language: c.language || "JavaScript",
        score: c.score || 0,
        passed: c.passed,
        result: c.passed ? "Accepted" : "Attempted",
        createdAt: c.createdAt,
      };
    });

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
      coding,
    });
  } catch (err: any) {
    console.error("Coding analytics error:", err);
    return res.status(500).json({ message: "Failed to load coding analytics", error: err.message });
  }
};

// GET /api/admin/roadmaps
export const getRoadmapAnalytics = async (_req: AuthRequest, res: Response) => {
  try {
    const dbRoadmaps = await Roadmap.findAll({
      order: [["updated_at", "DESC"]],
    });

    const userMap = await getUserMap(dbRoadmaps);

    const roleCounts: Record<string, number> = {};
    let totalProgress = 0;

    const roadmaps = dbRoadmaps.map((r: any) => {
      const u = r.userId ? userMap.get(r.userId) : null;
      let prog = 0;
      if (Array.isArray(r.phases)) {
        let comp = 0;
        let tot = 0;
        r.phases.forEach((p: any) => {
          const items = p.topics || p.milestones || [];
          tot += items.length;
          comp += items.filter((i: any) => i.completed).length;
        });
        if (tot > 0) prog = Math.round((comp / tot) * 100);
      }
      totalProgress += prog;

      if (r.targetRole) {
        roleCounts[r.targetRole] = (roleCounts[r.targetRole] || 0) + 1;
      }

      return {
        id: r.id,
        _id: r.id,
        userId: r.userId,
        userName: u?.name || "Candidate",
        userEmail: u?.email || "N/A",
        role: r.targetRole || "Software Developer",
        targetRole: r.targetRole || "Software Developer",
        skillLevel: r.skillLevel || "Beginner",
        studyTime: r.studyTime || "1 hour",
        progress: prog,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      };
    });

    const totalRoadmaps = dbRoadmaps.length;
    const avgProgress = totalRoadmaps > 0 ? Math.round(totalProgress / totalRoadmaps) : 0;

    const popularRoles = Object.entries(roleCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([role, count]) => ({ role, count }));

    return res.json({
      totalRoadmapsCreated: totalRoadmaps,
      averageCompletion: avgProgress,
      averageRoadmapProgress: avgProgress,
      mostPopularTargetRoles: popularRoles,
      roadmaps,
    });
  } catch (err: any) {
    console.error("Roadmap analytics error:", err);
    return res.status(500).json({ message: "Failed to load roadmap analytics", error: err.message });
  }
};

// GET /api/admin/jobs
export const getJobAnalytics = async (_req: AuthRequest, res: Response) => {
  try {
    const dbJobs = await JobActivity.findAll({
      order: [["created_at", "DESC"]],
    });

    const userMap = await getUserMap(dbJobs);

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

    const commonLocations = Object.entries(locationCount)
      .sort((a, b) => b[1] - a[1])
      .map(([location, count]) => ({ location, count }));

    const mostSearchedRoles = Object.entries(roleCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([role, count]) => ({ role, count }));

    const jobs = dbJobs.map((j: any) => {
      const u = j.userId ? userMap.get(j.userId) : null;
      return {
        id: j.id,
        _id: j.id,
        userId: j.userId,
        userName: u?.name || "Candidate",
        userEmail: u?.email || "N/A",
        jobId: j.jobId,
        role: j.role || "Job Match",
        company: j.company || "N/A",
        location: j.location || "N/A",
        matchScore: j.matchScore || 0,
        isSaved: j.isSaved,
        createdAt: j.createdAt,
      };
    });

    return res.json({
      totalJobSearches: dbJobs.length,
      savedJobs: savedJobsCount,
      mostSearchedRoles,
      mostCommonLocations: commonLocations,
      jobs,
    });
  } catch (err: any) {
    console.error("Job analytics error:", err);
    return res.status(500).json({ message: "Failed to load job analytics", error: err.message });
  }
};

// GET /api/admin/github
export const getGithubAnalytics = async (_req: AuthRequest, res: Response) => {
  try {
    const dbGithub = await GithubAnalysisModel.findAll({
      order: [["created_at", "DESC"]],
    });

    const userMap = await getUserMap(dbGithub);

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

    const github = dbGithub.map((g: any) => {
      const u = g.userId ? userMap.get(g.userId) : null;
      return {
        id: g.id,
        _id: g.id,
        userId: g.userId,
        userName: u?.name || "Candidate",
        userEmail: u?.email || "N/A",
        username: g.username || "N/A",
        repositoriesCount: Array.isArray(g.repositories) ? g.repositories.length : 0,
        overallScore: g.overallScore || 0,
        result: "Completed",
        createdAt: g.createdAt,
      };
    });

    return res.json({
      profilesAnalyzed: totalProfiles,
      averagePortfolioScore: avgScore,
      mostCommonTechnologies: commonTech,
      commonRecommendations: totalProfiles > 0 ? recommendations : [],
      github,
    });
  } catch (err: any) {
    console.error("GitHub analytics error:", err);
    return res.status(500).json({ message: "Failed to load GitHub analytics", error: err.message });
  }
};

// GET /api/admin/activity
export const getPlatformActivity = async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.max(1, Math.min(100, Number(req.query.limit || 50)));
    const offset = (page - 1) * limit;
    const moduleFilter = String(req.query.module || "ALL").trim();

    const where: any = {};
    if (moduleFilter && moduleFilter.toUpperCase() !== "ALL") {
      where.module = { [Op.iLike]: `%${moduleFilter}%` };
    }

    const { count, rows } = await AdminActivity.findAndCountAll({
      where,
      order: [["created_at", "DESC"]],
      limit,
      offset,
    });

    const userMap = await getUserMap(rows);

    const formattedActivities = rows.map((item) => {
      const u = item.userId ? userMap.get(item.userId) : null;
      const userName = u?.name || item.userName || "User";
      const userEmail = u?.email || item.userEmail || "N/A";
      const result = item.result || (item.score !== null ? `${item.score}` : "Completed");

      return {
        id: item.id,
        _id: item.id,
        user: {
          id: u?.id || item.userId,
          _id: u?.id || item.userId,
          name: userName,
          email: userEmail,
        },
        userId: item.userId,
        userName,
        userEmail,
        module: item.module,
        action: item.action,
        activity: item.action,
        result,
        score: item.score,
        status: item.status || "Completed",
        details: item.details,
        createdAt: item.createdAt,
      };
    });

    return res.json({
      total: count,
      page,
      limit,
      activities: formattedActivities,
    });
  } catch (err: any) {
    console.error("Activity log error:", err);
    return res.status(500).json({ message: "Failed to retrieve activity stream", error: err.message });
  }
};

// GET /api/admin/activity/:userId
export const getUserActivity = async (req: AuthRequest, res: Response) => {
  try {
    const userId = String(req.params.userId);
    const activities = await AdminActivity.findAll({
      where: { userId },
      order: [["created_at", "DESC"]],
    });

    const userMap = await getUserMap(activities);

    return res.json({
      userId,
      total: activities.length,
      activities: activities.map((item) => {
        const u = item.userId ? userMap.get(item.userId) : null;
        return {
          id: item.id,
          _id: item.id,
          user: {
            id: u?.id || item.userId,
            _id: u?.id || item.userId,
            name: u?.name || item.userName,
            email: u?.email || item.userEmail,
          },
          userName: u?.name || item.userName,
          userEmail: u?.email || item.userEmail,
          module: item.module,
          action: item.action,
          activity: item.action,
          result: item.result || (item.score !== null ? `${item.score}` : "Completed"),
          score: item.score,
          status: item.status || "Completed",
          details: item.details,
          createdAt: item.createdAt,
        };
      }),
    });
  } catch (err: any) {
    console.error("User activity error:", err);
    return res.status(500).json({ message: "Failed to retrieve user activity", error: err.message });
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
        platformName: platformSettings.platformName,
        supportEmail: platformSettings.supportEmail,
        maintenanceMode: platformSettings.maintenanceMode,
      },
    });
  } catch (err: any) {
    console.error("Get settings error:", err);
    return res.status(500).json({ message: "Failed to load settings", error: err.message });
  }
};

// PUT /api/admin/settings
export const updatePlatformSettings = async (req: AuthRequest, res: Response) => {
  try {
    const { adminName, platformName, supportEmail, maintenanceMode } = req.body;

    if (adminName && req.userId) {
      await User.update({ name: adminName.trim() }, { where: { id: req.userId } });
    }
    if (platformName) platformSettings.platformName = platformName.trim();
    if (supportEmail) platformSettings.supportEmail = supportEmail.trim();
    if (typeof maintenanceMode === "boolean") platformSettings.maintenanceMode = maintenanceMode;

    await logPlatformActivity({
      userId: req.userId,
      userName: adminName || req.user?.name || "Admin",
      userEmail: req.user?.email,
      action: `Updated platform settings (Platform: ${platformSettings.platformName})`,
      module: "settings",
      result: "Updated",
      status: "Completed",
    });

    return res.json({
      message: "Platform settings updated successfully",
      platform: {
        ...platformSettings,
        platformName: platformSettings.platformName,
      },
    });
  } catch (err: any) {
    console.error("Update settings error:", err);
    return res.status(500).json({ message: "Failed to update settings", error: err.message });
  }
};
