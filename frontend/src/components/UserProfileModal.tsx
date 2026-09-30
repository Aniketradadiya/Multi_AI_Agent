import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  User as UserIcon,
  Mail,
  Award,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { api } from "../services/api";

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  role?: string;
  targetRole?: string;
  status?: string;
  skills?: string[];
  experienceLevel?: string;
  studyTime?: number;
}

export function getInitials(name?: string): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onUserUpdate?: (updatedUser: UserProfile) => void;
}

export function UserProfileModal({
  isOpen,
  onClose,
  user,
  onUserUpdate,
}: UserProfileModalProps) {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Close modal on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Reset edit state when modal closes or opens
  useEffect(() => {
    if (isOpen && user) {
      setEditName(user.name || "");
      setEditRole(user.targetRole || "Software Developer");
    } else {
      setIsEditing(false);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

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
        localStorage.setItem("user", JSON.stringify(res.data.user));
        if (onUserUpdate) {
          onUserUpdate(res.data.user);
        }
      }
      setIsEditing(false);
    } catch (e) {
      console.error("Save profile error:", e);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div
      className="profile-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="User Profile"
    >
      <div className="profile-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="profile-modal-header">
          <h3>User Profile</h3>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close profile modal"
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
              <p className="profile-hero-role">
                {user?.targetRole || "Candidate"}
              </p>
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
                      background: "#f4f7f5",
                      border: "1px solid #c9d8ce",
                      borderRadius: "6px",
                      padding: "6px 10px",
                      color: "#15251f",
                      width: "100%",
                      marginTop: "4px",
                      fontSize: "14px",
                      boxSizing: "border-box",
                    }}
                  />
                ) : (
                  <span className="field-value">
                    {user?.name || "Not specified"}
                  </span>
                )}
              </div>
            </div>

            <div className="profile-field-item">
              <div className="field-icon">
                <Mail size={16} />
              </div>
              <div>
                <span className="field-label">Email Address</span>
                <span className="field-value">
                  {user?.email || "Not specified"}
                </span>
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
                      background: "#f4f7f5",
                      border: "1px solid #c9d8ce",
                      borderRadius: "6px",
                      padding: "6px 10px",
                      color: "#15251f",
                      width: "100%",
                      marginTop: "4px",
                      fontSize: "14px",
                      boxSizing: "border-box",
                    }}
                  />
                ) : (
                  <span className="field-value">
                    {user?.targetRole || "Software Developer"}
                  </span>
                )}
              </div>
            </div>

            <div className="profile-field-item">
              <div className="field-icon">
                <ShieldCheck size={16} />
              </div>
              <div>
                <span className="field-label">Account Status</span>
                <span className="field-value status-active">
                  ● {user?.status === "active" || !user?.status ? "Active Member" : user.status}
                </span>
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
                type="button"
                className="modal-dismiss-btn"
                onClick={() => setIsEditing(false)}
                disabled={savingProfile}
              >
                Cancel
              </button>
              <button
                type="button"
                className="modal-logout-btn"
                style={{
                  background: "#10b981",
                  borderColor: "#10b981",
                  color: "#fff",
                }}
                onClick={handleSaveProfile}
                disabled={savingProfile}
              >
                {savingProfile ? "Saving..." : "Save Profile"}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="modal-logout-btn"
                onClick={handleLogout}
              >
                <LogOut size={16} />
                Log out
              </button>
              <button
                type="button"
                className="modal-dismiss-btn"
                style={{ marginRight: "auto" }}
                onClick={handleStartEdit}
              >
                Edit Profile
              </button>
              <button
                type="button"
                className="modal-dismiss-btn"
                onClick={onClose}
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
