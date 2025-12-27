import { Link, NavLink } from "react-router-dom";

export default function Header() {
  return (
    <header className="border-b border-slate-800 bg-slate-950/60 backdrop-blur">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-slate-800/60 ring-1 ring-slate-700 flex items-center justify-center">
            <span className="text-slate-200 font-semibold">TM</span>
          </div>
          <div>
            <div className="text-base font-semibold leading-tight">Track My Container</div>
            <div className="text-xs text-slate-400">Demo (Static Simulation)</div>
          </div>
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          <NavLink to="/" className={({ isActive }) => (isActive ? "text-slate-100" : "text-slate-300 hover:text-slate-100")}>
            Live Demo
          </NavLink>
          <NavLink to="/about" className={({ isActive }) => (isActive ? "text-slate-100" : "text-slate-300 hover:text-slate-100")}>
            What This Represents
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
