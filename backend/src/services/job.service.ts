import { env } from "../config/environment.js";

export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  jobType: "Full Time" | "Internship" | "Contract" | "Remote";
  experienceLevel: "Fresher" | "0-1 Years" | "1-3 Years" | "3+ Years";
  requiredSkills: string[];
  salaryRange?: string;
  description: string;
  postedDate: string;
  url: string;
}

export interface JobMatchResult extends JobListing {
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
}

// Realistic job database for early-career & developer roles
// Can easily be connected to an external live job API (e.g. Adzuna, JSearch) in the future
export const DEFAULT_JOBS: JobListing[] = [
  {
    id: "job-mern-01",
    title: "MERN Stack Developer",
    company: "Infosys Digital Labs",
    location: "Ahmedabad, Gujarat",
    jobType: "Full Time",
    experienceLevel: "Fresher",
    requiredSkills: ["React", "Node.js", "MongoDB", "Express", "JavaScript"],
    salaryRange: "₹4.5 - ₹6.5 LPA",
    description: "Build robust web applications using the MERN stack. Collaborate with UI designers to build accessible interfaces and write clean REST APIs.",
    postedDate: "2026-09-14",
    url: "https://www.infosys.com/careers"
  },
  {
    id: "job-mern-02",
    title: "Junior Full Stack Engineer (MERN)",
    company: "TCS Interactive",
    location: "Vadodara, Gujarat",
    jobType: "Full Time",
    experienceLevel: "0-1 Years",
    requiredSkills: ["React", "Node.js", "Express", "MongoDB", "TypeScript", "Docker"],
    salaryRange: "₹4.8 - ₹7.2 LPA",
    description: "Join our agile engineering unit developing scalable cloud portals. Experience with TypeScript and basic containerization is a plus.",
    postedDate: "2026-09-15",
    url: "https://www.tcs.com/careers"
  },
  {
    id: "job-fe-01",
    title: "Frontend Developer",
    company: "Cognizant Studio",
    location: "Remote",
    jobType: "Remote",
    experienceLevel: "Fresher",
    requiredSkills: ["React", "JavaScript", "HTML", "CSS", "Tailwind CSS"],
    salaryRange: "₹4.0 - ₹5.8 LPA",
    description: "Create pixel-perfect, responsive user interfaces. Work closely with product managers and backend teams to integrate GraphQL/REST endpoints.",
    postedDate: "2026-09-16",
    url: "https://careers.cognizant.com"
  },
  {
    id: "job-be-01",
    title: "Backend Node.js Developer",
    company: "Persistent Systems",
    location: "Ahmedabad, Gujarat",
    jobType: "Full Time",
    experienceLevel: "1-3 Years",
    requiredSkills: ["Node.js", "Express", "MongoDB", "PostgreSQL", "Docker", "AWS"],
    salaryRange: "₹6.5 - ₹9.0 LPA",
    description: "Design and maintain high-throughput backend services and microservices. Monitor latency, database queries, and deployment pipelines.",
    postedDate: "2026-09-12",
    url: "https://www.persistent.com/careers"
  },
  {
    id: "job-mern-03",
    title: "MERN Stack Intern",
    company: "Crest Data Systems",
    location: "Ahmedabad, Gujarat",
    jobType: "Internship",
    experienceLevel: "Fresher",
    requiredSkills: ["React", "JavaScript", "Node.js", "MongoDB", "Git"],
    salaryRange: "₹25,000 / month",
    description: "3-6 month internship building modern SaaS dashboards with mentoring from senior architects. Strong conversion probability for high performers.",
    postedDate: "2026-09-16",
    url: "https://www.crestdatasys.com/careers"
  },
  {
    id: "job-fe-02",
    title: "Junior React Developer",
    company: "LTIMindtree",
    location: "Vadodara, Gujarat",
    jobType: "Full Time",
    experienceLevel: "0-1 Years",
    requiredSkills: ["React", "JavaScript", "Redux", "REST APIs", "Git"],
    salaryRange: "₹4.2 - ₹6.0 LPA",
    description: "Develop component-driven single page applications. Write unit tests and participate in sprint planning sessions.",
    postedDate: "2026-09-13",
    url: "https://www.ltimindtree.com/careers"
  },
  {
    id: "job-fs-01",
    title: "Full Stack Web Developer",
    company: "Tech Mahindra",
    location: "Remote",
    jobType: "Remote",
    experienceLevel: "1-3 Years",
    requiredSkills: ["React", "Node.js", "Express", "TypeScript", "AWS", "Jest"],
    salaryRange: "₹7.0 - ₹10.5 LPA",
    description: "Develop enterprise customer engagement platforms. End-to-end responsibility from frontend features to backend cloud architectures.",
    postedDate: "2026-09-11",
    url: "https://careers.techmahindra.com"
  },
  {
    id: "job-intern-01",
    title: "Software Engineering Intern - Web",
    company: "Wipro Digital",
    location: "Vadodara, Gujarat",
    jobType: "Internship",
    experienceLevel: "Fresher",
    requiredSkills: ["JavaScript", "HTML", "CSS", "React", "Node.js"],
    salaryRange: "₹20,000 / month",
    description: "Hands-on internship for final-year students and fresh graduates. Learn production deployment workflows, code reviews, and CI/CD pipelines.",
    postedDate: "2026-09-15",
    url: "https://careers.wipro.com"
  },
  {
    id: "job-py-01",
    title: "Junior Python / Backend Developer",
    company: "Tata Consultancy Services",
    location: "Ahmedabad, Gujarat",
    jobType: "Full Time",
    experienceLevel: "0-1 Years",
    requiredSkills: ["Python", "Django", "PostgreSQL", "REST APIs", "Git"],
    salaryRange: "₹4.5 - ₹6.2 LPA",
    description: "Implement API endpoints and background processing jobs using Python and Django. Collaborate with AI/ML teams on data pipelines.",
    postedDate: "2026-09-10",
    url: "https://www.tcs.com/careers"
  },
  {
    id: "job-fe-03",
    title: "Frontend UI Intern",
    company: "TatvaSoft",
    location: "Ahmedabad, Gujarat",
    jobType: "Internship",
    experienceLevel: "Fresher",
    requiredSkills: ["React", "JavaScript", "CSS", "Figma", "Tailwind CSS"],
    salaryRange: "₹18,000 / month",
    description: "Translate Figma designs into high-performance web components. Work on internal tooling and client showcase portals.",
    postedDate: "2026-09-16",
    url: "https://www.tatvasoft.com/careers"
  },
  {
    id: "job-cloud-01",
    title: "Cloud & DevOps Associate",
    company: "Etech Global Services",
    location: "Vadodara, Gujarat",
    jobType: "Full Time",
    experienceLevel: "0-1 Years",
    requiredSkills: ["Linux", "Docker", "AWS", "Git", "Node.js"],
    salaryRange: "₹5.0 - ₹7.0 LPA",
    description: "Manage containerized environments and cloud infrastructure. Configure automated monitoring, backups, and security baselines.",
    postedDate: "2026-09-14",
    url: "https://www.etechgs.com/careers"
  },
  {
    id: "job-mern-04",
    title: "MERN Stack Engineer",
    company: "Zuru Tech India",
    location: "Ahmedabad, Gujarat",
    jobType: "Full Time",
    experienceLevel: "1-3 Years",
    requiredSkills: ["React", "Node.js", "MongoDB", "Express", "Docker", "Redis"],
    salaryRange: "₹8.0 - ₹12.0 LPA",
    description: "Engineering high-traffic e-commerce and internal logistics platforms. Focus on database query optimization and clean service architecture.",
    postedDate: "2026-09-15",
    url: "https://zuru.tech/careers"
  },
  {
    id: "job-mern-05",
    title: "MERN Developer",
    company: "Simform Solutions",
    location: "Ahmedabad, Gujarat",
    jobType: "Full Time",
    experienceLevel: "Fresher",
    requiredSkills: ["React", "Node.js", "Express", "MongoDB", "JavaScript"],
    salaryRange: "₹4.5 - ₹6.8 LPA",
    description: "Build scalable cloud-native web apps. Work with modern React hooks, Node microservices, and MongoDB aggregations.",
    postedDate: "2026-09-16",
    url: "https://www.simform.com/careers"
  },
  {
    id: "job-mern-06",
    title: "Junior MERN Developer",
    company: "Gateway Group",
    location: "Vadodara, Gujarat",
    jobType: "Full Time",
    experienceLevel: "Fresher",
    requiredSkills: ["React", "JavaScript", "Node.js", "MongoDB", "Git"],
    salaryRange: "₹4.2 - ₹6.0 LPA",
    description: "Collaborate in an agile team delivering cutting-edge digital portals. Strong foundation in JavaScript and REST APIs required.",
    postedDate: "2026-09-15",
    url: "https://www.gatewaygroup.com/careers"
  },
  {
    id: "job-fe-04",
    title: "React Developer Intern",
    company: "Radixweb",
    location: "Remote",
    jobType: "Internship",
    experienceLevel: "Fresher",
    requiredSkills: ["React", "JavaScript", "HTML", "CSS", "Tailwind CSS"],
    salaryRange: "₹22,000 / month",
    description: "Exciting internship opportunity building responsive SPAs. Great learning environment with senior engineers.",
    postedDate: "2026-09-16",
    url: "https://radixweb.com/careers"
  }
];

// Helper: normalize skill string for fuzzy/case-insensitive matching
const normalizeSkill = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]/g, "");

// Calculate profile-to-job match score and skill breakdown
export function calculateJobMatch(job: JobListing, candidateSkills: string[]): JobMatchResult {
  const normCandidate = candidateSkills.map(normalizeSkill).filter(Boolean);
  
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const skill of job.requiredSkills) {
    const norm = normalizeSkill(skill);
    const hasMatch = normCandidate.some(cs => cs === norm || cs.includes(norm) || norm.includes(cs));
    if (hasMatch) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  }

  // Calculate score (0-100)
  const total = job.requiredSkills.length;
  let matchScore = 0;
  if (total > 0) {
    const rawScore = (matchedSkills.length / total) * 100;
    // Add baseline relevancy weight if at least 1 skill matches
    matchScore = Math.min(98, Math.max(15, Math.round(rawScore)));
  }

  return {
    ...job,
    matchScore,
    matchedSkills,
    missingSkills
  };
}

// In-memory store for user saved jobs (fallback and persistence across sessions)
const userSavedJobsStore = new Map<string, Set<string>>();

export function getSavedJobIds(userId: string): string[] {
  return Array.from(userSavedJobsStore.get(userId) || []);
}

export function toggleSavedJob(userId: string, jobId: string): { isSaved: boolean; savedJobIds: string[] } {
  let userSet = userSavedJobsStore.get(userId);
  if (!userSet) {
    userSet = new Set<string>();
    userSavedJobsStore.set(userId, userSet);
  }

  const isCurrentlySaved = userSet.has(jobId);
  if (isCurrentlySaved) {
    userSet.delete(jobId);
    // Asynchronously update PostgreSQL
    import("../models/JobActivity.js").then(({ JobActivity }) => {
      JobActivity.update({ isSaved: false }, { where: { userId, jobId } }).catch(() => null);
    });
    return { isSaved: false, savedJobIds: Array.from(userSet) };
  } else {
    userSet.add(jobId);
    // Asynchronously update PostgreSQL
    import("../models/JobActivity.js").then(({ JobActivity }) => {
      const jobItem = DEFAULT_JOBS.find(j => j.id === jobId);
      JobActivity.create({
        userId,
        jobId,
        role: jobItem?.title || "Job",
        company: jobItem?.company || "Company",
        location: jobItem?.location || "Location",
        isSaved: true,
        details: jobItem || null,
      }).catch(() => null);
    });
    return { isSaved: true, savedJobIds: Array.from(userSet) };
  }
}

// AI Recommendation generator using Gemini with algorithmic fallback
export async function generateAIRecommendation(
  userSkills: string[],
  targetRole: string,
  matchedJobs: JobMatchResult[]
): Promise<string> {
  // Aggregate common missing skills across top jobs
  const missingCounts = new Map<string, number>();
  for (const j of matchedJobs.slice(0, 5)) {
    for (const ms of j.missingSkills) {
      missingCounts.set(ms, (missingCounts.get(ms) || 0) + 1);
    }
  }

  const sortedMissing = Array.from(missingCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0]);

  const topMissing = sortedMissing.slice(0, 2);

  // If Gemini API Key is present, request a concise recommendation
  if (env.geminiApiKey) {
    const models = ["gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.7-flash", "gemini-flash-latest"];
    const prompt = `You are a Career Coach AI for the Career Orbit platform.
A student/developer has skills: [${userSkills.join(", ")}].
Target Role: "${targetRole || "Software Developer"}".
Top matched jobs have common missing skills: [${topMissing.join(", ")}].
Generate exactly 1-2 concise, encouraging sentences advising what skills to improve to maximize their job match rate.
Example: "These jobs match your current skills. Improve Docker and AWS to increase the number of matching backend/full-stack roles."
Do not use bullet points or markdown headings. Keep it under 35 words.`;

    for (const model of models) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.geminiApiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }]
            })
          }
        );

        if (response.ok) {
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (text) {
            return text.replace(/^"|"$/g, "").trim();
          }
        }
      } catch (err) {
        console.warn(`Gemini recommendation fallback with ${model}:`, err);
      }
    }
  }

  // Robust algorithmic fallback
  if (topMissing.length > 0) {
    return `These jobs match your current skills. Improve ${topMissing.join(" and ")} to increase the number of matching ${targetRole || "developer"} roles.`;
  }
  return `Great profile alignment! Your current skills match the core requirements for these ${targetRole || "developer"} positions.`;
}
