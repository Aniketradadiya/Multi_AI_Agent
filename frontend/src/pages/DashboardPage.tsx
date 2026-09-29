import { useEffect, useState } from "react";
import { ArrowUpRight, Flame, Target } from "lucide-react";
import { api } from "../services/api";
import type { DashboardData } from "../types";
export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    api
      .get("/dashboard")
      .then((r) => setData(r.data))
      .catch(() => {
        setData({
          readinessScore: 0,
          scores: {
            resume: 0,
            interview: 0,
            coding: 0,
            github: 0,
            roadmap: 0,
          },
          weeklyGoal: { completed: 0, total: 5 },
          streak: 0,
          nextStep: "Analyze your resume or generate an AI Roadmap to start your career journey",
          recentActivity: ["No activity yet"],
        });
      });
  }, []);

  if (!data) return <p className="loading">Loading your career snapshot...</p>;

  return (
    <div className="dashboard">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">PLACEMENT READINESS</p>
          <strong>
            {data.readinessScore}
            <small>%</small>
          </strong>
          <p>
            {data.readinessScore > 0
              ? "Calculated dynamically across your real resumes, coding, interviews, and roadmap progress."
              : "No activity yet. Complete exercises and analyses to build your placement readiness score."}
          </p>
        </div>
        <Target size={76} strokeWidth={1} />
      </section>

      <section className="metric-grid">
        {Object.entries(data.scores).map(([name, score]) => (
          <article className="metric" key={name}>
            <span>{name}</span>
            <b>{score}%</b>
            <div className="track">
              <i style={{ width: `${score}%` }} />
            </div>
          </article>
        ))}
      </section>

      <section className="two-col">
        <article className="panel">
          <div className="panel-title">
            <h2>Momentum</h2>
            <Flame size={19} />
          </div>
          <div className="goal">
            <b>{data.streak} day</b>
            <span>learning streak</span>
          </div>
          <p>
            {data.weeklyGoal.completed} of {data.weeklyGoal.total} weekly goals complete
          </p>
          <div className="track">
            <i
              style={{
                width: `${(data.weeklyGoal.completed / data.weeklyGoal.total) * 100}%`,
              }}
            />
          </div>
        </article>
        <article className="panel accent">
          <p className="eyebrow">NEXT BEST MOVE</p>
          <h2>{data.nextStep}</h2>
          <a href="/coding">
            Start a focused session <ArrowUpRight size={16} />
          </a>
        </article>
      </section>

      <section className="panel">
        <h2>Recent activity</h2>
        <ul className="activity">
          {data.recentActivity.map((item) => (
            <li key={item}>
              <span />
              {item}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
