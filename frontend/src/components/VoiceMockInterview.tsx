import { useState, useEffect, useRef, useMemo } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  Award,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Play,
  ArrowRight,
  RefreshCw,
  FileText,
  Clock,
  Zap,
  ChevronDown,
  ChevronUp,
  Flame,
  Briefcase,
  History,
  Activity,
  Edit3,
  Check,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { api } from "../services/api";

export interface QuestionItem {
  id: number;
  question: string;
  category: string;
  difficulty: "Easy" | "Medium" | "Hard";
  hints?: string;
}

export interface ParameterScores {
  relevance: number;
  technicalKnowledge: number;
  communication: number;
  confidence: number;
  structure: number;
  problemSolving?: number;
}

export interface AnswerEvaluation {
  scores: ParameterScores;
  overallScore: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  followUpQuestion?: string | null;
  idealAnswer?: string;
}

export interface QuestionHistoryItem {
  question: string;
  category: string;
  answer: string;
  metrics: {
    duration: number;
    wpm: number;
    fillerCount: number;
    fillerDetails: Record<string, number>;
  };
  evaluation: AnswerEvaluation;
}

export interface CompletedReport {
  role: string;
  experience: string;
  type: string;
  overallScore: number;
  parameterScores: ParameterScores;
  speakingSummary: {
    totalDuration: number;
    totalFillerWords: number;
    avgWpm: number;
    fillerWarning: string;
  };
  strengths: string[];
  areasToImprove: string[];
  starAdvice: {
    title: string;
    description: string;
    situation: string;
    task: string;
    action: string;
    result: string;
  };
  recommendedNextSteps: Array<{ title: string; text: string; link: string }>;
  historyItems: QuestionHistoryItem[];
}

export interface SavedInterviewSession {
  id: string;
  date: string;
  role: string;
  type: string;
  score: number;
  questionsCount: number;
}

const COMMON_FILLERS = [
  "um",
  "uh",
  "like",
  "actually",
  "basically",
  "you know",
  "sort of",
  "kind of",
  "literally",
  "honestly",
];

export function VoiceMockInterview() {
  // Navigation & Flow State
  const [stage, setStage] = useState<"setup" | "active" | "completed">("setup");
  const [role, setRole] = useState("MERN Stack Developer");
  const [customRole, setCustomRole] = useState("");
  const [experience, setExperience] = useState("Fresher");
  const [interviewType, setInterviewType] = useState<"Technical" | "HR" | "Behavioral" | "Mixed">("Mixed");
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">("Easy");
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [useResumeContext, setUseResumeContext] = useState(true);
  const [resumeContextText, setResumeContextText] = useState(
    "Skills: React, Node.js, Express, MongoDB, TypeScript, REST APIs, Git.\nProjects: E-Commerce Platform (MERN stack with Stripe & JWT Auth), Chat Application (WebSockets, MongoDB)."
  );

  // Active Interview State
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeQuestion, setActiveQuestion] = useState<QuestionItem | null>(null);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // User Recording & Speech-to-Text State
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isEditingAnswer, setIsEditingAnswer] = useState(false);
  const [editedTranscript, setEditedTranscript] = useState("");
  const [speechSupported, setSpeechSupported] = useState(true);

  // Real-Time Metrics State
  const [speakingSeconds, setSpeakingSeconds] = useState(0);
  const [pauseCount, setPauseCount] = useState(0);
  const [lastSpeechTimestamp, setLastSpeechTimestamp] = useState<number>(Date.now());

  // Per-Question Evaluation State
  const [evaluating, setEvaluating] = useState(false);
  const [currentEvaluation, setCurrentEvaluation] = useState<AnswerEvaluation | null>(null);
  const [followUpAnswerMode, setFollowUpAnswerMode] = useState(false);
  const [activeFollowUpQuestion, setActiveFollowUpQuestion] = useState<string | null>(null);

  // Completed Session State
  const [completedReport, setCompletedReport] = useState<CompletedReport | null>(null);
  const [questionHistory, setQuestionHistory] = useState<QuestionHistoryItem[]>([]);
  const [expandedHistoryIdx, setExpandedHistoryIdx] = useState<number | null>(0);
  const [pastSessions, setPastSessions] = useState<SavedInterviewSession[]>([]);

  // Refs
  const recognitionRef = useRef<any>(null);
  const speakingTimerRef = useRef<any>(null);
  const pauseCheckTimerRef = useRef<any>(null);

  // Load Past Sessions from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("orbit_interview_history");
      if (stored) {
        setPastSessions(JSON.parse(stored));
      } else {
        // Initial sample historical progression
        const initialSamples: SavedInterviewSession[] = [
          { id: "1", date: "Aug 28", role: "Frontend Developer", type: "Technical", score: 64, questionsCount: 5 },
          { id: "2", date: "Sep 03", role: "MERN Developer", type: "Mixed", score: 68, questionsCount: 5 },
          { id: "3", date: "Sep 08", role: "MERN Stack Developer", type: "Technical", score: 72, questionsCount: 5 },
          { id: "4", date: "Sep 12", role: "Full Stack Developer", type: "Mixed", score: 78, questionsCount: 5 },
        ];
        setPastSessions(initialSamples);
        localStorage.setItem("orbit_interview_history", JSON.stringify(initialSamples));
      }

      // Fetch persistent history from backend
      api
        .get("/interview/history")
        .then((res) => {
          if (Array.isArray(res.data?.history) && res.data.history.length > 0) {
            setPastSessions(res.data.history);
            localStorage.setItem("orbit_interview_history", JSON.stringify(res.data.history));
          }
        })
        .catch(() => null);
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Web Speech Synthesis (TTS) Helper
  const speakText = (text: string) => {
    if (!("speechSynthesis" in window) || isMuted) return;

    window.speechSynthesis.cancel(); // Stop any pending speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Pick natural English voice if available
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(
      (v) => (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Samantha")) && v.lang.startsWith("en")
    );
    if (naturalVoice) utterance.voice = naturalVoice;

    utterance.onstart = () => setIsAiSpeaking(true);
    utterance.onend = () => setIsAiSpeaking(false);
    utterance.onerror = () => setIsAiSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsAiSpeaking(false);
    }
  };

  // Web Speech Recognition (STT) Setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        let fullTranscript = "";
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript + " ";
        }
        const clean = fullTranscript.trim();
        setTranscript(clean);
        setEditedTranscript(clean);
        setLastSpeechTimestamp(Date.now());
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setIsRecording(false);
        }
      };

      recognition.onend = () => {
        // Keep idle
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.warn("Speech recognition initialization error:", err);
      setSpeechSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
      stopSpeaking();
    };
  }, []);

  // Speaking Timer & Long Pause Detection
  useEffect(() => {
    if (isRecording) {
      speakingTimerRef.current = setInterval(() => {
        setSpeakingSeconds((s) => s + 1);
      }, 1000);

      // Check for long pauses (> 2.8s of silence while recording)
      pauseCheckTimerRef.current = setInterval(() => {
        const gap = Date.now() - lastSpeechTimestamp;
        if (gap > 2800 && transcript.length > 10) {
          setPauseCount((p) => p + 1);
          setLastSpeechTimestamp(Date.now());
        }
      }, 1500);
    } else {
      clearInterval(speakingTimerRef.current);
      clearInterval(pauseCheckTimerRef.current);
    }

    return () => {
      clearInterval(speakingTimerRef.current);
      clearInterval(pauseCheckTimerRef.current);
    };
  }, [isRecording, lastSpeechTimestamp, transcript]);

  // Current Answer Text (edited or live)
  const currentAnswerText = isEditingAnswer ? editedTranscript : transcript;

  // Real-Time Filler Word Detection
  const fillerAnalysis = useMemo(() => {
    const text = (currentAnswerText || "").toLowerCase();
    const details: Record<string, number> = {};
    let total = 0;

    COMMON_FILLERS.forEach((filler) => {
      const regex = new RegExp(`\\b${filler}\\b`, "gi");
      const matches = text.match(regex);
      if (matches && matches.length > 0) {
        details[filler] = matches.length;
        total += matches.length;
      }
    });

    return { details, total };
  }, [currentAnswerText]);

  // Real-Time Words & Pacing Analysis (WPM)
  const wordMetrics = useMemo(() => {
    const text = currentAnswerText.trim();
    const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
    const minutes = Math.max(speakingSeconds / 60, 0.1);
    const wpm = Math.round(words / minutes);

    return { words, wpm };
  }, [currentAnswerText, speakingSeconds]);

  // Estimated Delivery Confidence Score
  const estimatedConfidence = useMemo(() => {
    if (wordMetrics.words < 5) return 50;

    let score = 80;

    // Pacing factor
    if (wordMetrics.wpm >= 90 && wordMetrics.wpm <= 140) {
      score += 8;
    } else if (wordMetrics.wpm < 70 || wordMetrics.wpm > 165) {
      score -= 10;
    }

    // Filler factor
    const fillerRatio = fillerAnalysis.total / Math.max(wordMetrics.words, 1);
    if (fillerRatio > 0.08) {
      score -= Math.min(Math.round(fillerRatio * 100), 20);
    } else if (fillerAnalysis.total === 0 && wordMetrics.words > 30) {
      score += 7;
    }

    // Long pauses factor
    if (pauseCount > 3) {
      score -= Math.min(pauseCount * 2, 12);
    }

    // Word volume factor
    if (wordMetrics.words > 35) {
      score += 5;
    }

    return Math.max(Math.min(score, 98), 38);
  }, [wordMetrics, fillerAnalysis.total, pauseCount]);

  // Start Interview Action
  const handleStartInterview = async () => {
    stopSpeaking();
    const targetRole = role === "Custom" ? customRole.trim() || "Software Engineer" : role;
    setEvaluating(true);

    try {
      const payload = {
        role: targetRole,
        experience,
        type: interviewType,
        difficulty,
        questionCount,
        resumeContext: useResumeContext ? resumeContextText : "",
      };

      const res = await api.post("/interview/start", payload);
      const fetchedQuestions: QuestionItem[] = res.data.questions || [];

      if (fetchedQuestions.length > 0) {
        setQuestions(fetchedQuestions);
        setCurrentIndex(0);
        setActiveQuestion(fetchedQuestions[0]);
        setQuestionHistory([]);
        setStage("active");
        setCurrentEvaluation(null);
        resetQuestionState();

        // Speak the first question
        setTimeout(() => {
          speakText(fetchedQuestions[0].question);
        }, 600);
      }
    } catch (err: any) {
      console.error(err);
      alert("Failed to start interview. Please verify backend connectivity.");
    } finally {
      setEvaluating(false);
    }
  };

  // Reset metrics for next question
  const resetQuestionState = () => {
    setTranscript("");
    setEditedTranscript("");
    setIsRecording(false);
    setIsEditingAnswer(false);
    setSpeakingSeconds(0);
    setPauseCount(0);
    setShowHint(false);
    setFollowUpAnswerMode(false);
    setActiveFollowUpQuestion(null);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
  };

  // Toggle Microphone Recording
  const toggleRecording = () => {
    if (isAiSpeaking) {
      stopSpeaking();
    }

    if (isRecording) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
      setIsRecording(false);
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setLastSpeechTimestamp(Date.now());
        } catch (e) {
          console.warn(e);
        }
      }
      setIsRecording(true);
    }
  };

  // Submit Answer to AI for Evaluation
  const handleSubmitAnswer = async () => {
    if (isRecording) {
      toggleRecording();
    }
    stopSpeaking();

    const answerToEval = (isEditingAnswer ? editedTranscript : transcript).trim();
    if (!answerToEval) {
      alert("Please provide an answer before submitting (speak via mic or type in the edit box).");
      return;
    }

    setEvaluating(true);
    const targetRole = role === "Custom" ? customRole : role;
    const qText = followUpAnswerMode && activeFollowUpQuestion ? activeFollowUpQuestion : activeQuestion?.question || "";

    const metricsPayload = {
      speakingDuration: speakingSeconds,
      wordsSpoken: wordMetrics.words,
      wpm: wordMetrics.wpm,
      fillerCount: fillerAnalysis.total,
      pauses: pauseCount,
    };

    try {
      const res = await api.post("/interview/evaluate-answer", {
        role: targetRole,
        experience,
        question: qText,
        answer: answerToEval,
        questionIndex: currentIndex,
        totalQuestions: questions.length,
        metrics: metricsPayload,
      });

      const evalData: AnswerEvaluation = res.data;
      setCurrentEvaluation(evalData);

      // Save to Question History
      const histItem: QuestionHistoryItem = {
        question: qText,
        category: activeQuestion?.category || "General",
        answer: answerToEval,
        metrics: {
          duration: speakingSeconds,
          wpm: wordMetrics.wpm,
          fillerCount: fillerAnalysis.total,
          fillerDetails: fillerAnalysis.details,
        },
        evaluation: evalData,
      };

      setQuestionHistory((prev) => [...prev, histItem]);

      // If there's a dynamic follow-up question, give candidate option to answer it
      if (evalData.followUpQuestion && !followUpAnswerMode) {
        setActiveFollowUpQuestion(evalData.followUpQuestion);
      }
    } catch (err: any) {
      console.error(err);
      alert("Failed to evaluate answer. Please try again.");
    } finally {
      setEvaluating(false);
    }
  };

  // Accept and Answer Follow-up Question
  const handleAnswerFollowUp = () => {
    if (!activeFollowUpQuestion) return;
    setFollowUpAnswerMode(true);
    setCurrentEvaluation(null);
    resetQuestionState();
    speakText(activeFollowUpQuestion);
  };

  // Proceed to Next Question or Finalize
  const handleNextQuestion = () => {
    stopSpeaking();
    setCurrentEvaluation(null);
    resetQuestionState();

    if (currentIndex + 1 < questions.length) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      const nextQ = questions[nextIdx];
      setActiveQuestion(nextQ);
      setTimeout(() => {
        speakText(nextQ.question);
      }, 500);
    } else {
      finalizeInterview();
    }
  };

  // Finalize Interview & Generate Overall Report
  const finalizeInterview = async () => {
    setEvaluating(true);
    stopSpeaking();

    const targetRole = role === "Custom" ? customRole : role;
    const allEvaluations = [...questionHistory.map((h) => h.evaluation)];
    const totalDuration = questionHistory.reduce((acc, h) => acc + h.metrics.duration, 0);
    const totalFiller = questionHistory.reduce((acc, h) => acc + h.metrics.fillerCount, 0);
    const avgWpm = Math.round(
      questionHistory.reduce((acc, h) => acc + h.metrics.wpm, 0) / Math.max(questionHistory.length, 1)
    );

    try {
      const res = await api.post("/interview/complete", {
        role: targetRole,
        experience,
        type: interviewType,
        evaluations: allEvaluations,
        totalDuration,
        totalFillerWords: totalFiller,
        avgWpm,
      });

      const report: CompletedReport = {
        ...res.data,
        historyItems: questionHistory,
      };

      setCompletedReport(report);
      setStage("completed");

      // Save session to history in localStorage
      const newSession: SavedInterviewSession = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        role: targetRole,
        type: interviewType,
        score: report.overallScore,
        questionsCount: questions.length,
      };

      const updatedHistory = [...pastSessions, newSession];
      setPastSessions(updatedHistory);
      localStorage.setItem("orbit_interview_history", JSON.stringify(updatedHistory));

      // Persist session to backend
      api.post("/interview/session", newSession).catch(() => null);
    } catch (err) {
      console.error(err);
      alert("Failed to compile complete interview analysis.");
    } finally {
      setEvaluating(false);
    }
  };

  // Format mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Visual color for scores
  const getScoreColor = (sc: number) => {
    if (sc >= 80) return "#10b981";
    if (sc >= 60) return "#f59e0b";
    return "#ef4444";
  };

  return (
    <div className="voice-interview-wrapper">
      {/* =========================================================================
          STAGE 1: INTERVIEW SETUP
         ========================================================================= */}
      {stage === "setup" && (
        <div className="interview-setup-container">
          {/* Header Banner */}
          <div className="panel interview-setup-banner">
            <div className="setup-banner-left">
              <div className="setup-badge">
                <Sparkles size={16} />
                <span>AI VOICE SIMULATOR</span>
              </div>
              <h2>AI Mock Interview Setup</h2>
              <p>
                Practice role-specific technical & behavioral questions with real-time speech recognition,
                speaking delivery metrics, filler word detection, and dynamic follow-up challenges.
              </p>
            </div>
            <div className="setup-stats-pills">
              <div className="stat-pill-item">
                <Zap size={18} className="pill-icon green" />
                <div>
                  <strong>Voice STT</strong>
                  <span>Speech-to-Text</span>
                </div>
              </div>
              <div className="stat-pill-item">
                <Flame size={18} className="pill-icon amber" />
                <div>
                  <strong>Dynamic AI</strong>
                  <span>Follow-up Qs</span>
                </div>
              </div>
              <div className="stat-pill-item">
                <Award size={18} className="pill-icon purple" />
                <div>
                  <strong>STAR Method</strong>
                  <span>Coaching Guide</span>
                </div>
              </div>
            </div>
          </div>

          {/* Configuration Form Card */}
          <div className="setup-form-grid">
            <div className="panel setup-config-card">
              <h3 className="setup-section-title">
                <Briefcase size={20} /> Interview Configuration
              </h3>

              {/* Target Role */}
              <div className="form-field-group">
                <label className="field-label">Target Role</label>
                <select
                  className="setup-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="MERN Stack Developer">MERN Stack Developer</option>
                  <option value="Full Stack Developer">Full Stack Developer</option>
                  <option value="Frontend Developer (React)">Frontend Developer (React)</option>
                  <option value="Backend Developer (Node.js)">Backend Developer (Node.js)</option>
                  <option value="Python / AI Engineer">Python / AI Engineer</option>
                  <option value="Data Scientist">Data Scientist</option>
                  <option value="DevOps & Cloud Engineer">DevOps & Cloud Engineer</option>
                  <option value="Custom">Custom Role...</option>
                </select>
                {role === "Custom" && (
                  <input
                    type="text"
                    className="setup-input-text mt-2"
                    placeholder="Enter custom role title, e.g. iOS Engineer"
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                  />
                )}
              </div>

              {/* Experience Level */}
              <div className="form-field-group">
                <label className="field-label">Experience Level</label>
                <div className="experience-pills-row">
                  {["Fresher", "Junior (1-2 yrs)", "Mid-Level (3-5 yrs)", "Senior (5+ yrs)"].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      className={`exp-pill-btn ${experience === lvl ? "active" : ""}`}
                      onClick={() => setExperience(lvl)}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interview Type */}
              <div className="form-field-group">
                <label className="field-label">Interview Type</label>
                <div className="type-options-grid">
                  {[
                    { id: "Technical", label: "Technical", desc: "Data structures, frameworks, core concepts" },
                    { id: "HR", label: "HR & Culture", desc: "Background, behavioral fit, work ethics" },
                    { id: "Behavioral", label: "Behavioral", desc: "Situational handling, teamwork, leadership" },
                    { id: "Mixed", label: "Mixed ⭐", desc: "Holistic blend of technical, project & HR" },
                  ].map((t) => (
                    <div
                      key={t.id}
                      className={`type-radio-card ${interviewType === t.id ? "active" : ""}`}
                      onClick={() => setInterviewType(t.id as any)}
                    >
                      <div className="type-radio-circle">
                        {interviewType === t.id && <div className="type-radio-dot" />}
                      </div>
                      <div className="type-radio-text">
                        <strong>{t.label}</strong>
                        <span>{t.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Question Difficulty */}
              <div className="form-field-group">
                <label className="field-label">Question Difficulty</label>
                <div className="difficulty-pills-row">
                  {[
                    { id: "Easy", label: "🟢 Easy (Recommended)", desc: "Foundational & friendly basics" },
                    { id: "Medium", label: "🟡 Medium", desc: "Standard application questions" },
                    { id: "Hard", label: "🔴 Hard", desc: "Advanced architecture" },
                  ].map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      className={`diff-pill-btn ${difficulty === d.id ? "active" : ""}`}
                      onClick={() => setDifficulty(d.id as any)}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Count */}
              <div className="form-field-group">
                <label className="field-label">Number of Questions</label>
                <div className="count-select-row">
                  {[3, 5, 8, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      className={`count-pill-btn ${questionCount === num ? "active" : ""}`}
                      onClick={() => setQuestionCount(num)}
                    >
                      {num} Questions
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Resume Integration & Start Action */}
            <div className="setup-side-panel">
              {/* Resume Context Card */}
              <div className="panel resume-link-card">
                <div className="resume-link-header">
                  <div className="resume-link-title-group">
                    <FileText size={20} className="resume-icon" />
                    <div>
                      <h4>Resume-Based Interview 🔥</h4>
                      <p>Connect with Resume Analyzer for project-tailored questions</p>
                    </div>
                  </div>
                  <label className="switch-label">
                    <input
                      type="checkbox"
                      checked={useResumeContext}
                      onChange={(e) => setUseResumeContext(e.target.checked)}
                    />
                    <span className="switch-slider"></span>
                  </label>
                </div>

                {useResumeContext && (
                  <div className="resume-context-body">
                    <span className="context-hint">
                      AI will read your project architecture & skills to ask targeted scenario questions:
                    </span>
                    <textarea
                      className="resume-context-textarea"
                      rows={4}
                      value={resumeContextText}
                      onChange={(e) => setResumeContextText(e.target.value)}
                      placeholder="Paste your top skills & project names (e.g. MERN E-Commerce, Chat App)..."
                    />
                    <div className="context-tag-list">
                      <span className="ctx-tag">React</span>
                      <span className="ctx-tag">Node.js</span>
                      <span className="ctx-tag">MongoDB</span>
                      <span className="ctx-tag">JWT Auth</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Start Interview Action */}
              <div className="panel setup-cta-card">
                <div className="cta-head">
                  <Mic size={28} className="cta-mic-icon" />
                  <h3>Ready to begin?</h3>
                  <p>Ensure your microphone is enabled and speak clearly at a natural pace.</p>
                </div>

                <button
                  type="button"
                  className="primary start-interview-btn"
                  onClick={handleStartInterview}
                  disabled={evaluating}
                >
                  {evaluating ? (
                    <>
                      <RefreshCw size={20} className="spinner-icon" />
                      Generating AI Questions...
                    </>
                  ) : (
                    <>
                      <Play size={20} />
                      Start Mock Interview
                    </>
                  )}
                </button>

                <div className="voice-support-notice">
                  {speechSupported ? (
                    <span className="status-badge-ok">
                      <CheckCircle2 size={15} /> Web Speech API is ready in this browser
                    </span>
                  ) : (
                    <span className="status-badge-warn">
                      <AlertCircle size={15} /> Speech API not detected; manual typing fallback enabled
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Past Performance Graph / History in Setup */}
          {pastSessions.length > 0 && (
            <div className="panel past-interviews-summary-card">
              <div className="section-head-bar">
                <div>
                  <p className="eyebrow">HISTORICAL PROGRESSION</p>
                  <h3 className="section-title">
                    <History size={18} /> Previous Interview Performance Trend
                  </h3>
                </div>
                <div className="history-score-chip">
                  Latest Score:{" "}
                  <strong>{pastSessions[pastSessions.length - 1]?.score || 78}/100</strong>
                </div>
              </div>

              <div className="history-chart-wrapper" style={{ width: "100%", height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={pastSessions} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 12 }} />
                    <YAxis domain={[40, 100]} tick={{ fill: "#64748b", fontSize: 12 }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="chart-custom-tooltip">
                              <strong>{d.role}</strong>
                              <div>Score: {d.score}/100</div>
                              <small>{d.date} • {d.type}</small>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="#10b981"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#scoreGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          STAGE 2: ACTIVE REAL-TIME INTERVIEW SCREEN
         ========================================================================= */}
      {stage === "active" && activeQuestion && (
        <div className="active-interview-container">
          {/* Top Control Bar */}
          <div className="panel interview-top-bar">
            <div className="top-bar-left">
              <span className="brand-logo-pill">Career Orbit</span>
              <div className="question-progress-pill">
                Question <strong>{currentIndex + 1}</strong> of {questions.length}
              </div>
              <span className="category-meta-tag">
                {activeQuestion.category} • {activeQuestion.difficulty}
              </span>
            </div>

            <div className="top-bar-right">
              {/* Elapsed Question Timer */}
              <div className="timer-badge">
                <Clock size={16} />
                <span>{formatTime(speakingSeconds)}</span>
              </div>

              {/* Mute AI Voice Button */}
              <button
                type="button"
                className={`icon-toggle-btn ${isMuted ? "muted" : ""}`}
                onClick={() => {
                  if (!isMuted) stopSpeaking();
                  setIsMuted(!isMuted);
                }}
                title={isMuted ? "Unmute AI Voice" : "Mute AI Voice"}
              >
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>

              {/* Exit Button */}
              <button
                type="button"
                className="exit-interview-btn"
                onClick={() => {
                  if (confirm("Are you sure you want to end this interview session?")) {
                    stopSpeaking();
                    setStage("setup");
                  }
                }}
              >
                Exit
              </button>
            </div>
          </div>

          {/* Progress Bar Track */}
          <div className="interview-progress-track">
            <div
              className="interview-progress-fill"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>

          {/* AI Interviewer Avatar & Question Box */}
          <div className="panel ai-question-card">
            <div className="ai-avatar-row">
              <div className={`ai-interviewer-avatar ${isAiSpeaking ? "speaking" : ""}`}>
                <div className="ai-orb-inner">
                  <Sparkles size={24} />
                </div>
                {isAiSpeaking && (
                  <div className="sound-wave-bars">
                    <span className="wave-bar bar1"></span>
                    <span className="wave-bar bar2"></span>
                    <span className="wave-bar bar3"></span>
                    <span className="wave-bar bar4"></span>
                  </div>
                )}
              </div>

              <div className="ai-status-indicator">
                <span className="ai-name-label">AI Senior Interviewer</span>
                <span className="ai-state-text">
                  {isAiSpeaking ? "🔊 Speaking question..." : isRecording ? "🎙️ Listening to your answer..." : "Ready for your answer"}
                </span>
              </div>

              <button
                type="button"
                className="replay-question-btn"
                onClick={() => speakText(followUpAnswerMode && activeFollowUpQuestion ? activeFollowUpQuestion : activeQuestion.question)}
                title="Replay Audio"
              >
                <RotateCcw size={15} /> Replay
              </button>
            </div>

            {/* Dynamic Follow-Up Callout if in follow-up mode */}
            {followUpAnswerMode && activeFollowUpQuestion && (
              <div className="follow-up-banner">
                <Flame size={18} className="flame-icon" />
                <div>
                  <strong>🔥 AI Dynamic Follow-up Challenge</strong>
                  <p>Probe into your previous statement:</p>
                </div>
              </div>
            )}

            {/* Question Text */}
            <h3 className="interview-question-heading">
              "{followUpAnswerMode && activeFollowUpQuestion ? activeFollowUpQuestion : activeQuestion.question}"
            </h3>

            {/* Hint Accordion */}
            {activeQuestion.hints && (
              <div className="hint-accordion-wrapper">
                <button
                  type="button"
                  className="hint-toggle-btn"
                  onClick={() => setShowHint(!showHint)}
                >
                  <HelpCircle size={15} />
                  <span>{showHint ? "Hide Answer Strategy Hint" : "💡 View Answer Strategy Hint"}</span>
                  {showHint ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>
                {showHint && <p className="hint-content-box">{activeQuestion.hints}</p>}
              </div>
            )}
          </div>

          {/* Answer Input & Speech-to-Text Stage */}
          <div className="panel answer-capture-card">
            <div className="answer-card-header">
              <div className="answer-header-left">
                <Mic size={18} className="mic-icon-static" />
                <h4>Your Answer</h4>
                <span className="transcription-badge">
                  {isRecording ? "🔴 Live Recording" : "Microphone Idle"}
                </span>
              </div>

              <div className="answer-header-right">
                <button
                  type="button"
                  className={`edit-answer-toggle-btn ${isEditingAnswer ? "active" : ""}`}
                  onClick={() => setIsEditingAnswer(!isEditingAnswer)}
                  title="Directly edit transcribed text before submitting"
                >
                  <Edit3 size={14} />
                  {isEditingAnswer ? "Done Editing" : "Edit Answer Text"}
                </button>
              </div>
            </div>

            {/* Answer Display / Edit Area */}
            <div className="answer-text-container">
              {isEditingAnswer ? (
                <textarea
                  className="answer-editable-textarea"
                  rows={4}
                  value={editedTranscript}
                  onChange={(e) => setEditedTranscript(e.target.value)}
                  placeholder="Type or correct your answer here..."
                />
              ) : (
                <div className={`answer-live-transcript ${!currentAnswerText ? "placeholder" : ""}`}>
                  {currentAnswerText || (
                    <span className="placeholder-text">
                      Click the microphone below and speak your answer. Your speech will transcribe here in real time...
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Big Mic Button & Audio Controls */}
            <div className="mic-controls-row">
              <button
                type="button"
                className={`record-bubble-btn ${isRecording ? "recording" : ""}`}
                onClick={toggleRecording}
              >
                {isRecording ? <MicOff size={28} /> : <Mic size={28} />}
                <span className="mic-ripple ring-1" />
                <span className="mic-ripple ring-2" />
              </button>

              <div className="mic-action-text">
                <strong>{isRecording ? "Click to Stop Recording" : "Click to Speak Answer"}</strong>
                <span>{isRecording ? "Recording your voice in real time..." : "Press when ready to talk"}</span>
              </div>

              {/* Submit Answer Button */}
              <button
                type="button"
                className="primary submit-answer-btn"
                onClick={handleSubmitAnswer}
                disabled={evaluating || (!transcript && !editedTranscript)}
              >
                {evaluating ? (
                  <>
                    <RefreshCw size={18} className="spinner-icon" />
                    AI Analyzing Answer...
                  </>
                ) : (
                  <>
                    <Check size={18} />
                    Submit Answer
                  </>
                )}
              </button>
            </div>

            {/* =========================================================================
                REAL-TIME SPEAKING & DELIVERY METRICS PANEL
               ========================================================================= */}
            <div className="realtime-metrics-grid">
              {/* Speaking Analysis */}
              <div className="metric-box speaking-stats-box">
                <span className="metric-box-title">
                  <Activity size={15} /> Speaking Analysis
                </span>
                <div className="stats-metric-row">
                  <div className="stat-item">
                    <span className="stat-label">Speaking Time</span>
                    <strong className="stat-val">{formatTime(speakingSeconds)}</strong>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Words Spoken</span>
                    <strong className="stat-val">{wordMetrics.words}</strong>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Speed (WPM)</span>
                    <strong className="stat-val">{wordMetrics.wpm}</strong>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Long Pauses</span>
                    <strong className="stat-val">{pauseCount}</strong>
                  </div>
                </div>
              </div>

              {/* Filler Word Detection */}
              <div className="metric-box filler-words-box">
                <div className="filler-header-row">
                  <span className="metric-box-title">
                    <AlertCircle size={15} /> Filler Word Detection
                  </span>
                  <span className={`filler-count-pill ${fillerAnalysis.total > 4 ? "danger" : "safe"}`}>
                    Total: {fillerAnalysis.total}
                  </span>
                </div>

                <div className="filler-tags-list">
                  {Object.keys(fillerAnalysis.details).length > 0 ? (
                    Object.entries(fillerAnalysis.details).map(([word, count]) => (
                      <span key={word} className="filler-tag">
                        "{word}": <strong>{count}</strong>
                      </span>
                    ))
                  ) : (
                    <span className="filler-empty-label">No filler words detected yet.</span>
                  )}
                </div>

                {fillerAnalysis.total >= 4 && (
                  <p className="filler-alert-tip">
                    ⚠️ Try to reduce filler words to sound more confident and authoritative.
                  </p>
                )}
              </div>

              {/* Estimated Delivery Confidence Score */}
              <div className="metric-box confidence-gauge-box">
                <div className="conf-header-row">
                  <span className="metric-box-title">
                    <TrendingUp size={15} /> Delivery Confidence
                  </span>
                  <strong className="conf-score-num" style={{ color: getScoreColor(estimatedConfidence) }}>
                    {estimatedConfidence} / 100
                  </strong>
                </div>

                <div className="conf-meter-track">
                  <div
                    className="conf-meter-fill"
                    style={{
                      width: `${estimatedConfidence}%`,
                      background: getScoreColor(estimatedConfidence),
                    }}
                  />
                </div>

                <div className="conf-tags-row">
                  {wordMetrics.words > 25 && <span className="conf-tag ok">✓ Clear speech</span>}
                  {fillerAnalysis.total <= 2 && <span className="conf-tag ok">✓ Minimal fillers</span>}
                  {pauseCount > 2 && <span className="conf-tag warn">⚠ Long pauses detected</span>}
                  {fillerAnalysis.total > 4 && <span className="conf-tag warn">⚠ Noticeable hesitation</span>}
                </div>
                <small className="conf-disclaimer">Estimated delivery pacing and fluency</small>
              </div>
            </div>
          </div>

          {/* =========================================================================
              INSTANT AI ANSWER EVALUATION CARD (MODAL / INLINE)
             ========================================================================= */}
          {currentEvaluation && (
            <div className="panel instant-evaluation-card">
              <div className="eval-card-header">
                <div className="eval-score-bubble" style={{ background: getScoreColor(currentEvaluation.overallScore) }}>
                  <span className="score-num">{currentEvaluation.overallScore}</span>
                  <small>/100</small>
                </div>
                <div>
                  <h4>AI Answer Analysis & Feedback</h4>
                  <p>{currentEvaluation.feedback}</p>
                </div>
              </div>

              {/* 5-Parameter Breakdown Grid */}
              <div className="eval-parameters-grid">
                {[
                  { key: "relevance", label: "Relevance", score: currentEvaluation.scores.relevance },
                  { key: "technicalKnowledge", label: "Technical Knowledge", score: currentEvaluation.scores.technicalKnowledge },
                  { key: "communication", label: "Communication", score: currentEvaluation.scores.communication },
                  { key: "confidence", label: "Confidence", score: currentEvaluation.scores.confidence },
                  { key: "structure", label: "Structure", score: currentEvaluation.scores.structure },
                ].map((param) => (
                  <div key={param.key} className="param-card">
                    <div className="param-header">
                      <span>{param.label}</span>
                      <strong>{param.score}%</strong>
                    </div>
                    <div className="param-track">
                      <div
                        className="param-fill"
                        style={{ width: `${param.score}%`, background: getScoreColor(param.score) }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Strengths & Improvements */}
              <div className="two-col eval-feedback-grid">
                <div className="feedback-col strengths-col">
                  <div className="col-title">
                    <CheckCircle2 size={16} /> Key Strengths
                  </div>
                  <ul>
                    {currentEvaluation.strengths.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div className="feedback-col improve-col">
                  <div className="col-title">
                    <AlertCircle size={16} /> Areas to Improve
                  </div>
                  <ul>
                    {currentEvaluation.improvements.map((imp, i) => (
                      <li key={i}>{imp}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* STAR Model Ideal Answer Accordion */}
              {currentEvaluation.idealAnswer && (
                <div className="star-ideal-answer-box">
                  <div className="ideal-answer-head">
                    <Award size={16} />
                    <strong>STAR Model Ideal Answer</strong>
                  </div>
                  <p>{currentEvaluation.idealAnswer}</p>
                </div>
              )}

              {/* Dynamic Follow-Up Question Prompt */}
              {currentEvaluation.followUpQuestion && !followUpAnswerMode && (
                <div className="followup-challenge-card">
                  <div className="challenge-head">
                    <Flame size={20} className="flame-icon" />
                    <div>
                      <strong>🔥 AI Dynamic Follow-up Question:</strong>
                      <p>"{currentEvaluation.followUpQuestion}"</p>
                    </div>
                  </div>
                  <div className="challenge-actions">
                    <button
                      type="button"
                      className="answer-followup-btn"
                      onClick={handleAnswerFollowUp}
                    >
                      🎤 Answer Follow-up Challenge
                    </button>
                  </div>
                </div>
              )}

              {/* Navigation Action */}
              <div className="eval-actions-row">
                <button
                  type="button"
                  className="primary next-question-btn"
                  onClick={handleNextQuestion}
                >
                  {currentIndex + 1 < questions.length ? (
                    <>
                      Next Question <ArrowRight size={18} />
                    </>
                  ) : (
                    <>
                      Finish & View Complete Dashboard <Award size={18} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          STAGE 3: COMPREHENSIVE PERFORMANCE DASHBOARD
         ========================================================================= */}
      {stage === "completed" && completedReport && (
        <div className="interview-complete-dashboard">
          {/* Main Score Banner */}
          <div className="panel report-hero-banner">
            <div className="hero-content-left">
              <span className="eyebrow">FINAL PERFORMANCE AUDIT</span>
              <h2>🎯 Interview Performance Report</h2>
              <p className="hero-subtitle">
                Target Role: <strong>{completedReport.role}</strong> ({completedReport.experience}) •{" "}
                {completedReport.type} Interview
              </p>
            </div>

            <div
              className="hero-score-badge"
              style={{ borderColor: getScoreColor(completedReport.overallScore) }}
            >
              <div className="overall-score-num" style={{ color: getScoreColor(completedReport.overallScore) }}>
                {completedReport.overallScore}
                <small>/100</small>
              </div>
              <span className="score-status-text">
                {completedReport.overallScore >= 80
                  ? "🌟 Excellent Readiness"
                  : completedReport.overallScore >= 65
                  ? "👍 Good Competency"
                  : "Needs Structured Practice"}
              </span>
            </div>
          </div>

          {/* Core Evaluation Parameters */}
          <div className="panel report-parameters-card">
            <div className="section-head-bar">
              <div>
                <p className="eyebrow">EVALUATION METRICS</p>
                <h3 className="section-title">Core Performance Dimensions</h3>
              </div>
            </div>

            <div className="report-param-bars-grid">
              {[
                { label: "Communication", score: completedReport.parameterScores.communication },
                { label: "Technical Knowledge", score: completedReport.parameterScores.technicalKnowledge },
                { label: "Confidence", score: completedReport.parameterScores.confidence },
                { label: "Problem Solving", score: completedReport.parameterScores.problemSolving || 80 },
                { label: "Structure", score: completedReport.parameterScores.structure },
                { label: "Relevance", score: completedReport.parameterScores.relevance },
              ].map((m) => (
                <div key={m.label} className="dimension-bar-item">
                  <div className="dimension-header">
                    <span>{m.label}</span>
                    <strong style={{ color: getScoreColor(m.score) }}>{m.score}%</strong>
                  </div>
                  <div className="dimension-track">
                    <div
                      className="dimension-fill"
                      style={{ width: `${m.score}%`, background: getScoreColor(m.score) }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Speaking Metrics Summary Bar */}
          <div className="speaking-stats-strip panel">
            <div className="stat-strip-box">
              <Clock size={20} className="strip-icon blue" />
              <div>
                <span className="strip-label">Total Duration</span>
                <strong>{formatTime(completedReport.speakingSummary.totalDuration)}</strong>
              </div>
            </div>
            <div className="stat-strip-box">
              <TrendingUp size={20} className="strip-icon emerald" />
              <div>
                <span className="strip-label">Average Pacing</span>
                <strong>{completedReport.speakingSummary.avgWpm} WPM</strong>
              </div>
            </div>
            <div className="stat-strip-box">
              <AlertCircle size={20} className="strip-icon amber" />
              <div>
                <span className="strip-label">Total Filler Words</span>
                <strong>{completedReport.speakingSummary.totalFillerWords}</strong>
              </div>
            </div>
            <div className="stat-strip-box full">
              <p className="strip-note">💡 {completedReport.speakingSummary.fillerWarning}</p>
            </div>
          </div>

          {/* Strengths & Improvements */}
          <div className="two-col results-grid">
            <div className="panel insight-card strengths">
              <div className="insight-card-header">
                <div className="insight-icon green">
                  <CheckCircle2 size={18} />
                </div>
                <h3>Key Strengths</h3>
              </div>
              <ul className="insight-list">
                {completedReport.strengths.map((s, idx) => (
                  <li key={idx}>✅ {s}</li>
                ))}
              </ul>
            </div>

            <div className="panel insight-card weaknesses">
              <div className="insight-card-header">
                <div className="insight-icon amber">
                  <AlertCircle size={18} />
                </div>
                <h3>Areas to Improve</h3>
              </div>
              <ul className="insight-list">
                {completedReport.areasToImprove.map((a, idx) => (
                  <li key={idx}>⚠️ {a}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* STAR Method Coaching Panel */}
          {completedReport.starAdvice && (
            <div className="panel star-coaching-card">
              <div className="star-card-header">
                <Award size={22} className="star-award-icon" />
                <div>
                  <h3 className="section-title">{completedReport.starAdvice.title}</h3>
                  <p>{completedReport.starAdvice.description}</p>
                </div>
              </div>

              <div className="star-steps-grid">
                <div className="star-step-item">
                  <span className="star-letter s">S</span>
                  <div>
                    <strong>Situation</strong>
                    <p>{completedReport.starAdvice.situation}</p>
                  </div>
                </div>
                <div className="star-step-item">
                  <span className="star-letter t">T</span>
                  <div>
                    <strong>Task</strong>
                    <p>{completedReport.starAdvice.task}</p>
                  </div>
                </div>
                <div className="star-step-item">
                  <span className="star-letter a">A</span>
                  <div>
                    <strong>Action</strong>
                    <p>{completedReport.starAdvice.action}</p>
                  </div>
                </div>
                <div className="star-step-item">
                  <span className="star-letter r">R</span>
                  <div>
                    <strong>Result</strong>
                    <p>{completedReport.starAdvice.result}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Question-by-Question Detailed Review Accordion */}
          <div className="panel question-history-review-card">
            <div className="section-head-bar">
              <div>
                <p className="eyebrow">QUESTION-BY-QUESTION AUDIT</p>
                <h3 className="section-title">Detailed Answers & Feedback Breakdown</h3>
              </div>
            </div>

            <div className="history-accordion-list">
              {completedReport.historyItems.map((item, idx) => {
                const isOpen = expandedHistoryIdx === idx;
                return (
                  <div key={idx} className="history-accordion-item">
                    <div
                      className="accordion-header"
                      onClick={() => setExpandedHistoryIdx(isOpen ? null : idx)}
                    >
                      <div className="acc-title-group">
                        <span className="acc-q-index">Q{idx + 1}</span>
                        <strong>{item.question}</strong>
                      </div>
                      <div className="acc-meta-group">
                        <span
                          className="acc-score-pill"
                          style={{ color: getScoreColor(item.evaluation.overallScore) }}
                        >
                          Score: {item.evaluation.overallScore}/100
                        </span>
                        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </div>
                    </div>

                    {isOpen && (
                      <div className="accordion-body">
                        {/* Spoken Answer */}
                        <div className="history-answer-box">
                          <span className="sub-label">🎙️ Your Spoken Answer:</span>
                          <p>"{item.answer}"</p>
                          <div className="answer-stats-meta">
                            <span>Duration: {formatTime(item.metrics.duration)}</span>
                            <span>Pacing: {item.metrics.wpm} WPM</span>
                            <span>Fillers: {item.metrics.fillerCount}</span>
                          </div>
                        </div>

                        {/* AI Feedback */}
                        <div className="history-feedback-box">
                          <span className="sub-label">💡 AI Coaching Critique:</span>
                          <p>{item.evaluation.feedback}</p>
                        </div>

                        {/* Ideal STAR Model Answer */}
                        {item.evaluation.idealAnswer && (
                          <div className="history-ideal-box">
                            <span className="sub-label">🌟 High-Impact Model Answer:</span>
                            <p>{item.evaluation.idealAnswer}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Historical Progression Graph */}
          {pastSessions.length > 0 && (
            <div className="panel report-progression-card">
              <div className="section-head-bar">
                <div>
                  <p className="eyebrow">PLACEMENT READINESS TRAJECTORY</p>
                  <h3 className="section-title">Performance Trend (Score History)</h3>
                </div>
              </div>

              <div style={{ width: "100%", height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={pastSessions} margin={{ top: 10, right: 30, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="scoreReportGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 12 }} />
                    <YAxis domain={[40, 100]} tick={{ fill: "#64748b", fontSize: 12 }} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="#10b981"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#scoreReportGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Connected Career Orbit Next Steps */}
          <div className="panel career-orbit-loop-card">
            <h3 className="section-title">🔥 Career Orbit Connected Actions</h3>
            <p className="loop-desc">
              Reinforce your weak spots detected during this interview with tailored modules:
            </p>

            <div className="loop-actions-grid">
              <a href="/resume" className="loop-action-btn">
                <FileText size={20} />
                <div>
                  <strong>Resume Analyzer</strong>
                  <span>Align highlighted projects & fix missing metrics</span>
                </div>
              </a>
              <a href="/roadmap" className="loop-action-btn">
                <TrendingUp size={20} />
                <div>
                  <strong>AI Roadmap</strong>
                  <span>Study asynchronous patterns & database design</span>
                </div>
              </a>
              <a href="/coding" className="loop-action-btn">
                <Zap size={20} />
                <div>
                  <strong>Coding Practice</strong>
                  <span>Solve curated data structures for your role</span>
                </div>
              </a>
            </div>

            <div className="dashboard-footer-actions">
              <button
                type="button"
                className="primary start-another-btn"
                onClick={() => {
                  setStage("setup");
                  setCompletedReport(null);
                }}
              >
                <RotateCcw size={18} /> Start Another Mock Interview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
