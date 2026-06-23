// backend/src/services/scoring.service.ts
// Shared logic: score predictions + update leaderboard for a completed match.
// Called by both the sync service and the admin updateMatchResult controller.

import { prisma } from "../lib/prisma";
import { ROUND_POINTS } from "../config";

const ROUND_FIELD_MAP: Record<string, string> = {
  ROUND_OF_32: "r32Points",
  ROUND_OF_16: "r16Points",
  ROUND_OF_8: "r8Points",
  QUARTER_FINAL: "qfPoints",
  SEMI_FINAL: "sfPoints",
  FINAL: "finalPoints",
};

export interface ScoringResult {
  matchId: string;
  predictionsScored: number;
  correctPredictions: number;
  pointsAwarded: number;
}

/**
 * Score all predictions for a completed match and update leaderboard entries.
 * Safe to call multiple times — re-scores idempotently.
 */
export async function scoreMatchPredictions(
  matchId: string,
  winnerId: string,
  round: string,
): Promise<ScoringResult> {
  const points = ROUND_POINTS[round] ?? 0;
  const roundField = ROUND_FIELD_MAP[round] ?? "r32Points";

  const predictions = await prisma.prediction.findMany({
    where: { matchId },
  });

  let correctCount = 0;
  let totalPointsAwarded = 0;

  // In scoreMatchPredictions, replace the loop with:
  for (const prediction of predictions) {
    const isCorrect = prediction.predictedWinnerId === winnerId;
    const pointsEarned = isCorrect ? points : 0;

    // Always update the prediction row — handles re-scoring on winner correction
    await prisma.prediction.update({
      where: { id: prediction.id },
      data: { isCorrect, pointsEarned },
    });

    // Calculate the delta vs what was previously stored
    const previousPoints = prediction.pointsEarned ?? 0;
    const pointsDelta = pointsEarned - previousPoints;

    if (pointsDelta !== 0) {
      await prisma.leaderboardEntry.upsert({
        where: { userId: prediction.userId },
        create: {
          userId: prediction.userId,
          totalPoints: Math.max(0, pointsDelta),
          [roundField]: Math.max(0, pointsDelta),
        },
        update: {
          totalPoints: { increment: pointsDelta },
          [roundField]: { increment: pointsDelta },
        },
      });
    }

    if (isCorrect) {
      correctCount++;
      totalPointsAwarded += pointsEarned;
    }
  }

  return {
    matchId,
    predictionsScored: predictions.length,
    correctPredictions: correctCount,
    pointsAwarded: totalPointsAwarded,
  };
}

/**
 * Recalculate ranks for all leaderboard entries by total points descending.
 * Ties share the same rank.
 */
export async function recalculateLeaderboardRanks(): Promise<void> {
  const entries = await prisma.leaderboardEntry.findMany({
    orderBy: { totalPoints: "desc" },
  });

  // Handle ties: same points → same rank
  let currentRank = 1;
  await Promise.all(
    entries.map((entry, index) => {
      if (index > 0 && entry.totalPoints < entries[index - 1].totalPoints) {
        currentRank = index + 1;
      }
      return prisma.leaderboardEntry.update({
        where: { id: entry.id },
        data: { rank: currentRank },
      });
    }),
  );
}
