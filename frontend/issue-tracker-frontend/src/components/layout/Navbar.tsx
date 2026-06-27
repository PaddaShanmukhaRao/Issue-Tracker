// ─── components/layout/Navbar.tsx ────────────────────────────────────────────
// The top navigation bar shown on all authenticated pages.
// Displays the app logo, logged-in user's email, and a logout button.
// ─────────────────────────────────────────────────────────────────────────────

import { LogOut, Layers } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-surface-600 bg-surface-900/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-accent-light" />
          <span className="font-semibold text-slate-200 tracking-tight">
            Issue<span className="text-accent-light">Tracker</span>
          </span>
        </div>

        {/* Right side: user info + logout */}
        <div className="flex items-center gap-4">
          {user && (
            <span className="text-sm text-slate-400 font-mono hidden sm:block">
              {user.email}
            </span>
          )}

          <button
            onClick={logout}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-200
                       transition-colors duration-150 text-sm"
            aria-label="Log out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:block">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}