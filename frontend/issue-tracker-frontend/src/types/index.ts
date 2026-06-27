// ─── types/index.ts ───────────────────────────────────────────────────────────
// Shared TypeScript interfaces used across the frontend.
// Keeping them in one file means a single import and zero duplicate definitions.
// ─────────────────────────────────────────────────────────────────────────────

export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "todo" | "in_progress" | "done";

// ── Issue ─────────────────────────────────────────────────────────────────────
// Mirrors the shape of what the backend returns from GET /api/issues
export interface Issue {
  issue_id: number;
  user_id: number;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  created_at: string; // ISO date string from JSON
  updated_at: string;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export interface User {
  user_id: number;
  email: string;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

// ── API response wrappers ─────────────────────────────────────────────────────
export interface ApiError {
  message: string;
  errors?: { field: string; message: string }[];
}

// ── Kanban column definition ──────────────────────────────────────────────────
export interface KanbanColumn {
  id: TaskStatus;
  title: string;
  color: string; // Tailwind colour class for the column header dot
}

// ── Form input types ──────────────────────────────────────────────────────────
export interface CreateIssueFormData {
  title: string;
  description: string;
  priority: TaskPriority;
}