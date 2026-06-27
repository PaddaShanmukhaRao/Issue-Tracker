// ─── server.ts ────────────────────────────────────────────────────────────────
// Entry point for the backend. Responsible for:
//   1. Wiring up Express middleware (CORS, JSON parsing, etc.)
//   2. Mounting route files under /api/*
//   3. Connecting to PostgreSQL and running the schema migration
//   4. Starting the HTTP listener
// ─────────────────────────────────────────────────────────────────────────────

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initializeDatabase } from "./db/database.js";
import authRoutes from "./routes/auth.routes.js";
import issueRoutes from "./routes/issues.routes.js";

// Load environment variables from .env before anything else runs.
dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3000;

// ── Global Middleware ─────────────────────────────────────────────────────────

// CORS: Allows the React frontend (running on a different port in dev) to call
// the API. In production you'd lock this down to your real domain.
app.use(
  cors({
    origin: process.env.NODE_ENV === "production"
      ? process.env.FRONTEND_URL // set this in your production .env
      : "http://localhost:5173",  // Vite's default dev port
    credentials: true,
  })
);

// Parse incoming JSON request bodies automatically.
// Without this, req.body would be undefined.
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────

// All routes are prefixed with /api so the frontend's proxy can forward them cleanly.
app.use("/api/auth", authRoutes);
app.use("/api/issues", issueRoutes);

// ── Health Check ──────────────────────────────────────────────────────────────
// A simple endpoint to confirm the server is alive (used by load balancers, etc.)
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── 404 Fallback ──────────────────────────────────────────────────────────────
// Catches any request that didn't match a route above.
app.use((_req, res) => {
  res.status(404).json({ message: "Route not found." });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
// Express recognises 4-argument functions as error handlers.
// Any call to next(err) lands here.
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ message: "An unexpected error occurred." });
  }
);

// ── Bootstrap ─────────────────────────────────────────────────────────────────
// Run the DB migration first, then start listening for requests.
// If the DB connection fails, we crash intentionally — a server with no DB
// is useless and silence would hide the problem.
async function bootstrap() {
  try {
    await initializeDatabase();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV ?? "development"}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1); // Non-zero exit code signals failure to the OS / Docker
  }
}

bootstrap();