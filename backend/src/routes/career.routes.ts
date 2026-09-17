import { Router } from "express";
import multer from "multer";
import { codingQuestion, codingEvaluate, codingHint, codingSolution, codingRun, dashboard, githubAnalysis, jobs, getSavedJobs, toggleSaveJob, roadmap, resumeAnalysis, startInterview, evaluateInterviewAnswer, completeInterview } from "../controllers/career.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

export const careerRouter = Router();
careerRouter.use(authenticate);
careerRouter.get("/dashboard", dashboard);
careerRouter.post("/resume/analyze", upload.single("resume"), resumeAnalysis);
careerRouter.post("/interview/start", startInterview);
careerRouter.post("/interview/evaluate-answer", evaluateInterviewAnswer);
careerRouter.post("/interview/complete", completeInterview);
careerRouter.post("/roadmap/generate", roadmap);
careerRouter.post("/coding/question", codingQuestion);
careerRouter.post("/coding/evaluate", codingEvaluate);
careerRouter.post("/coding/hint", codingHint);
careerRouter.post("/coding/solution", codingSolution);
careerRouter.post("/coding/run", codingRun);
careerRouter.get("/jobs/recommendations", jobs);
careerRouter.post("/jobs/recommendations", jobs);
careerRouter.get("/jobs/saved", getSavedJobs);
careerRouter.post("/jobs/save", toggleSaveJob);
careerRouter.post("/github/analyze", githubAnalysis);

