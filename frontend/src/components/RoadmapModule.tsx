import { useState, useEffect, useMemo } from "react";
import {
  MapPin,
  CheckCircle2,
  Circle,
  Clock,
  Target,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Award,
  Zap,
  BookOpen,
  Briefcase,
  Layers,
  FileCheck,
  Check,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
import { api } from "../services/api";
import { JOB_ROLES_CATEGORIES } from "../pages/AuthPage";

export interface RoadmapTopic {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export interface RoadmapPhase {
  phaseId: number;
  title: string;
  subtitle: string;
  topics: RoadmapTopic[];
}

export interface RoadmapData {
  title: string;
  targetRole: string;
  skillLevel: string;
  studyTime: string;
  goal: string;
  currentFocus: string;
  currentFocusReason: string;
  aiRecommendation: string;
  phases: RoadmapPhase[];
}

export function RoadmapModule() {
  // Setup Form State
  const [targetRole, setTargetRole] = useState("MERN Stack Developer");
  const [customRole, setCustomRole] = useState("");
  const [accountRole, setAccountRole] = useState<string | null>(null);
  const [skillLevel, setSkillLevel] = useState<"Beginner" | "Intermediate" | "Advanced">("Beginner");
  const [studyTime, setStudyTime] = useState<"30 min" | "1 hour" | "2 hours">("1 hour");
  const [goal, setGoal] = useState<"Job" | "Internship" | "Skill Improvement">("Job");

  // Connected Resume State
  const [detectedResumeSkills, setDetectedResumeSkills] = useState<string[]>([]);
  const [detectedMissingSkills, setDetectedMissingSkills] = useState<string[]>([]);
  const [useResumeData, setUseResumeData] = useState(true);

  // Roadmap State
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load cached roadmap, logged in user targetRole & detected resume analysis from localStorage
  useEffect(() => {
    try {
      // 1. Check logged in user profile role
      const userRaw = localStorage.getItem("user");
      if (userRaw) {
        const user = JSON.parse(userRaw);
        if (user.targetRole) {
          setAccountRole(user.targetRole);
          setTargetRole(user.targetRole);
        }
      }

      // 2. Check cached roadmap & fetch latest from server
      const cached = localStorage.getItem("career_orbit_roadmap");
      if (cached) {
        setRoadmap(JSON.parse(cached));
      }

      api
        .get<RoadmapData>("/roadmap")
        .then((res) => {
          if (res.data?.phases && res.data.phases.length > 0) {
            setRoadmap(res.data);
            localStorage.setItem("career_orbit_roadmap", JSON.stringify(res.data));
          }
        })
        .catch(() => null);

      // 3. Check if resume analysis data exists
      const resumeCache = localStorage.getItem("career_orbit_resume_analysis");
      if (resumeCache) {
        const parsed = JSON.parse(resumeCache);
        if (parsed.matchedSkills || parsed.strengths) {
          setDetectedResumeSkills(parsed.matchedSkills || []);
        }
        if (parsed.missingKeywords || parsed.missingSkills) {
          setDetectedMissingSkills(parsed.missingKeywords || parsed.missingSkills || []);
        }
      }
    } catch (e) {
      console.error("Error reading local storage:", e);
    }
  }, []);

  // Save changes to localStorage whenever roadmap updates
  const saveRoadmapState = (updated: RoadmapData) => {
    setRoadmap(updated);
    try {
      localStorage.setItem("career_orbit_roadmap", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Generate Roadmap Action
  const generateRoadmap = async () => {
    setLoading(true);
    setError("");

    const roleToUse = targetRole === "Custom" ? customRole.trim() || "Software Developer" : targetRole;

    const payload = {
      targetRole: roleToUse,
      skillLevel,
      studyTime,
      goal,
      resumeSkills: useResumeData ? detectedResumeSkills : [],
      missingSkills: useResumeData ? detectedMissingSkills : [],
    };

    try {
      const res = await api.post<RoadmapData>("/roadmap/generate", payload);
      saveRoadmapState(res.data);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to generate roadmap. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // Toggle Topic Completion
  const toggleTopic = (phaseId: number, topicId: string) => {
    if (!roadmap) return;

    const updatedPhases = roadmap.phases.map((phase) => {
      if (phase.phaseId !== phaseId) return phase;
      return {
        ...phase,
        topics: phase.topics.map((t) => (t.id === topicId ? { ...t, completed: !t.completed } : t)),
      };
    });

    // Calculate next uncompleted topic for dynamic focus
    let nextFocus = roadmap.currentFocus;
    let nextFocusReason = roadmap.currentFocusReason;

    for (const p of updatedPhases) {
      const uncompleted = p.topics.find((t) => !t.completed);
      if (uncompleted) {
        nextFocus = uncompleted.title;
        nextFocusReason = `Recommended because ${uncompleted.title} is your next important skill in ${p.title}.`;
        break;
      }
    }

    const updatedRoadmap: RoadmapData = {
      ...roadmap,
      currentFocus: nextFocus,
      currentFocusReason: nextFocusReason,
      phases: updatedPhases,
    };

    saveRoadmapState(updatedRoadmap);

    // Persist topic toggle to backend
    api.patch("/roadmap/topic", { phaseId, topicId }).catch(() => null);
  };

  // Compute Overall Progress & Counts
  const { totalTopics, completedTopics, progressPercent } = useMemo(() => {
    if (!roadmap || !roadmap.phases) {
      return { totalTopics: 0, completedTopics: 0, progressPercent: 0 };
    }

    let total = 0;
    let completed = 0;

    roadmap.phases.forEach((p) => {
      p.topics.forEach((t) => {
        total++;
        if (t.completed) completed++;
      });
    });

    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { totalTopics: total, completedTopics: completed, progressPercent: percent };
  }, [roadmap]);

  return (
    <div className="roadmap-module-container">
      {/* Top Banner */}
      <div className="panel roadmap-hero-banner">
        <div className="roadmap-hero-left">
          <div className="roadmap-badge">
            <Sparkles size={15} />
            <span>AI CAREER PATH</span>
          </div>
          <h2>AI Career Roadmap</h2>
          <p>Your personalized path to your career goal</p>
        </div>

        {roadmap && (
          <div className="roadmap-hero-stats">
            <div className="stat-pill">
              <Target size={18} className="pill-icon green" />
              <div>
                <span className="stat-sub">Target Role</span>
                <strong>{roadmap.targetRole}</strong>
              </div>
            </div>
            <div className="stat-pill">
              <Clock size={18} className="pill-icon blue" />
              <div>
                <span className="stat-sub">Study Time</span>
                <strong>{roadmap.studyTime} / day</strong>
              </div>
            </div>
            <div className="stat-pill">
              <Award size={18} className="pill-icon purple" />
              <div>
                <span className="stat-sub">Progress</span>
                <strong>{progressPercent}% Complete</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 1. Roadmap Setup Form (Show if no roadmap yet, or collapsible) */}
      {!roadmap ? (
        <div className="panel roadmap-setup-card">
          <div className="setup-head">
            <Layers size={22} className="setup-head-icon" />
            <div>
              <h3>Customize Your Learning Plan</h3>
              <p>Configure your preferences and let Gemini AI generate your step-by-step career path.</p>
            </div>
          </div>

          <div className="setup-fields-grid">
            {/* Target Role */}
            <div className="form-field-group">
              <label className="field-label">Target Role</label>
              <select
                className="setup-select"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
              >
                <option value="MERN Developer">MERN Developer</option>
                <option value="Frontend Developer">Frontend Developer</option>
                <option value="Backend Developer">Backend Developer</option>
                <option value="Java Developer">Java Developer</option>
                <option value="Python Developer">Python Developer</option>
                <option value="Full Stack Developer">Full Stack Developer</option>
                <option value="Data Scientist">Data Scientist</option>
                <option value="Custom">Custom Role...</option>
              </select>
              {targetRole === "Custom" && (
                <input
                  type="text"
                  className="setup-input-text mt-2"
                  placeholder="Enter custom role title, e.g. DevOps Engineer"
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                />
              )}
            </div>

            {/* Current Skill Level */}
            <div className="form-field-group">
              <label className="field-label">Current Skill Level</label>
              <div className="pill-selector-row">
                {(["Beginner", "Intermediate", "Advanced"] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    className={`pill-choice-btn ${skillLevel === lvl ? "active" : ""}`}
                    onClick={() => setSkillLevel(lvl)}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Daily Study Time */}
            <div className="form-field-group">
              <label className="field-label">Daily Study Time</label>
              <div className="pill-selector-row">
                {(["30 min", "1 hour", "2 hours"] as const).map((time) => (
                  <button
                    key={time}
                    type="button"
                    className={`pill-choice-btn ${studyTime === time ? "active" : ""}`}
                    onClick={() => setStudyTime(time)}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            {/* Primary Goal */}
            <div className="form-field-group">
              <label className="field-label">Primary Goal</label>
              <div className="pill-selector-row">
                {(["Job", "Internship", "Skill Improvement"] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    className={`pill-choice-btn ${goal === g ? "active" : ""}`}
                    onClick={() => setGoal(g)}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Connected Resume Indicator */}
          {(detectedResumeSkills.length > 0 || detectedMissingSkills.length > 0) && (
            <div className="resume-connected-box">
              <div className="resume-conn-left">
                <FileCheck size={18} className="file-check-icon" />
                <div>
                  <strong>Connected with Resume Analyzer</strong>
                  <span>
                    Detected skills: {detectedResumeSkills.slice(0, 4).join(", ") || "Available"}.
                    {detectedMissingSkills.length > 0 &&
                      ` Missing focus areas: ${detectedMissingSkills.slice(0, 3).join(", ")}.`}
                  </span>
                </div>
              </div>
              <label className="switch-label">
                <input
                  type="checkbox"
                  checked={useResumeData}
                  onChange={(e) => setUseResumeData(e.target.checked)}
                />
                <span className="switch-slider"></span>
              </label>
            </div>
          )}

          {error && (
            <div className="alert-error mt-3">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="setup-actions-row">
            <button
              type="button"
              className="primary generate-roadmap-btn"
              onClick={generateRoadmap}
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCw size={18} className="spinner-icon" />
                  Generating Personalized Roadmap...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Generate Roadmap
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* 2. Active Generated Roadmap View */
        <div className="active-roadmap-view">
          {/* Action Bar (Re-configure / Regenerate) */}
          <div className="roadmap-action-bar">
            <div className="action-bar-left">
              <span className="roadmap-role-tag">{roadmap.targetRole}</span>
              <span className="roadmap-sub-tag">{roadmap.skillLevel} Level</span>
              <span className="roadmap-sub-tag">Goal: {roadmap.goal}</span>
            </div>
            <button
              type="button"
              className="reconfigure-btn"
              onClick={() => setRoadmap(null)}
              title="Change configuration and regenerate"
            >
              <RotateCcw size={15} /> Customize / Regenerate
            </button>
          </div>

          {/* Overall Progress Bar Track */}
          <div className="panel roadmap-progress-card">
            <div className="progress-header-row">
              <div>
                <span className="progress-eyebrow">LEARNING COMPLETION</span>
                <h3>Overall Progress: {progressPercent}%</h3>
              </div>
              <div className="progress-count-badge">
                <strong>{completedTopics}</strong> of {totalTopics} Topics Mastered
              </div>
            </div>

            <div className="progress-bar-track">
              <div
                className="progress-bar-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* 4. Your Current Focus (Prominently displayed) */}
          {roadmap.currentFocus && (
            <div className="panel current-focus-card">
              <div className="focus-header-row">
                <div className="focus-icon-box">
                  <Zap size={22} />
                </div>
                <div className="focus-text-group">
                  <span className="focus-eyebrow">YOUR CURRENT FOCUS</span>
                  <h3 className="focus-skill-title">{roadmap.currentFocus}</h3>
                  <p className="focus-reason-text">
                    "{roadmap.currentFocusReason || "Recommended because this is your next important skill."}"
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 2. Phases Cards (Phase 1 to Phase 4) */}
          <div className="roadmap-phases-grid">
            {roadmap.phases.map((phase) => {
              const completedInPhase = phase.topics.filter((t) => t.completed).length;
              const isPhaseComplete = phase.topics.length > 0 && completedInPhase === phase.topics.length;

              return (
                <div key={phase.phaseId} className={`panel roadmap-phase-card ${isPhaseComplete ? "complete" : ""}`}>
                  <div className="phase-card-header">
                    <div className="phase-title-group">
                      <span className="phase-badge">Phase {phase.phaseId}</span>
                      <h4>{phase.title.replace(/^Phase \d+\s*-\s*/i, "")}</h4>
                      <p className="phase-subtitle">{phase.subtitle}</p>
                    </div>
                    <span className="phase-progress-pill">
                      {completedInPhase}/{phase.topics.length}
                    </span>
                  </div>

                  {/* Topics Checklist */}
                  <div className="phase-topics-list">
                    {phase.topics.map((topic) => (
                      <div
                        key={topic.id}
                        className={`topic-item-row ${topic.completed ? "completed" : ""}`}
                        onClick={() => toggleTopic(phase.phaseId, topic.id)}
                      >
                        <button
                          type="button"
                          className={`topic-check-btn ${topic.completed ? "checked" : ""}`}
                          aria-label={topic.completed ? "Completed" : "Mark Complete"}
                        >
                          {topic.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                        </button>

                        <div className="topic-text-content">
                          <strong className="topic-title">{topic.title}</strong>
                          {topic.description && (
                            <span className="topic-description">{topic.description}</span>
                          )}
                        </div>

                        <span className={`topic-status-label ${topic.completed ? "done" : "todo"}`}>
                          {topic.completed ? "Completed" : "Mark Complete"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 5. AI Recommendation (Prominently displayed at the bottom) */}
          {roadmap.aiRecommendation && (
            <div className="panel ai-recommendation-card">
              <div className="rec-header-row">
                <BookOpen size={20} className="rec-icon" />
                <div>
                  <h4>AI Recommendation</h4>
                  <p className="rec-quote">"{roadmap.aiRecommendation}"</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
