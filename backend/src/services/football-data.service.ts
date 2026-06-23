// backend/src/services/football-data.service.ts

import { MatchStatus, Round } from "../generated/prisma/enums";
import { config } from "../config";
import { prisma } from "../lib/prisma";
import {
  scoreMatchPredictions,
  recalculateLeaderboardRanks,
  ScoringResult,
} from "./scoring.service";

const FOOTBALL_DATA_API = "https://api.football-data.org/v4";
const API_KEY = config.apiToken || "";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FDTeam {
  id: number;
  name: string | null;
  shortName: string | null;
  tla: string | null;
  crest: string | null;
}

interface FDScore {
  winner: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null;
  duration: string;
  fullTime: { home: number | null; away: number | null };
  halfTime: { home: number | null; away: number | null };
}

interface FDMatch {
  id: number;
  utcDate: string;
  status:
    | "SCHEDULED"
    | "TIMED"
    | "IN_PLAY"
    | "PAUSED"
    | "FINISHED"
    | "CANCELLED"
    | "POSTPONED"
    | "SUSPENDED"
    | "AWARDED";
  matchday: number | null;
  stage: string;
  group: string | null;
  homeTeam: FDTeam;
  awayTeam: FDTeam;
  score: FDScore;
  venue: string | null;
}

interface FDMatchesResponse {
  count: number;
  filters: Record<string, unknown>;
  matches: FDMatch[];
}

// ─── Mappings ─────────────────────────────────────────────────────────────────

const STAGE_TO_ROUND: Record<string, Round> = {
  ROUND_OF_32: Round.ROUND_OF_32,
  GROUP_STAGE: Round.ROUND_OF_32,
  ROUND_OF_16: Round.ROUND_OF_16,
  LAST_16: Round.ROUND_OF_16,
  ROUND_OF_8: Round.ROUND_OF_8,
  QUARTER_FINALS: Round.QUARTER_FINAL,
  QUARTER_FINAL: Round.QUARTER_FINAL,
  SEMI_FINALS: Round.SEMI_FINAL,
  SEMI_FINAL: Round.SEMI_FINAL,
  FINAL: Round.FINAL,
  THIRD_PLACE: Round.SEMI_FINAL,
};

const STATUS_MAP: Record<string, MatchStatus> = {
  SCHEDULED: MatchStatus.SCHEDULED,
  TIMED: MatchStatus.SCHEDULED,
  IN_PLAY: MatchStatus.LIVE,
  PAUSED: MatchStatus.LIVE,
  FINISHED: MatchStatus.COMPLETED,
  AWARDED: MatchStatus.COMPLETED,
  CANCELLED: MatchStatus.CANCELLED,
  POSTPONED: MatchStatus.CANCELLED,
  SUSPENDED: MatchStatus.CANCELLED,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fetchFromAPI<T>(
  endpoint: string,
  params?: Record<string, string>,
): Promise<T> {
  if (!API_KEY) {
    throw new Error("FOOTBALL_DATA_API_KEY is not set");
  }

  const url = new URL(`${FOOTBALL_DATA_API}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const res = await fetch(url.toString(), {
    headers: { "X-Auth-Token": API_KEY, "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`football-data.org ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

type TeamRecord = {
  id: string;
  name: string;
  code: string;
  flagUrl: string | null;
};

async function upsertTeam(fdTeam: FDTeam): Promise<TeamRecord | null> {
  if (!fdTeam.name || fdTeam.name.trim() === "") return null;

  const rawCode =
    fdTeam.tla || fdTeam.shortName?.slice(0, 3) || `T${fdTeam.id}`;
  const code = rawCode.toUpperCase().replace(/\s+/g, "").slice(0, 10);
  const name = fdTeam.name.trim();

  const existing = await prisma.team.findFirst({
    where: { OR: [{ code }, { name }] },
  });

  if (existing) {
    return prisma.team.update({
      where: { id: existing.id },
      data: { name, flagUrl: fdTeam.crest || null },
    });
  }

  return prisma.team.create({
    data: { name, code, flagUrl: fdTeam.crest || null },
  });
}

// ─── Core result ──────────────────────────────────────────────────────────────

export interface SyncResult {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
  scored: ScoringResult[]; // ← NEW: prediction scoring results
}

// ─── Main sync ────────────────────────────────────────────────────────────────

export async function syncWorldCupMatches(
  options: { includeGroupStage?: boolean; season?: string } = {},
): Promise<SyncResult> {
  const { includeGroupStage = true, season = "2026" } = options;

  const result: SyncResult = {
    total: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
    scored: [],
  };

  const data = await fetchFromAPI<FDMatchesResponse>(
    "/competitions/WC/matches",
    { season },
  );

  const knockoutStages = new Set([
    "ROUND_OF_32",
    "ROUND_OF_16",
    "LAST_16",
    "ROUND_OF_8",
    "QUARTER_FINALS",
    "QUARTER_FINAL",
    "SEMI_FINALS",
    "SEMI_FINAL",
    "FINAL",
    "THIRD_PLACE",
  ]);

  const matchesToProcess = includeGroupStage
    ? data.matches
    : data.matches.filter((m) => knockoutStages.has(m.stage));

  result.total = matchesToProcess.length;

  // Track matches that need prediction scoring after the sync loop
  const toScore: Array<{ matchId: string; winnerId: string; round: string }> =
    [];

  for (const fdMatch of matchesToProcess) {
    try {
      const round = STAGE_TO_ROUND[fdMatch.stage];
      if (!round) {
        result.skipped++;
        continue;
      }

      const newStatus = STATUS_MAP[fdMatch.status] ?? MatchStatus.SCHEDULED;

      const [homeTeam, awayTeam] = await Promise.all([
        upsertTeam(fdMatch.homeTeam),
        upsertTeam(fdMatch.awayTeam),
      ]);

      if (!homeTeam || !awayTeam) {
        result.skipped++;
        continue;
      }

      let winnerId: string | null = null;
      if (fdMatch.score.winner === "HOME_TEAM") winnerId = homeTeam.id;
      else if (fdMatch.score.winner === "AWAY_TEAM") winnerId = awayTeam.id;
      // DRAW → winnerId stays null (no winner to score against)

      const externalId = `fd-${fdMatch.id}`;

      const existing = await prisma.match.findUnique({ where: { externalId } });

      // Detect transition to COMPLETED so we can score predictions
      const wasCompleted = existing?.status === MatchStatus.COMPLETED;
      const isNowCompleted = newStatus === MatchStatus.COMPLETED;
      const winnerChanged = existing?.winnerId !== winnerId;

      // Replace the "detect transition" block and toScore push with this:

      const matchData = {
        round,
        matchNumber: fdMatch.matchday ?? fdMatch.id,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        homeScore: fdMatch.score.fullTime.home ?? null,
        awayScore: fdMatch.score.fullTime.away ?? null,
        winnerId,
        status: newStatus,
        scheduledAt: new Date(fdMatch.utcDate),
        venue: fdMatch.venue ?? null,
        externalId,
      };

      let savedMatchId: string;

      if (existing) {
        await prisma.match.update({
          where: { id: existing.id },
          data: matchData,
        });
        savedMatchId = existing.id;
        result.updated++;
      } else {
        const created = await prisma.match.create({ data: matchData });
        savedMatchId = created.id;
        result.created++;
      }

      // Queue for scoring if match is COMPLETED with a winner AND
      // there are any unscored predictions (isCorrect === null).
      // This handles: first sync after completion, re-runs, winner corrections.
      if (winnerId && newStatus === MatchStatus.COMPLETED) {
        const unscoredCount = await prisma.prediction.count({
          where: {
            matchId: savedMatchId,
            OR: [
              { isCorrect: null },
              // Also re-score if winner changed (correction scenario)
              ...(existing?.winnerId && existing.winnerId !== winnerId
                ? [{ isCorrect: { not: null } }]
                : []),
            ],
          },
        });

        if (unscoredCount > 0) {
          toScore.push({ matchId: savedMatchId, winnerId, round });
        }
      }

      // Queue for scoring if:
      //   • match just became COMPLETED, OR
      //   • was already COMPLETED but winner changed (correction)
      if (winnerId && isNowCompleted && (!wasCompleted || winnerChanged)) {
        toScore.push({ matchId: savedMatchId, winnerId, round });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push(`Match fd-${fdMatch.id}: ${msg}`);
    }
  }

  // Score predictions for all newly-completed matches
  if (toScore.length > 0) {
    for (const { matchId, winnerId, round } of toScore) {
      try {
        const scoring = await scoreMatchPredictions(matchId, winnerId, round);
        result.scored.push(scoring);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        result.errors.push(`Scoring matchId=${matchId}: ${msg}`);
      }
    }

    // Recalculate ranks once after all scoring is done
    try {
      await recalculateLeaderboardRanks();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push(`Rank recalculation: ${msg}`);
    }
  }

  return result;
}

export async function syncLiveAndUpcomingMatches(): Promise<SyncResult> {
  return syncWorldCupMatches({ includeGroupStage: false });
}
