import { Router } from "express";
import multer from "multer";
import {
  codingQuestion,
  codingEvaluate,
  codingHint,
  codingSolution,
  codingRun,
  githubAnalysis,
  jobs,
  getSavedJobs,
  toggleSaveJob,
  roadmap,
  resumeAnalysis,
  startInterview,
  evaluateInterviewAnswer,
  completeInterview,
} from "../controllers/career.controller.js";
import {
  getProgress,
  dashboard as progressDashboard,
  syncProgress,
  getCodingHistoryHandler,
  saveCodingSubmissionHandler,
  getCodingTopicsHandler,
  getInterviewHistoryHandler,
  saveInterviewSessionHandler,
  getInterviewSessionHandler,
  getRoadmapHandler,
  saveRoadmapHandler,
  toggleRoadmapTopicHandler,
  clearRoadmapHandler,
  getLatestResumeHandler,
  saveResumeHandler,
  getLatestGithubHandler,
  saveGithubHandler,
  getJobByIdHandler,
} from "../controllers/progress.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

export const careerRouter = Router();
careerRouter.use(authenticate);

// Placement Readiness & Dynamic Dashboard
careerRouter.get("/dashboard", progressDashboard);
careerRouter.get("/progress", getProgress);
careerRouter.post("/progress/sync", syncProgress);

// Resume Analyzer
careerRouter.post("/resume/analyze", upload.single("resume"), resumeAnalysis);
careerRouter.get("/resume/latest", getLatestResumeHandler);
careerRouter.post("/resume/save", saveResumeHandler);

// Voice Mock Interview
careerRouter.post("/interview/start", startInterview);
careerRouter.post("/interview/evaluate-answer", evaluateInterviewAnswer);
careerRouter.post("/interview/complete", completeInterview);
careerRouter.get("/interview/history", getInterviewHistoryHandler);
careerRouter.post("/interview/session", saveInterviewSessionHandler);
careerRouter.get("/interview/session/:id", getInterviewSessionHandler);

// AI Career Roadmap
careerRouter.post("/roadmap/generate", roadmap);
careerRouter.get("/roadmap", getRoadmapHandler);
careerRouter.post("/roadmap/save", saveRoadmapHandler);
careerRouter.patch("/roadmap/topic", toggleRoadmapTopicHandler);
careerRouter.delete("/roadmap", clearRoadmapHandler);

// Coding Practice
careerRouter.post("/coding/question", codingQuestion);
careerRouter.post("/coding/evaluate", codingEvaluate);
careerRouter.post("/coding/hint", codingHint);
careerRouter.post("/coding/solution", codingSolution);
careerRouter.post("/coding/run", codingRun);
careerRouter.get("/coding/history", getCodingHistoryHandler);
careerRouter.post("/coding/history", saveCodingSubmissionHandler);
careerRouter.get("/coding/topics", getCodingTopicsHandler);

// Job Match
careerRouter.get("/jobs/recommendations", jobs);
careerRouter.post("/jobs/recommendations", jobs);
careerRouter.get("/jobs/saved", getSavedJobs);
careerRouter.post("/jobs/save", toggleSaveJob);
careerRouter.get("/jobs/:id", getJobByIdHandler);

// GitHub Analyzer
careerRouter.post("/github/analyze", githubAnalysis);
careerRouter.get("/github/latest", getLatestGithubHandler);
careerRouter.post("/github/save", saveGithubHandler);
