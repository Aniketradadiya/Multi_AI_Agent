import { useState, useEffect } from "react";
import { Outlet, useLocation, NavLink } from "react-router-dom";
import { Menu, Target } from "lucide-react";
import { Sidebar } from "./Sidebar";

export function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Close mobile drawer whenever user navigates to a new page
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const userInitial = (() => {
    try {
      const u = localStorage.getItem("user");
      if (u) {
        const parsed = JSON.parse(u);
        if (parsed.name) {
          const parts = parsed.name.trim().split(" ");
          return parts.length >= 2
            ? (parts[0][0] + parts[1][0]).toUpperCase()
            : parsed.name.slice(0, 2).toUpperCase();
        }
      }
    } catch {}
    return "U";
  })();

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
        <div
          className="mobile-avatar-btn"
          onClick={() => setMobileOpen(true)}
          title="Account / Menu"
        >
          {userInitial}
        </div>
      </header>

      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <main>
        <header>
          <div>
            <p className="eyebrow">YOUR CAREER COMMAND CENTER</p>
            <h1>Keep moving forward.</h1>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}


