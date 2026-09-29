import { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate, Link } from "react-router-dom";
import { Menu, Shield, LogOut, ExternalLink, Target } from "lucide-react";
import { AdminSidebar } from "./AdminSidebar";
import "../../styles/admin.css";

export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const user = (() => {
    try {
      const u = localStorage.getItem("user");
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  })();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="shell admin-shell">
      {/* Mobile Top Header */}
      <header className="mobile-top-bar admin-mobile-top-bar">
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={() => setMobileOpen(true)}
          aria-label="Open admin menu"
        >
          <Menu size={22} />
        </button>
        <div className="mobile-brand">
          <Target size={20} color="#34d399" />
          <span>Admin Panel</span>
        </div>
        <div
          className="mobile-avatar-btn admin-avatar-badge"
          onClick={() => setMobileOpen(true)}
          title="Admin Menu"
        >
          {user?.name ? user.name.slice(0, 2).toUpperCase() : "AD"}
        </div>
      </header>

      <AdminSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <main className="admin-main">
        {/* Desktop Admin Header Bar */}
        <header className="admin-top-header">
          <div className="admin-header-title-box">
            <div className="admin-header-badge-row">
              <span className="admin-pill-tag">
                <Shield size={12} /> ADMIN
              </span>
              <span className="admin-header-subtitle">Career Orbit Control Center</span>
            </div>
            <h1 className="admin-page-title">Admin Dashboard</h1>
          </div>

          <div className="admin-header-actions">
            <Link to="/dashboard" className="admin-user-view-btn" title="View standard student/candidate portal">
              <ExternalLink size={15} />
              <span>User Platform</span>
            </Link>

            <div className="admin-profile-pill">
              <div className="admin-avatar-small">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : "AD"}
              </div>
              <div className="admin-profile-meta">
                <span className="admin-profile-name">{user?.name || "Admin"}</span>
                <span className="admin-profile-role">Administrator</span>
              </div>
            </div>

            <button type="button" className="admin-header-logout-btn" onClick={handleLogout} title="Log out">
              <LogOut size={16} />
            </button>
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
}
