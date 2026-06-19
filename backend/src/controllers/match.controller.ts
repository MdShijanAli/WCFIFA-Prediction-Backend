import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { ROUND_POINTS } from '../config';

export const getMatches = async (req: Request, res: Response): Promise<void> => {
  try {
    const { round, status } = req.query;
    const where: any = {};
    if (round) where.round = round as string;
    if (status) where.status = status as string;

    const matches = await prisma.match.findMany({
      where,
      include: {
        homeTeam: true,
        awayTeam: true,
      },
      orderBy: [{ round: 'asc' }, { matchNumber: 'asc' }],
    });

    res.json({ matches });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch matches' });
  }
};

export const getMatch = async (req: Request, res: Response): Promise<void> => {
  try {
    const match = await prisma.match.findUnique({
      where: { id: req.params.id },
      include: { homeTeam: true, awayTeam: true },
    });

    if (!match) {
      res.status(404).json({ message: 'Match not found' });
      return;
    }

    res.json({ match });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch match' });
  }
};

export const updateMatchResult = async (req: Request, res: Response): Promise<void> => {
  try {
    const { homeScore, awayScore, winnerId, status } = req.body;

    const match = await prisma.match.update({
      where: { id: req.params.id },
      data: { homeScore, awayScore, winnerId, status },
    });

    // If completed, update predictions and leaderboard
    if (status === 'COMPLETED' && winnerId) {
      const predictions = await prisma.prediction.findMany({
        where: { matchId: match.id },
      });

      const points = ROUND_POINTS[match.round] || 0;

      for (const prediction of predictions) {
        const isCorrect = prediction.predictedWinnerId === winnerId;
        const pointsEarned = isCorrect ? points : 0;

        await prisma.prediction.update({
          where: { id: prediction.id },
          data: { isCorrect, pointsEarned },
        });

        if (isCorrect) {
          const roundField = getRoundField(match.round);
          await prisma.leaderboardEntry.update({
            where: { userId: prediction.userId },
            data: {
              totalPoints: { increment: pointsEarned },
              [roundField]: { increment: pointsEarned },
            },
          });
        }
      }

      // Recalculate ranks
      await recalculateRanks();
    }

    res.json({ match, message: 'Match updated and points calculated' });
  } catch (error) {
    console.error('Update match error:', error);
    res.status(500).json({ message: 'Failed to update match' });
  }
};

const getRoundField = (round: string): string => {
  const map: Record<string, string> = {
    ROUND_OF_32: 'r32Points',
    ROUND_OF_16: 'r16Points',
    ROUND_OF_8: 'r8Points',
    QUARTER_FINAL: 'qfPoints',
    SEMI_FINAL: 'sfPoints',
    FINAL: 'finalPoints',
  };
  return map[round] || 'r32Points';
};

const recalculateRanks = async (): Promise<void> => {
  const entries = await prisma.leaderboardEntry.findMany({
    orderBy: { totalPoints: 'desc' },
  });

  await Promise.all(
    entries.map((entry, index) =>
      prisma.leaderboardEntry.update({
        where: { id: entry.id },
        data: { rank: index + 1 },
      })
    )
  );
};
