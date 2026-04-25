import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  deleteWorkoutSessionRequest,
  exportWorkoutHistoryCsvRequest,
  getWorkoutHistoryRequest,
} from "../api/workoutApi";
import Button from "../components/Button";
import Card from "../components/Card";
import Loader from "../components/Loader";
import useAuth from "../hooks/useAuth";
import { useToast } from "../context/ToastContext";

const HistoryPage = () => {
  const { user } = useAuth();
  const { error, success } = useToast();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [exporting, setExporting] = useState(false);

  const fetchHistory = async () => {
    if (!user?.id) return;
    setLoading(true);
    setErrorState("");
    try {
      const { data } = await getWorkoutHistoryRequest(user.id);
      setHistory(data.history || []);
    } catch (err) {
      const message = err.response?.data?.message || "Failed to load workout history.";
      setErrorState(message);
      error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user?.id]);

  const prByExercise = useMemo(() => {
    const map = new Map();
    history.forEach((session) => {
      (session.entries || []).forEach((entry) => {
        const key = String(entry.exerciseName || "").toLowerCase().trim();
        const weight = Number(entry.weightUsed) || 0;
        if (!map.has(key) || weight > map.get(key)) {
          map.set(key, weight);
        }
      });
    });
    return map;
  }, [history]);

  const deleteSession = async (sessionId) => {
    setDeletingId(sessionId);
    try {
      await deleteWorkoutSessionRequest(sessionId);
      setHistory((prev) => prev.filter((session) => session._id !== sessionId));
      success("Workout session deleted.");
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Could not delete this session. Please try again later.";
      error(message);
    } finally {
      setDeletingId("");
    }
  };

  const exportCsv = async () => {
    if (!user?.id) return;
    setExporting(true);
    try {
      const { data } = await exportWorkoutHistoryCsvRequest(user.id);
      const blob = new Blob([data], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = "workout-history.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      success("CSV exported successfully.");
    } catch (err) {
      const message = err.response?.data?.message || "Failed to export CSV.";
      error(message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Workout History</h1>
        <p className="text-slate-400">Review previous sessions and personal records.</p>
      </div>

      <div className="flex justify-end">
        <Button onClick={exportCsv} loading={exporting}>
          Export CSV
        </Button>
      </div>

      {loading && <Loader label="Loading history..." />}

      {!loading && errorState && (
        <Card>
          <p className="text-sm text-rose-300">{errorState}</p>
        </Card>
      )}

      {!loading && !errorState && history.length === 0 && (
        <Card>
          <div className="space-y-3 text-center">
            <p className="text-6xl">🏋️</p>
            <p className="text-lg font-semibold text-white">No workouts logged yet</p>
            <p className="text-sm text-slate-400">Start tracking your first workout!</p>
            <Link to="/workout">
              <Button>Log Your First Workout</Button>
            </Link>
          </div>
        </Card>
      )}

      {!loading &&
        history.map((session) => (
          <Card
            key={session._id}
            className="animate-fade-in"
            title={new Date(session.date || session.createdAt).toLocaleString()}
            action={
              <Button
                variant="danger"
                loading={deletingId === session._id}
                onClick={() => deleteSession(session._id)}
              >
                Delete Session
              </Button>
            }
          >
            <ul className="space-y-2">
              {(session.entries || []).map((entry, idx) => {
                const key = String(entry.exerciseName || "").toLowerCase().trim();
                const isPR = (Number(entry.weightUsed) || 0) === (prByExercise.get(key) || 0);
                return (
                  <li
                    key={`${session._id}-${entry.exerciseName}-${idx}`}
                    className="rounded-lg bg-slate-800/70 px-3 py-2 text-sm text-slate-200"
                  >
                    <span className="font-semibold">{entry.exerciseName}</span> - {entry.setsCompleted} sets x{" "}
                    {entry.repsCompleted} reps @ {entry.weightUsed}kg | 1RM: {entry.oneRM || 0}
                    {" | "}
                    🔥 {Math.round(entry.caloriesBurned || session.caloriesBurned || 0)} cal
                    {isPR && (
                      <span className="ml-2 rounded-full bg-gradient-to-r from-amber-300 to-yellow-500 px-2 py-0.5 text-xs text-slate-900">
                        🏆 PR
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>
        ))}
    </div>
  );
};

export default HistoryPage;
