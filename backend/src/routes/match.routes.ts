// backend/src/routes/match.routes.ts
// Replace your existing file with this version.

import { Router } from "express";
import { authenticate } from "../middleware/auth";
import {
  getMatches,
  getMatch,
  getUpcomingMatches,
  updateMatchResult,
} from "../controllers/match.controller";

const router = Router();

router.get("/", getMatches); // GET /api/matches?round=ROUND_OF_16&grouped=true
router.get("/upcoming", getUpcomingMatches); // GET /api/matches/upcoming?limit=10
router.get("/:id", getMatch); // GET /api/matches/:id
router.put("/:id/result", authenticate, updateMatchResult); // Admin only

export default router;
