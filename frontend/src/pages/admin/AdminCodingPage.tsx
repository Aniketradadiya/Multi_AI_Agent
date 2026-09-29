import { useEffect, useState } from "react";
import { Code2, CheckCircle2, Award, BookOpen, Layers } from "lucide-react";
import { api } from "../../services/api";

interface CodingAnalyticsData {
  totalProblemsGenerated: number;
  problemsSolved: number;
  averageScore: number;
  mostPracticedTopics: { topic: string; count: number }[];
  difficultyBreakdown: { easy: number; medium: number; hard: number };
}

export function AdminCodingPage() {
  const [data, setData] = useState<CodingAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/admin/coding")
      .then((res) => setData(res.data))
      .catch((err) => console.error("Error loading coding analytics:", err))
      .finally(() => setLoading(false));
  }, []);

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
  } = data || {
    totalProblemsGenerated: 0,
    problemsSolved: 0,
    averageScore: 78,
    mostPracticedTopics: [],
    difficultyBreakdown: { easy: 0, medium: 0, hard: 0 },
  };

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <div>
          <h2>Coding Practice Analytics</h2>
          <p className="admin-page-sub">Algorithmic challenge volumes, test suite completions, and topical distribution.</p>
        </div>
        <div className="admin-user-count-badge">Total Solved: {problemsSolved}</div>
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
    </div>
  );
}
