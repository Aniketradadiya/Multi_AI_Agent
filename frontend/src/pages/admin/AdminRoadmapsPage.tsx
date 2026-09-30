import { useEffect, useState } from "react";
import { Map, Target, Award, TrendingUp, RefreshCw } from "lucide-react";
import { api } from "../../services/api";

interface RoadmapRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: string;
  targetRole: string;
  skillLevel: string;
  studyTime: string;
  progress: number;
  createdAt: string;
}

interface RoadmapAnalyticsData {
  totalRoadmapsCreated: number;
  averageCompletion: number;
  mostPopularTargetRoles: { role: string; count: number }[];
  averageRoadmapProgress: number;
  roadmaps: RoadmapRecord[];
}

export function AdminRoadmapsPage() {
  const [data, setData] = useState<RoadmapAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoadmaps();
  }, []);

  const fetchRoadmaps = () => {
    setLoading(true);
    api
      .get("/admin/roadmaps")
      .then((res) => setData(res.data))
      .catch((err) => console.error("Error loading roadmap analytics:", err))
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
        <p>Loading AI roadmap intelligence...</p>
      </div>
    );
  }

  const {
    totalRoadmapsCreated,
    averageCompletion,
    mostPopularTargetRoles,
    averageRoadmapProgress,
    roadmaps,
  } = data || {
    totalRoadmapsCreated: 0,
    averageCompletion: 0,
    mostPopularTargetRoles: [],
    averageRoadmapProgress: 0,
    roadmaps: [],
  };

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <div>
          <h2>AI Roadmap Analytics</h2>
          <p className="admin-page-sub">Candidate career targets, 4-phase learning milestones, and completion trends.</p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div className="admin-user-count-badge">Active Plans: {totalRoadmapsCreated}</div>
          <button className="admin-refresh-btn" onClick={fetchRoadmaps} title="Refresh roadmap data">
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="admin-kpi-row">
        <div className="admin-kpi-card">
          <div className="kpi-icon-wrapper" style={{ color: "#207452", background: "rgba(32,116,82,0.1)" }}>
            <Map size={22} />
          </div>
          <div>
            <span className="kpi-label">Total Roadmaps Generated</span>
            <strong className="kpi-value">{totalRoadmapsCreated}</strong>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="kpi-icon-wrapper" style={{ color: "#059669", background: "rgba(5,150,105,0.1)" }}>
            <Award size={22} />
          </div>
          <div>
            <span className="kpi-label">Average Completion</span>
            <strong className="kpi-value">{averageCompletion}%</strong>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="kpi-icon-wrapper" style={{ color: "#2563eb", background: "rgba(37,99,235,0.1)" }}>
            <TrendingUp size={22} />
          </div>
          <div>
            <span className="kpi-label">Average Milestone Progress</span>
            <strong className="kpi-value">{averageRoadmapProgress}%</strong>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-head">
          <div>
            <h3>Most Popular Career Goals & Roles</h3>
            <p className="admin-card-sub">Top target positions chosen by students & job seekers</p>
          </div>
          <div className="admin-badge-subtle">
            <Target size={14} /> Career Aspirations
          </div>
        </div>

        {mostPopularTargetRoles.length === 0 ? (
          <p className="admin-empty-state" style={{ padding: "20px" }}>No roadmaps generated yet.</p>
        ) : (
          <div className="roles-popularity-list">
            {mostPopularTargetRoles.map((item, index) => (
              <div key={index} className="role-popularity-item">
                <div className="role-item-meta">
                  <span className="role-rank-badge">0{index + 1}</span>
                  <div>
                    <strong className="role-name-text">{item.role}</strong>
                    <span className="role-sub-desc">Custom AI curricula generated</span>
                  </div>
                </div>
                <div className="role-count-box">
                  <span className="role-count-num">{item.count}</span>
                  <span className="role-count-sub">Candidates</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User-Specific AI Roadmap Activity Table */}
      <div className="admin-card" style={{ marginTop: "24px" }}>
        <div className="admin-card-head">
          <div>
            <h3>Candidate Roadmap Progress Activity</h3>
            <p className="admin-card-sub">Real-time candidate roadmap milestones, target roles, and curriculum completion rates</p>
          </div>
          <div className="admin-badge-subtle">
            <Map size={14} /> Database Verified
          </div>
        </div>

        {(!roadmaps || roadmaps.length === 0) ? (
          <p className="admin-empty-state">No roadmap activity found.</p>
        ) : (
          <div className="admin-table-wrapper" style={{ border: "none" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User Name</th>
                  <th>Role</th>
                  <th>Skill Level</th>
                  <th>Progress</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {roadmaps.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="table-user-cell">
                        <div className="table-avatar-initials">
                          {(item.userName || "U").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <strong className="table-user-name">{item.userName}</strong>
                          <span className="table-user-sub">{item.userEmail || "Candidate"}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <strong style={{ color: "#15251f" }}>{item.targetRole}</strong>
                    </td>
                    <td>
                      <span className="tier-pill easy">{item.skillLevel}</span>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div className="track" style={{ width: 80, height: 6 }}>
                          <i style={{ width: `${item.progress}%`, background: "#059669" }} />
                        </div>
                        <span style={{ fontWeight: 700, fontSize: "12px", color: "#059669" }}>
                          {item.progress}%
                        </span>
                      </div>
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
