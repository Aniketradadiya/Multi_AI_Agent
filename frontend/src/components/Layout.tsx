import { useState, useEffect } from "react";
import { Outlet, useLocation, NavLink } from "react-router-dom";
import { Menu, Target } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { UserProfileModal, UserProfile, getInitials } from "./UserProfileModal";
import { api } from "../services/api";

export function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const u = localStorage.getItem("user");
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  });
  const location = useLocation();

  // Close mobile drawer whenever user navigates to a new page
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const fetchUserProfile = () => {
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
  };

  // Fetch latest user details on mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const handleOpenProfile = () => {
    setMobileOpen(false);
    fetchUserProfile();
    setShowProfileModal(true);
  };

  return (
    <div className="shell">
      {/* Mobile Top Navigation Header */}
      <header className="mobile-top-bar">
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation menu"
        >
          <Menu size={22} />
        </button>
        <NavLink to="/dashboard" className="mobile-brand">
          <Target size={20} color="#42a977" />
          <span>Career Orbit</span>
        </NavLink>
        <button
          type="button"
          className="mobile-avatar-btn"
          onClick={handleOpenProfile}
          aria-label="Open profile"
          title="User Profile"
        >
          {getInitials(user?.name)}
        </button>
      </header>

      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        onOpenProfile={handleOpenProfile}
        user={user}
        onUserUpdate={(updated) => setUser(updated)}
      />

      <main>
        <header>
          <div>
            <p className="eyebrow">YOUR CAREER COMMAND CENTER</p>
            <h1>Keep moving forward.</h1>
          </div>
        </header>
        <Outlet />
      </main>

      {/* Shared User Profile Modal for Desktop and Mobile */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={user}
        onUserUpdate={(updated) => setUser(updated)}
      />
    </div>
  );
}


