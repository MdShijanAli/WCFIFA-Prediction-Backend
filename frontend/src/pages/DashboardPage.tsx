import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Target, BarChart2, TrendingUp, AlertCircle, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { leaderboardApi, matchApi, predictionApi } from '../services/api';
import type { LeaderboardEntry, Match, Prediction } from '../types';
import { ROUND_LABELS, ROUND_POINTS, ROUNDS_ORDER } from '../types';

export default function DashboardPage() {
  const { user } = useAuth();
  const [myRank, setMyRank] = useState<LeaderboardEntry | null>(null);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [myPredictions, setMyPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.hasPaid) { setLoading(false); return; }
    Promise.all([
      leaderboardApi.getMyRank().then(r => setMyRank(r.data.entry)),
      matchApi.getAll({ status: 'SCHEDULED' }).then(r => setUpcomingMatches(r.data.matches.slice(0, 5))),
      predictionApi.getMyPredictions().then(r => setMyPredictions(r.data.predictions)),
    ]).catch(console.error).finally(() => setLoading(false));
  }, [user]);

  const totalPossiblePoints = ROUNDS_ORDER.reduce((sum, r) => sum + ROUND_POINTS[r], 0);

  if (!user?.hasPaid) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="card max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Payment Required</h2>
          <p className="text-gray-400 mb-6">Complete your registration payment to start predicting!</p>
          <Link to="/payment" className="btn-primary inline-block">Complete Payment →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Welcome, {user.name}! 👋</h1>
        <p className="text-gray-400 mt-1">Here's your prediction competition overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Trophy className="w-5 h-5 text-yellow-400" />}
          label="Your Rank"
          value={myRank?.rank ? `#${myRank.rank}` : '-'}
          color="yellow"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-primary-400" />}
          label="Total Points"
          value={myRank?.totalPoints?.toString() || '0'}
          color="green"
        />
        <StatCard
          icon={<Target className="w-5 h-5 text-blue-400" />}
          label="Predictions Made"
          value={myPredictions.length.toString()}
          color="blue"
        />
        <StatCard
          icon={<BarChart2 className="w-5 h-5 text-purple-400" />}
          label="Correct Picks"
          value={myPredictions.filter(p => p.isCorrect).length.toString()}
          color="purple"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Round breakdown */}
        <div className="card">
          <h3 className="text-lg font-bold text-white mb-4">Points by Round</h3>
          <div className="space-y-3">
            {[
              { key: 'r32Points', label: 'Round of 32', max: ROUND_POINTS.ROUND_OF_32 * 16 },
              { key: 'r16Points', label: 'Round of 16', max: ROUND_POINTS.ROUND_OF_16 * 8 },
              { key: 'r8Points', label: 'Round of 8', max: ROUND_POINTS.ROUND_OF_8 * 4 },
              { key: 'qfPoints', label: 'Quarter Final', max: ROUND_POINTS.QUARTER_FINAL * 2 },
              { key: 'sfPoints', label: 'Semi Final', max: ROUND_POINTS.SEMI_FINAL * 2 },
              { key: 'finalPoints', label: 'Final', max: ROUND_POINTS.FINAL },
            ].map(({ key, label, max }) => {
              const pts = (myRank as any)?.[key] || 0;
              const pct = max > 0 ? (pts / max) * 100 : 0;
              return (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">{label}</span>
                    <span className="text-white font-medium">{pts} / {max}</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div
                      className="bg-primary-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming matches */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Upcoming Matches</h3>
            <Link to="/predict" className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1">
              Predict All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-gray-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : upcomingMatches.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No upcoming matches</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingMatches.map(match => (
                <div key={match.id} className="bg-gray-800 rounded-xl p-3">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span className="bg-gray-700 px-2 py-0.5 rounded">{ROUND_LABELS[match.round]}</span>
                    <span>{new Date(match.scheduledAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm font-medium">{match.homeTeam.name}</span>
                    <span className="text-gray-600 text-xs font-bold">VS</span>
                    <span className="text-white text-sm font-medium">{match.awayTeam.name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  const bg: Record<string, string> = {
    yellow: 'bg-yellow-400/10',
    green: 'bg-primary-400/10',
    blue: 'bg-blue-400/10',
    purple: 'bg-purple-400/10',
  };
  return (
    <div className="card">
      <div className={`w-10 h-10 ${bg[color]} rounded-xl flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-gray-400 text-sm mt-1">{label}</div>
    </div>
  );
}
