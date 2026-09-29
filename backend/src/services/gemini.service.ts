import { GoogleGenAI } from "@google/genai";
import { env } from "../config/environment.js";

// Initialize Gemini Client with process.env.GEMINI_API_KEY
const apiKey = env.geminiApiKey || process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

// Prioritized list of active Gemini models
const MODELS = ["gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.7-flash", "gemini-flash-latest"];

/**
 * Robust helper to call Gemini generateContent with fallback models
 */
async function callGemini(contents: any, responseSchemaDesc?: string): Promise<string> {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in backend environment.");
  }

  let lastError: any = null;

  for (const model of MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
      });

      const text = response.text?.trim();
      if (text) {
        return text;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[GeminiService] Model ${model} failed, trying next fallback... Reason:`, err?.message || err);
    }
  }

  throw new Error(
    `Gemini API failed with all available models. Last error: ${lastError?.message || "Service temporarily unavailable"}`
  );
}

/**
 * Safely parse JSON from Gemini text response, removing codeblocks if present
 */
function parseJson<T>(raw: string): T {
  let cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  const firstBrace = cleaned.indexOf("{");
  const firstBracket = cleaned.indexOf("[");
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    const lastBrace = cleaned.lastIndexOf("}");
    if (lastBrace !== -1) cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  } else if (firstBracket !== -1) {
    const lastBracket = cleaned.lastIndexOf("]");
    if (lastBracket !== -1) cleaned = cleaned.slice(firstBracket, lastBracket + 1);
  }
  return JSON.parse(cleaned) as T;
}

// ==========================================
// 1. RESUME ANALYZER
// ==========================================

export interface AnalyzeResumeParams {
  fileBuffer: Buffer;
  mimeType: string;
  fileName: string;
  jobDescription?: string;
}

export async function analyzeResume(params: AnalyzeResumeParams): Promise<any> {
  const isPdf = params.mimeType === "application/pdf" || params.fileName.toLowerCase().endsWith(".pdf");
  const parts: any[] = [];

  if (isPdf) {
    parts.push({
      inlineData: {
        mimeType: "application/pdf",
        data: params.fileBuffer.toString("base64"),
      },
    });
  } else {
    parts.push({
      text: `Resume Text Content:\n${params.fileBuffer.toString("utf-8")}`,
    });
  }

  if (params.jobDescription) {
    parts.push({
      text: `Target Job Description to match against:\n${params.jobDescription}`,
    });
  }

  parts.push({
    text: `You are a Senior Technical Recruiter and Principal ATS Resume Auditor.
Analyze the provided resume with high precision.
Extract and compute real ATS compatibility, skills match, strength analysis, critical gaps, and section feedback.
Return strictly a valid JSON object matching this schema without any markdown wrapping:
{
  "atsScore": <number 0-100 based on ATS formatting, keyword density, metrics>,
  "candidateName": "<Candidate Name or 'Candidate'>",
  "fileName": "${params.fileName.replace(/"/g, "")}",
  "summary": "<2-3 sentence executive assessment of the resume>",
  "categoryScores": {
    "atsCompatibility": <number 0-100>,
    "skills": <number 0-100>,
    "experience": <number 0-100>,
    "projects": <number 0-100>,
    "education": <number 0-100>,
    "formatting": <number 0-100>,
    "keywords": <number 0-100>
  },
  "jobMatch": {
    "overallMatch": <number 0-100>,
    "experienceMatch": <number 0-100>,
    "matchedSkills": ["skill1", "skill2", "skill3", "skill4"],
    "missingKeywords": ["keyword1", "keyword2", "keyword3"]
  },
  "changesRequired": [
    {
      "section": "<Section Name>",
      "issue": "<Deficiency identified in resume>",
      "exactChange": "<Concrete rewrite or modification recommendation>"
    }
  ],
  "sectionAnalysis": [
    { "section": "Contact Information", "score": <0-100>, "status": "Good" | "Needs Improvement" | "Critical", "feedback": "<text>" },
    { "section": "Career Objective / Summary", "score": <0-100>, "status": "Good" | "Needs Improvement" | "Critical", "feedback": "<text>" },
    { "section": "Skills", "score": <0-100>, "status": "Good" | "Needs Improvement" | "Critical", "feedback": "<text>" },
    { "section": "Experience", "score": <0-100>, "status": "Good" | "Needs Improvement" | "Critical", "feedback": "<text>" },
    { "section": "Projects", "score": <0-100>, "status": "Good" | "Needs Improvement" | "Critical", "feedback": "<text>" },
    { "section": "Education", "score": <0-100>, "status": "Good" | "Needs Improvement" | "Critical", "feedback": "<text>" },
    { "section": "Certifications", "score": <0-100>, "status": "Good" | "Needs Improvement" | "Critical", "feedback": "<text>" }
  ],
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>", "<weakness 3>"],
  "missingSkills": ["<missing skill 1>", "<missing skill 2>", "<missing skill 3>"],
  "suggestions": ["<actionable suggestion 1>", "<actionable suggestion 2>", "<actionable suggestion 3>"],
  "recommendedRoles": ["<role 1>", "<role 2>", "<role 3>"]
}`,
  });

  const raw = await callGemini([{ parts }]);
  return parseJson(raw);
}

// ==========================================
// 2. AI ROADMAP GENERATOR
// ==========================================

export interface GenerateRoadmapParams {
  targetRole: string;
  skillLevel: string;
  studyTime: string;
  goal: string;
  resumeSkills?: string[];
  missingSkills?: string[];
}

export async function generateRoadmap(params: GenerateRoadmapParams): Promise<any> {
  const prompt = `You are a Principal Career Architect and Tech Lead.
Generate a structured, industry-tailored learning roadmap for:
- Target Role: ${params.targetRole}
- Skill Level: ${params.skillLevel}
- Daily Study Time: ${params.studyTime}
- Career Goal: ${params.goal}
${params.resumeSkills?.length ? `- Verified Existing Skills from Resume: ${params.resumeSkills.join(", ")}` : ""}
${params.missingSkills?.length ? `- Identified Skill Gaps to Bridge: ${params.missingSkills.join(", ")}` : ""}

Generate exactly 4 comprehensive, chronological phases.
Return strictly a valid JSON object matching this schema:
{
  "title": "${params.targetRole} Mastery Roadmap",
  "targetRole": "${params.targetRole}",
  "skillLevel": "${params.skillLevel}",
  "studyTime": "${params.studyTime}",
  "goal": "${params.goal}",
  "currentFocus": "<Name of the first core foundational topic>",
  "currentFocusReason": "<1-2 sentences explaining why this focus comes first>",
  "aiRecommendation": "<Strategic guidance for succeeding in this roadmap>",
  "phases": [
    {
      "phaseId": 1,
      "title": "Phase 1: <Foundation Title>",
      "subtitle": "<Time estimate, e.g. Weeks 1-3>",
      "topics": [
        {
          "id": "t1",
          "title": "<Specific Topic or Tool>",
          "description": "<What to master and practical exercise to complete>",
          "completed": false
        },
        {
          "id": "t2",
          "title": "<Specific Topic or Tool>",
          "description": "<What to master and practical exercise to complete>",
          "completed": false
        },
        {
          "id": "t3",
          "title": "<Specific Topic or Tool>",
          "description": "<What to master and practical exercise to complete>",
          "completed": false
        }
      ]
    },
    {
      "phaseId": 2,
      "title": "Phase 2: <Core Specialization Title>",
      "subtitle": "<Weeks 4-7>",
      "topics": [
        { "id": "t4", "title": "<Topic>", "description": "<Description>", "completed": false },
        { "id": "t5", "title": "<Topic>", "description": "<Description>", "completed": false },
        { "id": "t6", "title": "<Topic>", "description": "<Description>", "completed": false }
      ]
    },
    {
      "phaseId": 3,
      "title": "Phase 3: <Advanced Architecture & Real Projects>",
      "subtitle": "<Weeks 8-10>",
      "topics": [
        { "id": "t7", "title": "<Topic>", "description": "<Description>", "completed": false },
        { "id": "t8", "title": "<Topic>", "description": "<Description>", "completed": false },
        { "id": "t9", "title": "<Topic>", "description": "<Description>", "completed": false }
      ]
    },
    {
      "phaseId": 4,
      "title": "Phase 4: <Deployment, Portfolio & Interview Readiness>",
      "subtitle": "<Weeks 11-12>",
      "topics": [
        { "id": "t10", "title": "<Topic>", "description": "<Description>", "completed": false },
        { "id": "t11", "title": "<Topic>", "description": "<Description>", "completed": false },
        { "id": "t12", "title": "<Topic>", "description": "<Description>", "completed": false }
      ]
    }
  ]
}`;

  const raw = await callGemini(prompt);
  return parseJson(raw);
}

// ==========================================
// 3. CODING PRACTICE: QUESTION GENERATION
// ==========================================

export interface GenerateCodingQuestionParams {
  topic: string;
  difficulty: string;
  language: string;
}

export async function generateCodingQuestion(params: GenerateCodingQuestionParams): Promise<any> {
  const prompt = `You are a Technical Interview Engineer at a top tier software company.
Generate an authentic algorithmic coding challenge tailored to:
- Topic: ${params.topic}
- Difficulty: ${params.difficulty}
- Programming Language: ${params.language}

Return strictly a valid JSON object matching this schema:
{
  "title": "<Problem Title, e.g. Valid Palindrome or Two Sum II>",
  "difficulty": "${params.difficulty}",
  "topic": "${params.topic}",
  "language": "${params.language}",
  "problem": "<Clear, concise problem description including requirements and edge case instructions>",
  "examples": [
    {
      "input": "<Sample input>",
      "output": "<Sample expected output>",
      "explanation": "<Brief explanation of the example>"
    },
    {
      "input": "<Second sample input>",
      "output": "<Second sample output>",
      "explanation": "<Brief explanation>"
    }
  ],
  "constraints": [
    "<e.g. 1 <= nums.length <= 10^5>",
    "<e.g. -10^9 <= nums[i] <= 10^9>"
  ],
  "starterCode": "<Standard function stub in ${params.language} with proper types or docstring>"
}`;

  const raw = await callGemini(prompt);
  return parseJson(raw);
}

// ==========================================
// 4. CODING PRACTICE: EVALUATE CODE
// ==========================================

export interface EvaluateCodeParams {
  problem: any;
  userCode: string;
  language: string;
  topic?: string;
}

export async function evaluateCode(params: EvaluateCodeParams): Promise<any> {
  const prompt = `You are an Automated Code Evaluation Engine and Senior Code Reviewer.
Analyze this submitted code for correctness, time complexity, space complexity, and code quality.

Problem:
Title: ${params.problem?.title || "Coding Challenge"}
Topic: ${params.problem?.topic || params.topic || "Algorithms"}
Difficulty: ${params.problem?.difficulty || "Medium"}
Description: ${params.problem?.problem || ""}
Constraints: ${JSON.stringify(params.problem?.constraints || [])}
Language: ${params.language}

Submitted Code:
\`\`\`${params.language.toLowerCase()}
${params.userCode}
\`\`\`

Evaluate carefully:
- Does it correctly handle standard cases and edge cases (empty input, negatives, large sizes)?
- What is the asymptotic Time Complexity and Space Complexity?
- Assign realistic scores (0-100).
- Passed must be true only if the logic is correct and handles key edge cases.

Return strictly a valid JSON object matching this schema:
{
  "score": <overall score number 0-100>,
  "passed": <boolean true or false>,
  "correctness": <number 0-100>,
  "codeQuality": <number 0-100>,
  "efficiency": <number 0-100>,
  "timeComplexity": "<e.g. O(n) or O(n^2)>",
  "spaceComplexity": "<e.g. O(1) or O(n)>",
  "observations": [
    "<observation 1 about implementation>",
    "<observation 2 about edge case or structure>"
  ],
  "feedback": "<2-3 sentence actionable constructive review>"
}`;

  const raw = await callGemini(prompt);
  return parseJson(raw);
}

// ==========================================
// 5. CODING PRACTICE: HINT & SOLUTION
// ==========================================

export async function generateCodingHint(params: { problem: any; userCode: string; language: string }): Promise<string> {
  const prompt = `You are a helpful coding coach. Give ONE thoughtful, nudging hint for this problem without giving away the full solution code.
Problem: ${params.problem?.title || ""}
Description: ${params.problem?.problem || ""}
User's Current Code:
${params.userCode}

Provide 2-3 sentences pointing out the key insight or data structure to use.`;

  const raw = await callGemini(prompt);
  return raw.replace(/```/g, "").trim();
}

export async function generateCodingSolution(params: { problem: any; language: string }): Promise<any> {
  const prompt = `You are a Senior Staff Engineer. Provide the optimal solution for this coding problem in ${params.language}.
Problem: ${params.problem?.title || ""}
Description: ${params.problem?.problem || ""}

Return strictly a valid JSON object matching this schema:
{
  "solutionCode": "<Optimal clean solution code in ${params.language} with clear comments>",
  "timeComplexity": "<e.g. O(n)>",
  "spaceComplexity": "<e.g. O(1)>",
  "explanation": "<Concise walkthrough of why this approach is optimal>"
}`;

  const raw = await callGemini(prompt);
  return parseJson(raw);
}

// ==========================================
// 6. MOCK INTERVIEW: QUESTIONS & EVALUATION
// ==========================================

export interface StartInterviewParams {
  role: string;
  experience: string;
  interviewType: string;
  difficulty: string;
  questionCount: number;
  resumeContext?: string;
}

export async function startInterview(params: StartInterviewParams): Promise<any> {
  const prompt = `You are a Principal Engineering Hiring Manager at a top tech company.
Conduct an interview for:
- Role: ${params.role}
- Experience Level: ${params.experience}
- Interview Style: ${params.interviewType}
- Target Difficulty: ${params.difficulty}
- Number of Questions to generate: ${params.questionCount || 5}
${params.resumeContext ? `Candidate Resume Context:\n${params.resumeContext}` : ""}

Generate realistic, high-signal interview questions tailored to the candidate's exact role and experience.
Return strictly a valid JSON object matching this schema:
{
  "questions": [
    {
      "id": 1,
      "question": "<Thought-provoking interview question>",
      "category": "<e.g. Core Architecture | State Management | Problem Solving | System Design | Behavioral>",
      "difficulty": "${params.difficulty}",
      "hints": "<Helpful interviewer cue or context to look for>"
    }
  ]
}`;

  const raw = await callGemini(prompt);
  return parseJson(raw);
}

export interface EvaluateInterviewAnswerParams {
  role: string;
  question: string;
  category: string;
  answer: string;
  duration?: number;
  wpm?: number;
  fillerCount?: number;
}

export async function evaluateInterviewAnswer(params: EvaluateInterviewAnswerParams): Promise<any> {
  const prompt = `You are an Executive Tech Interview Coach evaluating a candidate's spoken interview response.
Role: ${params.role}
Question: "${params.question}" (${params.category})
Candidate's Spoken Answer: "${params.answer}"
Speaking Duration: ${params.duration || 30} seconds | Speech Rate: ${params.wpm || 120} WPM | Filler Words: ${params.fillerCount || 0}

Evaluate thoroughly across relevance, technical depth, communication clarity, confidence, and structure (STAR method where applicable).
Return strictly a valid JSON object matching this schema:
{
  "scores": {
    "relevance": <number 0-100>,
    "technicalKnowledge": <number 0-100>,
    "communication": <number 0-100>,
    "confidence": <number 0-100>,
    "structure": <number 0-100>,
    "problemSolving": <number 0-100>
  },
  "overallScore": <number 0-100>,
  "feedback": "<2-3 sentence personalized feedback on the candidate's response>",
  "strengths": ["<key strength 1>", "<key strength 2>"],
  "improvements": ["<concrete area to improve 1>", "<concrete area to improve 2>"],
  "followUpQuestion": "<1 sharp follow-up question or null if comprehensive>",
  "idealAnswer": "<2-3 sentences exemplifying a high-scoring answer to this question>"
}`;

  const raw = await callGemini(prompt);
  return parseJson(raw);
}

export interface SummarizeInterviewParams {
  role: string;
  experience: string;
  type: string;
  historyItems: any[];
}

export async function summarizeInterview(params: SummarizeInterviewParams): Promise<any> {
  const prompt = `You are the Lead Hiring Committee Chair.
Summarize the full completed interview session for:
Role: ${params.role}
Level: ${params.experience}
Type: ${params.type}

Candidate Answer History & Question Scores:
${JSON.stringify(params.historyItems, null, 2)}

Provide a comprehensive performance synthesis, STAR technique guidance, and tailored next steps.
Return strictly a valid JSON object matching this schema:
{
  "overallScore": <weighted average score 0-100>,
  "parameterScores": {
    "relevance": <0-100>,
    "technicalKnowledge": <0-100>,
    "communication": <0-100>,
    "confidence": <0-100>,
    "structure": <0-100>,
    "problemSolving": <0-100>
  },
  "strengths": ["<top strength 1>", "<top strength 2>", "<top strength 3>"],
  "areasToImprove": ["<priority gap 1>", "<priority gap 2>", "<priority gap 3>"],
  "starAdvice": {
    "title": "Mastering the STAR Framework",
    "description": "Structure technical and behavioral responses clearly to maximize impact.",
    "situation": "Set the context and problem constraints in 1-2 concise sentences.",
    "task": "Explicitly identify your personal role and responsibility.",
    "action": "Explain the architectural choices, tools, and technical actions you took.",
    "result": "Highlight measurable outcomes, metrics, or lessons learned."
  },
  "recommendedNextSteps": [
    { "title": "Coding Practice", "text": "Strengthen foundational data structures and complexity analysis.", "link": "/coding" },
    { "title": "AI Roadmap", "text": "Review missing architectural topics in your career roadmap.", "link": "/roadmap" },
    { "title": "Resume Polish", "text": "Ensure your project bullets highlight quantifiable impact.", "link": "/resume" }
  ]
}`;

  const raw = await callGemini(prompt);
  return parseJson(raw);
}

// ==========================================
// 7. JOB MATCH: AI MATCHING
// ==========================================

export interface MatchJobsParams {
  userSkills: string[];
  targetRole: string;
  jobs: any[];
}

export async function matchJobs(params: MatchJobsParams): Promise<any> {
  const sampleJobs = params.jobs.slice(0, 15).map((j) => ({
    id: j.id,
    title: j.title,
    company: j.company,
    requiredSkills: j.requiredSkills,
  }));

  const prompt = `You are a Career Placement Director and AI Talent Matcher.
Compare the candidate's verified skills and target role against these job listings:
Candidate Target Role: ${params.targetRole}
Candidate Skills: ${params.userSkills.join(", ")}

Available Jobs:
${JSON.stringify(sampleJobs, null, 2)}

For each job, evaluate:
1. matchScore (0-100) based strictly on skills overlap and role relevance.
2. matchedSkills (array of strings from candidate's skills that match the job).
3. missingSkills (array of key skills required by the job that candidate is missing).

Also formulate 1 overarching strategic placement recommendation.

Return strictly a valid JSON object:
{
  "matches": [
    {
      "id": "<job id>",
      "matchScore": <number 0-100>,
      "matchedSkills": ["<skill>"],
      "missingSkills": ["<skill>"]
    }
  ],
  "aiRecommendation": "<1-2 sentence recommendation for maximizing placement success>"
}`;

  try {
    const raw = await callGemini(prompt);
    return parseJson(raw);
  } catch (err) {
    console.warn("[GeminiService] AI job matching fallback:", err);
    return null;
  }
}

// ==========================================
// 8. GITHUB ANALYZER: PORTFOLIO REVIEW
// ==========================================

export interface AnalyzeGithubParams {
  profileSummary: any;
  reposList: any[];
  targetRole?: string;
}

export async function analyzeGithub(params: AnalyzeGithubParams): Promise<any> {
  const repoSample = params.reposList.slice(0, 10).map((r) => ({
    name: r.name,
    description: r.description,
    language: r.language,
    stars: r.stars,
    forks: r.forks,
    hasPages: r.hasPages,
    topics: r.topics,
  }));

  const prompt = `You are a Principal Software Architect and Technical Hiring Manager.
Evaluate this developer's public GitHub portfolio based on their real GitHub data:
Username: ${params.profileSummary.username}
Bio: ${params.profileSummary.bio || "No bio"}
Public Repos: ${params.profileSummary.publicRepos}
Followers: ${params.profileSummary.followers}
Target Role: ${params.targetRole || "Software Developer"}

Repositories (up to 10):
${JSON.stringify(repoSample, null, 2)}

Evaluate strictly against real data. Do not invent repositories.
Return strictly a valid JSON object matching this schema:
{
  "portfolioScore": {
    "overall": <number 40-95>,
    "repositories": <number 40-95>,
    "activity": <number 40-95>,
    "projectQuality": <number 40-95>,
    "documentation": <number 40-95>
  },
  "recommendations": [
    "<3 to 5 concise, actionable portfolio advice points based on their actual repositories>"
  ],
  "checklist": [
    { "label": "Profile bio presents clear developer identity", "status": "completed" | "warning", "note": "<brief note>" },
    { "label": "Project READMEs include live demo and installation instructions", "status": "completed" | "warning", "note": "<brief note>" },
    { "label": "Code showcases modern tooling and tests", "status": "completed" | "warning", "note": "<brief note>" },
    { "label": "Repository topics and descriptions are complete", "status": "completed" | "warning", "note": "<brief note>" }
  ],
  "recommendedToHighlight": [
    { "name": "<Exact Repo Name>", "language": "<Language>", "reason": "<Why recruiters will appreciate this>" }
  ],
  "repoFeedback": [
    {
      "name": "<Exact Repo Name>",
      "quality": <number 50-95>,
      "feedback": "<Actionable constructive critique of this project>",
      "pros": ["<positive aspect>"],
      "cons": ["<aspect to improve>"]
    }
  ]
}`;

  const raw = await callGemini(prompt);
  return parseJson(raw);
}

// ==========================================
// 9. DYNAMIC CAREER RECOMMENDATION
// ==========================================

export async function generateCareerRecommendation(params: {
  targetRole: string;
  readinessScore: number;
  scores: Record<string, number>;
  activitySummary: string[];
}): Promise<string> {
  const prompt = `You are an AI Career Strategist.
Given the candidate's real career readiness metrics:
Target Role: ${params.targetRole}
Overall Readiness: ${params.readinessScore}%
Module Breakdown:
- Resume ATS: ${params.scores.resume || 0}%
- Coding Practice: ${params.scores.coding || 0}%
- Mock Interviews: ${params.scores.interviews || params.scores.interview || 0}%
- GitHub Portfolio: ${params.scores.github || params.scores.projects || 0}%
- AI Roadmap: ${params.scores.roadmap || 0}%
Recent Activities: ${params.activitySummary.join("; ") || "None"}

Provide 1 concise, highly motivational and strategic sentence telling the candidate exactly what high-impact step to take next.`;

  try {
    const raw = await callGemini(prompt);
    return raw.replace(/```/g, "").replace(/"/g, "").trim();
  } catch {
    return "Focus on your lowest scoring module this week to rapidly raise your overall placement readiness.";
  }
}
