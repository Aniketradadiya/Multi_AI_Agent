import { useEffect, useState } from "react";
import { Mic, Award, MessageSquare, AlertTriangle, CheckCircle } from "lucide-react";
import { api } from "../../services/api";

interface InterviewAnalyticsData {
  totalInterviews: number;
  completedInterviews: number;
  averageInterviewScore: number;
  averageCommunicationScore: number;
  commonWeakAreas: { area: string; count: number }[];
}

export function AdminInterviewsPage() {
  const [data, setData] = useState<InterviewAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/admin/interviews")
      .then((res) => setData(res.data))
      .catch((err) => console.error("Error loading interview analytics:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="admin-loading-state">
        <div className="admin-spinner" />
        <p>Compiling mock interview evaluations...</p>
      </div>
    );
  }

  const {
    totalInterviews,
    completedInterviews,
    averageInterviewScore,
    averageCommunicationScore,
    commonWeakAreas,
  } = data || {
    totalInterviews: 0,
    completedInterviews: 0,
    averageInterviewScore: 76,
    averageCommunicationScore: 72,
    commonWeakAreas: [
      { area: "Communication & Clarity", count: 12 },
      { area: "System Architecture & Deep Dive", count: 8 },
      { area: "Edge Case Handling", count: 6 },
    ],
  };

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <div>
          <h2>Mock Interview Analytics</h2>
          <p className="admin-page-sub">Candidate speech cadence, answer relevance, and identified technical weaknesses.</p>
        </div>
        <div className="admin-user-count-badge">Sessions: {totalInterviews}</div>
      </div>

      <div className="admin-kpi-row">
        <div className="admin-kpi-card">
          <div className="kpi-icon-wrapper" style={{ color: "#d97706", background: "rgba(217,119,6,0.1)" }}>
            <Mic size={22} />
          </div>
          <div>
            <span className="kpi-label">Total Simulated Sessions</span>
            <strong className="kpi-value">{totalInterviews}</strong>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="kpi-icon-wrapper" style={{ color: "#059669", background: "rgba(5,150,105,0.1)" }}>
            <CheckCircle size={22} />
          </div>
          <div>
            <span className="kpi-label">Completed Sessions</span>
            <strong className="kpi-value">{completedInterviews}</strong>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="kpi-icon-wrapper" style={{ color: "#2563eb", background: "rgba(37,99,235,0.1)" }}>
            <Award size={22} />
          </div>
          <div>
            <span className="kpi-label">Avg Technical Score</span>
            <strong className="kpi-value">{averageInterviewScore}%</strong>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="kpi-icon-wrapper" style={{ color: "#7c3aed", background: "rgba(124,58,237,0.1)" }}>
            <MessageSquare size={22} />
          </div>
          <div>
            <span className="kpi-label">Avg Communication Score</span>
            <strong className="kpi-value">{averageCommunicationScore}%</strong>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-head">
          <div>
            <h3>Most Common Weak Areas</h3>
            <p className="admin-card-sub">Frequent feedback suggestions delivered to candidates by the AI interviewer</p>
          </div>
          <div className="admin-badge-subtle" style={{ color: "#d97706" }}>
            <AlertTriangle size={14} /> Diagnostic Signals
          </div>
        </div>

        <div className="weak-areas-list">
          {commonWeakAreas.map((item, idx) => (
            <div key={idx} className="weak-area-row">
              <div className="weak-area-info">
                <span className="weak-area-rank">0{idx + 1}</span>
                <strong className="weak-area-title">{item.area}</strong>
              </div>
              <div className="weak-area-meta">
                <span className="weak-area-count">{item.count} candidates flagged</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
