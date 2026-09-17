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

export function Sidebar() {
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
    <aside className="sidebar">
      <NavLink to="/dashboard" className="brand">
        <Target size={24} /> Career Orbit
      </NavLink>

      <nav>
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className="nav-link">
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-bottom">
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
                  <div>
                    <span className="field-label">Full Name</span>
                    <span className="field-value">{user?.name || "Not specified"}</span>
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
                  <div>
                    <span className="field-label">Target Role</span>
                    <span className="field-value">{user?.targetRole || "Software Developer"}</span>
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
              <button
                className="modal-logout-btn"
                onClick={handleLogout}
              >
                <LogOut size={16} />
                Log out
              </button>
              <button
                className="modal-dismiss-btn"
                onClick={() => setShowProfileModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
