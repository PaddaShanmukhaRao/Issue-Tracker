// ─── hooks/useAuth.tsx ────────────────────────────────────────────────────────
// React context that manages authentication state for the whole app.
//
// What it provides:
//   - user      — the logged-in user object (or null)
//   - token     — the JWT string (or null)
//   - isLoading — true while we're checking localStorage on first load
//   - login()   — saves the token + user and redirects to /dashboard
//   - logout()  — clears everything and redirects to /login
//
// Usage:
//   const { user, logout } = useAuth();
// ─────────────────────────────────────────────────────────────────────────────

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import type { User } from "../types";

// ── Context shape ─────────────────────────────────────────────────────────────
interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

// Create the context with a placeholder default (overridden by the Provider)
const AuthContext = createContext<AuthContextType | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────
// Wrap your entire app in this so every component can access auth state.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // true until localStorage is read
  const navigate = useNavigate();

  // On first mount, try to restore session from localStorage.
  // This means refreshing the page won't log the user out.
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }

    // Done checking — the app can now render protected/public routes correctly
    setIsLoading(false);
  }, []);

  // Called after a successful register or login API response
  const login = (newToken: string, newUser: User) => {
    // Persist to localStorage so the session survives page refreshes
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));

    setToken(newToken);
    setUser(newUser);

    navigate("/dashboard");
  };

  // Wipes all auth state and sends the user to the login page
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setToken(null);
    setUser(null);

    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Consumer hook ─────────────────────────────────────────────────────────────
// Throw a useful error if a component forgets to wrap with AuthProvider.
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}