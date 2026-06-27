// ─── issues.routes.ts ─────────────────────────────────────────────────────────
// Full CRUD for issues. Every route is protected by authenticateToken, which
// means the client must send a valid JWT in the Authorization header.
//
// All queries are scoped to req.user.userId — users can only see/edit their own
// issues. This prevents one user from accessing another user's data even if they
// guess an issue_id.
//
// Routes:
//   GET    /api/issues           — list all issues for the logged-in user
//   POST   /api/issues           — create a new issue
//   PATCH  /api/issues/:id       — update a field (used by drag-and-drop)
//   DELETE /api/issues/:id       — delete an issue
// ─────────────────────────────────────────────────────────────────────────────

import { Router, Request, Response } from "express";
import { pool } from "../db/database.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  CreateIssueSchema,
  UpdateIssueSchema,
} from "../validators/schemas.js";
import { IssueRow } from "../types.js";

const router = Router();

// All issue routes require a valid JWT — apply the middleware to the whole router.
router.use(authenticateToken);

// ── GET /api/issues ───────────────────────────────────────────────────────────
// Returns all issues belonging to the logged-in user, newest first.
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const result = await pool.query<IssueRow>(
      `SELECT * FROM issues
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Get issues error:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});

// ── POST /api/issues ──────────────────────────────────────────────────────────
// Creates a new issue for the logged-in user.
// The Zod schema sets status = 'todo' as the default, so new issues always
// start in the leftmost Kanban column.
router.post(
  "/",
  validate(CreateIssueSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const { title, description, priority } = req.body;

      const result = await pool.query<IssueRow>(
        `INSERT INTO issues (user_id, title, description, priority)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [userId, title, description ?? null, priority]
      );

      // 201 Created — return the full new row so the frontend can add it to state
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error("Create issue error:", err);
      res.status(500).json({ message: "Internal server error." });
    }
  }
);

// ── PATCH /api/issues/:id ─────────────────────────────────────────────────────
// Partial update — called by:
//   - Drag-and-drop (updates status only)
//   - Edit modal    (updates title, description, priority)
//
// We build the SET clause dynamically from whatever fields were sent,
// rather than requiring all fields every time.
router.patch(
  "/:id",
  validate(UpdateIssueSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const issueId = parseInt(req.params.id, 10);

      if (isNaN(issueId)) {
        res.status(400).json({ message: "Invalid issue ID." });
        return;
      }

      // ── Verify ownership ──────────────────────────────────────────────
      // Never trust the client to tell you who owns the record.
      const owner = await pool.query(
        "SELECT issue_id FROM issues WHERE issue_id = $1 AND user_id = $2",
        [issueId, userId]
      );

      if (owner.rows.length === 0) {
        res.status(404).json({ message: "Issue not found." });
        return;
      }

      // ── Build dynamic SET clause ──────────────────────────────────────
      // Only update the fields the client actually sent.
      // $1 is reserved for issue_id in the WHERE clause.
      const fields = req.body as Record<string, string>;
      const keys = Object.keys(fields);

      if (keys.length === 0) {
        res.status(400).json({ message: "No fields to update." });
        return;
      }

      // Produces: "title = $2, status = $3" etc.
      const setClauses = keys
        .map((key, index) => `${key} = $${index + 2}`)
        .join(", ");

      const values = keys.map((key) => fields[key]);

      const result = await pool.query<IssueRow>(
        `UPDATE issues
         SET ${setClauses}
         WHERE issue_id = $1 AND user_id = ${userId}
         RETURNING *`,
        [issueId, ...values]
      );

      res.status(200).json(result.rows[0]);
    } catch (err) {
      console.error("Update issue error:", err);
      res.status(500).json({ message: "Internal server error." });
    }
  }
);

// ── DELETE /api/issues/:id ────────────────────────────────────────────────────
// Permanently deletes an issue. Ownership is checked via the WHERE clause —
// if the issue doesn't exist OR doesn't belong to this user, nothing is deleted.
router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const issueId = parseInt(req.params.id, 10);

    if (isNaN(issueId)) {
      res.status(400).json({ message: "Invalid issue ID." });
      return;
    }

    const result = await pool.query(
      `DELETE FROM issues
       WHERE issue_id = $1 AND user_id = $2
       RETURNING issue_id`,
      [issueId, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: "Issue not found." });
      return;
    }

    res.status(200).json({ message: "Issue deleted successfully." });
  } catch (err) {
    console.error("Delete issue error:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});

export default router;