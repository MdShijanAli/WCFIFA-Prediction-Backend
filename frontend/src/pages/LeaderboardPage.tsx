import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { leaderboardApi } from '../services/api';
import { LeaderboardEntry } from '../types';
import { useAuth } from '../context/AuthContext';

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<LeaderboardEntry | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async (p: number) => {
    setLoading(true);
    try {
      const [lbRes, myRes] = await Promise.all([
        leaderboardApi.getAll(p),
        leaderboardApi.getMyRank(),
      ]);
      setEntries(lbRes.data.leaderboard);
      setTotalPages(lbRes.data.pagination.pages);
      setTotal(lbRes.data.pagination.total);
      setMyRank(myRes.data.entry);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetchLeaderboard(page); }, [page]);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="text-gray-500 text-sm font-bold w-5 text-center">#{rank}</span>;
  };

  const getRankBg = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500/10 border-yellow-500/30';
    if (rank === 2) return 'bg-gray-400/10 border-gray-400/30';
    if (rank === 3) return 'bg-amber-600/10 border-amber-600/30';
    return 'bg-gray-900 border-gray-800';
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
        <p className="text-gray-400 mt-1">{total} players competing</p>
      </div>

      {/* My position */}
      {myRank && (
        <div className="bg-primary-900/30 border border-primary-700 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-primary-700 rounded-xl">
              <Star className="w-5 h-5 text-yellow-400" />
            </div>
            <div className="flex-1">
              <div className="text-sm text-primary-300">Your Position</div>
              <div className="text-white font-bold">{user?.name}</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">#{myRank.rank || '-'}</div>
              <div className="text-primary-400 text-sm">{myRank.totalPoints} pts</div>
            </div>
          </div>
          <div className="grid grid-cols-6 gap-1 mt-3">
            {[
              { label: 'R32', pts: myRank.r32Points },
              { label: 'R16', pts: myRank.r16Points },
              { label: 'R8', pts: myRank.r8Points },
              { label: 'QF', pts: myRank.qfPoints },
              { label: 'SF', pts: myRank.sfPoints },
              { label: 'Final', pts: myRank.finalPoints },
            ].map(r => (
              <div key={r.label} className="bg-primary-900/50 rounded-lg p-1.5 text-center">
                <div className="text-white text-xs font-bold">{r.pts}</div>
                <div className="text-primary-400 text-xs">{r.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h3 className="font-semibold text-white">All Players</h3>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {entries.map(entry => {
              const rank = entry.rank || 0;
              const isMe = entry.userId === user?.id;
              return (
                <div
                  key={entry.id}
                  className={`flex items-center gap-4 px-6 py-4 transition-colors ${
                    isMe ? 'bg-primary-900/20' : 'hover:bg-gray-800/50'
                  }`}
                >
                  <div className="w-8 flex justify-center">
                    {getRankIcon(rank)}
                  </div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                    isMe ? 'bg-primary-700 text-white' : 'bg-gray-800 text-gray-400'
                  }`}>
                    {entry.user.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${isMe ? 'text-primary-300' : 'text-white'}`}>
                        {entry.user.name}
                      </span>
                      {isMe && <span className="text-xs bg-primary-700 text-primary-200 px-2 py-0.5 rounded-full">You</span>}
                    </div>
                    <div className="flex gap-3 mt-1">
                      {[
                        { label: 'R32', pts: entry.r32Points },
                        { label: 'R16', pts: entry.r16Points },
                        { label: 'QF', pts: entry.qfPoints },
                        { label: 'Final', pts: entry.finalPoints },
                      ].map(r => r.pts > 0 ? (
                        <span key={r.label} className="text-xs text-gray-500">
                          {r.label}: <span className="text-gray-300">{r.pts}</span>
                        </span>
                      ) : null)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-white">{entry.totalPoints}</div>
                    <div className="text-xs text-gray-500">points</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-between">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary py-2 px-4 text-sm flex items-center gap-1 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <span className="text-gray-400 text-sm">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-secondary py-2 px-4 text-sm flex items-center gap-1 disabled:opacity-40"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
