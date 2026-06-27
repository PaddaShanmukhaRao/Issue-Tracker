// ─── validators.ts ────────────────────────────────────────────────────────────
// Zod schemas that validate incoming request bodies before they touch the DB.
// Zod gives us runtime type safety: if the client sends garbage, we reject it
// with a clear 400 error instead of letting bad data hit PostgreSQL.
// ─────────────────────────────────────────────────────────────────────────────

import { z } from "zod";

// ── Auth ──────────────────────────────────────────────────────────────────────

export const RegisterSchema = z.object({
  // Email must be a valid email format; we trim whitespace and lowercase it.
  email: z.string().email("Invalid email format").toLowerCase().trim(),

  // Password must be at least 6 characters (matching your DB schema note).
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const LoginSchema = z.object({
  email: z.string().email("Invalid email format").toLowerCase().trim(),
  password: z.string().min(1, "Password is required"),
});

// ── Issues ────────────────────────────────────────────────────────────────────

export const CreateIssueSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(255, "Title must be under 255 characters")
    .trim(),

  description: z.string().optional(),

  // Only accept the three valid priority values.
  priority: z.enum(["low", "medium", "high"]).default("medium"),
});

export const UpdateIssueSchema = z.object({
  title: z.string().min(1).max(255).trim().optional(),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  // Status is the main field the Kanban drag-and-drop updates.
  status: z.enum(["todo", "in_progress", "done"]).optional(),
});

// ── Exported inferred types ───────────────────────────────────────────────────
// TypeScript infers these from the Zod schemas, so you only define the shape once.
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type CreateIssueInput = z.infer<typeof CreateIssueSchema>;
export type UpdateIssueInput = z.infer<typeof UpdateIssueSchema>;