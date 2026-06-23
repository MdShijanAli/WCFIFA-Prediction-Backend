import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Target, BarChart2, TrendingUp, AlertCircle, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { leaderboardApi, predictionApi, sponsorVideoApi, upcomingMatchesApi } from '../services/api';
import type { LeaderboardEntry, Match, Prediction } from '../types';
import { ROUND_LABELS, ROUND_POINTS, ROUNDS_ORDER } from '../types';

export default function DashboardPage() {
  const { user, accessUnlocked, refreshAuth } = useAuth();
  const [myRank, setMyRank] = useState<LeaderboardEntry | null>(null);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [myPredictions, setMyPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  // sponsor video state
  const [video, setVideo] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);

  console.log('Access Unlocked:', accessUnlocked);

  useEffect(() => {
    if (!accessUnlocked) {
      setLoading(false);
      loadVideo();
      return;
    }

    Promise.all([
      leaderboardApi.getMyRank().then(r => setMyRank(r.data.entry)),
      upcomingMatchesApi.getAll().then(r => setUpcomingMatches(r.data.matches)),
      predictionApi.getMyPredictions().then(r => setMyPredictions(r.data.predictions)),
    ])
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [accessUnlocked]);

  const loadVideo = async () => {
    try {
      const res = await sponsorVideoApi.getCurrent();
      setVideo(res.data.video);
    } catch (err) {
      console.error(err);
    }
  };

  const getEmbedUrl = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|v=)([^&]+)/);
    return match
      ? `https://www.youtube.com/embed/${match[1]}`
      : url;
  };

  const startWatch = async () => {
    try {
      const res = await sponsorVideoApi.start();

      const id = res.data.watchSessionId;
      setSessionId(id);

      const duration = video?.durationSeconds || 15;
      setTimeLeft(duration);
      setShowModal(true);

      const interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            completeWatch(id); // 👈 PASS DIRECT
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (err) {
      console.error(err);
    }
  };

  const completeWatch = async (id: string) => {
    try {
      console.log('Completing session:', id);

      await sponsorVideoApi.complete(id);

      await refreshAuth();

      setShowModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  if (!accessUnlocked) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="card max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />

          <h2 className="text-xl font-bold text-white mb-2">
            Unlock Access
          </h2>

          <p className="text-gray-400 mb-6">
            Watch a short sponsored video to continue
          </p>

          {video && (
            <div className="bg-gray-800 p-3 rounded-xl mb-4 text-left">
              <p className="text-white font-semibold">{video.title}</p>
              <p className="text-gray-400 text-sm">{video.sponsorName}</p>
              <p className="text-gray-500 text-xs">
                Duration: {video.durationSeconds}s
              </p>
            </div>
          )}

          <button
            onClick={startWatch}
            className="btn-primary w-full"
          >
            Watch Video & Unlock
          </button>
        </div>

        {/* VIDEO MODAL */}
        {showModal && video && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-gray-900 p-4 rounded-xl w-full max-w-2xl">

              <div className="flex justify-between mb-2">
                <h3 className="text-white font-bold">
                  {video.title}
                </h3>

                <span className="text-red-400 font-bold">
                  {timeLeft}s
                </span>
              </div>

              <iframe
                className="w-full h-64 rounded-lg"
                src={getEmbedUrl(video.videoUrl)}
                allow="autoplay"
              />

              <div className="w-full bg-gray-700 h-2 rounded mt-3">
                <div
                  className="bg-green-500 h-2 transition-all"
                  style={{
                    width: `${((video.durationSeconds - timeLeft) /
                      video.durationSeconds) *
                      100
                      }%`,
                  }}
                />
              </div>

              <p className="text-gray-400 text-sm mt-2">
                Please wait until video completes...
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold ">Welcome, {user?.name}! 👋</h1>
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
                    <span className="font-medium">{pts} / {max}</span>
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
            <h3 className="text-lg font-bold">Upcoming Matches</h3>
            <Link to="/predict" className="text-[#F5C518] hover:text-[#FFD700] text-sm flex items-center gap-1">
              Predict All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 border rounded-xl animate-pulse" />
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
                <div key={match.id} className="border rounded-xl p-3">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span className="px-2 py-0.5 rounded">{ROUND_LABELS[match.round]}</span>
                    <span>{new Date(match.scheduledAt).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <img src={match.homeTeam.flagUrl} alt={match.homeTeam.name} className="w-8 h-auto mx-auto" />
                      <span className="text-white text-sm font-medium">{match.homeTeam.name}</span>
                    </div>
                    <span className="text-gray-600 text-xs font-bold">VS</span>
                    <div>
                      <img src={match.awayTeam.flagUrl} alt={match.awayTeam.name} className="w-8 h-auto mx-auto" />
                      <span className="text-white text-sm font-medium">{match.awayTeam.name}</span>
                    </div>
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
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-gray-400 text-sm mt-1">{label}</div>
    </div>
  );
}
