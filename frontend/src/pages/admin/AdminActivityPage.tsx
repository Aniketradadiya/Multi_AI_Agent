import { useEffect, useState } from "react";
import { Filter, RefreshCw, Search } from "lucide-react";
import { api } from "../../services/api";

interface ActivityItem {
  id: string;
  _id?: string;
  userId?: string;
  userName: string;
  userEmail?: string;
  action: string;
  activity?: string;
  module: string;
  result?: string;
  score?: number | null;
  status?: string;
  details?: string;
  createdAt: string;
}

export function AdminActivityPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterModule, setFilterModule] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/activity", { params: { limit: 100 } });
      setActivities(res.data?.activities || []);
    } catch (err) {
      console.error("Failed to load activity log:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = activities.filter((a) => {
    const matchesModule = filterModule === "ALL" || a.module.toLowerCase() === filterModule.toLowerCase();
    const query = search.toLowerCase().trim();
    const matchesSearch =
      !query ||
      (a.userName && a.userName.toLowerCase().includes(query)) ||
      (a.userEmail && a.userEmail.toLowerCase().includes(query)) ||
      (a.action && a.action.toLowerCase().includes(query)) ||
      (a.details && a.details.toLowerCase().includes(query));

    return matchesModule && matchesSearch;
  });

  const formatTimestamp = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
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

      {/* Filters and Search Bar */}
      <div className="admin-filters-bar">
        <div className="admin-search-form" style={{ maxWidth: 320 }}>
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search activity by user, email, or action..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-search-input"
          />
        </div>

        <div className="admin-pill-group">
          {["ALL", "resume", "interview", "coding", "roadmap", "job", "github", "auth", "admin"].map((mod) => (
            <button
              key={mod}
              className={`filter-pill ${filterModule.toLowerCase() === mod.toLowerCase() ? "active" : ""}`}
              onClick={() => setFilterModule(mod)}
            >
              {mod.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-table-wrapper">
        {loading ? (
          <div className="admin-loading-state">
            <div className="admin-spinner" />
            <p>Fetching platform audit logs...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="admin-empty-state">
            <p>No activity found.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Module</th>
                <th>Activity</th>
                <th>Result/Score</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
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
                    <span className={`module-badge module-${(item.module || "general").toLowerCase()}`}>
                      {item.module}
                    </span>
                  </td>
                  <td>
                    <div>
                      <span className="activity-action-text">{item.action || item.activity}</span>
                      {item.details && <p className="activity-detail-note">{item.details}</p>}
                    </div>
                  </td>
                  <td>
                    <strong>
                      {item.result || (item.score !== null && item.score !== undefined ? `${item.score}` : "—")}
                    </strong>
                  </td>
                  <td>
                    <span className="table-date-text">{formatTimestamp(item.createdAt)}</span>
                  </td>
                  <td>
                    <span className={`table-status-pill status-${(item.status || "completed").toLowerCase()}`}>
                      <span className="status-dot" /> {item.status || "Completed"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
