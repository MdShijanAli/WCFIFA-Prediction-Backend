// backend/src/controllers/sync.controller.ts

import { Request, Response } from "express";
import {
  syncLiveAndUpcomingMatches,
  syncWorldCupMatches,
} from "../services/football-data.service";

/**
 * POST /api/admin/sync/matches
 * Full sync — all matches for the given season, with prediction scoring.
 * Body (optional): { includeGroupStage?: boolean, season?: string }
 */
export const syncMatches = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { includeGroupStage = true, season = "2026" } = req.body ?? {};

    console.log(
      `[sync] Starting full WC match sync (season=${season}, includeGroupStage=${includeGroupStage})`,
    );

    const result = await syncWorldCupMatches({ includeGroupStage, season });

    const totalScored = result.scored.reduce(
      (sum, s) => sum + s.predictionsScored,
      0,
    );
    const totalCorrect = result.scored.reduce(
      (sum, s) => sum + s.correctPredictions,
      0,
    );
    const totalPoints = result.scored.reduce(
      (sum, s) => sum + s.pointsAwarded,
      0,
    );

    res.json({
      message: "Sync complete",
      matches: {
        total: result.total,
        created: result.created,
        updated: result.updated,
        skipped: result.skipped,
      },
      predictions: {
        matchesScored: result.scored.length,
        predictionsScored: totalScored,
        correctPredictions: totalCorrect,
        totalPointsAwarded: totalPoints,
        detail: result.scored,
      },
      errors: result.errors,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[sync] Full sync failed:", msg);
    res.status(500).json({ message: "Sync failed", error: msg });
  }
};

/**
 * POST /api/admin/sync/live
 * Quick sync — updates live scores + scores predictions for matches
 * that just finished. Call every few minutes during match windows.
 */
export const syncLive = async (_req: Request, res: Response): Promise<void> => {
  try {
    console.log("[sync] Starting live/upcoming sync");

    const result = await syncLiveAndUpcomingMatches();

    res.json({
      message: "Live sync complete",
      matches: {
        total: result.total,
        created: result.created,
        updated: result.updated,
        skipped: result.skipped,
      },
      predictions: {
        matchesScored: result.scored.length,
        predictionsScored: result.scored.reduce(
          (s, r) => s + r.predictionsScored,
          0,
        ),
        totalPointsAwarded: result.scored.reduce(
          (s, r) => s + r.pointsAwarded,
          0,
        ),
      },
      errors: result.errors,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[sync] Live sync failed:", msg);
    res.status(500).json({ message: "Live sync failed", error: msg });
  }
};
