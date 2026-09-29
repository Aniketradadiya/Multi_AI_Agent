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
  LogOut,
  User as UserIcon,
  X,
  Mail,
  Award,
  ShieldCheck,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { api } from "../services/api";

interface UserProfile {
  id?: string;
  name: string;
  email: string;
  role?: string;
  targetRole?: string;
  skills?: string[];
}

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
}

export function Sidebar({ mobileOpen = false, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Close mobile drawer / modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showProfileModal) {
          setShowProfileModal(false);
        } else if (mobileOpen && onClose) {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen, onClose, showProfileModal]);

  const handleStartEdit = () => {
    setEditName(user?.name || "");
    setEditRole(user?.targetRole || "Software Developer");
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await api.put("/auth/profile", {
        name: editName,
        targetRole: editRole,
      });
      if (res.data?.user) {
        setUser(res.data.user);
        localStorage.setItem("user", JSON.stringify(res.data.user));
      }
      setIsEditing(false);
    } catch (e) {
      console.error("Save profile error:", e);
    } finally {
      setSavingProfile(false);
    }
  };

  useEffect(() => {
    // Fetch latest user profile from backend
    api
      .get("/auth/me")
      .then((res) => {
        if (res.data?.user) {
          setUser(res.data.user);
          localStorage.setItem("user", JSON.stringify(res.data.user));
        }
      })
      .catch((err) => {
        console.warn("Could not fetch user profile:", err);
      });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
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
          {user?.role === "ADMIN" && (
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
            onClick={() => setShowProfileModal(true)}
            title="View Profile Details & Log out"
          >
            <div className="user-avatar-circle">
              {getInitials(user?.name)}
            </div>
            <div className="user-info-text">
              <span className="user-name">{user?.name || "Career Seeker"}</span>
              <span className="user-role">{user?.targetRole || user?.email || "Student / Developer"}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Profile Details Modal */}
      {showProfileModal && (
        <div className="profile-modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="profile-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h3>User Profile</h3>
              <button
                className="modal-close-btn"
                onClick={() => setShowProfileModal(false)}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="profile-modal-body">
              <div className="profile-hero-section">
                <div className="profile-avatar-large">
                  {getInitials(user?.name)}
                </div>
                <div>
                  <h4>{user?.name || "User"}</h4>
                  <p className="profile-hero-role">{user?.targetRole || "Candidate"}</p>
                </div>
              </div>

              <div className="profile-fields-list">
                <div className="profile-field-item">
                  <div className="field-icon">
                    <UserIcon size={16} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <span className="field-label">Full Name</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        style={{
                          background: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.15)",
                          borderRadius: "6px",
                          padding: "4px 8px",
                          color: "#fff",
                          width: "100%",
                          marginTop: "2px",
                        }}
                      />
                    ) : (
                      <span className="field-value">{user?.name || "Not specified"}</span>
                    )}
                  </div>
                </div>

                <div className="profile-field-item">
                  <div className="field-icon">
                    <Mail size={16} />
                  </div>
                  <div>
                    <span className="field-label">Email Address</span>
                    <span className="field-value">{user?.email || "Not specified"}</span>
                  </div>
                </div>

                <div className="profile-field-item">
                  <div className="field-icon">
                    <Award size={16} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <span className="field-label">Target Role</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value)}
                        style={{
                          background: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.15)",
                          borderRadius: "6px",
                          padding: "4px 8px",
                          color: "#fff",
                          width: "100%",
                          marginTop: "2px",
                        }}
                      />
                    ) : (
                      <span className="field-value">{user?.targetRole || "Software Developer"}</span>
                    )}
                  </div>
                </div>

                <div className="profile-field-item">
                  <div className="field-icon">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <span className="field-label">Account Status</span>
                    <span className="field-value status-active">● Active Member</span>
                  </div>
                </div>
              </div>

              {user?.skills && user.skills.length > 0 && (
                <div className="profile-skills-section">
                  <span className="field-label">Declared Skills</span>
                  <div className="profile-skills-chips">
                    {user.skills.map((skill, i) => (
                      <span key={i} className="skill-chip">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="profile-modal-footer">
              {isEditing ? (
                <>
                  <button
                    className="modal-dismiss-btn"
                    onClick={() => setIsEditing(false)}
                    disabled={savingProfile}
                  >
                    Cancel
                  </button>
                  <button
                    className="modal-logout-btn"
                    style={{ background: "#10b981", borderColor: "#10b981", color: "#fff" }}
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                  >
                    {savingProfile ? "Saving..." : "Save Profile"}
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="modal-logout-btn"
                    onClick={handleLogout}
                  >
                    <LogOut size={16} />
                    Log out
                  </button>
                  <button
                    className="modal-dismiss-btn"
                    style={{ marginRight: "auto" }}
                    onClick={handleStartEdit}
                  >
                    Edit Profile
                  </button>
                  <button
                    className="modal-dismiss-btn"
                    onClick={() => setShowProfileModal(false)}
                  >
                    Close
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

