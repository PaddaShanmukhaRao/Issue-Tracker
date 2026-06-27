// ─── pages/RegisterPage.tsx ───────────────────────────────────────────────────
// The registration form. On success, the backend returns a JWT which we pass
// to useAuth's login() function to persist the session.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Layers, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import api from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import type { User } from "../types";

export function RegisterPage() {
  const { login } = useAuth();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // ── Client-side validation (mirrors the Zod schema on the backend) ──────────
  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Enter a valid email address.";
    }
    if (!password || password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); // Prevent the browser from doing a full-page form submit

    if (!validate()) return;

    setIsLoading(true);
    try {
      const { data } = await api.post<{ token: string; user: User }>(
        "/auth/register",
        { email, password }
      );

      // Pass the JWT and user object to the auth context, which saves them
      // to localStorage and redirects to /dashboard
      login(data.token, data.user);

      toast.success("Welcome! Your account has been created.");
    } catch (err: unknown) {
      // Extract the error message from the axios error response
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Registration failed. Please try again.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center px-4">
      {/* Card */}
      <div className="w-full max-w-md bg-surface-800 border border-surface-600 rounded-xl p-8 shadow-2xl animate-fade-in">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <Layers className="w-6 h-6 text-accent-light" />
          <span className="text-xl font-semibold text-slate-200">
            Issue<span className="text-accent-light">Tracker</span>
          </span>
        </div>

        <h1 className="text-2xl font-bold text-slate-100 mb-1">Create an account</h1>
        <p className="text-slate-400 text-sm mb-6">
          Track your work. Ship faster.
        </p>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Email field */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              className={`form-input ${errors.email ? "border-red-500 focus:ring-red-500/50" : ""}`}
              placeholder="you@company.com"
              autoComplete="email"
              autoFocus
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-400">{errors.email}</p>
            )}
          </div>

          {/* Password field */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                className={`form-input pr-10 ${errors.password ? "border-red-500 focus:ring-red-500/50" : ""}`}
                placeholder="At least 6 characters"
                autoComplete="new-password"
              />
              {/* Toggle password visibility */}
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-400">{errors.password}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full mt-2"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating account…
              </span>
            ) : (
              "Create account"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-accent-light hover:underline font-medium"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}