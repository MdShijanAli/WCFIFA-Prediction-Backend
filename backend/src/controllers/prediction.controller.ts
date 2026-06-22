import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const submitPrediction = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { matchId, predictedWinnerId } = req.body;

    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) {
      res.status(404).json({ message: "Match not found" });
      return;
    }

    if (match.status !== "SCHEDULED") {
      res.status(400).json({ message: "Predictions closed for this match" });
      return;
    }

    if (new Date() >= match.scheduledAt) {
      res.status(400).json({ message: "Match has already started" });
      return;
    }

    // Verify the predicted winner is one of the teams
    if (
      predictedWinnerId !== match.homeTeamId &&
      predictedWinnerId !== match.awayTeamId
    ) {
      res.status(400).json({ message: "Invalid team selection" });
      return;
    }

    const prediction = await prisma.prediction.upsert({
      where: { userId_matchId: { userId, matchId } },
      create: { userId, matchId, predictedWinnerId },
      update: { predictedWinnerId },
    });

    res.json({ prediction, message: "Prediction saved" });
  } catch (error) {
    console.error("Submit prediction error:", error);
    res.status(500).json({ message: "Failed to save prediction" });
  }
};

export const getUserPredictions = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { round } = req.query;

    const predictions = await prisma.prediction.findMany({
      where: {
        userId,
        ...(round ? { match: { round: round as any } } : {}),
      },
      include: {
        match: {
          include: { homeTeam: true, awayTeam: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ predictions });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch predictions" });
  }
};

export const submitBulkPredictions = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { predictions } = req.body as {
      predictions: Array<{ matchId: string; predictedWinnerId: string }>;
    };

    const results = [];
    const errors = [];

    for (const pred of predictions) {
      try {
        const match = await prisma.match.findUnique({
          where: { id: pred.matchId },
        });
        if (
          !match ||
          match.status !== "SCHEDULED" ||
          new Date() >= match.scheduledAt
        ) {
          errors.push({
            matchId: pred.matchId,
            error: "Match not available for prediction",
          });
          continue;
        }

        if (
          pred.predictedWinnerId !== match.homeTeamId &&
          pred.predictedWinnerId !== match.awayTeamId
        ) {
          errors.push({ matchId: pred.matchId, error: "Invalid team" });
          continue;
        }

        const result = await prisma.prediction.upsert({
          where: { userId_matchId: { userId, matchId: pred.matchId } },
          create: {
            userId,
            matchId: pred.matchId,
            predictedWinnerId: pred.predictedWinnerId,
          },
          update: { predictedWinnerId: pred.predictedWinnerId },
        });
        results.push(result);
      } catch (err) {
        errors.push({ matchId: pred.matchId, error: "Failed to save" });
      }
    }

    res.json({
      saved: results.length,
      errors,
      message: `${results.length} predictions saved`,
    });
  } catch (error) {
    console.error("Bulk prediction error:", error);
    res.status(500).json({ message: "Failed to save predictions" });
  }
};
