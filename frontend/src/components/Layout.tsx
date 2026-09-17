import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";

export function Layout() {
  return (
    <div className="shell">
      <Sidebar />
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

