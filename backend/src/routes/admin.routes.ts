// backend/src/routes/admin.routes.ts
// All admin-only routes — protect with a strong secret header in production.

import { Router, Request, Response, NextFunction } from "express";
import { syncMatches, syncLive } from "../controllers/sync.controller";

const router = Router();

// ─── Simple admin guard ───────────────────────────────────────────────────────
// In production set ADMIN_SECRET in your .env and pass it as:
//   Authorization: Bearer <ADMIN_SECRET>
// OR use a proper role-based auth middleware.

const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const adminSecret = process.env.ADMIN_SECRET;

  if (!adminSecret) {
    // No secret configured → allow only in development
    if (process.env.NODE_ENV === "production") {
      res.status(403).json({ message: "Admin access not configured" });
      return;
    }
    next();
    return;
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (token !== adminSecret) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }

  next();
};

// ─── Sync routes ─────────────────────────────────────────────────────────────

// Full sync — run once before competition starts or when you add a new round
router.post("/sync/matches", requireAdmin, syncMatches);

// Live sync — run every 5 min during match windows
router.post("/sync/live", requireAdmin, syncLive);

export default router;
