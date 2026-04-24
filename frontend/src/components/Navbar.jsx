import { Link, NavLink } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { useTheme } from "../context/ThemeContext";
import Button from "./Button";

const linkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? "bg-indigo-600/20 text-indigo-300" : "text-slate-300 hover:bg-slate-800"
  }`;

const Navbar = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-bold text-white">
          FitTrack Pro
        </Link>
        <nav className="flex items-center gap-2">
          <NavLink to="/dashboard" className={linkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/workout" className={linkClass}>
            Workout
          </NavLink>
          <NavLink to="/history" className={linkClass}>
            History
          </NavLink>
          <NavLink to="/analysis" className={linkClass}>
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
