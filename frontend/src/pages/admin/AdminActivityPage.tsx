import { useEffect, useState } from "react";
import { Activity, Clock, Filter, RefreshCw } from "lucide-react";
import { api } from "../../services/api";

interface ActivityItem {
  id: string;
  userId?: string;
  userName: string;
  action: string;
  module: string;
  details?: string;
  createdAt: string;
}

export function AdminActivityPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterModule, setFilterModule] = useState<string>("ALL");

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/activity", { params: { limit: 50 } });
      setActivities(res.data?.activities || []);
    } catch (err) {
      console.error("Failed to load activity log:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = activities.filter((a) => {
    if (filterModule === "ALL") return true;
    return a.module.toLowerCase() === filterModule.toLowerCase();
  });

  const formatTimestamp = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <div>
          <h2>Platform Activity Stream</h2>
          <p className="admin-page-sub">Audit trail of student registrations, AI runs, test solutions, and interview logs.</p>
        </div>
        <button className="admin-refresh-btn" onClick={fetchActivities} disabled={loading} title="Refresh log">
          <RefreshCw size={15} className={loading ? "spin-icon" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Module Filters */}
      <div className="admin-filters-bar">
        <div className="admin-filter-label-group">
          <Filter size={15} />
          <span>Filter by Module:</span>
        </div>
        <div className="admin-pill-group">
          {["ALL", "auth", "resume", "interview", "coding", "roadmap", "github", "admin"].map((mod) => (
            <button
              key={mod}
              className={`filter-pill ${filterModule === mod ? "active" : ""}`}
              onClick={() => setFilterModule(mod)}
            >
              {mod.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-card">
        {loading ? (
          <div className="admin-loading-state">
            <div className="admin-spinner" />
            <p>Fetching platform audit logs...</p>
          </div>
        ) : filtered.length === 0 ? (
          <p className="admin-empty-state">No activities recorded for this module yet.</p>
        ) : (
          <div className="admin-activity-list">
            {filtered.map((item) => (
              <div key={item.id} className="admin-activity-item">
                <div className="activity-icon-bullet">
                  <div className="bullet-dot" />
                </div>
                <div className="admin-activity-info">
                  <p className="activity-action-text">
                    <strong>{item.userName}</strong> {item.action}
                  </p>
                  {item.details && <p className="activity-detail-note">{item.details}</p>}
                </div>
                <div className="admin-activity-meta">
                  <span className={`module-badge module-${item.module}`}>{item.module}</span>
                  <span className="activity-time">
                    <Clock size={12} /> {formatTimestamp(item.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
