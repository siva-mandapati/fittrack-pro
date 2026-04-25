import { useState } from "react";
import { analyzeProgressRequest } from "../api/progressApi";
import {
  getProgressDashboardStatsRequest,
  getWeeklyMuscleVolumeRequest,
} from "../api/progressApi";
import { getWorkoutHistoryRequest } from "../api/workoutApi";
import Button from "../components/Button";
import Card from "../components/Card";
import Loader from "../components/Loader";
import ProgressCharts from "../components/ProgressCharts";
import { useToast } from "../context/ToastContext";
import useAuth from "../hooks/useAuth";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const AnalysisPage = () => {
  const [loading, setLoading] = useState(false);
  const [errorState, setErrorState] = useState("");
  const [data, setData] = useState(null);
  const [aggregationStats, setAggregationStats] = useState(null);
  const [weeklyMuscleVolume, setWeeklyMuscleVolume] = useState([]);
  const [calorieHistory, setCalorieHistory] = useState([]);
  const { error, success } = useToast();
  const { user } = useAuth();

  const runAnalysis = async () => {
    setLoading(true);
    setErrorState("");
    try {
      const [analysisRes, statsRes, weeklyVolumeRes, historyRes] = await Promise.all([
        analyzeProgressRequest(),
        getProgressDashboardStatsRequest(),
        getWeeklyMuscleVolumeRequest(),
        user?.id ? getWorkoutHistoryRequest(user.id) : Promise.resolve({ data: { history: [] } }),
      ]);
      console.log("Full API response:", analysisRes.data);
      console.log("aiInsights from response:", analysisRes.data?.aiInsights);
      setData(analysisRes.data);
      setAggregationStats(statsRes.data);
      setWeeklyMuscleVolume(weeklyVolumeRes.data?.weeklyMuscleVolume || []);
      const calorieRows = (historyRes.data?.history || [])
        .slice()
        .reverse()
        .map((session, idx) => ({
          name: `S${idx + 1}`,
          calories: Math.round(session.caloriesBurned || 0),
        }));
      setCalorieHistory(calorieRows);
      success("Analysis generated successfully.");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to analyze progress.";
      setErrorState(msg);
      error(msg);
    } finally {
      setLoading(false);
    }
  };

  const stats = data?.analysis
    ? [
        { label: "Recent Logs", value: data.analysis.recentLogsCount ?? 0 },
        { label: "Avg Recent Weight", value: data.analysis.recentAverageWeight ?? 0 },
        { label: "Prev Avg Weight", value: data.analysis.previousAverageWeight ?? 0 },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">Progress Analysis</h1>
          <p className="text-slate-400">Track and analyze your training progress.</p>
        </div>
        <Button onClick={runAnalysis} loading={loading}>
          Analyze Progress
        </Button>
      </div>

      {errorState && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">
          {errorState}
        </div>
      )}

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.label}>
                <p className="text-xs uppercase tracking-wide text-slate-400">{stat.label}</p>
                <p className="mt-1 text-2xl font-semibold text-white">{stat.value}</p>
              </Card>
            ))}
            <Card>
              <p className="text-xs uppercase tracking-wide text-slate-400">2 Week Progress</p>
              <span
                className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  data.analysis?.noProgressForTwoWeeks
                    ? "bg-rose-500/20 text-rose-300"
                    : "bg-emerald-500/20 text-emerald-300"
                }`}
              >
                {data.analysis?.noProgressForTwoWeeks ? "No progress" : "Progressing"}
              </span>
            </Card>
          </div>

          <Card title="Recommendations">
            {data.recommendations?.length ? (
              <div className="space-y-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-4">
                {data.recommendations.map((item, index) => (
                  <p key={`${item.exercise}-${index}`} className="text-sm text-indigo-100">
                    <span className="font-semibold">{item.exercise}</span> {"->"} {item.action} ({item.value})
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No recommendations generated yet.</p>
            )}
          </Card>



          <Card title="Updated Plan">
            <div className="space-y-4">
              {(data.updatedPlan?.plan || []).map((dayPlan) => (
                <div key={dayPlan.day} className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                  <h4 className="font-semibold text-white">
                    {dayPlan.day} - {dayPlan.focus}
                  </h4>
                  <ul className="mt-2 space-y-1 text-sm text-slate-300">
                    {(dayPlan.exercises || []).map((exercise, idx) => (
                      <li key={`${exercise.name}-${idx}`} className="rounded-lg bg-slate-800/60 px-3 py-2">
                        {exercise.name}: {exercise.targetSets} x {exercise.targetReps} @{" "}
                        {exercise.targetWeight}kg
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Card>

          <ProgressCharts exerciseAnalytics={data.exerciseAnalytics} />

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <p className="text-xs uppercase tracking-wide text-slate-400">🏋 Total Volume (All Time)</p>
              <p className="mt-1 text-2xl font-semibold text-white">
                {aggregationStats?.totalVolumeLifted || 0}
              </p>
            </Card>
            <Card>
              <p className="text-xs uppercase tracking-wide text-slate-400">💪 Most Trained Muscle Group</p>
              <p className="mt-1 text-2xl font-semibold text-white">
                {aggregationStats?.mostTrainedMuscleGroup || "N/A"}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Exercise: {aggregationStats?.mostTrainedExercise || "N/A"}
              </p>
            </Card>
            <Card>
              <p className="text-xs uppercase tracking-wide text-slate-400">🚀 Best Session</p>
              <p className="mt-1 text-2xl font-semibold text-white">
                {aggregationStats?.bestSession?.totalVolume || 0}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                {aggregationStats?.bestSession?.date
                  ? new Date(aggregationStats.bestSession.date).toLocaleDateString()
                  : "N/A"}
              </p>
            </Card>
          </div>

          <Card title="Weekly Muscle Group Volume">
            {weeklyMuscleVolume.length ? (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyMuscleVolume}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.2)" />
                    <XAxis dataKey="muscleGroup" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155" }}
                      labelStyle={{ color: "#e2e8f0" }}
                    />
                    <Legend />
                    <Bar dataKey="sets" name="Total Sets" fill="#818cf8" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-slate-400">No weekly muscle volume data available yet.</p>
            )}
          </Card>

          <Card title="Calorie Burn History">
            {calorieHistory.length ? (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={calorieHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.2)" />
                    <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155" }}
                      labelStyle={{ color: "#e2e8f0" }}
                    />
                    <Legend />
                    <Bar dataKey="calories" name="Calories Burned" fill="#f97316" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-slate-400">No calorie history available yet.</p>
            )}
          </Card>
        </>
      )}

      {!loading && !data && (
        <Card title="No Analysis Yet">
          <div className="space-y-3">
            <p className="text-sm text-slate-400">
              Run progress analysis after logging workouts to unlock insights and recommendations.
            </p>
            <Button onClick={runAnalysis}>Run First Analysis</Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AnalysisPage;
