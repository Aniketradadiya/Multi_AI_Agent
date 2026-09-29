import { useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileText,
  Mic,
  Code2,
  Map,
  BriefcaseBusiness,
  GitBranch,
  Activity,
  Settings,
  LogOut,
  Target,
  X,
  ExternalLink,
  Shield,
} from "lucide-react";

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

const adminNavLinks = [
  { to: "/admin", label: "Admin Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/resumes", label: "Resumes", icon: FileText },
  { to: "/admin/interviews", label: "Mock Interviews", icon: Mic },
  { to: "/admin/coding", label: "Coding Practice", icon: Code2 },
  { to: "/admin/roadmaps", label: "AI Roadmaps", icon: Map },
  { to: "/admin/jobs", label: "Job Matches", icon: BriefcaseBusiness },
  { to: "/admin/github", label: "GitHub Analysis", icon: GitBranch },
  { to: "/admin/activity", label: "Activity", icon: Activity },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar({ mobileOpen = false, onClose }: AdminSidebarProps) {
  const navigate = useNavigate();

  const user = (() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileOpen && onClose) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen, onClose]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <>
      <div
        className={`sidebar-backdrop ${mobileOpen ? "visible" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`sidebar admin-sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="sidebar-header admin-brand-block">
          <NavLink to="/admin" className="brand" onClick={onClose}>
            <div className="admin-brand-icon-wrapper">
              <Target size={22} className="admin-brand-icon" />
            </div>
            <div className="admin-brand-titles">
              <span className="admin-brand-name">Career Orbit</span>
              <span className="admin-brand-tag">
                <Shield size={11} /> Admin Panel
              </span>
            </div>
          </NavLink>
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="admin-nav">
          {adminNavLinks.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `nav-link admin-nav-link ${isActive ? "active" : ""}`}
              onClick={onClose}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom admin-sidebar-bottom">
          <NavLink to="/dashboard" className="switch-view-btn" onClick={onClose} title="Go to User Platform">
            <ExternalLink size={15} />
            <span>Open User Platform</span>
          </NavLink>

          <div className="sidebar-user-card admin-user-card">
            <div className="user-avatar-circle admin-avatar-circle">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : "AD"}
            </div>
            <div className="user-info-text">
              <span className="user-name">{user?.name || "Administrator"}</span>
              <span className="admin-badge-pill">SUPER ADMIN</span>
            </div>
          </div>

          <button type="button" className="sidebar-logout-btn" onClick={handleLogout} title="Log out">
            <LogOut size={15} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
