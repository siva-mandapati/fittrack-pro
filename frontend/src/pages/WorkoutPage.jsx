import { useState } from "react";
import Button from "../components/Button";
import Card from "../components/Card";
import Input from "../components/Input";
import Loader from "../components/Loader";
import { logWorkoutRequest } from "../api/workoutApi";
import { useToast } from "../context/ToastContext";

const createEntry = () => ({
  exerciseName: "",
  setsCompleted: "",
  repsCompleted: "",
  weightUsed: "",
  difficulty: "medium",
});

const WorkoutPage = () => {
  const [entries, setEntries] = useState([createEntry()]);
  const [loading, setLoading] = useState(false);
  const [errorState, setErrorState] = useState("");
  const { success, error } = useToast();

  const updateEntry = (index, field, value) => {
    setEntries((prev) =>
      prev.map((entry, idx) => (idx === index ? { ...entry, [field]: value } : entry))
    );
  };

  const addExercise = () => setEntries((prev) => [...prev, createEntry()]);

  const removeExercise = (index) =>
    setEntries((prev) => prev.filter((_, idx) => idx !== index || prev.length === 1));

  const validate = () =>
    entries.every(
      (entry) =>
        entry.exerciseName.trim() &&
        Number(entry.setsCompleted) > 0 &&
        Number(entry.repsCompleted) > 0 &&
        Number(entry.weightUsed) >= 0
    );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorState("");

    if (!validate()) {
      const msg = "Please complete all exercise fields with valid values.";
      setErrorState(msg);
      error(msg);
      return;
    }

    const payload = {
      entries: entries.map((entry) => ({
        exerciseName: entry.exerciseName.trim(),
        setsCompleted: Number(entry.setsCompleted),
        repsCompleted: Number(entry.repsCompleted),
        weightUsed: Number(entry.weightUsed),
        difficulty: entry.difficulty,
      })),
    };

    setLoading(true);
    try {
      const { data } = await logWorkoutRequest(payload);
      success(`Workout logged successfully. Current streak: ${data.streak}`);
      setEntries([createEntry()]);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to log workout.";
      setErrorState(msg);
      error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Log Workout</h1>

      <Card title="Session Entries">
        {errorState && (
          <div className="mb-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">
            {errorState}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          {entries.map((entry, idx) => (
            <div key={idx} className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="font-semibold text-slate-100">Exercise #{idx + 1}</h4>
                <Button type="button" variant="ghost" onClick={() => removeExercise(idx)}>
                  Remove
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-5">
                <Input
                  type="text"
                  label="Exercise"
                  placeholder="Exercise name"
                  className="md:col-span-2"
                  value={entry.exerciseName}
                  onChange={(e) => updateEntry(idx, "exerciseName", e.target.value)}
                />
                <Input
                  type="number"
                  min="1"
                  label="Sets"
                  placeholder="Sets"
                  value={entry.setsCompleted}
                  onChange={(e) => updateEntry(idx, "setsCompleted", e.target.value)}
                />
                <Input
                  type="number"
                  min="1"
                  label="Reps"
                  placeholder="Reps"
                  value={entry.repsCompleted}
                  onChange={(e) => updateEntry(idx, "repsCompleted", e.target.value)}
                />
                <Input
                  type="number"
                  min="0"
                  label="Weight (kg)"
                  placeholder="Weight"
                  value={entry.weightUsed}
                  onChange={(e) => updateEntry(idx, "weightUsed", e.target.value)}
                />
              </div>
              <Input
                as="select"
                label="Difficulty"
                className="mt-3 w-full md:w-48"
                value={entry.difficulty}
                options={[
                  { value: "easy", label: "easy" },
                  { value: "medium", label: "medium" },
                  { value: "hard", label: "hard" },
                ]}
                onChange={(e) => updateEntry(idx, "difficulty", e.target.value)}
              />
            </div>
          ))}
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={addExercise}
              className="hover:scale-[1.02] active:scale-95"
            >
              Add Exercise
            </Button>
            <Button type="submit" loading={loading}>
              {loading ? "Saving..." : "Submit Workout"}
            </Button>
          </div>
        </form>
        {loading && <Loader label="Submitting workout..." />}
      </Card>
    </div>
  );
};

export default WorkoutPage;
