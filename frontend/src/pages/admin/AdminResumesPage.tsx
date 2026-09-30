import { useEffect, useState } from "react";
import { FileText, Award, AlertCircle, CheckCircle2, TrendingUp, RefreshCw, User as UserIcon } from "lucide-react";
import { api } from "../../services/api";

interface ResumeRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  fileName: string;
  candidateName: string;
  atsScore: number;
  createdAt: string;
  summary?: string;
}

interface ResumeAnalyticsData {
  totalResumesAnalyzed: number;
  averageAtsScore: number;
  topSkills: string[];
  commonSkillGaps: string[];
  resumes: ResumeRecord[];
}

export function AdminResumesPage() {
  const [data, setData] = useState<ResumeAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = () => {
    setLoading(true);
    api
      .get("/admin/resumes")
      .then((res) => setData(res.data))
      .catch((err) => console.error("Error loading resume analytics:", err))
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
        <p>Analyzing resume telemetry...</p>
      </div>
    );
  }

  const { totalResumesAnalyzed, averageAtsScore, topSkills, commonSkillGaps, resumes } = data || {
    totalResumesAnalyzed: 0,
    averageAtsScore: 0,
    topSkills: [],
    commonSkillGaps: [],
    resumes: [],
  };

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <div>
          <h2>Resume Analytics</h2>
          <p className="admin-page-sub">ATS pass rates, prevalent applicant skillsets, and recurrent industry gaps.</p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div className="admin-user-count-badge">Total Scanned: {totalResumesAnalyzed}</div>
          <button className="admin-refresh-btn" onClick={fetchResumes} title="Refresh resume data">
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="admin-kpi-row">
        <div className="admin-kpi-card">
          <div className="kpi-icon-wrapper" style={{ color: "#0284c7", background: "rgba(2,132,199,0.1)" }}>
            <FileText size={22} />
          </div>
          <div>
            <span className="kpi-label">Total Resumes Analyzed</span>
            <strong className="kpi-value">{totalResumesAnalyzed}</strong>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="kpi-icon-wrapper" style={{ color: "#059669", background: "rgba(5,150,105,0.1)" }}>
            <Award size={22} />
          </div>
          <div>
            <span className="kpi-label">Average ATS Score</span>
            <strong className="kpi-value">{averageAtsScore}%</strong>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="kpi-icon-wrapper" style={{ color: "#d97706", background: "rgba(217,119,6,0.1)" }}>
            <TrendingUp size={22} />
          </div>
          <div>
            <span className="kpi-label">Benchmark Readiness</span>
            <strong className="kpi-value">{averageAtsScore >= 70 ? "Competitive" : averageAtsScore > 0 ? "Developing" : "No Data"}</strong>
          </div>
        </div>
      </div>

      <div className="admin-analytics-grid">
        {/* Top Skills Detected */}
        <div className="admin-card">
          <div className="admin-card-head">
            <div>
              <h3>Most Common Candidate Skills</h3>
              <p className="admin-card-sub">Top competencies verified in parsed candidate resumes</p>
            </div>
            <div className="admin-badge-subtle" style={{ color: "#059669" }}>
              <CheckCircle2 size={14} /> High Frequency
            </div>
          </div>

          {topSkills.length === 0 ? (
            <p className="admin-empty-state" style={{ padding: "20px" }}>No skills recorded yet.</p>
          ) : (
            <div className="skills-tags-cluster">
              {topSkills.map((skill, index) => (
                <span key={index} className="admin-skill-chip detected">
                  <span className="chip-rank">#{index + 1}</span> {skill}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Common Skill Gaps */}
        <div className="admin-card">
          <div className="admin-card-head">
            <div>
              <h3>Common Skill Gaps</h3>
              <p className="admin-card-sub">Frequent missing competencies flagged during ATS evaluations</p>
            </div>
            <div className="admin-badge-subtle" style={{ color: "#b91c1c" }}>
              <AlertCircle size={14} /> Attention Needed
            </div>
          </div>

          {commonSkillGaps.length === 0 ? (
            <p className="admin-empty-state" style={{ padding: "20px" }}>No skill gaps recorded yet.</p>
          ) : (
            <div className="skills-tags-cluster">
              {commonSkillGaps.map((gap, index) => (
                <span key={index} className="admin-skill-chip missing">
                  <span className="chip-rank-gap">!</span> {gap}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* User-Specific Resume Activity Table */}
      <div className="admin-card" style={{ marginTop: "24px" }}>
        <div className="admin-card-head">
          <div>
            <h3>Candidate Resume Activity</h3>
            <p className="admin-card-sub">Real-time candidate resume uploads, evaluated scores, and file logs</p>
          </div>
          <div className="admin-badge-subtle">
            <FileText size={14} /> Database Verified
          </div>
        </div>

        {(!resumes || resumes.length === 0) ? (
          <p className="admin-empty-state">No resume activity found.</p>
        ) : (
          <div className="admin-table-wrapper" style={{ border: "none" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User Name</th>
                  <th>Email</th>
                  <th>Resume File</th>
                  <th>ATS Score</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {resumes.map((item) => (
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
                      <span style={{ fontWeight: 600, color: "#15251f" }}>{item.fileName}</span>
                    </td>
                    <td>
                      <span className={`table-role-badge ${item.atsScore >= 70 ? "role-user" : "role-admin"}`}>
                        {item.atsScore}%
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
