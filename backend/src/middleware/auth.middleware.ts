// ─── auth.middleware.ts ───────────────────────────────────────────────────────
// Express middleware that protects routes requiring authentication.
//
// How it works:
//   1. The client sends an Authorization header: "Bearer <token>"
//   2. We extract and verify the token using our JWT_SECRET
//   3. If valid, we attach the decoded payload to req.user and call next()
//   4. If invalid/missing, we immediately respond with 401 Unauthorized
//
// Usage: add `authenticateToken` to any route that needs a logged-in user.
// e.g.  router.get("/issues", authenticateToken, issueController.getAll)
// ─────────────────────────────────────────────────────────────────────────────

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JwtPayload } from "../types.js";

export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // The Authorization header looks like: "Bearer eyJhbGci..."
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // grab only the token part

  if (!token) {
    // No token provided — stop here and tell the client to log in
    res.status(401).json({ message: "Access denied. No token provided." });
    return;
  }

  try {
    // jwt.verify will throw if the token is expired, tampered, or signed with
    // the wrong secret. If it passes, we get back the original payload object.
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;

    // Attach the decoded user info to the request object.
    // Downstream handlers can now read req.user.userId without re-querying the DB.
    req.user = decoded;

    // Hand control to the next middleware or route handler.
    next();
  } catch (err) {
    // Token is invalid or expired
    res.status(403).json({ message: "Invalid or expired token." });
  }
}