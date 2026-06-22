// backend/src/services/football-data.service.ts
// Fetches matches from football-data.org API v4 and syncs to DB

import { MatchStatus, Round } from "../generated/prisma/enums";
import { config } from "../config";
import { prisma } from "../lib/prisma";

const FOOTBALL_DATA_API = "https://api.football-data.org/v4";
const API_KEY = config.apiToken || "";

// ─── Type definitions from football-data.org v4 ──────────────────────────────

interface FDTeam {
  id: number;
  name: string | null;
  shortName: string | null;
  tla: string | null; // 3-letter code e.g. "BRA"
  crest: string | null; // flag/crest image URL
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

// ─── Stage → Round mapping ────────────────────────────────────────────────────

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

// ─── Status mapping ───────────────────────────────────────────────────────────

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

// ─── HTTP helper ──────────────────────────────────────────────────────────────

async function fetchFromAPI<T>(
  endpoint: string,
  params?: Record<string, string>,
): Promise<T> {
  if (!API_KEY) {
    throw new Error(
      "FOOTBALL_DATA_API_KEY is not set in environment variables",
    );
  }

  const url = new URL(`${FOOTBALL_DATA_API}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const res = await fetch(url.toString(), {
    headers: {
      "X-Auth-Token": API_KEY,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`football-data.org API error ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

// ─── Upsert team helper ───────────────────────────────────────────────────────

type TeamRecord = {
  id: string;
  name: string;
  code: string;
  flagUrl: string | null;
};

/**
 * Returns null if the team is a TBD placeholder (not decided yet).
 * football-data.org returns { name: null, tla: null } for undecided knockout slots.
 */
async function upsertTeam(fdTeam: FDTeam): Promise<TeamRecord | null> {
  // Team not decided yet (e.g. "Winner Match A") — skip
  if (!fdTeam.name || fdTeam.name.trim() === "") return null;

  const rawCode =
    fdTeam.tla || fdTeam.shortName?.slice(0, 3) || `T${fdTeam.id}`;
  const code = rawCode.toUpperCase().replace(/\s+/g, "").slice(0, 10);
  const name = fdTeam.name.trim();

  const existing = await prisma.team.findFirst({
    where: {
      OR: [{ code }, { name }],
    },
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

// ─── Core sync function ───────────────────────────────────────────────────────

export interface SyncResult {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

/**
 * Fetches all WC matches from football-data.org and upserts into the DB.
 * Skips matches where either team is still TBD — re-run sync after the
 * previous round completes to pick those up automatically.
 */
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
  };

  const data = await fetchFromAPI<FDMatchesResponse>(
    "/competitions/WC/matches",
    { season },
  );

  const knockout_stages = new Set([
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
    : data.matches.filter((m) => knockout_stages.has(m.stage));

  result.total = matchesToProcess.length;

  for (const fdMatch of matchesToProcess) {
    try {
      // Skip if stage not mapped
      const round = STAGE_TO_ROUND[fdMatch.stage];
      if (!round) {
        result.skipped++;
        continue;
      }

      const status = STATUS_MAP[fdMatch.status] ?? MatchStatus.SCHEDULED;

      // Upsert teams — null means team not decided yet
      const [homeTeam, awayTeam] = await Promise.all([
        upsertTeam(fdMatch.homeTeam),
        upsertTeam(fdMatch.awayTeam),
      ]);

      // Skip TBD matches — will be synced once teams are confirmed
      if (!homeTeam || !awayTeam) {
        result.skipped++;
        continue;
      }

      // Resolve winner
      let winnerId: string | null = null;
      if (fdMatch.score.winner === "HOME_TEAM") winnerId = homeTeam.id;
      else if (fdMatch.score.winner === "AWAY_TEAM") winnerId = awayTeam.id;

      const externalId = `fd-${fdMatch.id}`;

      const existing = await prisma.match.findUnique({
        where: { externalId },
      });

      const matchData = {
        round,
        matchNumber: fdMatch.matchday ?? fdMatch.id,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        homeScore: fdMatch.score.fullTime.home ?? null,
        awayScore: fdMatch.score.fullTime.away ?? null,
        winnerId,
        status,
        scheduledAt: new Date(fdMatch.utcDate),
        venue: fdMatch.venue ?? null,
        externalId,
      };

      if (existing) {
        await prisma.match.update({
          where: { id: existing.id },
          data: matchData,
        });
        result.updated++;
      } else {
        await prisma.match.create({ data: matchData });
        result.created++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push(`Match fd-${fdMatch.id}: ${msg}`);
    }
  }

  return result;
}

/**
 * Quick sync for live/upcoming matches — call every few minutes during match windows.
 */
export async function syncLiveAndUpcomingMatches(): Promise<SyncResult> {
  return syncWorldCupMatches({ includeGroupStage: false });
}
