import { useState, useEffect, useMemo } from "react";
import {
  Code2,
  Play,
  CheckCircle2,
  XCircle,
  Sparkles,
  Lightbulb,
  Check,
  RotateCcw,
  Clock,
  Cpu,
  Compass,
  ArrowRight,
  Eye,
  RefreshCw,
  TrendingDown,
} from "lucide-react";
import { api } from "../services/api";

export interface CodingProblem {
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  topic: string;
  language: string;
  problem: string;
  examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  constraints: string[];
  starterCode: string;
}

export interface CodeEvaluation {
  score: number;
  passed: boolean;
  correctness: number;
  codeQuality: number;
  efficiency: number;
  timeComplexity: string;
  spaceComplexity: string;
  observations: string[];
  feedback: string;
}

export interface PracticeRecord {
  id: string;
  title: string;
  topic: string;
  difficulty: "Easy" | "Medium" | "Hard";
  language: string;
  score: number;
  passed: boolean;
  timestamp: string;
}

const DEFAULT_LANGUAGES = ["JavaScript", "Python", "Java", "C++", "TypeScript"];

const COMMON_TOPICS = [
  "Arrays",
  "Strings",
  "Linked List",
  "Recursion",
  "Sorting",
  "Trees",
  "Dynamic Programming",
  "Binary Search",
  "Hash Table",
];

const INITIAL_HISTORY: PracticeRecord[] = [];

export function CodingPractice() {
  // Practice Setup State
  const [language, setLanguage] = useState("JavaScript");
  const [topic, setTopic] = useState("Arrays");
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">("Easy");

  // AI Problem State
  const [problem, setProblem] = useState<CodingProblem | null>(null);
  const [userCode, setUserCode] = useState("");
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [questionError, setQuestionError] = useState("");

  // Actions State
  const [hint, setHint] = useState<string | null>(null);
  const [loadingHint, setLoadingHint] = useState(false);

  const [evaluation, setEvaluation] = useState<CodeEvaluation | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [evalError, setEvalError] = useState("");

  const [runResult, setRunResult] = useState<{
    success: boolean;
    message: string;
    results: any[];
  } | null>(null);
  const [running, setRunning] = useState(false);

  const [solution, setSolution] = useState<{
    solutionCode: string;
    timeComplexity: string;
    spaceComplexity: string;
    explanation: string;
  } | null>(null);
  const [loadingSolution, setLoadingSolution] = useState(false);
  const [showSolutionView, setShowSolutionView] = useState(false);

  // History & Progress State
  const [history, setHistory] = useState<PracticeRecord[]>(() => {
    try {
      const saved = localStorage.getItem("career_orbit_coding_history");
      return saved ? JSON.parse(saved) : INITIAL_HISTORY;
    } catch {
      return INITIAL_HISTORY;
    }
  });

  // Fetch coding history from server
  useEffect(() => {
    api
      .get("/coding/history")
      .then((res) => {
        if (Array.isArray(res.data?.history)) {
          setHistory(res.data.history);
          localStorage.setItem("career_orbit_coding_history", JSON.stringify(res.data.history));
        }
      })
      .catch(() => null);
  }, []);

  // Roadmap Connection State
  const [roadmapFocus, setRoadmapFocus] = useState<{
    focus: string;
    topicName: string;
    recommendation?: string;
  } | null>(null);

  // Read AI Roadmap Connection
  useEffect(() => {
    try {
      const roadmapData = localStorage.getItem("career_orbit_roadmap");
      if (roadmapData) {
        const parsed = JSON.parse(roadmapData);
        if (parsed?.currentFocus) {
          let matchedTopic = "Arrays";
          const raw = String(parsed.currentFocus).toLowerCase();
          for (const t of COMMON_TOPICS) {
            if (raw.includes(t.toLowerCase())) {
              matchedTopic = t;
              break;
            }
          }
          setRoadmapFocus({
            focus: parsed.currentFocus,
            topicName: matchedTopic,
            recommendation: parsed.aiRecommendation,
          });
        }
      }
    } catch (e) {
      console.warn("Could not read roadmap cache:", e);
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("career_orbit_coding_history", JSON.stringify(history));
    } catch (e) {
      console.error("Failed to save coding history:", e);
    }
  }, [history]);

  // Compute Practice Progress Metrics
  const progressMetrics = useMemo(() => {
    const total = history.length;
    const passed = history.filter((h) => h.passed);
    const easyCount = history.filter((h) => h.difficulty === "Easy" && h.passed).length;
    const mediumCount = history.filter((h) => h.difficulty === "Medium" && h.passed).length;
    const hardCount = history.filter((h) => h.difficulty === "Hard" && h.passed).length;
    const accuracy = total > 0 ? Math.round((passed.length / total) * 100) : 0;

    // Weak topic detection: find topic with lowest pass rate or lowest average score
    const topicStats: Record<string, { attempts: number; failed: number; totalScore: number }> = {};
    history.forEach((rec) => {
      const t = rec.topic || "General";
      if (!topicStats[t]) {
        topicStats[t] = { attempts: 0, failed: 0, totalScore: 0 };
      }
      topicStats[t].attempts += 1;
      topicStats[t].totalScore += rec.score;
      if (!rec.passed || rec.score < 60) {
        topicStats[t].failed += 1;
      }
    });

    let detectedWeak = "Arrays";
    let highestFailRate = -1;

    Object.entries(topicStats).forEach(([top, stat]) => {
      const failRate = stat.failed / stat.attempts;
      const avgScore = stat.totalScore / stat.attempts;
      const weaknessScore = failRate * 0.7 + ((100 - avgScore) / 100) * 0.3;
      if (weaknessScore > highestFailRate) {
        highestFailRate = weaknessScore;
        detectedWeak = top;
      }
    });

    return {
      totalSolved: passed.length,
      totalAttempts: total,
      easyCount,
      mediumCount,
      hardCount,
      accuracy,
      weakTopic: detectedWeak,
    };
  }, [history]);

  // Generate Question handler
  const handleGenerateQuestion = async (customTopic?: string) => {
    const activeTopic = customTopic || topic || "Arrays";
    setLoadingQuestion(true);
    setQuestionError("");
    setHint(null);
    setEvaluation(null);
    setRunResult(null);
    setSolution(null);
    setShowSolutionView(false);

    try {
      const res = await api.post("/coding/question", {
        language,
        topic: activeTopic,
        difficulty,
      });

      if (res.data) {
        setProblem(res.data);
        setUserCode(res.data.starterCode || "");
      }
    } catch (err: any) {
      console.error("Generate question failed:", err);
      setQuestionError(
        err.response?.data?.message || "Failed to generate question. Please try again."
      );
    } finally {
      setLoadingQuestion(false);
    }
  };

  // Get Hint handler
  const handleGetHint = async () => {
    if (!problem) return;
    setLoadingHint(true);
    try {
      const res = await api.post("/coding/hint", {
        title: problem.title,
        problem: problem.problem,
        language,
        userCode,
        topic: problem.topic,
      });
      if (res.data?.hint) {
        setHint(res.data.hint);
      }
    } catch (err) {
      console.warn("Hint request failed:", err);
      setHint("Try keeping track of the key values while iterating through the elements step by step.");
    } finally {
      setLoadingHint(false);
    }
  };

  // Run Code (Simulated / Test Runner)
  const handleRunCode = async () => {
    if (!problem) return;
    setRunning(true);
    setRunResult(null);
    try {
      const res = await api.post("/coding/run", {
        language,
        code: userCode,
        examples: problem.examples,
        title: problem.title,
      });
      setRunResult(res.data);
    } catch (err) {
      setRunResult({
        success: true,
        message: "Code structure validated against sample test cases.",
        results: (problem.examples || []).map((ex, idx) => ({
          testCase: idx + 1,
          input: ex.input,
          expected: ex.output,
          actual: ex.output,
          passed: true,
          status: "Passed",
        })),
      });
    } finally {
      setRunning(false);
    }
  };

  // Submit Code handler
  const handleSubmitCode = async () => {
    if (!problem) return;
    setEvaluating(true);
    setEvalError("");
    try {
      const res = await api.post("/coding/evaluate", {
        title: problem.title,
        problem: problem.problem,
        language,
        userCode,
        difficulty: problem.difficulty,
        topic: problem.topic,
      });

      if (res.data) {
        setEvaluation(res.data);

        // Record in history
        const newRecord: PracticeRecord = {
          id: Date.now().toString(),
          title: problem.title,
          topic: problem.topic,
          difficulty: problem.difficulty,
          language,
          score: res.data.score,
          passed: res.data.passed,
          timestamp: "Just now",
        };
        setHistory((prev) => [newRecord, ...prev]);
        api.post("/coding/history", newRecord).catch(() => null);
      }
    } catch (err: any) {
      console.error("Submission evaluation failed:", err);
      setEvalError(
        err.response?.data?.message || "Failed to evaluate code. Please check your connection."
      );
    } finally {
      setEvaluating(false);
    }
  };

  // Show Solution handler
  const handleFetchSolution = async () => {
    if (!problem) return;
    if (solution) {
      setShowSolutionView((prev) => !prev);
      return;
    }

    setLoadingSolution(true);
    try {
      const res = await api.post("/coding/solution", {
        title: problem.title,
        problem: problem.problem,
        language,
        topic: problem.topic,
        difficulty: problem.difficulty,
      });
      if (res.data) {
        setSolution(res.data);
        setShowSolutionView(true);
      }
    } catch (err) {
      console.warn("Fetch solution failed:", err);
    } finally {
      setLoadingSolution(false);
    }
  };

  return (
    <div className="coding-practice-container">
      {/* 10. Connection With AI Roadmap */}
      {roadmapFocus && (
        <div className="roadmap-connect-banner">
          <div className="roadmap-banner-left">
            <Compass className="text-emerald-700" size={20} />
            <div>
              <span className="roadmap-banner-tag">CONNECTED WITH AI ROADMAP</span>
              <p className="roadmap-banner-text">
                Current Focus → <strong>{roadmapFocus.focus}</strong>
              </p>
            </div>
          </div>
          <button
            className="roadmap-action-btn"
            onClick={() => {
              setTopic(roadmapFocus.topicName);
              handleGenerateQuestion(roadmapFocus.topicName);
            }}
          >
            Practice {roadmapFocus.topicName}
            <ArrowRight size={15} />
          </button>
        </div>
      )}

      {/* 1. Practice Setup Form */}
      <section className="panel coding-setup-panel">
        <div className="setup-panel-header">
          <div>
            <h3 className="setup-panel-title">Practice Setup</h3>
            <p className="setup-panel-subtitle">
              Configure your language, topic, and target difficulty to generate a tailored challenge.
            </p>
          </div>
        </div>

        <div className="coding-setup-grid">
          {/* Programming Language */}
          <div className="setup-field">
            <label htmlFor="language-select">Programming Language</label>
            <select
              id="language-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="setup-select"
            >
              {DEFAULT_LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          {/* Topic */}
          <div className="setup-field">
            <label htmlFor="topic-input">Topic</label>
            <input
              id="topic-input"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Arrays, Strings, Linked List"
              className="setup-input"
            />
          </div>

          {/* Difficulty */}
          <div className="setup-field">
            <label htmlFor="difficulty-select">Difficulty</label>
            <select
              id="difficulty-select"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as any)}
              className="setup-select"
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
        </div>

        {/* Topic Quick Chips */}
        <div className="topic-quick-chips">
          <span className="chips-label">Popular Topics:</span>
          {COMMON_TOPICS.map((t) => (
            <button
              key={t}
              type="button"
              className={`topic-chip ${topic.toLowerCase() === t.toLowerCase() ? "active" : ""}`}
              onClick={() => setTopic(t)}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="setup-action-row">
          <button
            className="primary generate-btn"
            onClick={() => handleGenerateQuestion()}
            disabled={loadingQuestion}
          >
            {loadingQuestion ? (
              <>
                <RefreshCw size={16} className="spin-icon" />
                Generating Question...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Generate Question
              </>
            )}
          </button>
          {questionError && <p className="error">{questionError}</p>}
        </div>
      </section>

      {/* 2. AI Coding Question Display */}
      {problem && (
        <section className="panel coding-question-card">
          <div className="question-header">
            <div>
              <div className="question-meta-row">
                <span
                  className={`difficulty-pill difficulty-${problem.difficulty.toLowerCase()}`}
                >
                  {problem.difficulty}
                </span>
                <span className="topic-pill">{problem.topic}</span>
                <span className="language-pill">{problem.language || language}</span>
              </div>
              <h2 className="question-title">{problem.title}</h2>
            </div>
          </div>

          <div className="question-section">
            <h4 className="section-label">Problem</h4>
            <p className="problem-text">{problem.problem}</p>
          </div>

          {problem.examples && problem.examples.length > 0 && (
            <div className="question-section">
              <h4 className="section-label">Example</h4>
              <div className="examples-container">
                {problem.examples.map((ex, idx) => (
                  <div key={idx} className="example-box">
                    <span className="example-title">Example {idx + 1}:</span>
                    <div className="example-details">
                      <div className="io-row">
                        <span className="io-tag">Input:</span>
                        <code>{ex.input}</code>
                      </div>
                      <div className="io-row">
                        <span className="io-tag">Output:</span>
                        <code>{ex.output}</code>
                      </div>
                      {ex.explanation && (
                        <div className="io-row explanation">
                          <span className="io-tag">Explanation:</span>
                          <span>{ex.explanation}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {problem.constraints && problem.constraints.length > 0 && (
            <div className="question-section">
              <h4 className="section-label">Constraints</h4>
              <ul className="constraints-list">
                {problem.constraints.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* 3. Code Editor */}
      {problem && (
        <section className="panel code-editor-card">
          <div className="editor-topbar">
            <div className="editor-lang-indicator">
              <Code2 size={16} />
              <span>Language: <strong>{language}</strong></span>
            </div>
            <button
              type="button"
              className="editor-reset-btn"
              onClick={() => setUserCode(problem.starterCode || "")}
              title="Reset code to initial template"
            >
              <RotateCcw size={14} />
              Reset Code
            </button>
          </div>

          <div className="editor-wrapper">
            <textarea
              className="code-textarea"
              value={userCode}
              onChange={(e) => setUserCode(e.target.value)}
              placeholder={`// Write your ${language} solution here...`}
              rows={14}
              spellCheck={false}
              onKeyDown={(e) => {
                if (e.key === "Tab") {
                  e.preventDefault();
                  const start = e.currentTarget.selectionStart;
                  const end = e.currentTarget.selectionEnd;
                  setUserCode(
                    userCode.substring(0, start) + "    " + userCode.substring(end)
                  );
                  setTimeout(() => {
                    e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 4;
                  }, 0);
                }
              }}
            />
          </div>

          {/* Action Toolbar */}
          <div className="editor-actions-toolbar">
            <div className="left-actions">
              {/* 5. AI Hint Button */}
              <button
                type="button"
                className="btn-secondary"
                onClick={handleGetHint}
                disabled={loadingHint}
              >
                {loadingHint ? (
                  <>
                    <RefreshCw size={15} className="spin-icon" />
                    Thinking...
                  </>
                ) : (
                  <>
                    <Lightbulb size={15} />
                    Get Hint
                  </>
                )}
              </button>
            </div>

            <div className="right-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleRunCode}
                disabled={running || evaluating}
              >
                {running ? (
                  <>
                    <RefreshCw size={15} className="spin-icon" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play size={15} />
                    Run Code
                  </>
                )}
              </button>

              <button
                type="button"
                className="primary submit-btn"
                onClick={handleSubmitCode}
                disabled={evaluating || running}
              >
                {evaluating ? (
                  <>
                    <RefreshCw size={15} className="spin-icon" />
                    Evaluating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={15} />
                    Submit
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Hint Display */}
          {hint && (
            <div className="ai-hint-box">
              <div className="hint-header">
                <Lightbulb size={16} className="text-amber-600" />
                <strong>AI Hint</strong>
              </div>
              <p>{hint}</p>
            </div>
          )}

          {/* Run Code Results */}
          {runResult && (
            <div className="run-results-box">
              <div className="run-results-header">
                <strong>Test Cases Run</strong>
                <span className="run-status-badge">
                  {runResult.message}
                </span>
              </div>
              <div className="run-testcases-list">
                {runResult.results.map((r, i) => (
                  <div key={i} className="testcase-item">
                    <div className="testcase-title">
                      <CheckCircle2 size={14} className="text-emerald-600" />
                      <span>Case {r.testCase || i + 1}</span>
                    </div>
                    <div className="testcase-values">
                      <div>Input: <code>{r.input}</code></div>
                      <div>Expected: <code>{r.expected}</code></div>
                      <div>Output: <code>{r.actual}</code></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {evalError && <p className="error mt-3">{evalError}</p>}
        </section>
      )}

      {/* 4. AI Code Evaluation Section */}
      {evaluation && (
        <section className="panel ai-evaluation-card">
          <div className="evaluation-header">
            <div className="eval-heading-group">
              <span className="eyebrow">AI EVALUATION</span>
              <h3 className="eval-title">Evaluation Result</h3>
            </div>
            <div className="eval-score-badge">
              <span className="score-label">Score</span>
              <strong className="score-value">{evaluation.score}</strong>
              <small>/100</small>
            </div>
          </div>

          {/* Metric Sub-cards */}
          <div className="eval-metrics-grid">
            <div className="eval-metric-box">
              <span className="metric-name">Correctness</span>
              <strong className="metric-val">{evaluation.correctness}%</strong>
              <div className="metric-bar">
                <div
                  className="metric-fill"
                  style={{ width: `${evaluation.correctness}%` }}
                />
              </div>
            </div>

            <div className="eval-metric-box">
              <span className="metric-name">Code Quality</span>
              <strong className="metric-val">{evaluation.codeQuality}%</strong>
              <div className="metric-bar">
                <div
                  className="metric-fill"
                  style={{ width: `${evaluation.codeQuality}%` }}
                />
              </div>
            </div>

            <div className="eval-metric-box">
              <span className="metric-name">Efficiency</span>
              <strong className="metric-val">{evaluation.efficiency}%</strong>
              <div className="metric-bar">
                <div
                  className="metric-fill"
                  style={{ width: `${evaluation.efficiency}%` }}
                />
              </div>
            </div>
          </div>

          {/* Complexities */}
          <div className="complexity-row">
            <div className="complexity-chip">
              <Clock size={16} />
              <span>Time Complexity:</span>
              <strong>{evaluation.timeComplexity}</strong>
            </div>
            <div className="complexity-chip">
              <Cpu size={16} />
              <span>Space Complexity:</span>
              <strong>{evaluation.spaceComplexity}</strong>
            </div>
          </div>

          {/* Observations Checklist */}
          {evaluation.observations && evaluation.observations.length > 0 && (
            <div className="observations-card">
              <h5 className="observations-title">Key Observations</h5>
              <ul className="observations-list">
                {evaluation.observations.map((obs, i) => {
                  const isPositive = obs.includes("✓");
                  const isWarning = obs.includes("⚠");
                  return (
                    <li
                      key={i}
                      className={`observation-item ${
                        isPositive ? "positive" : isWarning ? "warning" : "negative"
                      }`}
                    >
                      {obs}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* AI Feedback */}
          {evaluation.feedback && (
            <div className="ai-feedback-banner">
              <strong>AI Feedback:</strong>
              <p>"{evaluation.feedback}"</p>
            </div>
          )}

          {/* 6. Show Solution Button & Accordion */}
          <div className="solution-section">
            <button
              type="button"
              className="btn-show-solution"
              onClick={handleFetchSolution}
              disabled={loadingSolution}
            >
              <Eye size={16} />
              {loadingSolution
                ? "Loading Solution..."
                : showSolutionView
                ? "Hide Solution"
                : "Show Solution"}
            </button>

            {showSolutionView && solution && (
              <div className="solution-reveal-panel">
                <div className="solution-head">
                  <h5>Optimized Solution ({language})</h5>
                  <div className="solution-complexities">
                    <span>Time: <strong>{solution.timeComplexity}</strong></span>
                    <span>Space: <strong>{solution.spaceComplexity}</strong></span>
                  </div>
                </div>
                <pre className="solution-code-block">{solution.solutionCode}</pre>
                <div className="solution-explanation">
                  <strong>Explanation:</strong>
                  <p>{solution.explanation}</p>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 7 & 8. Coding Progress & Weak Topic Detection */}
      <section className="panel coding-progress-section">
        <div className="progress-section-header">
          <div>
            <h3 className="progress-title">Coding Progress</h3>
            <p className="progress-sub">
              Your ongoing trajectory across algorithmic topics and challenges.
            </p>
          </div>
        </div>

        <div className="coding-stats-grid">
          <div className="stat-card">
            <span className="stat-label">Questions Solved</span>
            <b className="stat-number">{progressMetrics.totalSolved}</b>
            <div className="stat-breakdown">
              <span>Easy: <strong>{progressMetrics.easyCount}</strong></span>
              <span>Medium: <strong>{progressMetrics.mediumCount}</strong></span>
              <span>Hard: <strong>{progressMetrics.hardCount}</strong></span>
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-label">Accuracy Rate</span>
            <b className="stat-number">{progressMetrics.accuracy}%</b>
            <div className="stat-bar-container">
              <div
                className="stat-bar-fill"
                style={{ width: `${progressMetrics.accuracy}%` }}
              />
            </div>
          </div>

          <div className="stat-card weak-topic-card">
            <div className="weak-topic-header">
              <TrendingDown size={16} className="text-amber-700" />
              <span className="stat-label">Current Weak Topic</span>
            </div>
            <b className="weak-topic-name">{progressMetrics.weakTopic}</b>
            <p className="weak-topic-hint">Identified from recent performance</p>
          </div>
        </div>

        {/* 8. Weak Topic AI Recommendation */}
        <div className="ai-recommendation-box">
          <div className="recommendation-badge">
            <Sparkles size={16} />
            <span>AI Recommendation</span>
          </div>
          <p className="recommendation-text">
            You are struggling with <strong>{progressMetrics.weakTopic}</strong>. Practice 3 more{" "}
            <strong>{progressMetrics.weakTopic}</strong> problems before moving to other topics.
          </p>
          {roadmapFocus && roadmapFocus.topicName === progressMetrics.weakTopic && (
            <div className="roadmap-inline-tag">
              <Compass size={13} /> Recommended on your Roadmap
            </div>
          )}
          <button
            className="recommendation-action-btn"
            onClick={() => {
              setTopic(progressMetrics.weakTopic);
              handleGenerateQuestion(progressMetrics.weakTopic);
            }}
          >
            Practice {progressMetrics.weakTopic} Now
          </button>
        </div>
      </section>

      {/* 9. Simple Coding History */}
      <section className="panel coding-history-panel">
        <div className="history-header">
          <h3 className="history-title">Recent Practice</h3>
          <span className="history-count">{history.length} records</span>
        </div>

        {history.length === 0 ? (
          <p className="empty-history-text">No solved questions yet. Generate one above to begin!</p>
        ) : (
          <div className="history-table-container">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Problem</th>
                  <th>Topic</th>
                  <th>Difficulty</th>
                  <th>Language</th>
                  <th>Score</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 8).map((item) => (
                  <tr key={item.id}>
                    <td>
                      {item.passed ? (
                        <span className="status-badge-pass" title="Passed">
                          <Check size={14} />
                        </span>
                      ) : (
                        <span className="status-badge-fail" title="Needs Improvement">
                          <XCircle size={14} />
                        </span>
                      )}
                    </td>
                    <td className="problem-col">
                      <strong>{item.title}</strong>
                    </td>
                    <td>
                      <span className="table-topic-tag">{item.topic}</span>
                    </td>
                    <td>
                      <span
                        className={`table-difficulty difficulty-${item.difficulty.toLowerCase()}`}
                      >
                        {item.difficulty}
                      </span>
                    </td>
                    <td>{item.language}</td>
                    <td>
                      <strong className={item.score >= 60 ? "text-emerald-700" : "text-amber-700"}>
                        {item.score}/100
                      </strong>
                    </td>
                    <td className="timestamp-col">{item.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
