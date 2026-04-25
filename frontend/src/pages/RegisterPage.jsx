import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import Card from "../components/Card";
import Input from "../components/Input";
import useAuth from "../hooks/useAuth";
import { useToast } from "../context/ToastContext";

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, loading, isAuthenticated } = useAuth();
  const { error: toastError, success: toastSuccess } = useToast();
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    level: "beginner",
    daysPerWeek: 3,
  });

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = "Name is required";
    if (!form.email.trim()) nextErrors.email = "Email is required";
    if (!form.password.trim()) nextErrors.password = "Password is required";
    if (form.password.length < 6) nextErrors.password = "Password must be at least 6 characters";
    if (Number(form.daysPerWeek) < 1 || Number(form.daysPerWeek) > 7) {
      nextErrors.daysPerWeek = "Days per week must be 1-7";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      await register({
        ...form,
        daysPerWeek: Number(form.daysPerWeek),
      });
      toastSuccess("Account created successfully.");
      navigate("/dashboard");
    } catch (err) {
      toastError(err.response?.data?.message || "Unable to register.");
    }
  };

  return (
    <div className="animate-fade-in flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <Card>
        <div className="w-full max-w-md">
          <p className="mb-4 text-center text-lg font-bold text-indigo-300">💪 FitTrack Pro</p>
          <h1 className="mb-1 text-2xl font-bold text-white">Create account</h1>
          <p className="mb-5 text-sm text-slate-400">Start tracking your workouts today.</p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              label="Full Name"
              error={errors.name}
              type="text"
              placeholder="Siva"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
            <Input
              label="Email"
              error={errors.email}
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            />
            <Input
              label="Password"
              error={errors.password}
              type="password"
              placeholder="At least 6 characters"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Level"
              as="select"
              value={form.level}
              options={[
                { value: "beginner", label: "Beginner" },
                { value: "intermediate", label: "Intermediate" },
              ]}
              onChange={(e) => setForm((prev) => ({ ...prev, level: e.target.value }))}
            />
            <Input
              label="Days/Week"
              error={errors.daysPerWeek}
              type="number"
              min="1"
              max="7"
              value={form.daysPerWeek}
              onChange={(e) => setForm((prev) => ({ ...prev, daysPerWeek: e.target.value }))}
            />
          </div>
            <Button type="submit" className="w-full" loading={loading}>
              {loading ? "Creating..." : "Register"}
            </Button>
          </form>
          <p className="mt-4 text-sm text-slate-400">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-indigo-400 hover:underline">
              Login
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default RegisterPage;
