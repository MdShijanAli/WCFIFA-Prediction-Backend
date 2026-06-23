// backend/src/controllers/match.controller.ts
// Replace your existing file with this version.
// Key changes:
//   • getMatches now groups by round and returns richer data
//   • getUpcomingMatches is a dedicated lightweight endpoint
//   • updateMatchResult unchanged (kept for admin use)

import { Request, Response } from "express";
import { ROUND_POINTS } from "../config";
import { prisma } from "../lib/prisma";

// ─── GET /api/matches ─────────────────────────────────────────────────────────
// Query params:
//   round   – ROUND_OF_32 | ROUND_OF_16 | ROUND_OF_8 | QUARTER_FINAL | SEMI_FINAL | FINAL
//   status  – SCHEDULED | LIVE | COMPLETED | CANCELLED
//   grouped – "true" → returns { [round]: Match[] } shape instead of flat array

export const getMatches = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { round, status, grouped } = req.query;
    const where: Record<string, unknown> = {};
    if (round) where.round = round as string;
    if (status) where.status = status as string;

    const matches = await prisma.match.findMany({
      where,
      include: {
        homeTeam: true,
        awayTeam: true,
      },
      orderBy: [{ scheduledAt: "asc" }, { matchNumber: "asc" }],
    });

    if (grouped === "true") {
      const byRound: Record<string, typeof matches> = {};
      for (const m of matches) {
        if (!byRound[m.round]) byRound[m.round] = [];
        byRound[m.round].push(m);
      }
      res.json({ matches: byRound });
      return;
    }

    res.json({ matches });
  } catch (error) {
    console.error("getMatches error:", error);
    res.status(500).json({ message: "Failed to fetch matches" });
  }
};

// ─── GET /api/matches/upcoming ────────────────────────────────────────────────
// Returns next N scheduled + any live matches — ideal for homepage widget.
// Query params:
//   limit – default 10

export const getUpcomingMatches = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const limit = Math.min(
      parseInt((req.query.limit as string) || "10", 10),
      50,
    );

    const [live, upcoming] = await Promise.all([
      prisma.match.findMany({
        where: { status: "LIVE" },
        include: { homeTeam: true, awayTeam: true },
        orderBy: { scheduledAt: "asc" },
      }),
      prisma.match.findMany({
        where: {
          status: "SCHEDULED",
          scheduledAt: { gte: new Date() },
        },
        include: { homeTeam: true, awayTeam: true },
        orderBy: { scheduledAt: "asc" },
        take: 5,
      }),
    ]);

    // Merge: live first, then upcoming, capped at limit
    const matches = [...live, ...upcoming].slice(0, limit);

    res.json({ matches });
  } catch (error) {
    console.error("getUpcomingMatches error:", error);
    res.status(500).json({ message: "Failed to fetch upcoming matches" });
  }
};

// ─── GET /api/matches/:id ─────────────────────────────────────────────────────

export const getMatch = async (req: Request, res: Response): Promise<void> => {
  try {
    const match = await prisma.match.findUnique({
      where: { id: req.params.id },
      include: { homeTeam: true, awayTeam: true },
    });

    if (!match) {
      res.status(404).json({ message: "Match not found" });
      return;
    }

    res.json({ match });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch match" });
  }
};

// ─── PUT /api/matches/:id/result — Admin only ────────────────────────────────

// export const updateMatchResult = async (
//   req: Request,
//   res: Response,
// ): Promise<void> => {
//   try {
//     const { homeScore, awayScore, winnerId, status } = req.body;

//     const match = await prisma.match.update({
//       where: { id: req.params.id },
//       data: { homeScore, awayScore, winnerId, status },
//     });

//     if (status === "COMPLETED" && winnerId) {
//       const predictions = await prisma.prediction.findMany({
//         where: { matchId: match.id },
//       });

//       const points = ROUND_POINTS[match.round] || 0;

//       for (const prediction of predictions) {
//         const isCorrect = prediction.predictedWinnerId === winnerId;
//         const pointsEarned = isCorrect ? points : 0;

//         await prisma.prediction.update({
//           where: { id: prediction.id },
//           data: { isCorrect, pointsEarned },
//         });

//         if (isCorrect) {
//           const roundField = getRoundField(match.round);
//           await prisma.leaderboardEntry.update({
//             where: { userId: prediction.userId },
//             data: {
//               totalPoints: { increment: pointsEarned },
//               [roundField]: { increment: pointsEarned },
//             },
//           });
//         }
//       }

//       await recalculateRanks();
//     }

//     res.json({ match, message: "Match updated and points calculated" });
//   } catch (error) {
//     console.error("Update match error:", error);
//     res.status(500).json({ message: "Failed to update match" });
//   }
// };

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getRoundField = (round: string): string => {
  const map: Record<string, string> = {
    ROUND_OF_32: "r32Points",
    ROUND_OF_16: "r16Points",
    ROUND_OF_8: "r8Points",
    QUARTER_FINAL: "qfPoints",
    SEMI_FINAL: "sfPoints",
    FINAL: "finalPoints",
  };
  return map[round] || "r32Points";
};

const recalculateRanks = async (): Promise<void> => {
  const entries = await prisma.leaderboardEntry.findMany({
    orderBy: { totalPoints: "desc" },
  });

  await Promise.all(
    entries.map((entry, index) =>
      prisma.leaderboardEntry.update({
        where: { id: entry.id },
        data: { rank: index + 1 },
      }),
    ),
  );
};

// In updateMatchResult, replace the prediction loop with:
import {
  scoreMatchPredictions,
  recalculateLeaderboardRanks,
} from "../services/scoring.service";

export const updateMatchResult = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { homeScore, awayScore, winnerId, status } = req.body;

    const match = await prisma.match.update({
      where: { id: req.params.id },
      data: { homeScore, awayScore, winnerId, status },
    });

    if (status === "COMPLETED" && winnerId) {
      await scoreMatchPredictions(match.id, winnerId, match.round);
      await recalculateLeaderboardRanks();
    }

    res.json({ match, message: "Match updated and points calculated" });
  } catch (error) {
    console.error("Update match error:", error);
    res.status(500).json({ message: "Failed to update match" });
  }
};
