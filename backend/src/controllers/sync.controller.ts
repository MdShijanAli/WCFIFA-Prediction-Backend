// backend/src/controllers/sync.controller.ts
// Admin-triggered endpoints to pull live data from football-data.org

import { Request, Response } from "express";
import {
  syncLiveAndUpcomingMatches,
  syncWorldCupMatches,
} from "../services/football-data.service";

/**
 * POST /api/admin/sync/matches
 * Full sync — all knockout-round matches for the given season.
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

    res.json({
      message: "Sync complete",
      ...result,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[sync] Full sync failed:", msg);
    res.status(500).json({ message: "Sync failed", error: msg });
  }
};

/**
 * POST /api/admin/sync/live
 * Quick sync — updates statuses and scores for all ongoing/upcoming matches.
 * Designed to be called every few minutes during a match window.
 */
export const syncLive = async (_req: Request, res: Response): Promise<void> => {
  try {
    console.log("[sync] Starting live/upcoming sync");
    const result = await syncLiveAndUpcomingMatches();

    res.json({
      message: "Live sync complete",
      ...result,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[sync] Live sync failed:", msg);
    res.status(500).json({ message: "Live sync failed", error: msg });
  }
};
