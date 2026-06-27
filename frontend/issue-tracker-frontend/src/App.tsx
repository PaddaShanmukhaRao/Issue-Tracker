// ─── App.tsx ──────────────────────────────────────────────────────────────────
// Root component. Sets up:
//   - BrowserRouter for client-side routing
//   - AuthProvider for global auth state
//   - Toaster for toast notifications (react-hot-toast)
//   - Route definitions
// ─────────────────────────────────────────────────────────────────────────────

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { RegisterPage } from "./pages/RegisterPage";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";

export default function App() {
  return (
    // BrowserRouter must wrap AuthProvider because AuthProvider uses useNavigate,
    // which requires a Router context.
    <BrowserRouter>
      <AuthProvider>
        {/* Toast notifications rendered at the top-right of the screen */}
        <Toaster
          position="top-right"
          toastOptions={{
            // Default styling that matches the dark theme
            style: {
              background: "#21262d",
              color: "#e6edf3",
              border: "1px solid #30363d",
              borderRadius: "8px",
              fontSize: "14px",
            },
            success: {
              iconTheme: {
                primary: "#6e40c9",
                secondary: "#ffffff",
              },
            },
          }}
        />

        <Routes>
          {/* Public routes — redirect to dashboard if already logged in */}
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Protected route — redirects to /login if not authenticated */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Default redirect — new visitors go to register, logged-in go to dashboard */}
          <Route path="/" element={<Navigate to="/register" replace />} />

          {/* 404 fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}