import { useEffect, useState } from "react";
import {
  BarChart3,
  BriefcaseBusiness,
  Code2,
  FileText,
  GitBranch,
  LayoutDashboard,
  Map,
  Mic,
  Target,
  X,
  ShieldCheck,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { api } from "../services/api";
import { UserProfileModal, UserProfile, getInitials } from "./UserProfileModal";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/resume", label: "Resume Analyzer", icon: FileText },
  { to: "/interview", label: "Mock Interview", icon: Mic },
  { to: "/roadmap", label: "AI Roadmap", icon: Map },
  { to: "/coding", label: "Coding Practice", icon: Code2 },
  { to: "/jobs", label: "Job Match", icon: BriefcaseBusiness },
  { to: "/github", label: "GitHub Analyzer", icon: GitBranch },
  { to: "/progress", label: "Progress", icon: BarChart3 },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
  onOpenProfile?: () => void;
  user?: UserProfile | null;
  onUserUpdate?: (updatedUser: UserProfile) => void;
}

export function Sidebar({
  mobileOpen = false,
  onClose,
  onOpenProfile,
  user: propUser,
  onUserUpdate,
}: SidebarProps) {
  const [internalUser, setInternalUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [showInternalModal, setShowInternalModal] = useState(false);

  const currentUser = propUser !== undefined ? propUser : internalUser;

  // Close mobile drawer on Escape key if open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (mobileOpen && onClose) {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen, onClose]);

  useEffect(() => {
    if (propUser === undefined) {
      // Fetch latest user profile from backend
      api
        .get("/auth/me")
        .then((res) => {
          if (res.data?.user) {
            setInternalUser(res.data.user);
            localStorage.setItem("user", JSON.stringify(res.data.user));
          }
        })
        .catch((err) => {
          console.warn("Could not fetch user profile:", err);
        });
    }
  }, [propUser]);

  const handleProfileClick = () => {
    if (onClose) onClose();
    if (onOpenProfile) {
      onOpenProfile();
    } else {
      setShowInternalModal(true);
    }
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      <div
        className={`sidebar-backdrop ${mobileOpen ? "visible" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <NavLink
            to="/dashboard"
            className="brand"
            onClick={() => {
              if (onClose) onClose();
            }}
          >
            <Target size={24} /> Career Orbit
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

        <nav>
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className="nav-link"
              onClick={() => {
                if (onClose) onClose();
              }}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          {currentUser?.role === "ADMIN" && (
            <NavLink
              to="/admin"
              className="admin-switch-btn"
              onClick={onClose}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 12px",
                borderRadius: "6px",
                background: "rgba(16, 185, 129, 0.12)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                color: "#34d399",
                fontSize: "12.5px",
                fontWeight: 650,
                textDecoration: "none",
                marginBottom: "4px",
              }}
            >
              <ShieldCheck size={16} />
              <span>Admin Dashboard</span>
            </NavLink>
          )}

          {/* User Profile Card */}
          <div
            className="sidebar-user-card"
            onClick={handleProfileClick}
            title="View Profile Details & Log out"
            role="button"
            tabIndex={0}
          >
            <div className="user-avatar-circle">
              {getInitials(currentUser?.name)}
            </div>
            <div className="user-info-text">
              <span className="user-name">{currentUser?.name || "Career Seeker"}</span>
              <span className="user-role">{currentUser?.targetRole || currentUser?.email || "Student / Developer"}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Fallback Profile Details Modal if not controlled by parent Layout */}
      {!onOpenProfile && (
        <UserProfileModal
          isOpen={showInternalModal}
          onClose={() => setShowInternalModal(false)}
          user={currentUser}
          onUserUpdate={(u) => {
            setInternalUser(u);
            if (onUserUpdate) onUserUpdate(u);
          }}
        />
      )}
    </>
  );
}

