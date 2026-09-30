import { useEffect, useState } from "react";
import { Mic, Award, MessageSquare, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import { api } from "../../services/api";

interface InterviewRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: string;
  interviewType: string;
  score: number;
  questionsCount: number;
  status: string;
  createdAt: string;
}

interface InterviewAnalyticsData {
  totalInterviews: number;
  completedInterviews: number;
  averageInterviewScore: number;
  averageCommunicationScore: number;
  commonWeakAreas: { area: string; count: number }[];
  interviews: InterviewRecord[];
}

export function AdminInterviewsPage() {
  const [data, setData] = useState<InterviewAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = () => {
    setLoading(true);
    api
      .get("/admin/interviews")
      .then((res) => setData(res.data))
      .catch((err) => console.error("Error loading interview analytics:", err))
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
    interviews,
  } = data || {
    totalInterviews: 0,
    completedInterviews: 0,
    averageInterviewScore: 0,
    averageCommunicationScore: 0,
    commonWeakAreas: [],
    interviews: [],
  };

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <div>
          <h2>Mock Interview Analytics</h2>
          <p className="admin-page-sub">Candidate speech cadence, answer relevance, and identified technical weaknesses.</p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div className="admin-user-count-badge">Sessions: {totalInterviews}</div>
          <button className="admin-refresh-btn" onClick={fetchInterviews} title="Refresh interview data">
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>
        </div>
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

        {commonWeakAreas.length === 0 ? (
          <p className="admin-empty-state" style={{ padding: "20px" }}>No weak areas flagged yet.</p>
        ) : (
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
        )}
      </div>

      {/* User-Specific Interview Activity Table */}
      <div className="admin-card" style={{ marginTop: "24px" }}>
        <div className="admin-card-head">
          <div>
            <h3>Candidate Interview Activity</h3>
            <p className="admin-card-sub">Simulated voice interview submissions with candidate name, score, and completion status</p>
          </div>
          <div className="admin-badge-subtle">
            <Mic size={14} /> Database Verified
          </div>
        </div>

        {(!interviews || interviews.length === 0) ? (
          <p className="admin-empty-state">No interview activity found.</p>
        ) : (
          <div className="admin-table-wrapper" style={{ border: "none" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User Name</th>
                  <th>Email</th>
                  <th>Interview Type</th>
                  <th>Score</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {interviews.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="table-user-cell">
                        <div className="table-avatar-initials">
                          {(item.userName || "U").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <strong className="table-user-name">{item.userName}</strong>
                          <span className="table-user-sub">{item.role}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="table-email-text">{item.userEmail || "—"}</span>
                    </td>
                    <td>
                      <span className="module-badge module-interview">{item.interviewType}</span>
                    </td>
                    <td>
                      <strong style={{ color: item.score >= 70 ? "#059669" : "#d97706" }}>
                        {item.score}%
                      </strong>
                    </td>
                    <td>
                      <span className="table-date-text">{formatDate(item.createdAt)}</span>
                    </td>
                    <td>
                      <span className={`table-status-pill status-${item.status === "Completed" ? "active" : "disabled"}`}>
                        <span className="status-dot" /> {item.status}
                      </span>
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
