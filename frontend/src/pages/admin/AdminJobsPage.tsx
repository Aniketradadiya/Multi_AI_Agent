import { useEffect, useState } from "react";
import { BriefcaseBusiness, Bookmark, MapPin, Search } from "lucide-react";
import { api } from "../../services/api";

interface JobAnalyticsData {
  totalJobSearches: number;
  savedJobs: number;
  mostSearchedRoles: { role: string; count: number }[];
  mostCommonLocations: { location: string; count: number }[];
}

export function AdminJobsPage() {
  const [data, setData] = useState<JobAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/admin/jobs")
      .then((res) => setData(res.data))
      .catch((err) => console.error("Error loading job analytics:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="admin-loading-state">
        <div className="admin-spinner" />
        <p>Retrieving job matching analytics...</p>
      </div>
    );
  }

  const { totalJobSearches, savedJobs, mostSearchedRoles, mostCommonLocations } = data || {
    totalJobSearches: 0,
    savedJobs: 0,
    mostSearchedRoles: [],
    mostCommonLocations: [],
  };

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <div>
          <h2>Job Match Analytics</h2>
          <p className="admin-page-sub">Candidate role queries, location preferences, and bookmark metrics.</p>
        </div>
        <div className="admin-user-count-badge">Searches: {totalJobSearches}</div>
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
        </div>
      </div>
    </div>
  );
}
