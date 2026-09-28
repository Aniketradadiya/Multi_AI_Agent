import { useState, useEffect, useRef, type DragEvent, type ChangeEvent } from "react";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  X,
  Briefcase,
  Lightbulb,
  TrendingUp,
  RefreshCw,
  Layers,
  CheckCircle,
  FileSearch,
} from "lucide-react";
import {
  ResponsiveContainer,
  Tooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { api } from "../services/api";

interface CategoryScores {
  atsCompatibility: number;
  skills: number;
  experience: number;
  projects: number;
  education: number;
  formatting: number;
  keywords: number;
}

interface SectionFeedback {
  section: string;
  score: number;
  status: "Good" | "Needs Improvement" | "Critical";
  feedback: string;
}

interface ResumeChangeItem {
  section: string;
  issue: string;
  exactChange: string;
}

interface JobMatchData {
  overallMatch: number;
  experienceMatch: number;
  matchedSkills: string[];
  missingKeywords: string[];
}

interface ResumeAnalysisResult {
  atsScore: number;
  candidateName?: string;
  fileName?: string;
  summary?: string;
  categoryScores?: CategoryScores;
  changesRequired?: ResumeChangeItem[];
  jobMatch?: JobMatchData;
  sectionAnalysis?: SectionFeedback[];
  strengths: string[];
  weaknesses: string[];
  missingSkills?: string[];
  suggestions: string[];
  recommendedRoles?: string[];
}

export function ResumeAnalyzer() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ResumeAnalysisResult | null>(() => {
    try {
      const cached = localStorage.getItem("career_orbit_resume_analysis");
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  // Fetch latest analysis from server on mount
  useEffect(() => {
    api
      .get<ResumeAnalysisResult>("/resume/latest")
      .then((res) => {
        if (res.data?.atsScore) {
          setResult(res.data);
          localStorage.setItem("career_orbit_resume_analysis", JSON.stringify(res.data));
        }
      })
      .catch(() => null);
  }, []);
  const [chartViewMode, setChartViewMode] = useState<"radar" | "cards">("radar");
  const [activeSectionIndex, setActiveSectionIndex] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    setError("");
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "text/plain",
    ];
    const isExtValid = /\.(pdf|docx|doc|txt)$/i.test(file.name);

    if (!validTypes.includes(file.type) && !isExtValid) {
      setError("Please upload a valid PDF, DOCX, or TXT file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File size exceeds 10MB limit. Please upload a smaller file.");
      return;
    }

    setSelectedFile(file);
  };

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const analyzeResume = async () => {
    if (!selectedFile) {
      setError("Please select a resume file from your computer first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("resume", selectedFile);
      if (jobDescription.trim()) {
        formData.append("jobDescription", jobDescription.trim());
      }

      const response = await api.post<ResumeAnalysisResult>("/resume/analyze", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setResult(response.data);
      try {
        localStorage.setItem("career_orbit_resume_analysis", JSON.stringify(response.data));
      } catch (storageErr) {
        console.warn("Could not cache resume analysis in localStorage:", storageErr);
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          "Failed to analyze resume. Please check your Gemini API key and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getIndicator = (score: number) => {
    if (score >= 80)
      return {
        label: "Good",
        color: "#15803d",
        bg: "#edf7f0",
        border: "#bbf7d0",
        dot: "🟢",
      };
    if (score >= 60)
      return {
        label: "Needs Improvement",
        color: "#a16207",
        bg: "#fef9c3",
        border: "#fef08a",
        dot: "🟡",
      };
    return {
      label: "Critical",
      color: "#b91c1c",
      bg: "#fef2f2",
      border: "#fecaca",
      dot: "🔴",
    };
  };

  const categoryLabels: { key: keyof CategoryScores; label: string }[] = [
    { key: "atsCompatibility", label: "ATS Compatibility" },
    { key: "skills", label: "Skills" },
    { key: "experience", label: "Experience" },
    { key: "projects", label: "Projects" },
    { key: "education", label: "Education" },
    { key: "formatting", label: "Formatting" },
    { key: "keywords", label: "Keywords" },
  ];

  return (
    <div className="resume-analyzer">
      {/* Upload Panel */}
      <section className="panel resume-upload-card">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.doc,.txt"
          onChange={onInputChange}
          style={{ display: "none" }}
          id="resume-file-input"
        />

        {!selectedFile ? (
          <div
            className={`resume-dropzone ${isDragging ? "active" : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="dropzone-icon-circle">
              <UploadCloud size={36} />
            </div>
            <div className="dropzone-text">
              <h3>Add Resume</h3>
              <p>Drag and drop your file here, or click to browse files from your computer</p>
            </div>
            <button
              type="button"
              className="browse-desktop-btn"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              Add Resume
            </button>
            <div className="dropzone-formats">
              <span>PDF</span>
              <span>DOCX</span>
              <span>DOC</span>
              <span>TXT</span>
              <span className="limit">Up to 10 MB</span>
            </div>
          </div>
        ) : (
          <div className="file-ready-container">
            <div className="file-info-badge">
              <div className="file-info-icon">
                <FileText size={26} />
              </div>
              <div className="file-details">
                <strong>{selectedFile.name}</strong>
                <span>{formatFileSize(selectedFile.size)}</span>
              </div>
              <button
                type="button"
                className="file-remove-btn"
                onClick={clearFile}
                title="Remove file"
              >
                <X size={18} />
              </button>
            </div>

            {/* Optional Job Description Input */}
            <div className="jd-input-box">
              <label className="jd-input-label" htmlFor="jd-input-field">
                <FileSearch size={15} />
                <span>Target Job Description (Optional — for targeted match calculation)</span>
              </label>
              <textarea
                id="jd-input-field"
                className="jd-input-textarea"
                rows={3}
                placeholder="Paste the target job description here to calculate exact skills match & missing keywords..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>

            <div className="upload-actions">
              <button
                className="primary analyze-btn"
                onClick={analyzeResume}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <RefreshCw size={18} className="spinner-icon" />
                    Analyzing resume...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Analyze Resume
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}
      </section>

      {/* Results View */}
      {result && (
        <section className="resume-results-container">
          {/* Header Score Banner */}
          <div className="panel score-banner">
            <div className="score-summary">
              <span className="eyebrow">ATS READINESS EVALUATION</span>
              <h2>{result.candidateName || "Candidate"}</h2>
              <p className="resume-filename">File: {result.fileName || selectedFile?.name}</p>
              {result.summary && <p className="resume-summary-text">{result.summary}</p>}
            </div>

            <div
              className="score-meter-card"
              style={{ background: getIndicator(result.atsScore).bg }}
            >
              <div
                className="score-number"
                style={{ color: getIndicator(result.atsScore).color }}
              >
                {result.atsScore}
                <small>/100</small>
              </div>
              <div className="score-meter-track">
                <div
                  className="score-meter-fill"
                  style={{
                    width: `${result.atsScore}%`,
                    background: getIndicator(result.atsScore).color,
                  }}
                />
              </div>
              <span
                className="score-label"
                style={{ color: getIndicator(result.atsScore).color }}
              >
                {getIndicator(result.atsScore).dot} {getIndicator(result.atsScore).label}
              </span>
            </div>
          </div>

          {/* Category Scores Breakdown — Grid of Individual Cards */}
          {result.categoryScores && (
            <div className="category-breakdown-container">
              <div className="section-head-bar">
                <div>
                  <p className="eyebrow">RECRUITMENT DIMENSIONS</p>
                  <h3 className="section-title">Category Breakdown</h3>
                </div>
                <div className="status-legend">
                  <span className="legend-item">
                    <span className="legend-dot green">●</span> Good (≥ 80%)
                  </span>
                  <span className="legend-item">
                    <span className="legend-dot yellow">●</span> Needs Improvement (60–79%)
                  </span>
                  <span className="legend-item">
                    <span className="legend-dot red">●</span> Critical (&lt; 60%)
                  </span>
                </div>
              </div>

              <div className="category-cards-grid">
                {categoryLabels.map(({ key, label }) => {
                  const score = result.categoryScores?.[key] ?? 70;
                  const indicator = getIndicator(score);
                  return (
                    <div key={key} className="panel category-metric-card">
                      <div className="cat-card-header">
                        <span className="cat-card-title">{label}</span>
                        <span
                          className="status-pill compact"
                          style={{
                            color: indicator.color,
                            background: indicator.bg,
                            borderColor: indicator.border,
                          }}
                        >
                          {indicator.dot} {indicator.label}
                        </span>
                      </div>
                      <div className="cat-card-score-row">
                        <strong className="cat-score-num" style={{ color: indicator.color }}>
                          {score}%
                        </strong>
                      </div>
                      <div className="cat-card-track">
                        <div
                          className="cat-card-fill"
                          style={{
                            width: `${score}%`,
                            background: indicator.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}


          {/* Resume Section Analysis - Interactive Chart */}
          {result.sectionAnalysis && result.sectionAnalysis.length > 0 && (() => {
            const sectionChartData = result.sectionAnalysis.map((sec, idx) => ({
              id: idx,
              name: sec.section,
              score: sec.score,
              status: sec.status,
              feedback: sec.feedback,
              color: sec.score >= 75 ? "#10b981" : sec.score >= 60 ? "#f59e0b" : "#ef4444",
            }));

            const activeSection = result.sectionAnalysis[activeSectionIndex] || result.sectionAnalysis[0];
            const activeIndicator = activeSection ? getIndicator(activeSection.score) : null;

            const CustomSectionTooltip = ({ active, payload }: any) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                const indicator = getIndicator(data.score);
                return (
                  <div className="section-chart-tooltip">
                    <strong className="tooltip-title">{data.name}</strong>
                    <div
                      className="tooltip-score-badge"
                      style={{ color: indicator.color, background: indicator.bg, border: `1px solid ${indicator.border}` }}
                    >
                      {indicator.dot} {data.score}/100 — {indicator.label}
                    </div>
                    <p className="tooltip-desc">{data.feedback}</p>
                  </div>
                );
              }
              return null;
            };

            return (
              <div className="section-analysis-container">
                <div className="section-head-bar">
                  <div>
                    <p className="eyebrow">STRUCTURAL AUDIT</p>
                    <h3 className="section-title">Resume Section Analysis</h3>
                  </div>
                  <div className="chart-view-toggle-group">
                    <button
                      type="button"
                      className={`chart-view-toggle-btn ${chartViewMode === "radar" ? "active" : ""}`}
                      onClick={() => setChartViewMode("radar")}
                    >
                      🕸️ Radar Chart
                    </button>
                    <button
                      type="button"
                      className={`chart-view-toggle-btn ${chartViewMode === "cards" ? "active" : ""}`}
                      onClick={() => setChartViewMode("cards")}
                    >
                      📋 Card View
                    </button>
                  </div>
                </div>

                {chartViewMode === "radar" && (
                  <div className="section-chart-dashboard">
                    <div className="chart-main-panel panel">
                      <div className="chart-panel-header">
                        <div>
                          <h4 className="chart-panel-title">Multi-Axis Resume Balance (Radar Chart)</h4>
                          <p className="chart-panel-sub">Visualizing profile shape across all 8 resume dimensions</p>
                        </div>
                      </div>
                      <div style={{ width: "100%", height: 380 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={sectionChartData}>
                            <PolarGrid stroke="#e2e8f0" />
                            <PolarAngleAxis
                              dataKey="name"
                              tick={{ fill: "#334155", fontSize: 11.5, fontWeight: 600 }}
                            />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#94a3b8" />
                            <Radar
                              name="Section Score"
                              dataKey="score"
                              stroke="#10b981"
                              fill="#10b981"
                              fillOpacity={0.35}
                            />
                            <Tooltip content={<CustomSectionTooltip />} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Selected Section Inspector in Radar View */}
                    {activeSection && activeIndicator && (
                      <div className="chart-inspector-panel panel">
                        <div className="inspector-head">
                          <span className="inspector-eyebrow">SELECTED SECTION DETAILS</span>
                          <div className="inspector-title-row">
                            <div className="inspector-title-left">
                              <Layers size={18} className="inspector-icon" />
                              <h4>{activeSection.section}</h4>
                            </div>
                            <span
                              className="status-pill compact"
                              style={{
                                color: activeIndicator.color,
                                background: activeIndicator.bg,
                                borderColor: activeIndicator.border,
                              }}
                            >
                              {activeIndicator.dot} {activeIndicator.label}
                            </span>
                          </div>
                        </div>

                        <div className="inspector-score-display">
                          <div className="inspector-score-circle" style={{ borderColor: activeIndicator.color }}>
                            <span className="inspector-score-val" style={{ color: activeIndicator.color }}>
                              {activeSection.score}
                            </span>
                            <span className="inspector-score-total">/ 100</span>
                          </div>
                          <div className="inspector-score-text">
                            <p className="inspector-status-title">Score: {activeSection.score}% ({activeIndicator.label})</p>
                            <p className="inspector-status-hint">
                              {activeSection.score >= 75
                                ? "Well optimized according to standard ATS criteria."
                                : activeSection.score >= 60
                                ? "Requires moderate adjustments to pass automated screening."
                                : "Immediate action required; this section hurts your screening score."}
                            </p>
                          </div>
                        </div>

                        <div className="inspector-feedback-card">
                          <span className="inspector-fb-label">
                            <FileSearch size={14} /> AI Structural Audit Feedback:
                          </span>
                          <p className="inspector-fb-text">{activeSection.feedback}</p>
                        </div>

                        <div className="inspector-quick-nav">
                          <span className="quick-nav-label">Click to inspect any section:</span>
                          <div className="quick-nav-pills">
                            {result.sectionAnalysis.map((sec, idx) => {
                              const ind = getIndicator(sec.score);
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  className={`quick-pill-btn ${activeSectionIndex === idx ? "active" : ""}`}
                                  onClick={() => setActiveSectionIndex(idx)}
                                >
                                  <span className="pill-dot" style={{ background: ind.color }}></span>
                                  {sec.section}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {chartViewMode === "cards" && (
                  <div className="section-analysis-grid">
                    {result.sectionAnalysis.map((sec, idx) => {
                      const indicator = getIndicator(sec.score);
                      return (
                        <div key={idx} className="section-item-card">
                          <div className="section-card-header">
                            <div className="section-title-group">
                              <Layers size={18} className="section-layer-icon" />
                              <h4>
                                {sec.section} — <strong>{sec.score}/100</strong>
                              </h4>
                            </div>
                            <span
                              className="status-pill compact"
                              style={{
                                color: indicator.color,
                                background: indicator.bg,
                                borderColor: indicator.border,
                              }}
                            >
                              {indicator.dot} {indicator.label}
                            </span>
                          </div>

                          <div className="section-bar-track">
                            <div
                              className="section-bar-fill"
                              style={{
                                width: `${sec.score}%`,
                                background: indicator.color,
                              }}
                            />
                          </div>

                          <p className="section-feedback-text">{sec.feedback}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Detailed Feedback: Strengths & Weaknesses */}
          <div className="two-col results-grid">
            {/* Strengths */}
            <div className="panel insight-card strengths">
              <div className="insight-card-header">
                <div className="insight-icon green">
                  <CheckCircle2 size={18} />
                </div>
                <h3>Key Strengths</h3>
              </div>
              <ul className="insight-list">
                {result.strengths.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="panel insight-card weaknesses">
              <div className="insight-card-header">
                <div className="insight-icon amber">
                  <AlertCircle size={18} />
                </div>
                <h3>Areas to Improve</h3>
              </div>
              <ul className="insight-list">
                {result.weaknesses.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Missing Skills & Recommended Roles */}
          <div className="two-col results-grid">
            {/* Missing Skills */}
            {result.missingSkills && result.missingSkills.length > 0 && (
              <div className="panel insight-card skills">
                <div className="insight-card-header">
                  <div className="insight-icon blue">
                    <TrendingUp size={18} />
                  </div>
                  <h3>Missing High-Demand Skills</h3>
                </div>
                <p className="insight-subtitle">
                  Adding these skills can significantly boost ATS rankings:
                </p>
                <div className="tags-container">
                  {result.missingSkills.map((skill, i) => (
                    <span key={i} className="skill-tag">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Roles */}
            {result.recommendedRoles && result.recommendedRoles.length > 0 && (
              <div className="panel insight-card roles">
                <div className="insight-card-header">
                  <div className="insight-icon purple">
                    <Briefcase size={18} />
                  </div>
                  <h3>Recommended Target Roles</h3>
                </div>
                <p className="insight-subtitle">Roles aligned with your detected competencies:</p>
                <div className="tags-container">
                  {result.recommendedRoles.map((role, i) => (
                    <span key={i} className="role-tag">
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actionable Suggestions */}
          {result.suggestions && result.suggestions.length > 0 && (
            <div className="panel suggestions-card">
              <div className="insight-card-header">
                <div className="insight-icon emerald">
                  <Lightbulb size={18} />
                </div>
                <h3>Actionable ATS Recommendations</h3>
              </div>
              <ol className="suggestions-list">
                {result.suggestions.map((suggestion, i) => (
                  <li key={i}>
                    <strong>Step {i + 1}:</strong> {suggestion}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Job Description Matching — Small Box with Circle (Moved to the Last) */}
          {result.jobMatch && (
            <div className="panel job-match-card">
              <div className="job-match-header-row">
                <div>
                  <p className="eyebrow">JOB ALIGNMENT ANALYSIS</p>
                  <h3 className="section-title">Job Description Matching</h3>
                </div>
                <div className="match-overall-pill">
                  Resume ↔ Job Match: <strong>{result.jobMatch.overallMatch}%</strong>
                </div>
              </div>

              <div className="job-match-body">
                {/* Left: Small Circle Gauge */}
                <div className="job-match-circle-box">
                  <div className="circular-gauge-container">
                    <svg width="104" height="104" viewBox="0 0 100 100" className="gauge-svg">
                      <circle cx="50" cy="50" r="38" className="gauge-bg-circle" />
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        className="gauge-bar-circle"
                        style={{
                          strokeDasharray: 238.76,
                          strokeDashoffset:
                            238.76 - (result.jobMatch.overallMatch / 100) * 238.76,
                        }}
                      />
                      <text x="50" y="48" className="gauge-score-text">
                        {result.jobMatch.overallMatch}%
                      </text>
                      <text x="50" y="63" className="gauge-label-text">
                        MATCH
                      </text>
                    </svg>
                  </div>

                  <div className="exp-match-box">
                    <span className="exp-label">Experience Match</span>
                    <strong className="exp-value">{result.jobMatch.experienceMatch}%</strong>
                    <div className="exp-bar-track">
                      <div
                        className="exp-bar-fill"
                        style={{ width: `${result.jobMatch.experienceMatch}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Right: Matched Skills & Missing Keywords */}
                <div className="job-match-lists-box">
                  {/* Matched Skills */}
                  <div className="match-section-block">
                    <h5 className="match-title green-title">
                      <CheckCircle size={15} /> Matched Skills
                    </h5>
                    <ul className="match-ul">
                      {result.jobMatch.matchedSkills.map((skill, idx) => (
                        <li key={idx} className="match-li matched">
                          <span className="match-check">✓</span>
                          <span>{skill}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Missing Keywords */}
                  <div className="match-section-block">
                    <h5 className="match-title red-title">
                      <X size={15} /> Missing Keywords
                    </h5>
                    <ul className="match-ul">
                      {result.jobMatch.missingKeywords.map((kw, idx) => (
                        <li key={idx} className="match-li missing">
                          <span className="match-cross">✕</span>
                          <span>{kw}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
