import { useEffect, useState } from "react";
import { BriefcaseBusiness, Bookmark, MapPin, Search, RefreshCw } from "lucide-react";
import { api } from "../../services/api";

interface JobRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  jobId: string;
  role: string;
  company: string;
  location: string;
  matchScore: number;
  isSaved: boolean;
  createdAt: string;
}

interface JobAnalyticsData {
  totalJobSearches: number;
  savedJobs: number;
  mostSearchedRoles: { role: string; count: number }[];
  mostCommonLocations: { location: string; count: number }[];
  jobs: JobRecord[];
}

export function AdminJobsPage() {
  const [data, setData] = useState<JobAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = () => {
    setLoading(true);
    api
      .get("/admin/jobs")
      .then((res) => setData(res.data))
      .catch((err) => console.error("Error loading job analytics:", err))
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
        <p>Retrieving job matching analytics...</p>
      </div>
    );
  }

  const { totalJobSearches, savedJobs, mostSearchedRoles, mostCommonLocations, jobs } = data || {
    totalJobSearches: 0,
    savedJobs: 0,
    mostSearchedRoles: [],
    mostCommonLocations: [],
    jobs: [],
  };

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <div>
          <h2>Job Match Analytics</h2>
          <p className="admin-page-sub">Candidate role queries, location preferences, and bookmark metrics.</p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div className="admin-user-count-badge">Searches: {totalJobSearches}</div>
          <button className="admin-refresh-btn" onClick={fetchJobs} title="Refresh job metrics">
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="admin-kpi-row">
        <div className="admin-kpi-card">
          <div className="kpi-icon-wrapper" style={{ color: "#2563eb", background: "rgba(37,99,235,0.1)" }}>
            <Search size={22} />
          </div>
          <div>
            <span className="kpi-label">Total Job Inquiries</span>
            <strong className="kpi-value">{totalJobSearches}</strong>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="kpi-icon-wrapper" style={{ color: "#059669", background: "rgba(5,150,105,0.1)" }}>
            <Bookmark size={22} />
          </div>
          <div>
            <span className="kpi-label">Saved & Shortlisted Roles</span>
            <strong className="kpi-value">{savedJobs}</strong>
          </div>
        </div>
      </div>

      <div className="admin-analytics-grid">
        {/* Most Searched Roles */}
        <div className="admin-card">
          <div className="admin-card-head">
            <div>
              <h3>Most Searched Roles</h3>
              <p className="admin-card-sub">Top positions candidates filtered and matched against</p>
            </div>
            <div className="admin-badge-subtle">
              <BriefcaseBusiness size={14} /> Openings
            </div>
          </div>

          {mostSearchedRoles.length === 0 ? (
            <p className="admin-empty-state" style={{ padding: "20px" }}>No job inquiries recorded yet.</p>
          ) : (
            <div className="roles-popularity-list">
              {mostSearchedRoles.map((item, index) => (
                <div key={index} className="role-popularity-item">
                  <span className="role-rank-badge">0{index + 1}</span>
                  <strong className="role-name-text">{item.role}</strong>
                  <span className="role-count-box" style={{ marginLeft: "auto" }}>
                    {item.count} listings
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Most Common Locations */}
        <div className="admin-card">
          <div className="admin-card-head">
            <div>
              <h3>Most Common Locations</h3>
              <p className="admin-card-sub">Geographic distribution of openings and candidate interest</p>
            </div>
            <div className="admin-badge-subtle">
              <MapPin size={14} /> Regional
            </div>
          </div>

          {mostCommonLocations.length === 0 ? (
            <p className="admin-empty-state" style={{ padding: "20px" }}>No regional data recorded yet.</p>
          ) : (
            <div className="locations-list">
              {mostCommonLocations.map((item, index) => (
                <div key={index} className="location-item-row">
                  <div className="location-name-box">
                    <MapPin size={16} color="#059669" />
                    <strong>{item.location}</strong>
                  </div>
                  <span className="location-count-pill">{item.count} opportunities</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* User-Specific Job Match Activity Table */}
      <div className="admin-card" style={{ marginTop: "24px" }}>
        <div className="admin-card-head">
          <div>
            <h3>Candidate Job Match Activity</h3>
            <p className="admin-card-sub">Candidate job queries, company targets, and calculated match compatibility scores</p>
          </div>
          <div className="admin-badge-subtle">
            <BriefcaseBusiness size={14} /> Database Verified
          </div>
        </div>

        {(!jobs || jobs.length === 0) ? (
          <p className="admin-empty-state">No job match activity found.</p>
        ) : (
          <div className="admin-table-wrapper" style={{ border: "none" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User Name</th>
                  <th>Email</th>
                  <th>Matched Jobs</th>
                  <th>Match Score</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((item) => (
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
                        <strong style={{ color: "#15251f" }}>{item.role}</strong>
                        <span className="table-user-sub">{item.company} • {item.location}</span>
                      </div>
                    </td>
                    <td>
                      <span className="table-role-badge role-user">
                        {item.matchScore}%
                      </span>
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
