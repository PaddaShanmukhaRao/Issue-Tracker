// ─── components/layout/ProtectedRoute.tsx ────────────────────────────────────
// A wrapper component that redirects to /login if the user isn't authenticated.
//
// Usage: Wrap any route element that requires login:
//   <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
//
// While we're still checking localStorage (isLoading), show nothing to avoid
// a flash of the login page for already-authenticated users.
// ─────────────────────────────────────────────────────────────────────────────

import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import type { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  // Still loading from localStorage — render nothing to avoid flicker
  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not logged in — redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Logged in — render the protected page
  return <>{children}</>;
}