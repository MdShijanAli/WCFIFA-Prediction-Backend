import React, { useState, useEffect } from 'react';
import { Target, CheckCircle, Clock, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { matchApi, predictionApi } from '../services/api';
import type { Match, Prediction, Round } from '../types';
import { ROUND_LABELS, ROUND_POINTS, ROUNDS_ORDER } from '../types';

export default function PredictPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Record<string, string>>({});
  const [savedPredictions, setSavedPredictions] = useState<Record<string, Prediction>>({});
  const [activeRound, setActiveRound] = useState<Round>('ROUND_OF_32');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      matchApi.getAll(),
      predictionApi.getMyPredictions(),
    ]).then(([matchRes, predRes]) => {
      setMatches(matchRes.data.matches);
      const predMap: Record<string, Prediction> = {};
      const localPreds: Record<string, string> = {};
      predRes.data.predictions.forEach((p: Prediction) => {
        predMap[p.matchId] = p;
        localPreds[p.matchId] = p.predictedWinnerId;
      });
      setSavedPredictions(predMap);
      setPredictions(localPreds);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const roundMatches = matches.filter(m => m.round === activeRound);
  const availableRounds = ROUNDS_ORDER.filter(r => matches.some(m => m.round === r));

  const handlePick = (matchId: string, teamId: string) => {
    const match = matches.find(m => m.id === matchId);
    if (!match || match.status !== 'SCHEDULED') return;
    if (new Date() >= new Date(match.scheduledAt)) {
      toast.error('Match has already started');
      return;
    }
    setPredictions(prev => ({ ...prev, [matchId]: teamId }));
  };

  const handleSaveRound = async () => {
    const roundMatchIds = roundMatches.map(m => m.id);
    const bulk = roundMatchIds
      .filter(id => predictions[id])
      .map(id => ({ matchId: id, predictedWinnerId: predictions[id] }));

    if (bulk.length === 0) {
      toast.error('No predictions to save');
      return;
    }

    setSaving(true);
    try {
      const res = await predictionApi.submitBulk(bulk);
      toast.success(`${res.data.saved} predictions saved!`);
      // Refresh saved predictions
      const predRes = await predictionApi.getMyPredictions();
      const predMap: Record<string, Prediction> = {};
      predRes.data.predictions.forEach((p: Prediction) => { predMap[p.matchId] = p; });
      setSavedPredictions(predMap);
    } catch {
      toast.error('Failed to save predictions');
    } finally {
      setSaving(false);
    }
  };

  const roundPredCount = roundMatches.filter(m => predictions[m.id]).length;


  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-800 rounded-2xl animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Make Predictions</h1>
        <p className="text-gray-400 mt-1">Pick winners for each match before kickoff</p>
      </div>

      {/* Round tabs */}
      <div className="flex gap-2 flex-wrap">
        {availableRounds.map(round => {
          const rMatches = matches.filter(m => m.round === round);
          const rSaved = rMatches.filter(m => savedPredictions[m.id]).length;
          const complete = rSaved === rMatches.length && rMatches.length > 0;
          return (
            <button
              key={round}
              onClick={() => setActiveRound(round)}
              className={`
                px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2
                ${activeRound === round
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
                }
              `}
            >
              {ROUND_LABELS[round]}
              {complete ? (
                <CheckCircle className="w-3.5 h-3.5 text-primary-300" />
              ) : (
                <span className="bg-black/20 text-xs px-1.5 rounded">
                  {rSaved}/{rMatches.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Points info */}
      <div className="flex items-center gap-3 bg-primary-900/30 border border-primary-800 rounded-xl px-4 py-3">
        <Target className="w-5 h-5 text-primary-400" />
        <span className="text-primary-300 text-sm">
          Each correct prediction in {ROUND_LABELS[activeRound]} earns{' '}
          <span className="font-bold text-white">{ROUND_POINTS[activeRound]} points</span>
        </span>
      </div>

      {/* Matches */}
      {roundMatches.length === 0 ? (
        <div className="card text-center py-12">
          <Target className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500">No matches for this round yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {roundMatches.map(match => {
            const selected = predictions[match.id];
            const saved = savedPredictions[match.id];
            const isCompleted = match.status === 'COMPLETED';
            const isStarted = new Date() >= new Date(match.scheduledAt);
            const locked = isCompleted || isStarted || match.status === 'LIVE';

            return (
              <div key={match.id} className="card">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <span>Match #{match.matchNumber}</span>
                  <div className="flex items-center gap-2">
                    {locked && <Lock className="w-3.5 h-3.5" />}
                    <span>{new Date(match.scheduledAt).toLocaleString()}</span>
                    {match.venue && <span>• {match.venue}</span>}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 items-center">
                  <TeamButton
                    team={match.homeTeam}
                    selected={selected === match.homeTeam.id}
                    correct={isCompleted ? match.winnerId === match.homeTeam.id : undefined}
                    predicted={saved?.predictedWinnerId === match.homeTeam.id}
                    locked={locked}
                    onClick={() => handlePick(match.id, match.homeTeam.id)}
                  />

                  <div className="text-center">
                    {isCompleted ? (
                      <div>
                        <div className="text-2xl font-bold text-white">
                          {match.homeScore} - {match.awayScore}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Full Time</div>
                        {saved && (
                          <div className={`text-xs mt-1 font-semibold ${saved.isCorrect ? 'text-primary-400' : 'text-red-400'}`}>
                            {saved.isCorrect ? `+${saved.pointsEarned} pts` : 'No points'}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <div className="text-gray-600 font-bold text-lg">VS</div>
                        <div className="flex items-center justify-center gap-1 mt-1 text-gray-600 text-xs">
                          <Clock className="w-3 h-3" />
                          {locked ? 'Locked' : 'Open'}
                        </div>
                      </div>
                    )}
                  </div>

                  <TeamButton
                    team={match.awayTeam}
                    selected={selected === match.awayTeam.id}
                    correct={isCompleted ? match.winnerId === match.awayTeam.id : undefined}
                    predicted={saved?.predictedWinnerId === match.awayTeam.id}
                    locked={locked}
                    onClick={() => handlePick(match.id, match.awayTeam.id)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Save button */}
      {roundMatches.some(m => m.status === 'SCHEDULED' && new Date() < new Date(m.scheduledAt)) && (
        <div className="flex items-center justify-between sticky bottom-4 bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <div className="text-sm text-gray-400">
            <span className="text-white font-medium">{roundPredCount}</span> of{' '}
            <span className="text-white font-medium">{roundMatches.length}</span> predictions made
          </div>
          <button
            onClick={handleSaveRound}
            disabled={saving || roundPredCount === 0}
            className="btn-primary"
          >
            {saving ? 'Saving...' : 'Save Predictions'}
          </button>
        </div>
      )}
    </div>
  );
}

function TeamButton({ team, selected, correct, predicted, locked, onClick }: {
  team: { id: string; name: string; code: string };
  selected: boolean;
  correct?: boolean;
  predicted?: boolean;
  locked: boolean;
  onClick: () => void;
}) {
  const getStyle = () => {
    if (correct === true) return 'bg-primary-900/50 border-primary-500';
    if (correct === false) return 'bg-red-900/20 border-red-800';
    if (selected) return 'bg-primary-900/50 border-primary-500';
    return 'bg-gray-800 border-gray-700 hover:border-gray-600';
  };

  return (
    <button
      onClick={onClick}
      disabled={locked}
      className={`w-full border-2 rounded-xl p-4 text-center transition-all ${getStyle()} ${!locked ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <div className="text-2xl mb-2">🏳️</div>
      <div className="text-sm font-bold text-white">{team.name}</div>
      <div className="text-xs text-gray-500 mt-1">{team.code}</div>
      {predicted && (
        <div className="text-xs text-primary-400 mt-1 flex items-center justify-center gap-1">
          <CheckCircle className="w-3 h-3" /> Saved
        </div>
      )}
    </button>
  );
}
