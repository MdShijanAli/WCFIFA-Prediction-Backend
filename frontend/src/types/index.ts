export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  dob?: string;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  hasPaid: boolean;
  accessUnlocked: boolean;
  accessUnlockedAt?: string;
}

export interface Team {
  id: string;
  name: string;
  code: string;
  flagUrl?: string;
  group?: string;
}

export type Round =
  | "ROUND_OF_32"
  | "ROUND_OF_16"
  | "ROUND_OF_8"
  | "QUARTER_FINAL"
  | "SEMI_FINAL"
  | "FINAL";
export type MatchStatus = "SCHEDULED" | "LIVE" | "COMPLETED" | "CANCELLED";

export interface Match {
  id: string;
  round: Round;
  matchNumber: number;
  homeTeam: Team;
  awayTeam: Team;
  homeScore?: number;
  awayScore?: number;
  winnerId?: string;
  status: MatchStatus;
  scheduledAt: string;
  venue?: string;
}

export interface Prediction {
  id: string;
  matchId: string;
  predictedWinnerId: string;
  isCorrect?: boolean;
  pointsEarned: number;
  match: Match;
}

export interface LeaderboardEntry {
  id: string;
  userId: string;
  totalPoints: number;
  rank?: number;
  r32Points: number;
  r16Points: number;
  r8Points: number;
  qfPoints: number;
  sfPoints: number;
  finalPoints: number;
  user: { name: string; gender?: string };
}

export interface Payment {
  status: "PENDING" | "COMPLETED" | "FAILED";
  amount: number;
  currency: string;
  transactionId: string;
  createdAt: string;
}

export const ROUND_LABELS: Record<Round, string> = {
  ROUND_OF_32: "Round of 32",
  ROUND_OF_16: "Round of 16",
  ROUND_OF_8: "Round of 8",
  QUARTER_FINAL: "Quarter Final",
  SEMI_FINAL: "Semi Final",
  FINAL: "Final",
};

export const ROUND_POINTS: Record<Round, number> = {
  ROUND_OF_32: 2,
  ROUND_OF_16: 4,
  ROUND_OF_8: 6,
  QUARTER_FINAL: 8,
  SEMI_FINAL: 10,
  FINAL: 20,
};

export const ROUNDS_ORDER: Round[] = [
  "ROUND_OF_32",
  "ROUND_OF_16",
  "ROUND_OF_8",
  "QUARTER_FINAL",
  "SEMI_FINAL",
  "FINAL",
];
