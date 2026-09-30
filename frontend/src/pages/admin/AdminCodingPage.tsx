import { useEffect, useState } from "react";
import { Code2, CheckCircle2, Award, BookOpen, Layers, RefreshCw } from "lucide-react";
import { api } from "../../services/api";

interface CodingRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  problemTitle: string;
  topic: string;
  difficulty: string;
  language: string;
  score: number;
  passed: boolean;
  result: string;
  createdAt: string;
}

interface CodingAnalyticsData {
  totalProblemsGenerated: number;
  problemsSolved: number;
  averageScore: number;
  mostPracticedTopics: { topic: string; count: number }[];
  difficultyBreakdown: { easy: number; medium: number; hard: number };
  coding: CodingRecord[];
}

export function AdminCodingPage() {
  const [data, setData] = useState<CodingAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCoding();
  }, []);

  const fetchCoding = () => {
    setLoading(true);
    api
      .get("/admin/coding")
      .then((res) => setData(res.data))
      .catch((err) => console.error("Error loading coding analytics:", err))
      .finally(() => setLoading(false));
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="admin-loading-state">
        <div className="admin-spinner" />
        <p>Gathering coding practice evaluations...</p>
      </div>
    );
  }

  const {
    totalProblemsGenerated,
    problemsSolved,
    averageScore,
    mostPracticedTopics,
    difficultyBreakdown,
    coding,
  } = data || {
    totalProblemsGenerated: 0,
    problemsSolved: 0,
    averageScore: 0,
    mostPracticedTopics: [],
    difficultyBreakdown: { easy: 0, medium: 0, hard: 0 },
    coding: [],
  };

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <div>
          <h2>Coding Practice Analytics</h2>
          <p className="admin-page-sub">Algorithmic challenge volumes, test suite completions, and topical distribution.</p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div className="admin-user-count-badge">Total Solved: {problemsSolved}</div>
          <button className="admin-refresh-btn" onClick={fetchCoding} title="Refresh coding metrics">
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="admin-kpi-row">
        <div className="admin-kpi-card">
          <div className="kpi-icon-wrapper" style={{ color: "#7c3aed", background: "rgba(124,58,237,0.1)" }}>
            <Code2 size={22} />
          </div>
          <div>
            <span className="kpi-label">Total Generated</span>
            <strong className="kpi-value">{totalProblemsGenerated}</strong>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="kpi-icon-wrapper" style={{ color: "#059669", background: "rgba(5,150,105,0.1)" }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <span className="kpi-label">Successfully Solved</span>
            <strong className="kpi-value">{problemsSolved}</strong>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="kpi-icon-wrapper" style={{ color: "#2563eb", background: "rgba(37,99,235,0.1)" }}>
            <Award size={22} />
          </div>
          <div>
            <span className="kpi-label">Average Test Pass Rate</span>
            <strong className="kpi-value">{averageScore}%</strong>
          </div>
        </div>
      </div>

      <div className="admin-analytics-grid">
        {/* Most Practiced Topics */}
        <div className="admin-card">
          <div className="admin-card-head">
            <div>
              <h3>Most Practiced Topics</h3>
              <p className="admin-card-sub">Top data structures & algorithm themes chosen by candidates</p>
            </div>
            <div className="admin-badge-subtle">
              <BookOpen size={14} /> Core Topics
            </div>
          </div>

          {mostPracticedTopics.length === 0 ? (
            <p className="admin-empty-state" style={{ padding: "20px" }}>No coding topics practiced yet.</p>
          ) : (
            <div className="topic-bars-list">
              {mostPracticedTopics.map((item, index) => (
                <div key={index} className="topic-bar-item">
                  <div className="topic-bar-labels">
                    <span className="topic-name">{item.topic}</span>
                    <span className="topic-count">{item.count} submissions</span>
                  </div>
                  <div className="track">
                    <i
                      style={{
                        width: `${Math.min(100, Math.max(15, (item.count / (mostPracticedTopics[0]?.count || 1)) * 100))}%`,
                        background: "#7c3aed",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Difficulty Breakdown */}
        <div className="admin-card">
          <div className="admin-card-head">
            <div>
              <h3>Difficulty Breakdown</h3>
              <p className="admin-card-sub">Distribution of attempted coding challenges</p>
            </div>
            <div className="admin-badge-subtle">
              <Layers size={14} /> Tiers
            </div>
          </div>

          <div className="difficulty-tiers-container">
            <div className="tier-card tier-easy">
              <span className="tier-pill">Easy</span>
              <strong className="tier-num">{difficultyBreakdown.easy}</strong>
              <span className="tier-desc">Foundational syntax & array traversal</span>
            </div>

            <div className="tier-card tier-medium">
              <span className="tier-pill">Medium</span>
              <strong className="tier-num">{difficultyBreakdown.medium}</strong>
              <span className="tier-desc">Pointers, dynamic programming, trees</span>
            </div>

            <div className="tier-card tier-hard">
              <span className="tier-pill">Hard</span>
              <strong className="tier-num">{difficultyBreakdown.hard}</strong>
              <span className="tier-desc">Graph flows, advanced system design algos</span>
            </div>
          </div>
        </div>
      </div>

      {/* User-Specific Coding Activity Table */}
      <div className="admin-card" style={{ marginTop: "24px" }}>
        <div className="admin-card-head">
          <div>
            <h3>Candidate Coding Submissions</h3>
            <p className="admin-card-sub">Real-time candidate submissions with problem title, difficulty, result, and score</p>
          </div>
          <div className="admin-badge-subtle">
            <Code2 size={14} /> Database Verified
          </div>
        </div>

        {(!coding || coding.length === 0) ? (
          <p className="admin-empty-state">No coding submissions found.</p>
        ) : (
          <div className="admin-table-wrapper" style={{ border: "none" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User Name</th>
                  <th>Email</th>
                  <th>Problem</th>
                  <th>Difficulty</th>
                  <th>Result</th>
                  <th>Score</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {coding.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="table-user-cell">
                        <div className="table-avatar-initials">
                          {(item.userName || "U").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <strong className="table-user-name">{item.userName}</strong>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="table-email-text">{item.userEmail || "—"}</span>
                    </td>
                    <td>
                      <div>
                        <strong style={{ color: "#15251f" }}>{item.problemTitle}</strong>
                        <span className="table-user-sub">{item.topic} ({item.language})</span>
                      </div>
                    </td>
                    <td>
                      <span className={`tier-pill ${item.difficulty.toLowerCase()}`}>
                        {item.difficulty}
                      </span>
                    </td>
                    <td>
                      <span className={`table-status-pill status-${item.passed ? "active" : "disabled"}`}>
                        <span className="status-dot" /> {item.result}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: item.passed ? "#059669" : "#b91c1c" }}>
                        {item.score}%
                      </strong>
                    </td>
                    <td>
                      <span className="table-date-text">{formatDate(item.createdAt)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
