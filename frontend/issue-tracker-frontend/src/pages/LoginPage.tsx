// ─── pages/LoginPage.tsx ──────────────────────────────────────────────────────
// The login form. Mirrors RegisterPage but calls POST /api/auth/login instead.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Layers, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import api from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import type { User } from "../types";

export function LoginPage() {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data } = await api.post<{ token: string; user: User }>(
        "/auth/login",
        { email, password }
      );

      login(data.token, data.user);
      toast.success(`Welcome back!`);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Login failed. Check your credentials.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-surface-800 border border-surface-600 rounded-xl p-8 shadow-2xl animate-fade-in">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <Layers className="w-6 h-6 text-accent-light" />
          <span className="text-xl font-semibold text-slate-200">
            Issue<span className="text-accent-light">Tracker</span>
          </span>
        </div>

        <h1 className="text-2xl font-bold text-slate-100 mb-1">Sign in</h1>
        <p className="text-slate-400 text-sm mb-6">
          Welcome back to your board.
        </p>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              placeholder="you@company.com"
              autoComplete="email"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input pr-10"
                placeholder="Your password"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full mt-2"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in…
              </span>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Don't have an account?{" "}
          <Link to="/register" className="text-accent-light hover:underline font-medium">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}