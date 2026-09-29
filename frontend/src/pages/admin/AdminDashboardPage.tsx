import { useEffect, useState } from "react";
import {
  Users,
  UserCheck,
  FileText,
  Mic,
  Code2,
  GitBranch,
  ArrowUpRight,
  Clock,
  Sparkles,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";
import { Link } from "react-router-dom";
import { api } from "../../services/api";

interface AdminStatsData {
  stats: {
    totalUsers: number;
    activeUsers: number;
    resumesAnalyzed: number;
    mockInterviews: number;
    codingProblemsSolved: number;
    githubProfilesAnalyzed: number;
    roadmapsCreated?: number;
  };
  charts: {
    registrationTrend: { date: string; users: number }[];
    moduleUsage: { name: string; count: number }[];
  };
  recentActivity: {
    id: string;
    userName: string;
    action: string;
    module: string;
    details?: string;
    createdAt: string;
  }[];
}

export function AdminDashboardPage() {
  const [data, setData] = useState<AdminStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/admin/stats");
      setData(res.data);
    } catch (err: any) {
      console.error("Error loading admin stats:", err);
      setError(err.response?.data?.message || "Could not load admin stats. Please check permissions.");
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const diffSecs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
      if (diffSecs < 60) return "Just now";
      if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
      if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`;
      return `${Math.floor(diffSecs / 86400)}d ago`;
    } catch {
      return "Recent";
    }
  };

  if (loading) {
    return (
      <div className="admin-loading-state">
        <div className="admin-spinner" />
        <p>Loading real-time admin metrics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="admin-error-card">
        <h3>Could not load Admin Dashboard</h3>
        <p>{error || "No data received."}</p>
        <button className="primary" onClick={fetchStats}>
          Retry
        </button>
      </div>
    );
  }

  const stats = data.stats || {
    totalUsers: (data as any).totalUsers || 0,
    activeUsers: (data as any).activeUsers || 0,
    resumesAnalyzed: (data as any).resumesAnalyzed || 0,
    mockInterviews: (data as any).mockInterviews || 0,
    codingProblemsSolved: (data as any).codingProblemsSolved || 0,
    githubProfilesAnalyzed: (data as any).githubProfilesAnalyzed || 0,
    roadmapsCreated: (data as any).roadmapsCreated || 0,
  };

  const charts = data.charts || {
    registrationTrend: (data as any).registrationTrend || [],
    moduleUsage: (data as any).moduleUsage || [],
  };

  const recentActivity = data.recentActivity || [];

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "#207452",
      link: "/admin/users",
    },
    {
      title: "Active Users",
      value: stats.activeUsers,
      icon: UserCheck,
      color: "#059669",
      link: "/admin/users",
    },
    {
      title: "Resumes Analyzed",
      value: stats.resumesAnalyzed,
      icon: FileText,
      color: "#0284c7",
      link: "/admin/resumes",
    },
    {
      title: "Mock Interviews",
      value: stats.mockInterviews,
      icon: Mic,
      color: "#d97706",
      link: "/admin/interviews",
    },
    {
      title: "Problems Solved",
      value: stats.codingProblemsSolved,
      icon: Code2,
      color: "#7c3aed",
      link: "/admin/coding",
    },
    {
      title: "GitHub Analyzed",
      value: stats.githubProfilesAnalyzed,
      icon: GitBranch,
      color: "#2563eb",
      link: "/admin/github",
    },
  ];

  return (
    <div className="admin-dashboard-page">
      <div className="admin-hero-banner">
        <div className="admin-hero-content">
          <p className="eyebrow" style={{ color: "#a7f3d0" }}>
            MANAGEMENT & PLATFORM MONITOR
          </p>
          <h2>Manage and monitor the Career Orbit platform.</h2>
          <p className="admin-hero-desc">
            Real-time analytics across candidates, AI interview simulations, ATS resume scans, and coding assessments.
          </p>
        </div>
        <div className="admin-hero-glow">
          <Sparkles size={48} color="#34d399" />
        </div>
      </div>

      {/* Top 6 Statistics Cards */}
      <section className="admin-stats-grid">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Link to={card.link} key={i} className="admin-stat-card">
              <div className="admin-stat-top">
                <span className="admin-stat-label">{card.title}</span>
                <div className="admin-stat-icon-wrapper" style={{ color: card.color, background: `${card.color}15` }}>
                  <Icon size={19} />
                </div>
              </div>
              <div className="admin-stat-num">{card.value}</div>
              <div className="admin-stat-footer">
                <span>View details</span>
                <ArrowUpRight size={14} />
              </div>
            </Link>
          );
        })}
      </section>

      {/* Charts Grid */}
      <section className="admin-charts-grid">
        {/* User Registration Trend */}
        <div className="admin-card">
          <div className="admin-card-head">
            <div>
              <h3>User Registrations</h3>
              <p className="admin-card-sub">New student & candidate registrations</p>
            </div>
            <div className="admin-badge-subtle">
              <TrendingUp size={14} /> 7 Days
            </div>
          </div>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.registrationTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#207452" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#207452" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6ede8" vertical={false} />
                <XAxis dataKey="date" stroke="#688073" fontSize={12} tickLine={false} />
                <YAxis allowDecimals={false} stroke="#688073" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "#15251f",
                    borderColor: "#263a32",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                  itemStyle={{ color: "#34d399" }}
                />
                <Area type="monotone" dataKey="users" stroke="#207452" strokeWidth={2.5} fill="url(#userGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Module Usage Breakdown */}
        <div className="admin-card">
          <div className="admin-card-head">
            <div>
              <h3>Module Usage</h3>
              <p className="admin-card-sub">Platform interactions by AI module</p>
            </div>
            <div className="admin-badge-subtle">
              <BarChart3 size={14} /> Activity
            </div>
          </div>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.moduleUsage} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6ede8" vertical={false} />
                <XAxis dataKey="name" stroke="#688073" fontSize={12} tickLine={false} />
                <YAxis allowDecimals={false} stroke="#688073" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "#15251f",
                    borderColor: "#263a32",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                  itemStyle={{ color: "#34d399" }}
                />
                <Bar dataKey="count" fill="#207452" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Recent Platform Activity */}
      <section className="admin-card">
        <div className="admin-card-head">
          <div>
            <h3>Recent Platform Activity</h3>
            <p className="admin-card-sub">Real-time actions executed by users across modules</p>
          </div>
          <Link to="/admin/activity" className="admin-view-all-link">
            View all logs <ArrowUpRight size={14} />
          </Link>
        </div>

        {recentActivity.length === 0 ? (
          <p className="admin-empty-state">No recent activity recorded yet.</p>
        ) : (
          <div className="admin-activity-list">
            {recentActivity.map((item) => (
              <div key={item.id} className="admin-activity-item">
                <div className="activity-icon-bullet">
                  <div className="bullet-dot" />
                </div>
                <div className="admin-activity-info">
                  <p className="activity-action-text">
                    <strong>{item.userName}</strong> {item.action}
                  </p>
                  {item.details && <p className="activity-detail-note">{item.details}</p>}
                </div>
                <div className="admin-activity-meta">
                  <span className={`module-badge module-${item.module}`}>{item.module}</span>
                  <span className="activity-time">
                    <Clock size={12} /> {formatTimeAgo(item.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
