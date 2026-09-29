import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { api } from "../../services/api";

export function AdminProtected() {
  const token = localStorage.getItem("token");
  const [isAdmin, setIsAdmin] = useState<boolean | null>(() => {
    try {
      const u = localStorage.getItem("user");
      if (!u) return null;
      const parsed = JSON.parse(u);
      return parsed.role === "ADMIN";
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(isAdmin === null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    // Verify role directly from backend /auth/me for rock-solid security
    api
      .get("/auth/me")
      .then((res) => {
        const user = res.data?.user;
        if (user) {
          localStorage.setItem("user", JSON.stringify(user));
          setIsAdmin(user.role === "ADMIN");
        } else {
          setIsAdmin(false);
        }
      })
      .catch(() => {
        setIsAdmin(false);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "#0d1814",
          color: "#42a977",
          fontFamily: "Inter, sans-serif",
          fontWeight: 600,
          letterSpacing: "0.5px",
        }}
      >
        Verifying administrator credentials...
      </div>
    );
  }

  // If authenticated but role is NOT ADMIN, redirect to normal user dashboard
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
