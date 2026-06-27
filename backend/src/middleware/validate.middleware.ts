// ─── validate.middleware.ts ───────────────────────────────────────────────────
// A reusable factory that turns any Zod schema into Express middleware.
//
// Instead of calling schema.parse() inside every route handler, we use this
// middleware so routes stay focused on business logic only.
//
// Usage:
//   router.post("/register", validate(RegisterSchema), authController.register)
//
// If validation fails, Zod throws a ZodError. We catch it and return a
// structured 400 response that lists exactly which fields failed and why.
// ─────────────────────────────────────────────────────────────────────────────

import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // parse() validates AND transforms the data (e.g. toLowerCase on email).
      // The result overwrites req.body so the route handler gets clean data.
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        // Format Zod's errors into a user-friendly array of { field, message }
        const errors = err.errors.map((e) => ({
          field: e.path.join("."), // e.g. "email" or "priority"
          message: e.message,
        }));

        res.status(400).json({
          message: "Validation failed",
          errors,
        });
        return;
      }

      // Unexpected error — pass it to Express's global error handler
      next(err);
    }
  };
}
