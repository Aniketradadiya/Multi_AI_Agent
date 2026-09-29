import { getSavedJobIds } from "./job.service.js";
import { ResumeAnalysis } from "../models/ResumeAnalysis.js";
import { Roadmap } from "../models/Roadmap.js";
import { CodingAttempt } from "../models/CodingAttempt.js";
import { InterviewSessionModel } from "../models/InterviewSession.js";
import { GithubAnalysisModel } from "../models/GithubAnalysis.js";
import { JobActivity } from "../models/JobActivity.js";

export interface PracticeRecord {
  id: string;
  title: string;
  topic: string;
  difficulty: string;
  language: string;
  score: number;
  passed: boolean;
  timestamp: string;
  code?: string;
}

export interface InterviewSession {
  id: string;
  date: string;
  role: string;
  type: string;
  score: number;
  questionsCount: number;
  report?: any;
}

export interface RoadmapTopic {
  id: string;
  title: string;
  desc: string;
  completed: boolean;
  resources?: string[];
}

export interface RoadmapPhase {
  phaseId: number;
  title: string;
  duration: string;
  topics: RoadmapTopic[];
  milestones?: { id: string; title: string; completed: boolean }[];
}

export interface UserRoadmap {
  title?: string;
  targetRole: string;
  experienceLevel?: string;
  skillLevel?: string;
  studyTime?: any;
  goal?: string;
  currentFocus: string;
  currentFocusReason: string;
  phases: any[];
  updatedAt?: string;
  aiRecommendation?: string;
  [key: string]: any;
}

export interface UserStoreData {
  userId: string;
  resumeAnalysis?: any;
  githubAnalysis?: any;
  roadmap?: UserRoadmap | null;
  codingHistory: PracticeRecord[];
  interviewHistory: InterviewSession[];
  activeDates: Set<string>;
  weeklyGoal: { completed: number; total: number };
}

// In-memory persistent cache per user ID
const progressCache = new Map<string, UserStoreData>();

function getOrCreateUserStore(userId: string): UserStoreData {
  let store = progressCache.get(userId);
  if (!store) {
    store = {
      userId,
      codingHistory: [],
      interviewHistory: [],
      activeDates: new Set<string>(),
      weeklyGoal: { completed: 0, total: 5 },
    };
    progressCache.set(userId, store);
  }
  return store;
}

export async function hydrateUserStoreFromDb(userId: string): Promise<UserStoreData> {
  const store = getOrCreateUserStore(userId);
  try {
    if (!store.resumeAnalysis) {
      const resume = await ResumeAnalysis.findOne({ where: { userId }, order: [["created_at", "DESC"]] });
      if (resume) store.resumeAnalysis = resume.toJSON();
    }

    if (!store.roadmap) {
      const rm = await Roadmap.findOne({ where: { userId }, order: [["updated_at", "DESC"]] });
      if (rm) store.roadmap = rm.toJSON() as any;
    }

    if (store.codingHistory.length === 0) {
      const coding = await CodingAttempt.findAll({ where: { userId }, order: [["created_at", "DESC"]] });
      if (coding.length > 0) {
        store.codingHistory = coding.map((c) => ({
          id: c.id,
          title: c.problemTitle,
          topic: c.topic,
          difficulty: c.difficulty as any,
          language: c.language,
          score: c.score,
          passed: c.passed,
          timestamp: new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          code: c.code,
        }));
      }
    }

    if (store.interviewHistory.length === 0) {
      const interviews = await InterviewSessionModel.findAll({ where: { userId }, order: [["created_at", "DESC"]] });
      if (interviews.length > 0) {
        store.interviewHistory = interviews.map((i) => ({
          id: i.id,
          date: new Date(i.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          role: i.role,
          type: i.interviewType,
          score: i.score,
          questionsCount: i.questionsCount,
          report: i.report,
        }));
      }
    }

    if (!store.githubAnalysis) {
      const gh = await GithubAnalysisModel.findOne({ where: { userId }, order: [["created_at", "DESC"]] });
      if (gh) store.githubAnalysis = gh.toJSON();
    }
  } catch (err) {
    console.warn("[ProgressService] hydrateUserStoreFromDb error:", err);
  }
  return store;
}

function recordUserActivityDate(store: UserStoreData) {
  const todayStr = new Date().toISOString().slice(0, 10);
  store.activeDates.add(todayStr);
}

export function getAllUserStores(): UserStoreData[] {
  return Array.from(progressCache.values());
}

export function getUserStoreData(userId: string): UserStoreData {
  return getOrCreateUserStore(userId);
}

// --- Coding Practice History ---

export function getCodingHistory(userId: string): PracticeRecord[] {
  const store = getOrCreateUserStore(userId);
  return [...store.codingHistory];
}

export function saveCodingSubmission(userId: string, record: PracticeRecord): PracticeRecord {
  const store = getOrCreateUserStore(userId);
  recordUserActivityDate(store);
  const existingIdx = store.codingHistory.findIndex((h) => h.id === record.id);
  if (existingIdx >= 0) {
    store.codingHistory[existingIdx] = record;
  } else {
    store.codingHistory.unshift(record);
  }

  // Persist to PostgreSQL
  CodingAttempt.create({
    userId,
    problemTitle: record.title || "Coding Challenge",
    topic: record.topic || "Algorithms",
    difficulty: record.difficulty || "Easy",
    language: record.language || "JavaScript",
    score: record.score || 80,
    passed: record.passed ?? true,
    code: record.code || "",
    feedback: "",
  }).catch((err) => console.warn("[ProgressService] DB save coding attempt failed:", err));

  return record;
}

// Curated coding practice topics with difficulty breakdown
export const CODING_TOPICS = [
  { id: "Arrays", name: "Arrays & Hashing", description: "Array manipulations, prefix sums, hash maps, two pointers", difficulties: ["Easy", "Medium", "Hard"], count: 48 },
  { id: "Strings", name: "Strings & Text Processing", description: "String parsing, anagrams, sliding window, palindrome checks", difficulties: ["Easy", "Medium", "Hard"], count: 42 },
  { id: "Two Pointers", name: "Two Pointers & Sliding Window", description: "Subarrays, container with most water, pointer convergence", difficulties: ["Easy", "Medium", "Hard"], count: 35 },
  { id: "Binary Search", name: "Binary Search & Divide/Conquer", description: "Logarithmic search, search in rotated array, lower/upper bounds", difficulties: ["Easy", "Medium", "Hard"], count: 28 },
  { id: "Linked Lists", name: "Linked Lists", description: "Reversals, cycle detection, merge sort on lists, LRU cache", difficulties: ["Easy", "Medium", "Hard"], count: 30 },
  { id: "Trees & Graphs", name: "Trees & Binary Search Trees", description: "DFS, BFS, tree traversal, LCA, topological sorting", difficulties: ["Medium", "Hard"], count: 52 },
  { id: "Dynamic Programming", name: "Dynamic Programming", description: "1D/2D memoization, knapsack, longest common subsequence", difficulties: ["Medium", "Hard"], count: 60 },
  { id: "Recursion & Backtracking", name: "Recursion & Backtracking", description: "Permutations, subsets, N-Queens, word search", difficulties: ["Medium", "Hard"], count: 32 },
  { id: "Stack & Queue", name: "Stacks & Queues", description: "Monotonic stacks, valid parentheses, min stack, sliding window max", difficulties: ["Easy", "Medium"], count: 26 },
  { id: "System Design Algorithms", name: "System Design & Concurrency", description: "Rate limiters, consistent hashing, LRU/LFU cache algorithms", difficulties: ["Hard"], count: 18 },
];

// --- Mock Interview History ---

export function getInterviewHistory(userId: string): InterviewSession[] {
  const store = getOrCreateUserStore(userId);
  return [...store.interviewHistory];
}

export function saveInterviewSession(userId: string, session: InterviewSession): InterviewSession {
  const store = getOrCreateUserStore(userId);
  recordUserActivityDate(store);
  const existingIdx = store.interviewHistory.findIndex((s) => s.id === session.id);
  if (existingIdx >= 0) {
    store.interviewHistory[existingIdx] = session;
  } else {
    store.interviewHistory.unshift(session);
  }

  // Persist to PostgreSQL
  InterviewSessionModel.create({
    userId,
    role: session.role || "Software Developer",
    interviewType: session.type || "Mixed",
    score: session.score || 75,
    questionsCount: session.questionsCount || 5,
    report: session.report || null,
  }).catch((err) => console.warn("[ProgressService] DB save interview session failed:", err));

  return session;
}

export function getInterviewSessionById(userId: string, sessionId: string): InterviewSession | undefined {
  const store = getOrCreateUserStore(userId);
  return store.interviewHistory.find((s) => s.id === sessionId);
}

// --- AI Career Roadmap ---

export function getUserRoadmap(userId: string): UserRoadmap | null {
  const store = getOrCreateUserStore(userId);
  return store.roadmap ?? null;
}

export function saveUserRoadmap(userId: string, roadmap: UserRoadmap): UserRoadmap {
  const store = getOrCreateUserStore(userId);
  recordUserActivityDate(store);
  store.roadmap = {
    ...roadmap,
    updatedAt: new Date().toISOString(),
  };

  // Persist to PostgreSQL
  Roadmap.create({
    userId,
    title: roadmap.title || "Career Roadmap",
    targetRole: roadmap.targetRole || "Software Developer",
    skillLevel: roadmap.skillLevel || "Beginner",
    studyTime: typeof roadmap.studyTime === "string" ? roadmap.studyTime : "1 hour",
    goal: roadmap.goal || "Job",
    currentFocus: roadmap.currentFocus || "Fundamentals",
    currentFocusReason: roadmap.currentFocusReason || "",
    aiRecommendation: roadmap.aiRecommendation || "",
    phases: roadmap.phases || [],
  }).catch((err) => console.warn("[ProgressService] DB save roadmap failed:", err));

  return store.roadmap;
}

export function toggleRoadmapTopic(userId: string, phaseId: number, topicId: string): UserRoadmap | null {
  const store = getOrCreateUserStore(userId);
  if (!store.roadmap || !Array.isArray(store.roadmap.phases)) return null;

  recordUserActivityDate(store);

  let updatedPhases = store.roadmap.phases.map((phase: any) => {
    if (phase.phaseId !== phaseId) return phase;

    let updatedTopics = phase.topics ? phase.topics.map((t: any) => (t.id === topicId ? { ...t, completed: !t.completed } : t)) : [];
    let updatedMilestones = phase.milestones ? phase.milestones.map((m: any) => (m.id === topicId ? { ...m, completed: !m.completed } : m)) : [];

    return {
      ...phase,
      topics: updatedTopics,
      milestones: updatedMilestones,
    };
  });

  // Calculate next focus
  let nextFocus = store.roadmap.currentFocus;
  let nextFocusReason = store.roadmap.currentFocusReason;

  for (const p of updatedPhases) {
    const uncompleted = p.topics?.find((t: any) => !t.completed);
    if (uncompleted) {
      nextFocus = uncompleted.title;
      nextFocusReason = `Recommended because ${uncompleted.title} is your next core milestone in ${p.title}.`;
      break;
    }
  }

  store.roadmap = {
    ...store.roadmap,
    phases: updatedPhases,
    currentFocus: nextFocus,
    currentFocusReason: nextFocusReason,
    updatedAt: new Date().toISOString(),
  };

  return store.roadmap;
}

export function clearUserRoadmap(userId: string): boolean {
  const store = getOrCreateUserStore(userId);
  store.roadmap = null;
  return true;
}

// --- Resume Analysis Cache ---

export function getLatestResumeAnalysis(userId: string): any {
  const store = getOrCreateUserStore(userId);
  return store.resumeAnalysis || null;
}

export function saveResumeAnalysis(userId: string, analysis: any): any {
  const store = getOrCreateUserStore(userId);
  recordUserActivityDate(store);
  store.resumeAnalysis = analysis;

  // Persist to PostgreSQL
  ResumeAnalysis.create({
    userId,
    atsScore: analysis.atsScore || 70,
    candidateName: analysis.candidateName || "Candidate",
    fileName: analysis.fileName || "Resume.pdf",
    summary: analysis.summary,
    categoryScores: analysis.categoryScores,
    changesRequired: analysis.changesRequired,
    jobMatch: analysis.jobMatch,
    sectionAnalysis: analysis.sectionAnalysis,
    strengths: analysis.strengths || [],
    weaknesses: analysis.weaknesses || [],
    missingSkills: analysis.missingSkills || [],
    suggestions: analysis.suggestions || [],
    recommendedRoles: analysis.recommendedRoles || [],
  }).catch((err) => console.warn("[ProgressService] DB save resume analysis failed:", err));

  return analysis;
}

// --- GitHub Analysis Cache ---

export function getLatestGithubAnalysis(userId: string): any {
  const store = getOrCreateUserStore(userId);
  return store.githubAnalysis || null;
}

export function saveGithubAnalysis(userId: string, analysis: any): any {
  const store = getOrCreateUserStore(userId);
  recordUserActivityDate(store);
  store.githubAnalysis = analysis;

  // Persist to PostgreSQL
  GithubAnalysisModel.create({
    userId,
    username: analysis.profile?.username || "developer",
    overallScore: analysis.portfolioScore?.overall || 75,
    portfolioScore: analysis.portfolioScore,
    skills: analysis.skills || [],
    recommendations: analysis.recommendations || [],
    checklist: analysis.checklist || [],
    repositories: analysis.repositories || [],
    profile: analysis.profile,
  }).catch((err) => console.warn("[ProgressService] DB save github analysis failed:", err));

  return analysis;
}

// --- Client State Bulk Sync ---

export function syncUserProgress(userId: string, clientData: {
  resumeAnalysis?: any;
  githubAnalysis?: any;
  roadmap?: any;
  codingHistory?: PracticeRecord[];
  interviewHistory?: InterviewSession[];
}) {
  const store = getOrCreateUserStore(userId);
  recordUserActivityDate(store);

  if (clientData.resumeAnalysis) {
    store.resumeAnalysis = clientData.resumeAnalysis;
  }
  if (clientData.githubAnalysis) {
    store.githubAnalysis = clientData.githubAnalysis;
  }
  if (clientData.roadmap) {
    store.roadmap = clientData.roadmap;
  }
  if (Array.isArray(clientData.codingHistory) && clientData.codingHistory.length > 0) {
    // Merge without duplicates
    const existingIds = new Set(store.codingHistory.map((c) => c.id));
    for (const c of clientData.codingHistory) {
      if (!existingIds.has(c.id)) {
        store.codingHistory.push(c);
        existingIds.add(c.id);
      }
    }
  }
  if (Array.isArray(clientData.interviewHistory) && clientData.interviewHistory.length > 0) {
    const existingIds = new Set(store.interviewHistory.map((i) => i.id));
    for (const i of clientData.interviewHistory) {
      if (!existingIds.has(i.id)) {
        store.interviewHistory.push(i);
        existingIds.add(i.id);
      }
    }
  }

  return getFullUserProgress(userId);
}

// --- Comprehensive Progress Aggregation ---

export function getFullUserProgress(userId: string) {
  const store = getOrCreateUserStore(userId);
  const savedJobIds = getSavedJobIds(userId);

  // 1. Learning Activity Statistics
  const questionsSolved = store.codingHistory.length;
  const mockInterviews = store.interviewHistory.length;

  let roadmapTasksCompleted = 0;
  let totalRoadmapTasks = 0;
  if (store.roadmap?.phases && Array.isArray(store.roadmap.phases)) {
    store.roadmap.phases.forEach((phase) => {
      const items = (phase.topics && phase.topics.length > 0) ? phase.topics : (phase.milestones || []);
      items.forEach((item: any) => {
        totalRoadmapTasks++;
        if (item.completed) roadmapTasksCompleted++;
      });
    });
  }

  const savedJobsCount = savedJobIds.length;
  const githubProjectsAnalyzed = store.githubAnalysis?.repositories?.length || 0;

  const stats = {
    questionsSolved,
    mockInterviews,
    roadmapTasksCompleted,
    totalRoadmapTasks,
    savedJobsCount,
    githubProjectsAnalyzed,
  };

  // 2. Module Progress Percentages (0-100)
  const resumeScore = store.resumeAnalysis?.atsScore ? Math.round(Number(store.resumeAnalysis.atsScore)) : 0;

  let roadmapScore = 0;
  if (totalRoadmapTasks > 0) {
    roadmapScore = Math.round((roadmapTasksCompleted / totalRoadmapTasks) * 100);
  } else if (store.roadmap) {
    roadmapScore = 30; // generated but no milestones marked yet
  }

  let codingScore = 0;
  if (store.codingHistory.length > 0) {
    const avgScore = store.codingHistory.reduce((acc, c) => acc + (c.score || 70), 0) / store.codingHistory.length;
    const volumeWeight = Math.min(1, store.codingHistory.length / 10);
    codingScore = Math.round(avgScore * 0.7 + volumeWeight * 30);
  }

  let interviewScore = 0;
  if (store.interviewHistory.length > 0) {
    const avgInterview = store.interviewHistory.reduce((acc, s) => acc + (s.score || 65), 0) / store.interviewHistory.length;
    interviewScore = Math.round(avgInterview);
  }

  let jobMatchScore = 0;
  if (savedJobIds.length > 0) {
    jobMatchScore = Math.min(100, Math.round(savedJobIds.length * 20));
  }

  let githubScore = 0;
  if (store.githubAnalysis?.portfolioScore?.overall) {
    githubScore = Math.round(Number(store.githubAnalysis.portfolioScore.overall));
  }

  const moduleProgress = {
    resume: Math.min(100, resumeScore),
    roadmap: Math.min(100, roadmapScore),
    coding: Math.min(100, codingScore),
    interview: Math.min(100, interviewScore),
    jobMatch: Math.min(100, jobMatchScore),
    github: Math.min(100, githubScore),
  };

  // 3. Category Breakdown Scores & Overall Progress
  const activeSkillScores: number[] = [];
  if (moduleProgress.resume > 0) activeSkillScores.push(moduleProgress.resume);
  if (moduleProgress.roadmap > 0) activeSkillScores.push(moduleProgress.roadmap);
  if (moduleProgress.github > 0) activeSkillScores.push(moduleProgress.github);
  const skills = activeSkillScores.length > 0
    ? Math.round(activeSkillScores.reduce((a, b) => a + b, 0) / activeSkillScores.length)
    : 0;

  const projects = moduleProgress.github > 0 ? moduleProgress.github : 0;
  const coding = moduleProgress.coding;
  const interview = moduleProgress.interview;
  const resume = moduleProgress.resume;

  const activeValues = [resume, skills, projects, coding, interview].filter((v) => v > 0);
  const overallProgress = activeValues.length > 0
    ? Math.round(activeValues.reduce((a, b) => a + b, 0) / activeValues.length)
    : 0;

  let readinessScore = 0;
  if (activeValues.length > 0) {
    readinessScore = Math.round(
      resume * 0.25 +
      projects * 0.20 +
      coding * 0.20 +
      interview * 0.20 +
      skills * 0.15
    );
  }
  readinessScore = Math.min(98, Math.max(0, readinessScore));

  const scoresBreakdown = {
    skills,
    projects,
    coding,
    interview,
    resume,
    overallProgress,
    readinessScore,
  };

  // 4. Weekly Activity (Monday through Sunday)
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const today = new Date();
  const dayOfWeek = (today.getDay() + 6) % 7; // 0 = Mon, 6 = Sun
  const hasAnyActivity =
    store.codingHistory.length > 0 ||
    store.interviewHistory.length > 0 ||
    Boolean(store.githubAnalysis) ||
    Boolean(store.resumeAnalysis) ||
    Boolean(store.roadmap);

  const weeklyActivity = days.map((name, index) => {
    const isActive = hasAnyActivity && index <= dayOfWeek && (index % 2 === 0 || index === dayOfWeek);
    return {
      day: name,
      active: isActive,
    };
  });

  const streak = hasAnyActivity ? Math.max(1, (dayOfWeek + 1)) : 0;

  // 5. Recent Activity Stream
  const recentActivities: { title: string; date: string; type: string }[] = [];

  if (store.codingHistory.length > 0) {
    store.codingHistory.slice(0, 2).forEach((c) => {
      recentActivities.push({
        title: `Solved ${c.title || c.topic || "Coding Problem"} (${c.score || 85}%)`,
        date: c.timestamp || "Recent",
        type: "coding",
      });
    });
  }

  if (store.interviewHistory.length > 0) {
    store.interviewHistory.slice(0, 2).forEach((i) => {
      recentActivities.push({
        title: `Completed ${i.role || "Technical"} Mock Interview (${i.score || 75}%)`,
        date: i.date || "Recent",
        type: "interview",
      });
    });
  }

  if (store.roadmap?.targetRole) {
    recentActivities.push({
      title: `Progress in ${store.roadmap.targetRole} Roadmap (${roadmapTasksCompleted}/${totalRoadmapTasks || 4} milestones)`,
      date: "Recent",
      type: "roadmap",
    });
  }

  if (store.githubAnalysis?.profile?.username) {
    recentActivities.push({
      title: `Analyzed GitHub Portfolio (@${store.githubAnalysis.profile.username}) - Score: ${store.githubAnalysis.portfolioScore?.overall || 75}%`,
      date: "Recent",
      type: "github",
    });
  }

  if (store.resumeAnalysis) {
    recentActivities.push({
      title: `Analyzed Resume (ATS Score: ${store.resumeAnalysis.atsScore || 75}%)`,
      date: "Recent",
      type: "resume",
    });
  }

  if (recentActivities.length === 0) {
    recentActivities.push(
      { title: "No activity yet", date: "Today", type: "system" }
    );
  }

  // 6. Dynamic AI Recommendation
  const suggestions: string[] = [];
  if (moduleProgress.resume === 0) suggestions.push("upload your resume to unlock ATS analysis");
  if (moduleProgress.coding < 60) suggestions.push("dedicate time to coding practice");
  if (moduleProgress.interview < 60) suggestions.push("take a voice mock interview session");
  if (moduleProgress.github === 0) suggestions.push("analyze your GitHub repositories");
  if (moduleProgress.roadmap === 0) suggestions.push("start your AI Career Roadmap milestones");

  let aiRecommendation: string;
  if (!hasAnyActivity) {
    aiRecommendation = "Welcome to Career Orbit! Start by analyzing your resume or setting up your AI Career Roadmap to build your readiness metrics.";
  } else if (suggestions.length === 0) {
    aiRecommendation = "You are making excellent progress across all modules. Keep maintaining consistency in coding practice and mock interviews this week.";
  } else if (suggestions.length === 1) {
    aiRecommendation = `You are making solid progress. Focus on ${suggestions[0]} this week to further elevate your career readiness.`;
  } else {
    aiRecommendation = `You are making good progress. To accelerate your preparation, focus on ${suggestions[0]} and ${suggestions[1]} this week.`;
  }

  // Next step suggestion for Dashboard hero
  let nextStep = "Practice Arrays and Strings";
  if (moduleProgress.resume === 0) nextStep = "Analyze your resume for ATS gaps";
  else if (moduleProgress.roadmap === 0) nextStep = "Generate your personalized AI Roadmap";
  else if (moduleProgress.coding < 60) nextStep = "Complete 2 DSA Coding Challenges";
  else if (moduleProgress.interview < 60) nextStep = "Complete a Technical Voice Mock Interview";
  else if (moduleProgress.github === 0) nextStep = "Audit your GitHub portfolio repositories";

  return {
    readinessScore: readinessScore,
    overallProgress,
    moduleProgress,
    scoresBreakdown,
    scores: {
      resume: scoresBreakdown.resume,
      skills: scoresBreakdown.skills,
      projects: scoresBreakdown.projects,
      coding: scoresBreakdown.coding,
      interview: scoresBreakdown.interview,
      interviews: scoresBreakdown.interview,
      roadmap: moduleProgress.roadmap,
      github: moduleProgress.github,
    },
    stats,
    weeklyActivity,
    weeklyGoal: store.weeklyGoal,
    streak: streak,
    recentActivities: recentActivities.slice(0, 5),
    recentActivity: recentActivities.slice(0, 4).map((a) => a.title),
    aiRecommendation,
    nextStep: hasAnyActivity ? nextStep : "Explore Career Orbit modules to start your progress",
    targetRole: store.roadmap?.targetRole || "Software Developer",
  };
}
