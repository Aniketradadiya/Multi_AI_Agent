import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware.js";
import {
  getFullUserProgress,
  hydrateUserStoreFromDb,
  getCodingHistory,
  saveCodingSubmission,
  CODING_TOPICS,
  getInterviewHistory,
  saveInterviewSession,
  getInterviewSessionById,
  getUserRoadmap,
  saveUserRoadmap,
  toggleRoadmapTopic,
  clearUserRoadmap,
  getLatestResumeAnalysis,
  saveResumeAnalysis,
  getLatestGithubAnalysis,
  saveGithubAnalysis,
  syncUserProgress,
  type PracticeRecord,
  type InterviewSession,
} from "../services/progress.service.js";
import { DEFAULT_JOBS } from "../services/job.service.js";

// GET /api/progress
export const getProgress = async (req: AuthRequest, res: Response) => {
  const userId = req.userId || "anonymous";
  await hydrateUserStoreFromDb(userId);
  const progress = getFullUserProgress(userId);
  return res.json(progress);
};

// GET /api/dashboard
export const dashboard = async (req: AuthRequest, res: Response) => {
  const userId = req.userId || "anonymous";
  await hydrateUserStoreFromDb(userId);
  const progress = getFullUserProgress(userId);
  return res.json({
    readinessScore: progress.readinessScore,
    scores: progress.scores,
    weeklyGoal: progress.weeklyGoal,
    streak: progress.streak,
    nextStep: progress.nextStep,
    recentActivity: progress.recentActivity,
  });
};

// POST /api/progress/sync
export const syncProgress = (req: AuthRequest, res: Response) => {
  const userId = req.userId || "anonymous";
  const synced = syncUserProgress(userId, req.body || {});
  return res.json({ message: "Progress synced successfully", progress: synced });
};

// --- Coding Practice APIs ---

// GET /api/coding/history
export const getCodingHistoryHandler = (req: AuthRequest, res: Response) => {
  const userId = req.userId || "anonymous";
  const history = getCodingHistory(userId);
  return res.json({ history });
};

// POST /api/coding/history
export const saveCodingSubmissionHandler = (req: AuthRequest, res: Response) => {
  const userId = req.userId || "anonymous";
  const { title, topic, difficulty, language, score, passed, code } = req.body;

  if (!title) {
    return res.status(400).json({ message: "Problem title is required." });
  }

  const record: PracticeRecord = {
    id: req.body.id || Date.now().toString(),
    title,
    topic: topic || "Algorithms",
    difficulty: difficulty || "Easy",
    language: language || "JavaScript",
    score: typeof score === "number" ? score : 80,
    passed: passed ?? true,
    timestamp: "Just now",
    code,
  };

  const saved = saveCodingSubmission(userId, record);
  return res.status(201).json({ message: "Submission recorded", record: saved });
};

// GET /api/coding/topics
export const getCodingTopicsHandler = (_req: AuthRequest, res: Response) => {
  return res.json({ topics: CODING_TOPICS });
};

// --- Mock Interview APIs ---

// GET /api/interview/history
export const getInterviewHistoryHandler = (req: AuthRequest, res: Response) => {
  const userId = req.userId || "anonymous";
  const history = getInterviewHistory(userId);
  return res.json({ history });
};

// POST /api/interview/session
export const saveInterviewSessionHandler = (req: AuthRequest, res: Response) => {
  const userId = req.userId || "anonymous";
  const { role, type, score, questionsCount, report, id, date } = req.body;

  const session: InterviewSession = {
    id: id || Date.now().toString(),
    date: date || new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    role: role || "Software Developer",
    type: type || "Mixed",
    score: typeof score === "number" ? score : 75,
    questionsCount: typeof questionsCount === "number" ? questionsCount : 3,
    report,
  };

  const saved = saveInterviewSession(userId, session);
  return res.status(201).json({ message: "Session saved", session: saved });
};

// GET /api/interview/session/:id
export const getInterviewSessionHandler = (req: AuthRequest, res: Response) => {
  const userId = req.userId || "anonymous";
  const session = getInterviewSessionById(userId, String(req.params.id));
  if (!session) {
    return res.status(404).json({ message: "Interview session not found" });
  }
  return res.json({ session });
};

// --- AI Career Roadmap APIs ---

// GET /api/roadmap
export const getRoadmapHandler = (req: AuthRequest, res: Response) => {
  const userId = req.userId || "anonymous";
  const roadmap = getUserRoadmap(userId);
  if (!roadmap) {
    return res.status(404).json({ message: "No active roadmap found for user." });
  }
  return res.json(roadmap);
};

// POST /api/roadmap/save
export const saveRoadmapHandler = (req: AuthRequest, res: Response) => {
  const userId = req.userId || "anonymous";
  if (!req.body || !req.body.phases) {
    return res.status(400).json({ message: "Valid roadmap object with phases is required." });
  }
  const saved = saveUserRoadmap(userId, req.body);
  return res.json({ message: "Roadmap saved successfully", roadmap: saved });
};

// PATCH /api/roadmap/topic
export const toggleRoadmapTopicHandler = (req: AuthRequest, res: Response) => {
  const userId = req.userId || "anonymous";
  const { phaseId, topicId } = req.body;
  if (phaseId === undefined || !topicId) {
    return res.status(400).json({ message: "phaseId and topicId are required." });
  }
  const updated = toggleRoadmapTopic(userId, Number(phaseId), String(topicId));
  if (!updated) {
    return res.status(404).json({ message: "Roadmap or topic not found." });
  }
  return res.json({ message: "Topic milestone toggled", roadmap: updated });
};

// DELETE /api/roadmap
export const clearRoadmapHandler = (req: AuthRequest, res: Response) => {
  const userId = req.userId || "anonymous";
  clearUserRoadmap(userId);
  return res.json({ message: "Roadmap cleared." });
};

// --- Resume Analysis Storage APIs ---

// GET /api/resume/latest
export const getLatestResumeHandler = (req: AuthRequest, res: Response) => {
  const userId = req.userId || "anonymous";
  const analysis = getLatestResumeAnalysis(userId);
  if (!analysis) {
    return res.status(404).json({ message: "No resume analysis found for user." });
  }
  return res.json(analysis);
};

// POST /api/resume/save
export const saveResumeHandler = (req: AuthRequest, res: Response) => {
  const userId = req.userId || "anonymous";
  if (!req.body) {
    return res.status(400).json({ message: "Resume analysis data required." });
  }
  const saved = saveResumeAnalysis(userId, req.body);
  return res.json({ message: "Resume analysis saved", analysis: saved });
};

// --- GitHub Analysis Storage APIs ---

// GET /api/github/latest
export const getLatestGithubHandler = (req: AuthRequest, res: Response) => {
  const userId = req.userId || "anonymous";
  const analysis = getLatestGithubAnalysis(userId);
  if (!analysis) {
    return res.status(404).json({ message: "No GitHub analysis found for user." });
  }
  return res.json(analysis);
};

// POST /api/github/save
export const saveGithubHandler = (req: AuthRequest, res: Response) => {
  const userId = req.userId || "anonymous";
  if (!req.body) {
    return res.status(400).json({ message: "GitHub analysis data required." });
  }
  const saved = saveGithubAnalysis(userId, req.body);
  return res.json({ message: "GitHub analysis saved", analysis: saved });
};

// --- Job Detail API ---

// GET /api/jobs/:id
export const getJobByIdHandler = (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const job = DEFAULT_JOBS.find((j) => j.id === id);
  if (!job) {
    return res.status(404).json({ message: "Job not found" });
  }
  return res.json({ job });
};
