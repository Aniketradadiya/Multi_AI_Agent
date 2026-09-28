import { useState } from "react";
import { api } from "../services/api";
import { ResumeAnalyzer } from "../components/ResumeAnalyzer";
import { VoiceMockInterview } from "../components/VoiceMockInterview";
import { RoadmapModule } from "../components/RoadmapModule";
import { CodingPractice } from "../components/CodingPractice";
import { JobMatch } from "../components/JobMatch";
import { GitHubAnalyzer } from "../components/GitHubAnalyzer";
import { ProgressDashboard } from "../components/ProgressDashboard";

const copy = {
  resume: ["Resume Analyzer", "Upload your resume to receive ATS feedback, skill gaps, and concrete improvements."],
  interview: ["Voice Mock Interview", "Simulate realistic hiring interviews with voice recognition, delivery metrics, and AI coaching."],
  roadmap: ["AI Career Roadmap", "Generate a personalized 4-phase learning plan that fits your target role and available study time."],
  coding: ["Coding Practice", "Improve your problem-solving skills with AI-generated coding challenges."],
  jobs: ["Job Match", "Find opportunities that match your skills and career goals."],
  github: ["GitHub Analyzer", "Turn your repositories into a stronger portfolio signal."],
  progress: ["Progress", "A clear record of your learning activity and placement preparation."]
} as const;

type Tool = keyof typeof copy;

export function ToolPage({ tool }: { tool: Tool }) {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  const action = async () => {
    setLoading(true);
    setError("");
    try {
      const requests: Record<Tool, [string, any]> = {
        resume: ["/resume/analyze", {}],
        interview: ["/interview/start", {}],
        roadmap: ["/roadmap/generate", { targetRole: input || "MERN Developer" }],
        coding: ["/coding/question", { topic: input || "Arrays", difficulty: "Easy" }],
        jobs: ["/jobs/recommendations", null],
        github: ["/github/analyze", { username: input }],
        progress: ["/progress", null]
      };
      const [url, body] = requests[tool];
      const response = body ? await api.post(url, body) : await api.get(url);
      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message ?? "This module is ready for its next API integration.");
    } finally {
      setLoading(false);
    }
  };

  const prompts: Partial<Record<Tool, string>> = {
    roadmap: "Target role",
    coding: "Topic, e.g. Arrays",
    github: "GitHub username"
  };

  return (
    <div className={`tool-page ${tool === "resume" || tool === "interview" || tool === "roadmap" || tool === "coding" || tool === "jobs" || tool === "github" || tool === "progress" ? "resume-page-wide" : ""}`}>
      <section className="tool-head">
        <p className="eyebrow">CAREER INTELLIGENCE MODULE</p>
        <h2>{copy[tool][0]}</h2>
        <p>{copy[tool][1]}</p>
      </section>

      {tool === "resume" ? (
        <ResumeAnalyzer />
      ) : tool === "interview" ? (
        <VoiceMockInterview />
      ) : tool === "roadmap" ? (
        <RoadmapModule />
      ) : tool === "coding" ? (
        <CodingPractice />
      ) : tool === "jobs" ? (
        <JobMatch />
      ) : tool === "github" ? (
        <GitHubAnalyzer />
      ) : tool === "progress" ? (
        <ProgressDashboard />
      ) : (
        <>
          <section className="panel tool-action">
            {prompts[tool] && (
              <label>
                {prompts[tool]}
                <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={prompts[tool]} />
              </label>
            )}
            <button className="primary" onClick={action} disabled={loading}>
              {loading
                ? "Working..."
                : (tool as string) === "github"
                ? "Analyze profile"
                : (tool as string) === "jobs"
                ? "Find matches"
                : (tool as string) === "coding"
                ? "Get question"
                : "Open module"}
            </button>
            {error && <p className="error">{error}</p>}
          </section>
          {result && (
            <section className="panel result">
              <h3>Results</h3>
              <pre>{JSON.stringify(result, null, 2)}</pre>
            </section>
          )}
        </>
      )}
    </div>
  );
}

