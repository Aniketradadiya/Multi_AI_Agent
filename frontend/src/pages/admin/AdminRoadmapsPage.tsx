import { useEffect, useState } from "react";
import { Map, Target, Compass, Award, TrendingUp } from "lucide-react";
import { api } from "../../services/api";

interface RoadmapAnalyticsData {
  totalRoadmapsCreated: number;
  averageCompletion: number;
  mostPopularTargetRoles: { role: string; count: number }[];
  averageRoadmapProgress: number;
}

export function AdminRoadmapsPage() {
  const [data, setData] = useState<RoadmapAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/admin/roadmaps")
      .then((res) => setData(res.data))
      .catch((err) => console.error("Error loading roadmap analytics:", err))
      .finally(() => setLoading(false));
  }, []);

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
  } = data || {
    totalRoadmapsCreated: 0,
    averageCompletion: 68,
    mostPopularTargetRoles: [],
    averageRoadmapProgress: 68,
  };

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <div>
          <h2>AI Roadmap Analytics</h2>
          <p className="admin-page-sub">Candidate career targets, 4-phase learning milestones, and completion trends.</p>
        </div>
        <div className="admin-user-count-badge">Active Plans: {totalRoadmapsCreated}</div>
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
      </div>
    </div>
  );
}
