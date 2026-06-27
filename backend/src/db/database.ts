// ─── database.ts ─────────────────────────────────────────────────────────────
// Manages the PostgreSQL connection pool and runs the initial schema migration.
// We use a Pool (not a single Client) so Express can handle concurrent requests
// without waiting for one query to finish before starting another.
// ─────────────────────────────────────────────────────────────────────────────

import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

// Create a connection pool using the DATABASE_URL from your .env file.
// Neon (and most hosted Postgres) requires SSL, so we keep rejectUnauthorized
// false to allow self-signed certs from the provider.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// ─── Schema Migration ─────────────────────────────────────────────────────────
// This function runs once on server startup. It creates the tables if they
// don't already exist (idempotent), so you never have to manually run SQL.
// In a production app you'd use a migration tool like Flyway or node-pg-migrate,
// but for this project inline SQL keeps things self-contained.
// ─────────────────────────────────────────────────────────────────────────────

export async function initializeDatabase(): Promise<void> {
  const client = await pool.connect();

  try {
    console.log("Connecting to PostgreSQL...");

    // ── Enable UUID extension (needed for gen_random_uuid) ────────────────
    await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

    // ── Users table ───────────────────────────────────────────────────────
    // Stores registered accounts. Passwords are NEVER stored in plain text —
    // bcrypt hashes are stored instead (see auth routes).
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id   SERIAL        PRIMARY KEY,
        email     VARCHAR(255)  NOT NULL UNIQUE,
        password  VARCHAR(255)  NOT NULL,              -- bcrypt hash
        created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      );
    `);

    // ── Enum types ────────────────────────────────────────────────────────
    // PostgreSQL enums are type-safe at the DB level. We guard the CREATE
    // with a DO block so re-running the migration doesn't throw an error
    // if the type already exists.
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'done');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    // ── Issues table ──────────────────────────────────────────────────────
    // One row per issue/task. user_id is a foreign key — deleting a user
    // cascades and removes all their issues too.
    await client.query(`
      CREATE TABLE IF NOT EXISTS issues (
        issue_id    SERIAL        PRIMARY KEY,
        user_id     INTEGER       NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        title       VARCHAR(255)  NOT NULL,
        description TEXT,
        priority    task_priority NOT NULL DEFAULT 'medium',
        status      task_status   NOT NULL DEFAULT 'todo',
        created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
      );
    `);

    // ── Auto-update updated_at ────────────────────────────────────────────
    // This trigger fires on every UPDATE to the issues table and stamps the
    // current timestamp, so we never have to remember to set it manually.
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS set_updated_at ON issues;
      CREATE TRIGGER set_updated_at
        BEFORE UPDATE ON issues
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    console.log("Database schema ready");
  } catch (err) {
    console.error("Database initialisation failed:", err);
    throw err; // Bubble up so the server refuses to start with a broken DB
  } finally {
    // Always release the client back to the pool — even if an error occurred.
    client.release();
  }
}