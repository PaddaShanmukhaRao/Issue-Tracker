// ─── types.ts ─────────────────────────────────────────────────────────────────
// Central type definitions shared across the backend.
// Keeping types in one place avoids import loops and makes refactoring easier.
// ─────────────────────────────────────────────────────────────────────────────

// ── Issue enums ───────────────────────────────────────────────────────────────
// These mirror the PostgreSQL enum values exactly.
export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "todo" | "in_progress" | "done";

// ── Database row shapes ───────────────────────────────────────────────────────
// These describe exactly what pg returns from a SELECT query.
export interface UserRow {
  user_id: number;
  email: string;
  password: string; // bcrypt hash — never send this to the client
  created_at: Date;
}

export interface IssueRow {
  issue_id: number;
  user_id: number;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  created_at: Date;
  updated_at: Date;
}

// ── Safe user shape (sent to clients) ────────────────────────────────────────
// The password hash is stripped before this reaches any API response.
export interface SafeUser {
  user_id: number;
  email: string;
  created_at: Date;
}

// ── JWT payload ───────────────────────────────────────────────────────────────
// What we encode inside the signed token. Keep it small.
export interface JwtPayload {
  userId: number;
  email: string;
}

// ── Express augmentation ──────────────────────────────────────────────────────
// When our auth middleware verifies a JWT, it attaches the decoded payload to
// req.user so downstream route handlers can read who made the request.
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}