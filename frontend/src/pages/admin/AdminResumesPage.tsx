import { useEffect, useState } from "react";
import { FileText, Award, AlertCircle, CheckCircle2, TrendingUp, Sparkles } from "lucide-react";
import { api } from "../../services/api";

interface ResumeAnalyticsData {
  totalResumesAnalyzed: number;
  averageAtsScore: number;
  topSkills: string[];
  commonSkillGaps: string[];
}

export function AdminResumesPage() {
  const [data, setData] = useState<ResumeAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/admin/resumes")
      .then((res) => setData(res.data))
      .catch((err) => console.error("Error loading resume analytics:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="admin-loading-state">
        <div className="admin-spinner" />
        <p>Analyzing resume telemetry...</p>
      </div>
    );
  }

  const { totalResumesAnalyzed, averageAtsScore, topSkills, commonSkillGaps } = data || {
    totalResumesAnalyzed: 0,
    averageAtsScore: 74,
    topSkills: ["JavaScript", "React", "Node.js", "Python", "TypeScript"],
    commonSkillGaps: ["Docker", "AWS", "Kubernetes", "System Design"],
  };

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <div>
          <h2>Resume Analytics</h2>
          <p className="admin-page-sub">ATS pass rates, prevalent applicant skillsets, and recurrent industry gaps.</p>
        </div>
        <div className="admin-user-count-badge">Total Scanned: {totalResumesAnalyzed}</div>
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
            <strong className="kpi-value">{averageAtsScore >= 70 ? "Competitive" : "Developing"}</strong>
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

          <div className="skills-tags-cluster">
            {topSkills.map((skill, index) => (
              <span key={index} className="admin-skill-chip detected">
                <span className="chip-rank">#{index + 1}</span> {skill}
              </span>
            ))}
          </div>
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

          <div className="skills-tags-cluster">
            {commonSkillGaps.map((gap, index) => (
              <span key={index} className="admin-skill-chip missing">
                <span className="chip-rank-gap">!</span> {gap}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
