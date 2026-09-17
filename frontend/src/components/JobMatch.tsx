import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Briefcase,
  Search,
  MapPin,
  Clock,
  Sparkles,
  Heart,
  ExternalLink,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RotateCcw,
  SlidersHorizontal,
  BookmarkCheck,
  Building2,
  TrendingUp,
  Tag,
  Info,
  X
} from "lucide-react";
import { api } from "../services/api";

export interface JobItem {
  id: string;
  title: string;
  company: string;
  location: string;
  jobType: "Full Time" | "Internship" | "Contract" | "Remote";
  experienceLevel: "Fresher" | "0-1 Years" | "1-3 Years" | "3+ Years";
  requiredSkills: string[];
  salaryRange?: string;
  description: string;
  postedDate: string;
  url: string;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
}

export function JobMatch() {
  const navigate = useNavigate();

  // Search setup form states
  const [role, setRole] = useState("MERN Developer");
  const [location, setLocation] = useState("All Locations");
  const [experience, setExperience] = useState("Fresher");
  const [jobType, setJobType] = useState("All");

  // In-results quick filter & search
  const [keywordSearch, setKeywordSearch] = useState("");
  const [activeTypeTab, setActiveTypeTab] = useState<"All" | "Remote" | "Full Time" | "Internship">("All");
  const [sortBy, setSortBy] = useState<"best" | "recent">("best");
  const [activeViewTab, setActiveViewTab] = useState<"all" | "saved">("all");

  // User Skills (connected to Resume Analyzer and profile)
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [hasResumeData, setHasResumeData] = useState(false);
  const [newSkillInput, setNewSkillInput] = useState("");

  // Results state
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [savedJobIds, setSavedJobIds] = useState<string[]>(() => {
    try {
      const cached = localStorage.getItem("career_orbit_saved_jobs");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [aiRecommendation, setAiRecommendation] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState("");

  // Detail modal state
  const [selectedJobModal, setSelectedJobModal] = useState<JobItem | null>(null);

  // 1. Initial Load: detect skills from Resume Analyzer and user profile
  useEffect(() => {
    let detected: string[] = [];

    // Check Resume Analyzer cache
    try {
      const resumeRaw = localStorage.getItem("career_orbit_resume_analysis");
      if (resumeRaw) {
        const parsed = JSON.parse(resumeRaw);
        if (Array.isArray(parsed.jobMatch?.matchedSkills) && parsed.jobMatch.matchedSkills.length > 0) {
          detected = [...parsed.jobMatch.matchedSkills];
          setHasResumeData(true);
        } else if (Array.isArray(parsed.strengths) && parsed.strengths.length > 0) {
          // If extracted strengths has keywords
          const fromStrengths = parsed.strengths.filter((s: string) => s.length < 25);
          detected = [...fromStrengths];
          setHasResumeData(true);
        }
      }
    } catch (e) {
      console.warn("Could not parse cached resume analysis:", e);
    }

    // Check User profile skills if resume not present
    if (detected.length === 0) {
      try {
        const userRaw = localStorage.getItem("user");
        if (userRaw) {
          const u = JSON.parse(userRaw);
          if (Array.isArray(u.skills) && u.skills.length > 0) {
            detected = [...u.skills];
          }
          if (u.targetRole) {
            setRole(u.targetRole);
          }
        }
      } catch (e) {
        console.warn("Could not read user profile from storage:", e);
      }
    }

    // Default skills fallback if still empty
    if (detected.length === 0) {
      detected = ["React", "JavaScript", "Node.js", "MongoDB", "Express"];
    }

    // Deduplicate
    const unique = Array.from(new Set(detected));
    setUserSkills(unique);

    // Initial search
    executeJobSearch(unique, "MERN Developer", "All Locations", "Fresher", "All");
  }, []);

  // Sync saved jobs to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("career_orbit_saved_jobs", JSON.stringify(savedJobIds));
    } catch (e) {
      console.error(e);
    }
  }, [savedJobIds]);

  // Execute job search API
  const executeJobSearch = async (
    skillsToUse = userSkills,
    roleToUse = role,
    locToUse = location,
    expToUse = experience,
    typeToUse = jobType
  ) => {
    setLoading(true);
    setError("");
    try {
      const payload = {
        role: roleToUse === "All Roles" ? "" : roleToUse,
        location: locToUse === "All Locations" ? "" : locToUse,
        experience: expToUse === "All" || expToUse === "Any Experience" ? "" : expToUse,
        jobType: typeToUse === "All" ? "" : typeToUse,
        skills: skillsToUse,
        sort: sortBy
      };

      const response = await api.post("/jobs/recommendations", payload);
      if (response.data?.jobs) {
        setJobs(response.data.jobs);
        setAiRecommendation(response.data.aiRecommendation || "");
        if (Array.isArray(response.data.savedJobIds) && response.data.savedJobIds.length > 0) {
          setSavedJobIds(prev => Array.from(new Set([...prev, ...response.data.savedJobIds])));
        }
      }
      setHasSearched(true);
    } catch (err: any) {
      console.error("Job search error:", err);
      // Fallback local search if backend is offline or network fails
      setError(err.response?.data?.message || "Failed to search jobs. Please verify your connection.");
    } finally {
      setLoading(false);
    }
  };

  // Toggle Save Job
  const handleToggleSave = async (job: JobItem) => {
    const isCurrentlySaved = savedJobIds.includes(job.id);
    const newSaved = isCurrentlySaved
      ? savedJobIds.filter(id => id !== job.id)
      : [...savedJobIds, job.id];

    setSavedJobIds(newSaved);

    try {
      await api.post("/jobs/save", { jobId: job.id });
    } catch (e) {
      // Offline fallback already updated in state and localStorage
      console.warn("Saved to local cache, remote sync deferred:", e);
    }
  };

  // Navigate to Roadmap with skill gaps
  const handleLearnSkills = (missingSkills: string[], jobTitle: string) => {
    try {
      localStorage.setItem("career_orbit_roadmap_target_skills", JSON.stringify(missingSkills));
      localStorage.setItem("career_orbit_roadmap_target_role", jobTitle);
    } catch (e) {
      console.error(e);
    }
    navigate("/roadmap");
  };

  // Add custom skill chip
  const handleAddSkill = () => {
    if (!newSkillInput.trim()) return;
    const cleaned = newSkillInput.trim();
    if (!userSkills.some(s => s.toLowerCase() === cleaned.toLowerCase())) {
      const updated = [...userSkills, cleaned];
      setUserSkills(updated);
      setNewSkillInput("");
      executeJobSearch(updated);
    } else {
      setNewSkillInput("");
    }
  };

  // Remove skill chip
  const handleRemoveSkill = (skillToRemove: string) => {
    const updated = userSkills.filter(s => s !== skillToRemove);
    setUserSkills(updated);
    executeJobSearch(updated);
  };

  // Filter and sort jobs client-side for immediate responsive feedback
  const displayedJobs = useMemo(() => {
    let list = [...jobs];

    // Filter by saved tab
    if (activeViewTab === "saved") {
      list = list.filter(j => savedJobIds.includes(j.id));
    }

    // Filter by quick job type tab
    if (activeTypeTab !== "All") {
      list = list.filter(j => {
        if (activeTypeTab === "Remote") {
          return j.jobType === "Remote" || j.location.toLowerCase().includes("remote");
        }
        return j.jobType.toLowerCase() === activeTypeTab.toLowerCase();
      });
    }

    // Filter by keyword search
    if (keywordSearch.trim()) {
      const q = keywordSearch.trim().toLowerCase();
      list = list.filter(
        j =>
          j.title.toLowerCase().includes(q) ||
          j.company.toLowerCase().includes(q) ||
          j.location.toLowerCase().includes(q) ||
          j.requiredSkills.some(s => s.toLowerCase().includes(q))
      );
    }

    // Sort
    if (sortBy === "best") {
      list.sort((a, b) => b.matchScore - a.matchScore);
    } else {
      list.sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime());
    }

    return list;
  }, [jobs, activeViewTab, savedJobIds, activeTypeTab, keywordSearch, sortBy]);

  // Reset all filters
  const handleResetFilters = () => {
    setRole("MERN Developer");
    setLocation("All Locations");
    setExperience("Fresher");
    setJobType("All");
    setKeywordSearch("");
    setActiveTypeTab("All");
    setSortBy("best");
    executeJobSearch(userSkills, "MERN Developer", "All Locations", "Fresher", "All");
  };

  // Score color helper
  const getScoreColor = (score: number) => {
    if (score >= 80) return { bg: "#e8f5ed", text: "#1b6d49", border: "#b8e2c8" };
    if (score >= 60) return { bg: "#fbf3db", text: "#8f6b12", border: "#f3e1a9" };
    return { bg: "#fbeeed", text: "#ad332b", border: "#f4c6c2" };
  };

  return (
    <div className="job-match-container">
      {/* Search Setup Card */}
      <section className="panel job-search-setup-card">
        <div className="job-search-header">
          <div>
            <h3 className="job-setup-title">Job Search Setup</h3>
            <p className="job-setup-subtitle">
              Configure your preferences or search directly against your skill profile.
            </p>
          </div>
          {hasResumeData && (
            <div className="resume-connected-pill" title="Skills automatically synced from your analyzed resume">
              <Sparkles size={14} className="text-emerald" />
              <span>Resume Synced</span>
            </div>
          )}
        </div>

        <form
          className="job-search-grid"
          onSubmit={e => {
            e.preventDefault();
            executeJobSearch();
          }}
        >
          {/* Job Role */}
          <div className="job-form-field">
            <label htmlFor="job-role-input">Job Role</label>
            <div className="input-with-icon">
              <Briefcase size={16} className="input-field-icon" />
              <input
                id="job-role-input"
                type="text"
                value={role}
                onChange={e => setRole(e.target.value)}
                placeholder="e.g. MERN Developer, Frontend..."
              />
            </div>
          </div>

          {/* Location */}
          <div className="job-form-field">
            <label htmlFor="job-location-input">Location</label>
            <div className="input-with-icon">
              <MapPin size={16} className="input-field-icon" />
              <input
                id="job-location-input"
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="Ahmedabad / Vadodara / Remote"
              />
            </div>
          </div>

          {/* Experience Level */}
          <div className="job-form-field">
            <label htmlFor="job-exp-select">Experience Level</label>
            <div className="input-with-icon">
              <Clock size={16} className="input-field-icon" />
              <select
                id="job-exp-select"
                value={experience}
                onChange={e => setExperience(e.target.value)}
              >
                <option value="All">Any Experience</option>
                <option value="Fresher">Fresher</option>
                <option value="0-1 Years">0-1 Years</option>
                <option value="1-3 Years">1-3 Years</option>
                <option value="3+ Years">3+ Years</option>
              </select>
            </div>
          </div>

          {/* Job Type */}
          <div className="job-form-field">
            <label htmlFor="job-type-select">Job Type</label>
            <div className="input-with-icon">
              <SlidersHorizontal size={16} className="input-field-icon" />
              <select
                id="job-type-select"
                value={jobType}
                onChange={e => setJobType(e.target.value)}
              >
                <option value="All">All Types</option>
                <option value="Full Time">Full Time</option>
                <option value="Internship">Internship</option>
                <option value="Remote">Remote</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="job-form-actions">
            <button
              type="submit"
              className="primary btn-find-jobs"
              disabled={loading}
            >
              {loading ? (
                <>Searching...</>
              ) : (
                <>
                  <Search size={16} />
                  Find Jobs
                </>
              )}
            </button>
            <button
              type="button"
              className="btn-secondary btn-find-matches"
              onClick={() => executeJobSearch()}
              disabled={loading}
              title="Match roles strictly against your current skills"
            >
              <Sparkles size={16} />
              Find matches
            </button>
          </div>
        </form>

        {/* Profile Skills Bar (Connected Resume / Profile) */}
        <div className="user-skills-sync-bar">
          <div className="skills-bar-label">
            <Tag size={14} />
            <span>Profile Skills:</span>
            <small className="skills-sync-hint">
              {hasResumeData
                ? "(Loaded from your analyzed resume)"
                : "(Click × to remove, or type to add skills)"}
            </small>
          </div>
          <div className="skills-chips-wrapper">
            {userSkills.map(skill => (
              <span key={skill} className="skill-chip">
                {skill}
                <button
                  type="button"
                  className="chip-remove"
                  onClick={() => handleRemoveSkill(skill)}
                  title={`Remove ${skill}`}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
            <div className="add-skill-inline">
              <input
                type="text"
                value={newSkillInput}
                onChange={e => setNewSkillInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                placeholder="+ Add skill..."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Error state */}
      {error && (
        <div className="job-match-error-banner">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={() => executeJobSearch()} className="error-retry-btn">
            Retry
          </button>
        </div>
      )}

      {/* AI Recommendation Banner */}
      {aiRecommendation && (
        <section className="panel ai-recommendation-banner">
          <div className="ai-rec-badge">
            <Sparkles size={16} />
            <span>AI Job Recommendation</span>
          </div>
          <p className="ai-rec-text">{aiRecommendation}</p>
          <div className="ai-rec-meta">
            <span>
              <strong>{displayedJobs.length}</strong> opportunities matching your current profile
            </span>
          </div>
        </section>
      )}

      {/* Navigation Tabs: All Jobs vs Saved Jobs */}
      <div className="job-match-view-tabs">
        <button
          className={`view-tab-btn ${activeViewTab === "all" ? "active" : ""}`}
          onClick={() => setActiveViewTab("all")}
        >
          <Briefcase size={16} />
          All Jobs ({jobs.length})
        </button>
        <button
          className={`view-tab-btn ${activeViewTab === "saved" ? "active" : ""}`}
          onClick={() => setActiveViewTab("saved")}
        >
          <BookmarkCheck size={16} />
          Saved Jobs ({savedJobIds.length})
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="job-results-toolbar">
        {/* Quick Type Filter Pills */}
        <div className="filter-pills-group">
          {(["All", "Remote", "Full Time", "Internship"] as const).map(typeTab => (
            <button
              key={typeTab}
              className={`filter-pill ${activeTypeTab === typeTab ? "active" : ""}`}
              onClick={() => setActiveTypeTab(typeTab)}
            >
              {typeTab}
            </button>
          ))}
        </div>

        <div className="toolbar-right-controls">
          {/* Search box */}
          <div className="quick-search-box">
            <Search size={15} className="quick-search-icon" />
            <input
              type="text"
              value={keywordSearch}
              onChange={e => setKeywordSearch(e.target.value)}
              placeholder="Search jobs..."
            />
            {keywordSearch && (
              <button
                className="clear-search-btn"
                onClick={() => setKeywordSearch("")}
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="sort-dropdown-box">
            <label htmlFor="sort-select">Sort:</label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
            >
              <option value="best">Best Match</option>
              <option value="recent">Most Recent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading Skeleton State */}
      {loading && (
        <div className="job-cards-skeleton-list">
          {[1, 2, 3].map(i => (
            <div key={i} className="panel job-card-skeleton">
              <div className="skeleton-line skeleton-title"></div>
              <div className="skeleton-line skeleton-company"></div>
              <div className="skeleton-line skeleton-skills"></div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && displayedJobs.length === 0 && (
        <div className="panel job-empty-state">
          <div className="empty-icon-circle">
            <Briefcase size={36} />
          </div>
          <h3>No matching jobs found</h3>
          <p className="empty-message">
            {activeViewTab === "saved"
              ? "You haven't saved any jobs yet. Browse available jobs and click the heart icon to save."
              : "We couldn't find jobs matching your exact filters."}
          </p>
          <div className="empty-ai-tip">
            <Sparkles size={16} />
            <span>
              <strong>AI Recommendation:</strong> Try changing your location, role, or experience level to see more roles.
            </span>
          </div>
          {activeViewTab !== "saved" && (
            <button className="primary btn-reset-filters" onClick={handleResetFilters}>
              <RotateCcw size={15} />
              Reset Filters
            </button>
          )}
        </div>
      )}

      {/* Job Cards Grid */}
      {!loading && displayedJobs.length > 0 && (
        <div className="job-cards-list">
          {displayedJobs.map(job => {
            const isSaved = savedJobIds.includes(job.id);
            const scoreColor = getScoreColor(job.matchScore);

            return (
              <article key={job.id} className="panel job-card">
                {/* Header: Title, Company, Location & Save Button */}
                <div className="job-card-header">
                  <div className="job-title-group">
                    <div className="job-company-icon">
                      <Building2 size={20} />
                    </div>
                    <div>
                      <h4 className="job-title">{job.title}</h4>
                      <div className="job-company-location">
                        <span className="job-company">{job.company}</span>
                        <span className="dot-divider">•</span>
                        <span className="job-location">
                          <MapPin size={13} />
                          {job.location}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`btn-save-job ${isSaved ? "saved" : ""}`}
                    onClick={() => handleToggleSave(job)}
                    title={isSaved ? "Remove from saved" : "Save this job"}
                  >
                    <Heart size={18} fill={isSaved ? "#ad332b" : "none"} />
                    <span>{isSaved ? "Saved" : "Save"}</span>
                  </button>
                </div>

                {/* Job Meta Chips: Type | Experience | Salary */}
                <div className="job-meta-chips">
                  <span className="meta-chip type-chip">{job.jobType}</span>
                  <span className="meta-chip exp-chip">{job.experienceLevel}</span>
                  {job.salaryRange && (
                    <span className="meta-chip salary-chip">{job.salaryRange}</span>
                  )}
                </div>

                {/* AI Job Match Score Section */}
                <div
                  className="job-match-score-banner"
                  style={{
                    backgroundColor: scoreColor.bg,
                    borderColor: scoreColor.border
                  }}
                >
                  <div className="match-score-left">
                    <div className="score-percent-badge" style={{ color: scoreColor.text }}>
                      <strong>{job.matchScore}%</strong>
                      <span>Match Score</span>
                    </div>
                    <div className="match-ratio-info">
                      <span className="matched-counter">
                        Matched: {job.matchedSkills.length}/{job.requiredSkills.length} skills
                      </span>
                      <span className="disclaimer-note">
                        <Info size={11} /> Profile-to-job similarity score
                      </span>
                    </div>
                  </div>
                </div>

                {/* Skill Match Breakdown: Matched & Missing */}
                <div className="job-skills-breakdown">
                  {/* Matched Skills */}
                  {job.matchedSkills.length > 0 && (
                    <div className="matched-skills-section">
                      <span className="skills-subhead matched-subhead">
                        <CheckCircle2 size={14} /> Matched Skills:
                      </span>
                      <div className="skill-badges-row">
                        {job.matchedSkills.map(skill => (
                          <span key={skill} className="skill-badge matched">
                            ✓ {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Missing Skills / Skill Gap */}
                  {job.missingSkills.length > 0 && (
                    <div className="missing-skills-section">
                      <div className="missing-skills-header">
                        <span className="skills-subhead missing-subhead">
                          <XCircle size={14} /> Missing Skills (Skill Gap):
                        </span>
                        <button
                          type="button"
                          className="btn-learn-skills"
                          onClick={() => handleLearnSkills(job.missingSkills, job.title)}
                          title="Generate a learning plan for these missing skills in AI Roadmap"
                        >
                          <BookOpen size={13} />
                          Learn These Skills
                          <ArrowRight size={13} />
                        </button>
                      </div>
                      <div className="skill-badges-row">
                        {job.missingSkills.map(skill => (
                          <span key={skill} className="skill-badge missing">
                            ✗ {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer: View Job & Actions */}
                <div className="job-card-footer">
                  <span className="job-posted-time">
                    Posted on {new Date(job.postedDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>

                  <div className="card-actions-right">
                    <button
                      type="button"
                      className="btn-job-details"
                      onClick={() => setSelectedJobModal(job)}
                    >
                      Job Details
                    </button>
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="primary btn-view-job"
                    >
                      <span>View Job</span>
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Job Details Modal */}
      {selectedJobModal && (
        <div className="profile-modal-overlay" onClick={() => setSelectedJobModal(null)}>
          <div className="profile-modal-card job-details-modal" onClick={e => e.stopPropagation()}>
            <div className="profile-modal-header">
              <div>
                <h3>{selectedJobModal.title}</h3>
                <p className="modal-company-sub">
                  {selectedJobModal.company} • {selectedJobModal.location}
                </p>
              </div>
              <button
                className="close-modal-btn"
                onClick={() => setSelectedJobModal(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="job-modal-body">
              <div className="modal-match-summary">
                <span className="modal-score-pill">
                  {selectedJobModal.matchScore}% Match
                </span>
                <span>{selectedJobModal.jobType}</span>
                <span>{selectedJobModal.experienceLevel}</span>
                {selectedJobModal.salaryRange && <span>{selectedJobModal.salaryRange}</span>}
              </div>

              <div className="modal-section">
                <h4>Role Description</h4>
                <p className="modal-description-text">{selectedJobModal.description}</p>
              </div>

              <div className="modal-section">
                <h4>Required Competencies</h4>
                <div className="skill-badges-row">
                  {selectedJobModal.requiredSkills.map(s => {
                    const isMatched = selectedJobModal.matchedSkills.includes(s);
                    return (
                      <span
                        key={s}
                        className={`skill-badge ${isMatched ? "matched" : "missing"}`}
                      >
                        {isMatched ? `✓ ${s}` : `✗ ${s}`}
                      </span>
                    );
                  })}
                </div>
              </div>

              {selectedJobModal.missingSkills.length > 0 && (
                <div className="modal-skill-gap-alert">
                  <div className="gap-alert-text">
                    <strong>Need to learn:</strong> {selectedJobModal.missingSkills.join(", ")}
                  </div>
                  <button
                    className="primary btn-learn-modal"
                    onClick={() => {
                      const ms = selectedJobModal.missingSkills;
                      const title = selectedJobModal.title;
                      setSelectedJobModal(null);
                      handleLearnSkills(ms, title);
                    }}
                  >
                    <BookOpen size={14} />
                    Open in AI Roadmap
                  </button>
                </div>
              )}
            </div>

            <div className="job-modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setSelectedJobModal(null)}
              >
                Close
              </button>
              <a
                href={selectedJobModal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="primary btn-apply-external"
              >
                <span>Apply on Company Website</span>
                <ExternalLink size={15} />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
