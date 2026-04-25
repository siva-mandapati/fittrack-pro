import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import Card from "../components/Card";
import Input from "../components/Input";
import useAuth from "../hooks/useAuth";
import { useToast } from "../context/ToastContext";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, loading, isAuthenticated } = useAuth();
  const { error: toastError, success: toastSuccess } = useToast();
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({ email: "", password: "" });

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!form.email.trim()) nextErrors.email = "Email is required";
    if (!form.password.trim()) nextErrors.password = "Password is required";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      await login(form);
      toastSuccess("Logged in successfully.");
      navigate("/dashboard");
    } catch (err) {
      toastError(err.response?.data?.message || "Unable to login.");
    }
  };

  return (
    <div className="animate-fade-in flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <Card>
        <div className="w-full max-w-md">
          <p className="mb-4 text-center text-lg font-bold text-indigo-300">💪 FitTrack Pro</p>
          <h1 className="mb-1 text-2xl font-bold text-white">Welcome back</h1>
          <p className="mb-5 text-sm text-slate-400">Sign in to continue tracking your progress.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            />
            <Button type="submit" className="w-full" loading={loading}>
              {loading ? "Signing in..." : "Login"}
            </Button>
          </form>
          <p className="mt-4 text-sm text-slate-400">
            New user?{" "}
            <Link to="/register" className="font-medium text-indigo-400 hover:underline">
              Create account
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
