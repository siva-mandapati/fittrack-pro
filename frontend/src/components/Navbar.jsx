import { Link, NavLink } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { useTheme } from "../context/ThemeContext";
import Button from "./Button";

const linkClass = ({ isActive }) =>
  `group relative rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? "bg-indigo-600/20 text-indigo-300 shadow-[inset_0_-2px_0_0_rgba(99,102,241,0.9)]"
      : "text-slate-300 hover:bg-slate-800"
  }`;

const Navbar = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-xl font-black text-white">
          💪 FitTrack Pro
        </Link>
        <nav className="flex items-center gap-2">
          <NavLink to="/dashboard" className={(args) => `${linkClass(args)} nav-link`}>
            Dashboard
          </NavLink>
          <NavLink to="/workout" className={(args) => `${linkClass(args)} nav-link`}>
            Workout
          </NavLink>
          <NavLink to="/history" className={(args) => `${linkClass(args)} nav-link`}>
            History
          </NavLink>
          <NavLink to="/analysis" className={(args) => `${linkClass(args)} nav-link`}>
            Analysis
          </NavLink>
        </nav>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-slate-400 md:inline">{user?.name}</span>
          <Button variant="ghost" onClick={toggleTheme}>
            {isDark ? "Light" : "Dark"}
          </Button>
          <Button variant="secondary" onClick={logout}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
