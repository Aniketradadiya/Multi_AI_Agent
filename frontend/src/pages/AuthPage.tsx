import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Target, Briefcase } from "lucide-react";
import { api } from "../services/api";

export const JOB_ROLES_CATEGORIES = [
  {
    category: "Full Stack Development",
    roles: [
      "MERN Stack Developer",
      "Full Stack Developer",
      "MEAN Stack Developer",
      "Java Full Stack Developer",
      "Python Full Stack Developer",
      ".NET Full Stack Developer",
      "PERN Stack Developer",
    ],
  },
  {
    category: "Frontend Development",
    roles: [
      "Frontend Developer (React / Next.js)",
      "Frontend Developer (Angular / Vue)",
      "Web Developer (HTML / CSS / JavaScript)",
      "UI / UX Frontend Developer",
    ],
  },
  {
    category: "Backend & Core Engineering",
    roles: [
      "Backend Developer (Node.js / Express)",
      "Java / Spring Boot Developer",
      "Python / Django / FastAPI Developer",
      "Golang Developer",
      "C++ / Systems Software Engineer",
      "C# / .NET Core Developer",
      "PHP / Laravel Developer",
      "Ruby on Rails Developer",
    ],
  },
  {
    category: "Mobile App Development",
    roles: [
      "Android Developer (Kotlin / Java)",
      "iOS Developer (Swift)",
      "Flutter Developer",
      "React Native Developer",
      "Mobile App Developer (Cross-Platform)",
    ],
  },
  {
    category: "Data Science, AI & Machine Learning",
    roles: [
      "AI / Machine Learning Engineer",
      "Generative AI / LLM Engineer",
      "Data Scientist",
      "Data Analyst / BI Developer",
      "Data Engineer (Big Data / Spark / SQL)",
      "Deep Learning / NLP Specialist",
      "Computer Vision Engineer",
    ],
  },
  {
    category: "Cloud, DevOps & Infrastructure",
    roles: [
      "DevOps Engineer",
      "Cloud Solutions Architect (AWS / Azure / GCP)",
      "Cloud Security Engineer",
      "Site Reliability Engineer (SRE)",
      "Linux System Administrator",
      "Database Administrator (DBA)",
    ],
  },
  {
    category: "Cybersecurity",
    roles: [
      "Cybersecurity Analyst",
      "Ethical Hacker / Penetration Tester",
      "Information Security Engineer",
      "SOC Analyst",
    ],
  },
  {
    category: "Quality Assurance & Testing",
    roles: [
      "QA Automation Engineer (Selenium / Cypress / Playwright)",
      "Manual QA Tester",
      "SDET (Software Development Engineer in Test)",
    ],
  },
  {
    category: "Product, Design & Management",
    roles: [
      "UI / UX Designer",
      "Product Manager",
      "Scrum Master / Agile Coach",
      "Business Analyst",
      "Technical Project Manager",
    ],
  },
];

export function AuthPage({ mode }: { mode: "login" | "register" }) {
  const nav = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState("MERN Stack Developer");
  const [customRole, setCustomRole] = useState("");

  const savedUser = localStorage.getItem("user");
  let isAdmin = false;
  try {
    if (savedUser) isAdmin = JSON.parse(savedUser).role === "ADMIN";
  } catch {}

  if (localStorage.getItem("token")) {
    return <Navigate to={isAdmin ? "/admin" : "/dashboard"} replace />;
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setLoading(true);
    setError("");

    try {
      const rawBody = Object.fromEntries(form);
      const targetRoleValue =
        selectedRole === "other"
          ? customRole.trim() || "Software Developer"
          : selectedRole;

      const body = {
        ...rawBody,
        targetRole: targetRoleValue,
      };

      const { data } = await api.post(`/auth/${mode === "login" ? "login" : "register"}`, body);
      localStorage.setItem("token", data.token);
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }
      if (data.user?.role === "ADMIN") {
        nav("/admin");
      } else {
        nav("/dashboard");
      }
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-intro">
        <Target size={38} />
        <p className="eyebrow">CAREER ORBIT</p>
        <h1>Make your next opportunity a little more inevitable.</h1>
        <p>AI-guided practice, feedback, and a clear view of your placement readiness.</p>
      </section>

      <form className="auth-form" onSubmit={submit}>
        <h2>{mode === "login" ? "Welcome back" : "Create your account"}</h2>

        {mode === "register" && (
          <label>
            Name
            <input name="name" required minLength={2} placeholder="Your name" />
          </label>
        )}

        <label>
          Email
          <input name="email" required type="email" placeholder="you@example.com" />
        </label>

        <label>
          Password
          <input
            name="password"
            required
            minLength={8}
            type="password"
            placeholder="At least 8 characters"
          />
        </label>

        {mode === "register" && (
          <>
            <label>
              Target role (Select Job)
              <select
                name="targetRole"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                required
              >
                {JOB_ROLES_CATEGORIES.map((grp) => (
                  <optgroup key={grp.category} label={grp.category}>
                    {grp.roles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </optgroup>
                ))}
                <optgroup label="Custom / Other">
                  <option value="other">✨ Other (Type custom role...)</option>
                </optgroup>
              </select>
            </label>

            {selectedRole === "other" && (
              <label>
                Specify Custom Job Role
                <input
                  name="customRoleInput"
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  placeholder="e.g. Blockchain Developer, AR/VR Engineer"
                  required
                  autoFocus
                />
              </label>
            )}
          </>
        )}

        {error && <p className="error">{error}</p>}

        <button className="primary" disabled={loading}>
          {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Get started"}
        </button>

        <p className="switch">
          {mode === "login" ? "New here?" : "Already have an account?"}{" "}
          <a href={mode === "login" ? "/register" : "/login"}>
            {mode === "login" ? "Create account" : "Sign in"}
          </a>
        </p>
      </form>
    </div>
  );
}
