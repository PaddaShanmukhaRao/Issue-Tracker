// ─── auth.routes.ts ───────────────────────────────────────────────────────────
// Handles user registration and login.
//
// POST /api/auth/register — create a new account, return a JWT
// POST /api/auth/login    — verify credentials, return a JWT
//
// Security notes:
//   - Passwords are hashed with bcrypt (cost factor 12) before storage.
//   - We NEVER store plain-text passwords.
//   - JWTs expire after 7 days.
//   - We send the same error for "email not found" and "wrong password" to
//     prevent user enumeration attacks.
// ─────────────────────────────────────────────────────────────────────────────

import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db/database.js";
import { validate } from "../middleware/validate.middleware.js";
import { RegisterSchema, LoginSchema } from "../validators/schemas.js";
import { UserRow, SafeUser } from "../types.js";

const router = Router();

// ── POST /api/auth/register ───────────────────────────────────────────────────
router.post(
  "/register",
  validate(RegisterSchema), // Validates email format + password length
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      // ── Check for existing account ────────────────────────────────────
      const existing = await pool.query<UserRow>(
        "SELECT user_id FROM users WHERE email = $1",
        [email]
      );

      if (existing.rows.length > 0) {
        res.status(409).json({ message: "An account with this email already exists." });
        return;
      }

      // ── Hash the password ─────────────────────────────────────────────
      // bcrypt.hash is async and computationally expensive by design —
      // this makes brute-forcing a stolen hash database impractical.
      // Salt rounds = 12 is a good balance of security vs speed (~300ms on modern hardware).
      const hashedPassword = await bcrypt.hash(password, 12);

      // ── Insert new user ───────────────────────────────────────────────
      const result = await pool.query<UserRow>(
        `INSERT INTO users (email, password)
         VALUES ($1, $2)
         RETURNING user_id, email, created_at`,
        [email, hashedPassword]
      );

      const newUser = result.rows[0];

      // ── Sign a JWT ────────────────────────────────────────────────────
      // The payload contains just enough info for the middleware to identify
      // the user without hitting the database on every request.
      const token = jwt.sign(
        { userId: newUser.user_id, email: newUser.email },
        process.env.JWT_SECRET as string,
        { expiresIn: "7d" }
      );

      // ── Respond ───────────────────────────────────────────────────────
      res.status(201).json({
        message: "Account created successfully.",
        token,
        user: {
          user_id: newUser.user_id,
          email: newUser.email,
          created_at: newUser.created_at,
        } as SafeUser,
      });
    } catch (err) {
      console.error("Register error:", err);
      res.status(500).json({ message: "Internal server error." });
    }
  }
);

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post(
  "/login",
  validate(LoginSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      // ── Look up the user by email ─────────────────────────────────────
      const result = await pool.query<UserRow>(
        "SELECT * FROM users WHERE email = $1",
        [email]
      );

      const user = result.rows[0];

      // ── Compare password against stored hash ──────────────────────────
      // We intentionally use the same error message for both "not found" and
      // "wrong password" to prevent an attacker from discovering valid emails.
      const isValidPassword =
        user && (await bcrypt.compare(password, user.password));

      if (!user || !isValidPassword) {
        res.status(401).json({ message: "Invalid email or password." });
        return;
      }

      // ── Issue a fresh JWT ─────────────────────────────────────────────
      const token = jwt.sign(
        { userId: user.user_id, email: user.email },
        process.env.JWT_SECRET as string,
        { expiresIn: "7d" }
      );

      res.status(200).json({
        message: "Login successful.",
        token,
        user: {
          user_id: user.user_id,
          email: user.email,
          created_at: user.created_at,
        } as SafeUser,
      });
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ message: "Internal server error." });
    }
  }
);

export default router;