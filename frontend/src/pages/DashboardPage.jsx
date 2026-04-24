import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import Card from "../components/Card";
import Loader from "../components/Loader";
import Skeleton from "../components/Skeleton";
import useAuth from "../hooks/useAuth";
import { getWorkoutHistoryRequest } from "../api/workoutApi";
import { useToast } from "../context/ToastContext";

const statsMeta = [
  { key: "level", label: "Level", icon: "📈" },
  { key: "days", label: "Days per week", icon: "📅" },
  { key: "last", label: "Last workout", icon: "🏋️" },
  { key: "total", label: "Total workouts", icon: "🔥" },
  { key: "currentStreak", label: "Current streak", icon: "⚡" },
  { key: "longestStreak", label: "Longest streak", icon: "🏆" },
];

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { error: toastError } = useToast();
  const [summary, setSummary] = useState(null);
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [streakStats, setStreakStats] = useState({ current: 0, longest: 0 });
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState("");

  useEffect(() => {
    const fetchSummary = async () => {
      if (!user?.id) return;
      setLoading(true);
      setErrorState("");
      try {
        const { data } = await getWorkoutHistoryRequest(user.id);
        setSummary(data.history?.[0] || null);
        setTotalWorkouts(data.count || 0);
        setStreakStats(data.streak || { current: 0, longest: 0 });
      } catch (err) {
        const msg = err.response?.data?.message || "Failed to load dashboard.";
        setErrorState(msg);
        toastError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [user?.id]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400">Welcome back, {user?.name}. Track your gains daily.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        {statsMeta.map((stat) => (
          <Card key={stat.key}>
            {loading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-slate-400">
                  <span className="mr-2">{stat.icon}</span>
                  {stat.label}
                </p>
                <p className="text-2xl font-semibold text-white">
                  {stat.key === "level" && (user?.level || "beginner")}
                  {stat.key === "days" && (user?.daysPerWeek || 0)}
                  {stat.key === "last" && (summary ? "Logged" : "None")}
                  {stat.key === "total" && totalWorkouts}
                  {stat.key === "currentStreak" && streakStats.current}
                  {stat.key === "longestStreak" && streakStats.longest}
                </p>
              </div>
            )}
          </Card>
        ))}
      </div>

      <Card title="Last Workout Summary">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : errorState ? (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">
            {errorState}
          </div>
        ) : summary ? (
          <div className="space-y-2">
            <p className="text-sm text-slate-400">
              Date: {new Date(summary.date || summary.createdAt).toLocaleString()}
            </p>
            <ul className="space-y-2">
              {(summary.entries || []).map((entry, idx) => (
                <li
                  key={`${entry.exerciseName}-${idx}`}
                  className="rounded-lg bg-slate-800/60 p-3 text-sm text-slate-200"
                >
                  <span className="font-semibold">{entry.exerciseName}</span> - {entry.setsCompleted} sets x{" "}
                  {entry.repsCompleted} reps @ {entry.weightUsed} kg ({entry.difficulty})
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-slate-400">No workouts logged yet.</p>
        )}
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => navigate("/workout")}>
          Log Workout
        </Button>
        <Button variant="secondary" onClick={() => navigate("/analysis")}>
          Analyze Progress
        </Button>
      </div>
    </div>
  );
};

export default DashboardPage;
