import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  GitBranch,
  Search,
  ExternalLink,
  Star,
  GitFork,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Check,
  AlertCircle,
  FolderGit2,
  Users,
  Layers,
  Code2,
  FileCheck,
  RotateCcw,
} from "lucide-react";
import { api } from "../services/api";

export interface GitHubRepoItem {
  id: number;
  name: string;
  fullName: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  htmlUrl: string;
  updatedAt: string;
  hasPages: boolean;
  topics: string[];
  isFork: boolean;
  quality: number;
  feedback: string;
  pros?: string[];
  cons?: string[];
}

export interface GitHubAnalysisData {
  profile: {
    username: string;
    name: string;
    bio: string;
    avatarUrl: string;
    publicRepos: number;
    followers: number;
    following: number;
    blog?: string;
    company?: string;
    location?: string;
    htmlUrl: string;
    createdAt?: string;
  };
  portfolioScore: {
    overall: number;
    repositories: number;
    activity: number;
    projectQuality: number;
    documentation: number;
  };
  skills: Array<{
    skill: string;
    count: number;
    percentage: number;
  }>;
  recommendedToHighlight: Array<{
    name: string;
    language: string;
    reason: string;
  }>;
  recommendations: string[];
  checklist: Array<{
    label: string;
    status: "completed" | "warning";
    note?: string;
  }>;
  repositories: GitHubRepoItem[];
  analyzedAt: string;
}

export function GitHubAnalyzer() {
  const navigate = useNavigate();

  // Inputs and states
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<GitHubAnalysisData | null>(null);

  // Filters
  const [selectedLanguage, setSelectedLanguage] = useState<string>("All");
  const [repoSearch, setRepoSearch] = useState("");

  // Target role from user profile or default
  const [targetRole, setTargetRole] = useState("MERN Stack Developer");

  // Resume analyzer cached skills
  const [resumeSkills, setResumeSkills] = useState<string[]>([]);
  const [hasResumeData, setHasResumeData] = useState(false);

  // 1. Initial load from local cache & user profile
  useEffect(() => {
    // Check cached github analysis & fetch from server
    try {
      const cached = localStorage.getItem("career_orbit_github_analysis");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.profile?.username) {
          setResult(parsed);
          setUsername(parsed.profile.username);
        }
      }

      api
        .get<GitHubAnalysisData>("/github/latest")
        .then((res) => {
          if (res.data?.profile?.username) {
            setResult(res.data);
            setUsername(res.data.profile.username);
            localStorage.setItem("career_orbit_github_analysis", JSON.stringify(res.data));
          }
        })
        .catch(() => null);
    } catch (e) {
      console.warn("Could not load cached github analysis:", e);
    }

    // Check user target role
    try {
      const userRaw = localStorage.getItem("user");
      if (userRaw) {
        const u = JSON.parse(userRaw);
        if (u.targetRole) {
          setTargetRole(u.targetRole);
        }
      }
    } catch (e) {
      console.warn("Could not read user profile:", e);
    }

    // Check resume analysis for skill consistency
    try {
      const resumeRaw = localStorage.getItem("career_orbit_resume_analysis");
      if (resumeRaw) {
        const parsed = JSON.parse(resumeRaw);
        const extracted: string[] = [];
        if (Array.isArray(parsed.jobMatch?.matchedSkills)) {
          extracted.push(...parsed.jobMatch.matchedSkills);
        }
        if (Array.isArray(parsed.strengths)) {
          extracted.push(...parsed.strengths.filter((s: string) => s.length < 25));
        }
        const unique = Array.from(new Set(extracted));
        if (unique.length > 0) {
          setResumeSkills(unique);
          setHasResumeData(true);
        }
      }
    } catch (e) {
      console.warn("Could not read resume analysis cache:", e);
    }
  }, []);

  // 2. Perform GitHub Analysis
  const handleAnalyze = async (userToAnalyze = username) => {
    if (!userToAnalyze.trim()) {
      setError("Please enter a GitHub username.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.post<GitHubAnalysisData>("/github/analyze", {
        username: userToAnalyze.trim(),
      });

      setResult(response.data);
      try {
        localStorage.setItem("career_orbit_github_analysis", JSON.stringify(response.data));
      } catch (storageErr) {
        console.warn("Could not cache github analysis:", storageErr);
      }
    } catch (err: any) {
      console.error("GitHub analyze error:", err);
      setError(
        err.response?.data?.message ||
          "Failed to analyze GitHub profile. Please verify the username and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // 3. Extract dynamic language filters from repositories
  const availableLanguages = useMemo(() => {
    if (!result?.repositories) return ["All"];
    const set = new Set<string>();
    result.repositories.forEach(r => {
      if (r.language && r.language !== "Other") {
        set.add(r.language);
      }
    });
    return ["All", ...Array.from(set).sort()];
  }, [result]);

  // 4. Filter repositories based on language and search query
  const filteredRepos = useMemo(() => {
    if (!result?.repositories) return [];
    return result.repositories.filter(repo => {
      const matchesLang =
        selectedLanguage === "All" ||
        (repo.language && repo.language.toLowerCase() === selectedLanguage.toLowerCase());
      const query = repoSearch.toLowerCase().trim();
      const matchesQuery =
        !query ||
        repo.name.toLowerCase().includes(query) ||
        (repo.description && repo.description.toLowerCase().includes(query)) ||
        (repo.language && repo.language.toLowerCase().includes(query));
      return matchesLang && matchesQuery;
    });
  }, [result, selectedLanguage, repoSearch]);

  // 5. Compute Target Role Skill Gaps
  const roleGaps = useMemo(() => {
    if (!result?.skills) return { matched: [], missing: [] };

    // Standard recommended stacks based on target role keywords
    const roleLower = targetRole.toLowerCase();
    let expectedSkills: string[] = ["Git", "Testing", "CI/CD", "TypeScript", "Docker"];

    if (roleLower.includes("mern") || roleLower.includes("full stack") || roleLower.includes("fullstack")) {
      expectedSkills = ["React", "Node.js", "Express", "MongoDB", "TypeScript", "Docker", "REST API", "Testing"];
    } else if (roleLower.includes("frontend") || roleLower.includes("front end") || roleLower.includes("ui")) {
      expectedSkills = ["React", "JavaScript", "TypeScript", "Tailwind CSS", "HTML/CSS", "Next.js", "Testing"];
    } else if (roleLower.includes("backend") || roleLower.includes("back end")) {
      expectedSkills = ["Node.js", "Python", "PostgreSQL", "MongoDB", "Docker", "Redis", "REST API", "Testing"];
    } else if (roleLower.includes("python") || roleLower.includes("data") || roleLower.includes("ai")) {
      expectedSkills = ["Python", "FastAPI", "Pandas", "SQL", "Docker", "Machine Learning", "Git"];
    }

    const detectedSkillNames = result.skills.map(s => s.skill.toLowerCase());

    const matched: string[] = [];
    const missing: string[] = [];

    expectedSkills.forEach(skill => {
      const isFound = detectedSkillNames.some(
        ds => ds.includes(skill.toLowerCase()) || skill.toLowerCase().includes(ds)
      );
      if (isFound) {
        matched.push(skill);
      } else {
        missing.push(skill);
      }
    });

    return { matched, missing };
  }, [result, targetRole]);

  // 6. Cross-reference Resume Skills with GitHub Skills
  const skillConsistency = useMemo(() => {
    if (!hasResumeData || resumeSkills.length === 0 || !result?.skills) return [];

    const githubSkillNames = result.skills.map(s => s.skill.toLowerCase());

    return resumeSkills.slice(0, 10).map(rSkill => {
      const rLower = rSkill.toLowerCase();
      const inGitHub = githubSkillNames.some(
        g => g.includes(rLower) || rLower.includes(g)
      );
      return {
        skill: rSkill,
        consistent: inGitHub,
        statusText: inGitHub ? "Verified in repositories" : "Not found in analyzed repositories",
      };
    });
  }, [hasResumeData, resumeSkills, result]);

  // 7. Navigation helper to AI Roadmap for missing skill
  const handleGoToRoadmap = (missingSkill?: string) => {
    if (missingSkill) {
      try {
        localStorage.setItem("career_orbit_roadmap_target_skills", JSON.stringify([missingSkill]));
        localStorage.setItem("career_orbit_roadmap_target_role", targetRole);
      } catch (e) {
        console.error(e);
      }
    }
    navigate("/roadmap");
  };

  return (
    <div className="github-analyzer-container">
      {/* Top Banner & Search Form */}
      <section className="panel github-search-card">
        <div className="github-search-header">
          <div className="github-header-badge">
            <GitBranch size={18} />
            <span>PORTFOLIO INTELLIGENCE</span>
          </div>
          <h2>GitHub Profile Analyzer</h2>
          <p className="github-subtitle">
            Turn your repositories into a stronger portfolio signal. Enter a public GitHub username to evaluate repositories, score portfolio readiness, and uncover skill gaps.
          </p>
        </div>

        <form
          className="github-search-bar"
          onSubmit={e => {
            e.preventDefault();
            handleAnalyze();
          }}
        >
          <div className="github-input-wrapper">
            <span className="github-prefix">github.com/</span>
            <input
              type="text"
              id="github-username-input"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="e.g. torvalds, gaearon, or your username"
              aria-label="GitHub Username"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            className="primary btn-analyze-github"
            disabled={loading || !username.trim()}
          >
            {loading ? (
              <>
                <RotateCcw size={16} className="spin-icon" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Analyze profile
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="github-error-banner" role="alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}
      </section>

      {/* Loading Skeleton */}
      {loading && (
        <div className="github-skeleton-state">
          <div className="panel skeleton-card">
            <div className="skeleton-line-title"></div>
            <div className="skeleton-line-sub"></div>
            <div className="skeleton-grid-placeholder">
              <div className="skeleton-box"></div>
              <div className="skeleton-box"></div>
              <div className="skeleton-box"></div>
            </div>
          </div>
        </div>
      )}

      {/* Main Results View */}
      {result && !loading && (
        <div className="github-results-wrapper">
          {/* Section 1: GitHub Profile Card & Portfolio Score Grid */}
          <div className="github-top-summary-grid">
            {/* 1. Profile Details Card */}
            <div className="panel github-profile-card">
              <div className="profile-card-header">
                <img
                  src={result.profile.avatarUrl}
                  alt={result.profile.name}
                  className="profile-avatar-large"
                  onError={e => {
                    (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(result.profile.name)}&background=207452&color=fff`;
                  }}
                />
                <div className="profile-identity">
                  <h3>{result.profile.name}</h3>
                  <a
                    href={result.profile.htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="profile-handle-link"
                  >
                    @{result.profile.username}
                    <ExternalLink size={13} />
                  </a>
                  <p className="profile-bio">{result.profile.bio}</p>
                </div>
              </div>

              <div className="profile-stats-bar">
                <div className="stat-item">
                  <span className="stat-label">Repositories</span>
                  <span className="stat-value">{result.profile.publicRepos}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Followers</span>
                  <span className="stat-value">{result.profile.followers}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Following</span>
                  <span className="stat-value">{result.profile.following}</span>
                </div>
              </div>

              {result.profile.blog && (
                <div className="profile-extra-link">
                  <ExternalLink size={13} />
                  <a href={result.profile.blog.startsWith("http") ? result.profile.blog : `https://${result.profile.blog}`} target="_blank" rel="noopener noreferrer">
                    {result.profile.blog}
                  </a>
                </div>
              )}
            </div>

            {/* 2. GitHub Portfolio Score Card */}
            <div className="panel github-score-card">
              <div className="score-card-header">
                <div>
                  <span className="score-card-label">PORTFOLIO ASSESSMENT</span>
                  <h3>GitHub Portfolio Score</h3>
                </div>
                <div className="overall-score-badge">
                  <span className="score-number">{result.portfolioScore.overall}</span>
                  <span className="score-max">/ 100</span>
                </div>
              </div>

              <p className="score-disclaimer">
                ⭐ This score is an AI-generated portfolio assessment, not an official GitHub score.
              </p>

              <div className="score-breakdown-list">
                <div className="score-breakdown-item">
                  <div className="breakdown-meta">
                    <span className="meta-title">Repositories</span>
                    <span className="meta-value">{result.portfolioScore.repositories}%</span>
                  </div>
                  <div className="breakdown-track">
                    <div
                      className="breakdown-fill"
                      style={{ width: `${result.portfolioScore.repositories}%` }}
                    />
                  </div>
                </div>

                <div className="score-breakdown-item">
                  <div className="breakdown-meta">
                    <span className="meta-title">Activity</span>
                    <span className="meta-value">{result.portfolioScore.activity}%</span>
                  </div>
                  <div className="breakdown-track">
                    <div
                      className="breakdown-fill"
                      style={{ width: `${result.portfolioScore.activity}%` }}
                    />
                  </div>
                </div>

                <div className="score-breakdown-item">
                  <div className="breakdown-meta">
                    <span className="meta-title">Project Quality</span>
                    <span className="meta-value">{result.portfolioScore.projectQuality}%</span>
                  </div>
                  <div className="breakdown-track">
                    <div
                      className="breakdown-fill"
                      style={{ width: `${result.portfolioScore.projectQuality}%` }}
                    />
                  </div>
                </div>

                <div className="score-breakdown-item">
                  <div className="breakdown-meta">
                    <span className="meta-title">Documentation</span>
                    <span className="meta-value">{result.portfolioScore.documentation}%</span>
                  </div>
                  <div className="breakdown-track">
                    <div
                      className="breakdown-fill"
                      style={{ width: `${result.portfolioScore.documentation}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Detected Skills & Target Role Gaps */}
          <div className="github-two-col-grid">
            {/* Detected Skills */}
            <div className="panel github-skills-card">
              <div className="card-heading-with-icon">
                <Code2 size={18} className="text-emerald" />
                <div>
                  <h4>Detected Skills</h4>
                  <p className="section-subtext">Technologies identified across your public repositories.</p>
                </div>
              </div>

              <div className="skills-bar-collection">
                {result.skills.length === 0 ? (
                  <p className="no-data-hint">No specific language or framework detected in repositories.</p>
                ) : (
                  result.skills.slice(0, 7).map(item => (
                    <div key={item.skill} className="skill-meter-row">
                      <div className="skill-meter-meta">
                        <span className="skill-name">{item.skill}</span>
                        <span className="skill-repo-count">{item.count} {item.count === 1 ? "repo" : "repos"}</span>
                      </div>
                      <div className="skill-meter-track">
                        <div
                          className="skill-meter-fill"
                          style={{ width: `${Math.max(15, item.percentage)}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Skill Gaps vs Target Role */}
            <div className="panel github-gaps-card">
              <div className="card-heading-with-icon">
                <TrendingUp size={18} className="text-emerald" />
                <div>
                  <h4>Target Role Skill Gaps</h4>
                  <p className="section-subtext">Comparing GitHub codebase against <strong>{targetRole}</strong> expectations.</p>
                </div>
              </div>

              <div className="gaps-content">
                <div className="gaps-subgroup">
                  <span className="gaps-subgroup-title text-success">Your Verified Skills:</span>
                  <div className="chips-flex-row">
                    {roleGaps.matched.length > 0 ? (
                      roleGaps.matched.map(s => (
                        <span key={s} className="skill-pill-badge pill-matched">
                          <Check size={12} />
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="pill-muted">No direct primary matches found yet.</span>
                    )}
                  </div>
                </div>

                <div className="gaps-subgroup">
                  <span className="gaps-subgroup-title text-warning">Recommended Skills to Build:</span>
                  <div className="chips-flex-row">
                    {roleGaps.missing.map(s => (
                      <span key={s} className="skill-pill-badge pill-recommended">
                        <AlertTriangle size={12} />
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {roleGaps.missing.length > 0 && (
                  <div className="roadmap-callout-box">
                    <div className="callout-text">
                      <Sparkles size={16} className="text-emerald" />
                      <span>
                        AI Recommendation: Add <strong>{roleGaps.missing[0]}</strong> to your learning roadmap.
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn-link-roadmap"
                      onClick={() => handleGoToRoadmap(roleGaps.missing[0])}
                    >
                      <BookOpen size={14} />
                      View AI Roadmap
                      <ArrowRight size={13} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Connection with Resume Analyzer (Skill Consistency) */}
          {hasResumeData && (
            <div className="panel github-resume-sync-card">
              <div className="card-heading-with-icon">
                <FileCheck size={18} className="text-emerald" />
                <div className="sync-title-box">
                  <h4>Resume & GitHub Skill Consistency</h4>
                  <span className="badge-synced">Resume Data Linked</span>
                </div>
              </div>
              <p className="section-subtext">
                Cross-referencing claims from your analyzed resume against proof found in your public GitHub repositories.
              </p>

              <div className="consistency-table-wrapper">
                <table className="consistency-table">
                  <thead>
                    <tr>
                      <th>Resume Skill</th>
                      <th>GitHub Presence</th>
                      <th>Portfolio Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {skillConsistency.map(item => (
                      <tr key={item.skill}>
                        <td className="skill-title-cell">
                          <strong>{item.skill}</strong>
                        </td>
                        <td>
                          {item.consistent ? (
                            <span className="status-tag status-success">
                              <CheckCircle2 size={13} />
                              Verified in Repos
                            </span>
                          ) : (
                            <span className="status-tag status-warning">
                              <AlertTriangle size={13} />
                              Not in Public Repos
                            </span>
                          )}
                        </td>
                        <td className="status-desc-cell">
                          {item.consistent
                            ? "Solid proof established for recruiters."
                            : "Consider building or publishing a repository that demonstrates this skill."}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Section 4: Recommended Projects to Highlight */}
          <div className="panel github-highlights-card">
            <div className="card-heading-with-icon">
              <Star size={18} className="text-amber" />
              <div>
                <h4>Recommended Projects to Highlight</h4>
                <p className="section-subtext">3 repositories best suited to pin or emphasize on your portfolio.</p>
              </div>
            </div>

            <div className="highlighted-projects-grid">
              {result.recommendedToHighlight.length === 0 ? (
                <p className="no-data-hint">Create and publicize showcase repositories to unlock highlight recommendations.</p>
              ) : (
                result.recommendedToHighlight.map((proj, idx) => (
                  <div key={idx} className="highlight-project-box">
                    <div className="highlight-box-header">
                      <FolderGit2 size={18} className="text-emerald" />
                      <span className="highlight-tag">Showcase #{idx + 1}</span>
                    </div>
                    <h5>{proj.name}</h5>
                    {proj.language && (
                      <span className="repo-lang-badge">{proj.language}</span>
                    )}
                    <p className="highlight-reason">{proj.reason}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section 5: Profile Checklist & AI Recommendations */}
          <div className="github-two-col-grid">
            {/* Profile Improvements Checklist */}
            <div className="panel github-checklist-card">
              <div className="card-heading-with-icon">
                <ShieldCheck size={18} className="text-emerald" />
                <div>
                  <h4>Profile Checklist</h4>
                  <p className="section-subtext">Essential signals recruiters look for on your profile.</p>
                </div>
              </div>

              <div className="checklist-items-stack">
                {result.checklist.map((item, i) => (
                  <div
                    key={i}
                    className={`checklist-item-row ${item.status === "completed" ? "item-completed" : "item-warning"}`}
                  >
                    <div className="check-icon-circle">
                      {item.status === "completed" ? (
                        <CheckCircle2 size={16} className="icon-pass" />
                      ) : (
                        <AlertCircle size={16} className="icon-warn" />
                      )}
                    </div>
                    <div className="check-text">
                      <span className="check-title">{item.label}</span>
                      {item.note && <span className="check-note">{item.note}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Portfolio Recommendations */}
            <div className="panel github-recommendations-card">
              <div className="card-heading-with-icon">
                <Sparkles size={18} className="text-emerald" />
                <div>
                  <h4>AI Portfolio Recommendations</h4>
                  <p className="section-subtext">Actionable next steps to boost recruiter conversion.</p>
                </div>
              </div>

              <div className="recommendations-list">
                {result.recommendations.map((rec, i) => (
                  <div key={i} className="rec-item">
                    <span className="rec-num">{i + 1}</span>
                    <p className="rec-text">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 6: Repository Explorer & Filters */}
          <div className="panel github-repos-explorer">
            <div className="explorer-header">
              <div>
                <h4>Repositories Analysis</h4>
                <p className="section-subtext">
                  Showing {filteredRepos.length} public {filteredRepos.length === 1 ? "repository" : "repositories"}.
                </p>
              </div>

              {/* Live Search Input */}
              <div className="repo-search-box">
                <Search size={15} className="repo-search-icon" />
                <input
                  type="text"
                  placeholder="Search repositories..."
                  value={repoSearch}
                  onChange={e => setRepoSearch(e.target.value)}
                  aria-label="Filter repositories"
                />
              </div>
            </div>

            {/* Language Filter Pills */}
            <div className="repo-filter-pills">
              {availableLanguages.map(lang => (
                <button
                  key={lang}
                  type="button"
                  className={`filter-pill ${selectedLanguage === lang ? "active" : ""}`}
                  onClick={() => setSelectedLanguage(lang)}
                >
                  {lang}
                </button>
              ))}
            </div>

            {/* Repositories Cards Grid */}
            <div className="repositories-cards-grid">
              {filteredRepos.length === 0 ? (
                <div className="no-matching-repos">
                  <FolderGit2 size={32} />
                  <p>No repositories found matching your filter criteria.</p>
                </div>
              ) : (
                filteredRepos.map(repo => (
                  <div key={repo.id} className="repo-card">
                    <div className="repo-card-top">
                      <div className="repo-title-row">
                        <h5 title={repo.name}>{repo.name}</h5>
                        {repo.isFork && <span className="fork-badge">Fork</span>}
                      </div>

                      <p className="repo-desc">
                        {repo.description && repo.description !== "No description provided."
                          ? repo.description
                          : "No description provided."}
                      </p>
                    </div>

                    <div className="repo-meta-row">
                      <div className="meta-left">
                        <span className="repo-language">
                          <span className="lang-dot" />
                          {repo.language}
                        </span>
                        <span className="repo-stat" title={`${repo.stars} Stars`}>
                          <Star size={13} />
                          {repo.stars}
                        </span>
                        <span className="repo-stat" title={`${repo.forks} Forks`}>
                          <GitFork size={13} />
                          {repo.forks}
                        </span>
                      </div>

                      <div className="meta-right">
                        <span className="quality-pill" title="AI Repository Quality Score">
                          Quality: <strong>{repo.quality}%</strong>
                        </span>
                      </div>
                    </div>

                    {/* AI Feedback Box */}
                    <div className="repo-ai-feedback-box">
                      <div className="feedback-main">
                        <Sparkles size={13} className="text-emerald" />
                        <span>{repo.feedback}</span>
                      </div>

                      {/* Pros & Cons Checklist */}
                      {(repo.pros || repo.cons) && (
                        <div className="feedback-bullet-tags">
                          {repo.pros?.map((p, idx) => (
                            <span key={`pro-${idx}`} className="bullet-tag tag-pro">
                              ✓ {p}
                            </span>
                          ))}
                          {repo.cons?.map((c, idx) => (
                            <span key={`con-${idx}`} className="bullet-tag tag-con">
                              ⚠ {c}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Card Footer Button */}
                    <div className="repo-card-actions">
                      <a
                        href={repo.htmlUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-view-repo"
                      >
                        <span>View Repository</span>
                        <ExternalLink size={13} />
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
