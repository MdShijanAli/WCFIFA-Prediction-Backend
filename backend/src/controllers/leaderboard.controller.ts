import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const getLeaderboard = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const page = parseInt((req.query.page as string) || "1");
    const limit = parseInt((req.query.limit as string) || "20");
    const skip = (page - 1) * limit;

    const [entries, total] = await Promise.all([
      prisma.leaderboardEntry.findMany({
        skip,
        take: limit,
        orderBy: { totalPoints: "desc" },
        include: {
          user: { select: { name: true, gender: true } },
        },
      }),
      prisma.leaderboardEntry.count(),
    ]);

    res.json({
      leaderboard: entries,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch leaderboard" });
  }
};

export const getMyRank = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;

    const entry = await prisma.leaderboardEntry.findUnique({
      where: { userId },
      include: { user: { select: { name: true } } },
    });

    if (!entry) {
      res.status(404).json({ message: "Leaderboard entry not found" });
      return;
    }

    const total = await prisma.leaderboardEntry.count();

    res.json({ entry, total });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch rank" });
  }
};

export const getTopPlayers = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const top = await prisma.leaderboardEntry.findMany({
      take: 10,
      orderBy: { totalPoints: "desc" },
      include: {
        user: { select: { name: true } },
      },
    });

    res.json({ top });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch top players" });
  }
};
