import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AuthPage } from "./pages/AuthPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ToolPage } from "./pages/ToolPage";
function Protected() { return localStorage.getItem("token") ? <Layout /> : <Navigate to="/login" replace />; }
export default function App() { return <BrowserRouter><Routes><Route path="/login" element={<AuthPage mode="login" />} /><Route path="/register" element={<AuthPage mode="register" />} /><Route element={<Protected />}><Route path="/dashboard" element={<DashboardPage />} />{["resume", "interview", "roadmap", "coding", "jobs", "github", "progress"].map((tool) => <Route key={tool} path={`/${tool}`} element={<ToolPage tool={tool as any} />} />)}</Route><Route path="*" element={<Navigate to="/dashboard" replace />} /></Routes></BrowserRouter>; }
