import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Target, BarChart2, TrendingUp, ChevronRight, Play, Pause, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { leaderboardApi, predictionApi, sponsorVideoApi, upcomingMatchesApi } from '../services/api';
import type { LeaderboardEntry, Match, Prediction } from '../types';
import { ROUND_LABELS, ROUND_POINTS } from '../types';

// Extend window for YouTube IFrame API
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

function extractVideoId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|v=)([^&?/]+)/);
  return m ? m[1] : null;
}

export default function DashboardPage() {
  const { user, accessUnlocked, refreshAuth } = useAuth();
  const [myRank, setMyRank] = useState<LeaderboardEntry | null>(null);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [myPredictions, setMyPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  // sponsor video
  const [video, setVideo] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // refs
  const isPausedRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ytPlayerRef = useRef<any>(null);          // YT.Player instance
  const playerDivRef = useRef<HTMLDivElement>(null); // div YT mounts into
  const ytReadyRef = useRef(false);              // YT API loaded?
  const pendingPlayRef = useRef(false);             // play requested before API ready

  // ── Load YouTube IFrame API script once ──────────────────────
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      ytReadyRef.current = true;
      return;
    }
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);

    window.onYouTubeIframeAPIReady = () => {
      ytReadyRef.current = true;
      if (pendingPlayRef.current) {
        pendingPlayRef.current = false;
        mountPlayer();
      }
    };
  }, []);

  // ── Mount / destroy YT.Player when modal opens/closes ────────
  useEffect(() => {
    if (!showModal) {
      destroyPlayer();
      return;
    }
    if (ytReadyRef.current) {
      // Small timeout so the div is in the DOM
      setTimeout(mountPlayer, 50);
    } else {
      pendingPlayRef.current = true;
    }
  }, [showModal]);

  // keep isPausedRef in sync
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);

  // ── Dashboard data ────────────────────────────────────────────
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
    } catch (err) { console.error(err); }
  };

  // ── YT Player helpers ─────────────────────────────────────────
  const mountPlayer = () => {
    if (!playerDivRef.current || !video?.videoUrl) return;
    const videoId = extractVideoId(video.videoUrl);
    if (!videoId) return;

    destroyPlayer(); // clean up any existing player

    ytPlayerRef.current = new window.YT.Player(playerDivRef.current, {
      videoId,
      playerVars: {
        autoplay: 1,
        mute: 0,          // sound on — browser allows because user just clicked
        rel: 0,
        modestbranding: 1,
        controls: 1,
      },
      events: {
        onReady: (e: any) => {
          e.target.playVideo(); // force play on ready
        },
        onStateChange: (e: any) => {
          // YT.PlayerState: PLAYING=1, PAUSED=2
          if (e.data === 2) {
            // video paused externally (user clicked YT controls)
            setIsPaused(true);
            isPausedRef.current = true;
          } else if (e.data === 1) {
            setIsPaused(false);
            isPausedRef.current = false;
          }
        },
      },
    });
  };

  const destroyPlayer = () => {
    if (ytPlayerRef.current) {
      try { ytPlayerRef.current.destroy(); } catch (_) { }
      ytPlayerRef.current = null;
    }
  };

  // ── Watch session ─────────────────────────────────────────────
  const startWatch = async () => {
    try {
      const res = await sponsorVideoApi.start();
      const id = res.data.watchSessionId;
      setSessionId(id);

      const duration = video?.durationSeconds || 15;
      setTotalDuration(duration);
      setTimeLeft(duration);
      setIsPaused(false);
      isPausedRef.current = false;
      setShowModal(true); // triggers mountPlayer via useEffect

      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        if (isPausedRef.current) return;
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            completeWatch(id);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) { console.error(err); }
  };

  const completeWatch = async (id: string) => {
    try {
      await sponsorVideoApi.complete(id);
      await refreshAuth();
      setShowModal(false);
    } catch (err) { console.error(err); }
  };

  // ── Pause / resume ────────────────────────────────────────────
  const togglePause = () => {
    const next = !isPaused;
    setIsPaused(next);
    isPausedRef.current = next;
    if (ytPlayerRef.current) {
      next ? ytPlayerRef.current.pauseVideo() : ytPlayerRef.current.playVideo();
    }
  };

  const elapsed = totalDuration - timeLeft;
  const progressPct = totalDuration > 0 ? (elapsed / totalDuration) * 100 : 0;

  // ── Unlock gate ───────────────────────────────────────────────
  if (!accessUnlocked) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">

        {/* Gate card */}
        <div
          className="w-full max-w-md rounded-2xl p-8 text-center relative overflow-hidden"
          style={{ background: '#0d1220', border: '0.5px solid rgba(245,197,24,0.15)' }}
        >
          <div
            className="absolute pointer-events-none"
            style={{
              top: '-60px', left: '50%', transform: 'translateX(-50%)',
              width: '300px', height: '300px',
              background: 'radial-gradient(circle, rgba(245,197,24,0.08) 0%, transparent 70%)',
            }}
          />

          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: 'rgba(245,197,24,0.1)', border: '0.5px solid rgba(245,197,24,0.25)' }}
          >
            <Lock className="w-7 h-7" style={{ color: '#F5C518' }} />
          </div>

          <h2 className="text-xl font-bold mb-2">Unlock Full Access</h2>
          <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.42)' }}>
            Watch a short sponsored video to unlock all predictions and leaderboard features.
          </p>

          {video && (
            <div
              className="rounded-xl p-4 mb-6 text-left"
              style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)' }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(245,197,24,0.12)' }}
                >
                  <Play className="w-4 h-4" style={{ color: '#F5C518' }} />
                </div>
                <div>
                  <p className="font-semibold text-sm">{video.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>{video.sponsorName}</p>
                  <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>⏱ {video.durationSeconds} seconds</p>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={startWatch}
            className="w-full rounded-xl py-3 text-sm font-semibold tracking-wide flex items-center justify-center gap-2 transition-opacity"
            style={{ background: '#F5C518', color: '#060b18' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            <Play className="w-4 h-4" />
            Watch Video &amp; Unlock
          </button>
        </div>

        {/* ── VIDEO MODAL ── */}
        {showModal && video && (
          <div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}
          >
            <div
              className="w-full max-w-2xl rounded-2xl overflow-hidden"
              style={{
                background: '#0d1220',
                border: '0.5px solid rgba(245,197,24,0.2)',
                boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
              }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: '0.5px solid rgba(255,255,255,0.07)' }}
              >
                <div>
                  <p className="font-semibold text-sm">{video.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{video.sponsorName}</p>
                </div>

                {/* Countdown pill */}
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300"
                  style={{
                    background: isPaused ? 'rgba(255,255,255,0.06)' : 'rgba(245,197,24,0.12)',
                    border: `0.5px solid ${isPaused ? 'rgba(255,255,255,0.12)' : 'rgba(245,197,24,0.3)'}`,
                  }}
                >
                  {isPaused
                    ? <Pause className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.5)' }} />
                    : <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#F5C518' }} />
                  }
                  <span
                    className="font-bold text-sm tabular-nums"
                    style={{ color: isPaused ? 'rgba(255,255,255,0.5)' : '#F5C518' }}
                  >
                    {timeLeft}s
                  </span>
                </div>
              </div>

              {/* Player div — YT.Player mounts here */}
              <div style={{ aspectRatio: '16/9', background: '#000' }}>
                <div ref={playerDivRef} className="w-full h-full" />
              </div>

              {/* Progress + controls */}
              <div className="px-5 py-4">
                <div
                  className="w-full rounded-full overflow-hidden mb-3"
                  style={{ height: '4px', background: 'rgba(255,255,255,0.08)' }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${progressPct}%`,
                      background: isPaused ? 'rgba(255,255,255,0.3)' : 'linear-gradient(90deg, #F5C518, #FFD700)',
                      transition: isPaused ? 'none' : 'width 1s linear',
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {isPaused
                      ? '⏸ Paused — countdown also paused'
                      : '▶ Please watch until the end to unlock access'}
                  </p>

                  <button
                    onClick={togglePause}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
                    style={{
                      background: isPaused ? 'rgba(245,197,24,0.15)' : 'rgba(255,255,255,0.06)',
                      color: isPaused ? '#F5C518' : 'rgba(255,255,255,0.45)',
                      border: `0.5px solid ${isPaused ? 'rgba(245,197,24,0.3)' : 'rgba(255,255,255,0.1)'}`,
                    }}
                  >
                    {isPaused
                      ? <><Play className="w-3 h-3" /> Resume</>
                      : <><Pause className="w-3 h-3" /> Pause</>
                    }
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Main dashboard ────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Welcome, {user?.name}! 👋</h1>
        <p className="text-gray-400 mt-1">Here's your prediction competition overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Trophy className="w-5 h-5 text-yellow-400" />} label="Your Rank" value={myRank?.rank ? `#${myRank.rank}` : '-'} color="yellow" />
        <StatCard icon={<TrendingUp className="w-5 h-5 text-primary-400" />} label="Total Points" value={myRank?.totalPoints?.toString() || '0'} color="green" />
        <StatCard icon={<Target className="w-5 h-5 text-blue-400" />} label="Predictions Made" value={myPredictions.length.toString()} color="blue" />
        <StatCard icon={<BarChart2 className="w-5 h-5 text-purple-400" />} label="Correct Picks" value={myPredictions.filter(p => p.isCorrect).length.toString()} color="purple" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Round breakdown */}
        <div className="card">
          <h3 className="text-lg font-bold mb-4">Points by Round</h3>
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
                    <div className="bg-primary-500 h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
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
              {[1, 2, 3].map(i => <div key={i} className="h-16 border rounded-xl animate-pulse" />)}
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
                    <div className="text-center">
                      <img src={match.homeTeam.flagUrl} alt={match.homeTeam.name} className="w-8 h-auto mx-auto" />
                      <span className="text-sm font-medium">{match.homeTeam.name}</span>
                    </div>
                    <span className="text-gray-600 text-xs font-bold">VS</span>
                    <div className="text-center">
                      <img src={match.awayTeam.flagUrl} alt={match.awayTeam.name} className="w-8 h-auto mx-auto" />
                      <span className="text-sm font-medium">{match.awayTeam.name}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Prizes & Rules Section ── */}
      <div className="space-y-6">

        {/* Section header */}
        <div className="flex items-center gap-3">
          <Trophy className="w-5 h-5" style={{ color: '#BA7517' }} />
          <h2 className="text-lg font-bold">Prizes & Rewards</h2>
          <span
            className="text-[11px] font-medium px-2.5 py-1 rounded-full"
            style={{ background: '#FAEEDA', color: '#633806', border: '0.5px solid #EF9F27' }}
          >
            Top 10 Winners
          </span>
        </div>

        {/* Prize grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { rank: 1, prize: 'iPhone 17 Pro', sub: 'Latest Apple flagship', accent: '#EF9F27', border: '2px solid #EF9F27' },
            { rank: 2, prize: 'Laptop', sub: 'Premium notebook', accent: '#B4B2A9', border: '1.5px solid #B4B2A9' },
            { rank: 3, prize: 'Wireless Headphones', sub: 'Premium audio', accent: '#F0997B', border: '1.5px solid #F0997B' },
            { rank: 4, prize: 'Smart Watch', sub: 'Fitness & lifestyle', accent: null, border: '' },
            { rank: 5, prize: 'Tablet', sub: 'Android / iPad', accent: null, border: '' },
            { rank: 6, prize: 'Action Camera', sub: 'GoPro or equivalent', accent: null, border: '' },
            { rank: 7, prize: 'Bluetooth Speaker', sub: 'Portable, premium', accent: null, border: '' },
            { rank: 8, prize: 'Shopping Voucher', sub: 'Tk. 5,000 worth', accent: null, border: '' },
            { rank: 9, prize: 'Official WC Jersey', sub: 'Authentic edition', accent: null, border: '' },
            { rank: 10, prize: 'Special Hamper', sub: 'NBWC goodies pack', accent: null, border: '' },
          ].map(({ rank, prize, sub, border }) => (
            <div
              key={rank}
              className="card relative pt-5"
              style={border ? { border } : {}}
            >
              {rank <= 3 && (
                <div
                  className="absolute top-0 right-3 text-[10px] font-medium px-2 py-0.5 rounded-b-md"
                  style={{
                    background: rank === 1 ? '#EF9F27' : rank === 2 ? '#B4B2A9' : '#F0997B',
                    color: rank === 1 ? '#412402' : rank === 2 ? '#2C2C2A' : '#4A1B0C',
                  }}
                >
                  {rank === 1 ? '1st' : rank === 2 ? '2nd' : '3rd'} Place
                </div>
              )}
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-medium mb-3"
                style={{
                  background: rank === 1 ? '#FAEEDA' : rank === 2 ? '#F1EFE8' : rank === 3 ? '#FAECE7' : 'rgba(255,255,255,0.06)',
                  color: rank === 1 ? '#633806' : rank === 2 ? '#444441' : rank === 3 ? '#712B13' : 'rgba(255,255,255,0.4)',
                }}
              >
                {rank}
              </div>
              <Trophy
                className="w-5 h-5 mb-2"
                style={{ color: rank === 1 ? '#BA7517' : rank === 2 ? '#888780' : rank === 3 ? '#993C1D' : 'rgba(255,255,255,0.3)' }}
              />
              <p className="text-sm font-semibold leading-tight">{prize}</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.38)' }}>{sub}</p>
            </div>
          ))}
        </div>

        {/* Rules card */}
        <div className="card">
          <h3 className="text-base font-bold mb-4 flex items-center gap-2">
            <Target className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
            Competition rules & policy
          </h3>
          <div className="space-y-0 divide-y" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            {[
              { num: 1, text: 'Rankings are determined entirely by total points earned across all rounds.', tag: 'Points-based', tagBg: '#E1F5EE', tagColor: '#085041' },
              { num: 2, text: 'Each correct prediction earns points according to the round — higher rounds carry more weight. Predictions cannot be changed after a match kicks off.', tag: null },
              { num: 3, text: 'If two or more participants finish with equal points, a tiebreaker quiz will be held between them to determine final ranking.', tag: 'Quiz tiebreaker', tagBg: '#EEEDFE', tagColor: '#3C3489' },
              { num: 4, text: 'If scores remain tied even after the quiz, the winner will be decided by a fair lottery conducted publicly and transparently.', tag: 'Lottery', tagBg: '#FAEEDA', tagColor: '#633806' },
              { num: 5, text: 'All participants must abide by decisions made by the NBWC authority. Authority decisions are final and binding in all matters.', tag: 'Authority final', tagBg: '#FCEBEB', tagColor: '#791F1F' },
              { num: 6, text: 'Any attempt to manipulate predictions, exploit system vulnerabilities, or engage in unfair conduct will result in immediate disqualification without appeal.', tag: null },
              { num: 7, text: 'Winners will be announced after the FIFA World Cup 2026 Final. Prize distribution details will be communicated directly to winners by the NBWC authority.', tag: null },
            ].map(({ num, text, tag, tagBg, tagColor }) => (
              <div key={num} className="flex items-start gap-3 py-3">
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-medium flex-shrink-0 mt-0.5"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)' }}
                >
                  {num}
                </div>
                <p className="text-sm leading-relaxed ">
                  {text}
                  {tag && (
                    <span
                      className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full ml-2 align-middle"
                      style={{ background: tagBg, color: tagColor }}
                    >
                      {tag}
                    </span>
                  )}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: string; color: string;
}) {
  const bg: Record<string, string> = {
    yellow: 'bg-yellow-400/10', green: 'bg-primary-400/10',
    blue: 'bg-blue-400/10', purple: 'bg-purple-400/10',
  };
  return (
    <div className="card">
      <div className={`w-10 h-10 ${bg[color]} rounded-xl flex items-center justify-center mb-3`}>{icon}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-gray-400 text-sm mt-1">{label}</div>
    </div>
  );
}
