import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Card from "./Card";

const ProgressCharts = ({ exerciseAnalytics = [] }) => {
  const weightProgressData = exerciseAnalytics.map((item, index) => ({
    index: index + 1,
    exercise: item.exercise,
    averageWeight: item.averageWeight ?? 0,
  }));

  const weeklyVolumeData = exerciseAnalytics.reduce((acc, item, index) => {
    const weekIndex = Math.floor(index / 3) + 1;
    const key = `Week ${weekIndex}`;
    const existing = acc.find((row) => row.week === key);
    const volume = item.totalVolume ?? 0;

    if (existing) {
      existing.volume += volume;
    } else {
      acc.push({ week: key, volume });
    }
    return acc;
  }, []);

  if (!exerciseAnalytics.length) {
    return (
      <Card title="Progress Charts">
        <p className="text-sm text-slate-400">No analysis data available yet.</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Weight Over Time">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weightProgressData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.2)" />
              <XAxis dataKey="exercise" stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155" }}
                labelStyle={{ color: "#e2e8f0" }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="averageWeight"
                name="Average Weight (kg)"
                stroke="#818cf8"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card title="Weekly Volume">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyVolumeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.2)" />
              <XAxis dataKey="week" stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155" }}
                labelStyle={{ color: "#e2e8f0" }}
              />
              <Legend />
              <Bar dataKey="volume" name="Workout Volume" fill="#38bdf8" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};

export default ProgressCharts;
