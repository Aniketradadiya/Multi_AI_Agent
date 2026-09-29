import { useEffect, useState } from "react";
import {
  Search,
  Eye,
  Shield,
  UserX,
  UserCheck,
  X,
  CheckCircle2,
  Calendar,
  Mail,
  User as UserIcon,
  Briefcase,
  Layers,
  Award,
} from "lucide-react";
import { api } from "../../services/api";

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  status: "active" | "disabled";
  targetRole?: string;
  createdAt: string;
  activityCount: number;
}

interface UserDetailData {
  user: {
    id: string;
    name: string;
    email: string;
    role: "USER" | "ADMIN";
    status: "active" | "disabled";
    targetRole?: string;
    experienceLevel?: string;
    skills?: string[];
    studyTime?: number;
    createdAt: string;
  };
  careerActivity: {
    resumeAnalyses: number;
    mockInterviews: number;
    codingProblems: number;
    roadmapProgress: { targetRole: string; percentage: number };
    jobMatches: number;
    githubAnalyses: number;
  };
}

export function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "USER" | "ADMIN">("ALL");

  // Modals state
  const [viewUser, setViewUser] = useState<UserDetailData | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const [roleModalUser, setRoleModalUser] = useState<UserItem | null>(null);
  const [statusModalUser, setStatusModalUser] = useState<UserItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/users", {
        params: {
          q: search || undefined,
          role: roleFilter,
        },
      });
      setUsers(res.data?.users || []);
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleView = async (user: UserItem) => {
    setViewLoading(true);
    setViewUser(null);
    try {
      const res = await api.get(`/admin/users/${user.id}`);
      setViewUser(res.data);
    } catch (err) {
      console.error("Failed to load user details:", err);
    } finally {
      setViewLoading(false);
    }
  };

  const confirmRoleChange = async () => {
    if (!roleModalUser) return;
    setActionLoading(true);
    const newRole = roleModalUser.role === "ADMIN" ? "USER" : "ADMIN";
    try {
      await api.patch(`/admin/users/${roleModalUser.id}/role`, { role: newRole });
      setToastMessage(`Role for ${roleModalUser.name} updated to ${newRole}`);
      setRoleModalUser(null);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update role");
    } finally {
      setActionLoading(false);
    }
  };

  const confirmStatusToggle = async () => {
    if (!statusModalUser) return;
    setActionLoading(true);
    const newStatus = statusModalUser.status === "active" ? "disabled" : "active";
    try {
      await api.patch(`/admin/users/${statusModalUser.id}/status`, { status: newStatus });
      setToastMessage(`Account for ${statusModalUser.name} is now ${newStatus}`);
      setStatusModalUser(null);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update status");
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <div>
          <h2>User Management</h2>
          <p className="admin-page-sub">View candidate records, adjust permissions, and monitor active status.</p>
        </div>
        <div className="admin-user-count-badge">Total Users: {users.length}</div>
      </div>

      {toastMessage && (
        <div className="admin-toast-alert">
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)}>&times;</button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="admin-filters-bar">
        <form onSubmit={handleSearchSubmit} className="admin-search-form">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-search-input"
          />
          <button type="submit" className="admin-search-btn">
            Search
          </button>
        </form>

        <div className="admin-pill-group">
          {(["ALL", "USER", "ADMIN"] as const).map((r) => (
            <button
              key={r}
              className={`filter-pill ${roleFilter === r ? "active" : ""}`}
              onClick={() => setRoleFilter(r)}
            >
              {r === "ALL" ? "All Users" : r === "USER" ? "Users" : "Admins"}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="admin-table-wrapper">
        {loading ? (
          <div className="admin-loading-state">
            <div className="admin-spinner" />
            <p>Fetching user directory...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="admin-empty-state">
            <UserIcon size={36} color="#8fa69a" />
            <p>No users found matching your search criteria.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className={u.status === "disabled" ? "row-disabled" : ""}>
                  <td>
                    <div className="table-user-cell">
                      <div className="table-avatar-initials">
                        {u.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <strong className="table-user-name">{u.name}</strong>
                        <span className="table-user-sub">{u.targetRole || "Software Developer"}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="table-email-text">{u.email}</span>
                  </td>
                  <td>
                    <span className={`table-role-badge role-${u.role.toLowerCase()}`}>
                      {u.role === "ADMIN" && <Shield size={11} />}
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <span className="table-date-text">{formatDate(u.createdAt)}</span>
                  </td>
                  <td>
                    <span className={`table-status-pill status-${u.status}`}>
                      <span className="status-dot" /> {u.status === "active" ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions-cell">
                      <button
                        className="table-action-btn action-view"
                        onClick={() => handleView(u)}
                        title="View user analytics"
                      >
                        <Eye size={15} />
                        <span>View</span>
                      </button>

                      <button
                        className="table-action-btn action-role"
                        onClick={() => setRoleModalUser(u)}
                        title="Toggle USER / ADMIN role"
                      >
                        <Shield size={14} />
                        <span>Edit Role</span>
                      </button>

                      <button
                        className={`table-action-btn ${u.status === "active" ? "action-disable" : "action-enable"}`}
                        onClick={() => setStatusModalUser(u)}
                        title={u.status === "active" ? "Disable account" : "Enable account"}
                      >
                        {u.status === "active" ? <UserX size={14} /> : <UserCheck size={14} />}
                        <span>{u.status === "active" ? "Disable" : "Enable"}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal 1: User Profile & Career Activity View */}
      {(viewUser || viewLoading) && (
        <div className="profile-modal-overlay" onClick={() => setViewUser(null)}>
          <div className="profile-modal-card user-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h3>User Career Profile</h3>
              <button className="modal-close-btn" onClick={() => setViewUser(null)}>
                <X size={18} />
              </button>
            </div>

            {viewLoading || !viewUser ? (
              <div className="admin-loading-state" style={{ padding: "40px" }}>
                <div className="admin-spinner" />
                <p>Loading candidate dossier...</p>
              </div>
            ) : (
              <div className="profile-modal-body">
                <div className="profile-hero-section">
                  <div className="profile-avatar-large">
                    {viewUser.user.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4>{viewUser.user.name}</h4>
                    <p className="profile-hero-role">{viewUser.user.targetRole || "Candidate"}</p>
                    <span className={`table-role-badge role-${viewUser.user.role.toLowerCase()}`}>
                      {viewUser.user.role}
                    </span>
                  </div>
                </div>

                <div className="user-detail-section-title">
                  <UserIcon size={16} /> Basic Information
                </div>
                <div className="user-details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Email</span>
                    <span className="detail-val">{viewUser.user.email}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Account Created</span>
                    <span className="detail-val">{formatDate(viewUser.user.createdAt)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Target Role</span>
                    <span className="detail-val">{viewUser.user.targetRole || "Software Developer"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Account Status</span>
                    <span className={`table-status-pill status-${viewUser.user.status}`}>
                      {viewUser.user.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="user-detail-section-title" style={{ marginTop: "20px" }}>
                  <Layers size={16} /> Career Orbit Activity
                </div>
                <div className="career-activity-cards-grid">
                  <div className="activity-mini-card">
                    <span className="mini-card-title">Resumes Analyzed</span>
                    <strong className="mini-card-val">{viewUser.careerActivity.resumeAnalyses}</strong>
                  </div>
                  <div className="activity-mini-card">
                    <span className="mini-card-title">Mock Interviews</span>
                    <strong className="mini-card-val">{viewUser.careerActivity.mockInterviews}</strong>
                  </div>
                  <div className="activity-mini-card">
                    <span className="mini-card-title">Problems Solved</span>
                    <strong className="mini-card-val">{viewUser.careerActivity.codingProblems}</strong>
                  </div>
                  <div className="activity-mini-card">
                    <span className="mini-card-title">Roadmap Progress</span>
                    <strong className="mini-card-val">
                      {viewUser.careerActivity.roadmapProgress.percentage}%
                    </strong>
                  </div>
                  <div className="activity-mini-card">
                    <span className="mini-card-title">Saved Jobs</span>
                    <strong className="mini-card-val">{viewUser.careerActivity.jobMatches}</strong>
                  </div>
                  <div className="activity-mini-card">
                    <span className="mini-card-title">GitHub Analyzed</span>
                    <strong className="mini-card-val">{viewUser.careerActivity.githubAnalyses}</strong>
                  </div>
                </div>
              </div>
            )}

            <div className="profile-modal-footer">
              <button className="modal-dismiss-btn" onClick={() => setViewUser(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Edit Role Confirmation */}
      {roleModalUser && (
        <div className="profile-modal-overlay" onClick={() => setRoleModalUser(null)}>
          <div className="profile-modal-card confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h3>Confirm Role Modification</h3>
              <button className="modal-close-btn" onClick={() => setRoleModalUser(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="profile-modal-body">
              <p>
                Are you sure you want to change the role of <strong>{roleModalUser.name}</strong> from{" "}
                <span className="badge-tag">{roleModalUser.role}</span> to{" "}
                <span className="badge-tag">{roleModalUser.role === "ADMIN" ? "USER" : "ADMIN"}</span>?
              </p>
              {roleModalUser.role !== "ADMIN" && (
                <p className="admin-warning-note">
                  Granting ADMIN role allows this user full access to management metrics, user accounts, and platform
                  analytics.
                </p>
              )}
            </div>
            <div className="profile-modal-footer">
              <button className="modal-cancel-btn" onClick={() => setRoleModalUser(null)} disabled={actionLoading}>
                Cancel
              </button>
              <button className="modal-primary-btn" onClick={confirmRoleChange} disabled={actionLoading}>
                {actionLoading ? "Updating..." : "Confirm Role Change"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Disable/Enable Account Confirmation */}
      {statusModalUser && (
        <div className="profile-modal-overlay" onClick={() => setStatusModalUser(null)}>
          <div className="profile-modal-card confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h3>
                {statusModalUser.status === "active" ? "Disable User Account" : "Re-enable User Account"}
              </h3>
              <button className="modal-close-btn" onClick={() => setStatusModalUser(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="profile-modal-body">
              <p>
                Are you sure you want to {statusModalUser.status === "active" ? "disable" : "enable"} access for{" "}
                <strong>{statusModalUser.name}</strong> ({statusModalUser.email})?
              </p>
              {statusModalUser.status === "active" && (
                <p className="admin-warning-note">
                  Disabled users will be blocked from logging into the Career Orbit platform until re-enabled.
                </p>
              )}
            </div>
            <div className="profile-modal-footer">
              <button className="modal-cancel-btn" onClick={() => setStatusModalUser(null)} disabled={actionLoading}>
                Cancel
              </button>
              <button
                className={statusModalUser.status === "active" ? "modal-danger-btn" : "modal-primary-btn"}
                onClick={confirmStatusToggle}
                disabled={actionLoading}
              >
                {actionLoading
                  ? "Processing..."
                  : statusModalUser.status === "active"
                  ? "Yes, Disable Account"
                  : "Yes, Enable Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
