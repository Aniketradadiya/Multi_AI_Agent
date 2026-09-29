import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AuthPage } from "./pages/AuthPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ToolPage } from "./pages/ToolPage";

// Admin components
import { AdminProtected } from "./components/admin/AdminProtected";
import { AdminLayout } from "./components/admin/AdminLayout";
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage";
import { AdminUsersPage } from "./pages/admin/AdminUsersPage";
import { AdminResumesPage } from "./pages/admin/AdminResumesPage";
import { AdminInterviewsPage } from "./pages/admin/AdminInterviewsPage";
import { AdminCodingPage } from "./pages/admin/AdminCodingPage";
import { AdminRoadmapsPage } from "./pages/admin/AdminRoadmapsPage";
import { AdminJobsPage } from "./pages/admin/AdminJobsPage";
import { AdminGitHubPage } from "./pages/admin/AdminGitHubPage";
import { AdminActivityPage } from "./pages/admin/AdminActivityPage";
import { AdminSettingsPage } from "./pages/admin/AdminSettingsPage";

function Protected() {
  return localStorage.getItem("token") ? <Layout /> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public authentication routes */}
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />

        {/* Existing standard user platform */}
        <Route element={<Protected />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          {["resume", "interview", "roadmap", "coding", "jobs", "github", "progress"].map((tool) => (
            <Route key={tool} path={`/${tool}`} element={<ToolPage tool={tool as any} />} />
          ))}
        </Route>

        {/* Secure Admin Dashboard (Role-based: ADMIN only) */}
        <Route element={<AdminProtected />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="resumes" element={<AdminResumesPage />} />
            <Route path="interviews" element={<AdminInterviewsPage />} />
            <Route path="coding" element={<AdminCodingPage />} />
            <Route path="roadmaps" element={<AdminRoadmapsPage />} />
            <Route path="jobs" element={<AdminJobsPage />} />
            <Route path="github" element={<AdminGitHubPage />} />
            <Route path="activity" element={<AdminActivityPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
