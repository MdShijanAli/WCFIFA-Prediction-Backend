import React, { useState, useEffect } from "react";
import {
  Target,
  CheckCircle,
  Clock,
  Lock,
  XCircle,
  TrendingUp,
  Trophy,
} from "lucide-react";
import toast from "react-hot-toast";
import { matchApi, predictionApi } from "../services/api";
import type { Match, Prediction, Round } from "../types";
import { ROUND_LABELS, ROUND_POINTS, ROUNDS_ORDER } from "../types";

export default function PredictPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Record<string, string>>({});
  const [savedPredictions, setSavedPredictions] = useState<
    Record<string, Prediction>
  >({});
  const [activeRound, setActiveRound] = useState<Round>("ROUND_OF_32");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([matchApi.getAll(), predictionApi.getMyPredictions()])
      .then(([matchRes, predRes]) => {
        setMatches(matchRes.data.matches);
        const predMap: Record<string, Prediction> = {};
        const localPreds: Record<string, string> = {};
        predRes.data.predictions.forEach((p: Prediction) => {
          predMap[p.matchId] = p;
          localPreds[p.matchId] = p.predictedWinnerId;
        });
        setSavedPredictions(predMap);
        setPredictions(localPreds);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const roundMatches = matches.filter((m) => m.round === activeRound);
  const availableRounds = ROUNDS_ORDER.filter((r) =>
    matches.some((m) => m.round === r),
  );

  const handlePick = (matchId: string, teamId: string) => {
    const match = matches.find((m) => m.id === matchId);
    if (!match) return;
    if (savedPredictions[matchId]) {
      toast.error("You have already submitted this prediction");
      return;
    }
    if (match.status !== "SCHEDULED") return;
    if (new Date() >= new Date(match.scheduledAt)) {
      toast.error("Match has already started");
      return;
    }
    setPredictions((prev) => ({ ...prev, [matchId]: teamId }));
  };

  const handleSaveRound = async () => {
    const bulk = roundMatches
      .filter((m) => predictions[m.id] && !savedPredictions[m.id])
      .map((m) => ({ matchId: m.id, predictedWinnerId: predictions[m.id] }));

    if (bulk.length === 0) {
      toast.error("No new predictions to save");
      return;
    }

    setSaving(true);
    try {
      const res = await predictionApi.submitBulk(bulk);
      toast.success(`${res.data.saved} predictions saved!`);
      const predRes = await predictionApi.getMyPredictions();
      const predMap: Record<string, Prediction> = {};
      predRes.data.predictions.forEach((p: Prediction) => {
        predMap[p.matchId] = p;
      });
      setSavedPredictions(predMap);
    } catch {
      toast.error("Failed to save predictions");
    } finally {
      setSaving(false);
    }
  };

  const roundStats = {
    correct: roundMatches.filter(
      (m) => savedPredictions[m.id]?.isCorrect === true,
    ).length,
    wrong: roundMatches.filter(
      (m) => savedPredictions[m.id]?.isCorrect === false,
    ).length,
    pending: roundMatches.filter(
      (m) =>
        savedPredictions[m.id] && savedPredictions[m.id]?.isCorrect === null,
    ).length,
    unsaved: roundMatches.filter(
      (m) => predictions[m.id] && !savedPredictions[m.id],
    ).length,
  };
  const totalPts = roundMatches.reduce(
    (acc, m) => acc + (savedPredictions[m.id]?.pointsEarned || 0),
    0,
  );

  if (loading)
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Make Predictions</h1>
        <p className="text-gray-500 mt-1">
          Pick winners for each match before kickoff
        </p>
      </div>

      {/* Round tabs */}
      <div className="flex gap-2 flex-wrap">
        {availableRounds.map((round) => {
          const rMatches = matches.filter((m) => m.round === round);
          const rSaved = rMatches.filter((m) => savedPredictions[m.id]).length;
          const rCorrect = rMatches.filter(
            (m) => savedPredictions[m.id]?.isCorrect === true,
          ).length;
          const rWrong = rMatches.filter(
            (m) => savedPredictions[m.id]?.isCorrect === false,
          ).length;
          const complete = rSaved === rMatches.length && rMatches.length > 0;
          const isActive = activeRound === round;

          return (
            <button
              key={round}
              onClick={() => setActiveRound(round)}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 border"
              style={{
                background: isActive ? "#1a1a2e" : "#f3f4f6",
                color: isActive ? "#F5C518" : "#374151",
                borderColor: isActive ? "#1a1a2e" : "#e5e7eb",
              }}
            >
              {ROUND_LABELS[round]}
              {complete ? (
                <CheckCircle
                  className="w-3.5 h-3.5"
                  style={{ color: isActive ? "#4ade80" : "#16a34a" }}
                />
              ) : (
                <span
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{
                    background: isActive ? "rgba(255,255,255,0.15)" : "#e5e7eb",
                    color: isActive ? "#fff" : "#6b7280",
                  }}
                >
                  {rSaved}/{rMatches.length}
                </span>
              )}
              {rCorrect > 0 && (
                <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
              )}
              {rWrong > 0 && (
                <span className="w-2 h-2 rounded-full bg-red-500  flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Round summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 border border-gray-200 rounded-2xl p-4">
        <SummaryPill
          icon={<Trophy className="w-4 h-4 text-yellow-500" />}
          label="Points Earned"
          value={`${totalPts} pts`}
          valueColor="text-yellow-600"
        />
        <SummaryPill
          icon={<CheckCircle className="w-4 h-4 text-green-500" />}
          label="Correct"
          value={`${roundStats.correct}`}
          valueColor="text-green-600"
        />
        <SummaryPill
          icon={<XCircle className="w-4 h-4 text-red-500" />}
          label="Wrong"
          value={`${roundStats.wrong}`}
          valueColor="text-red-600"
        />
        <SummaryPill
          icon={<Clock className="w-4 h-4 text-blue-500" />}
          label="Awaiting"
          value={`${roundStats.pending}`}
          valueColor="text-blue-600"
        />
      </div>

      {/* Points info banner */}
      <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
        <Target className="w-5 h-5 text-yellow-600 flex-shrink-0" />
        <span className="text-sm text-gray-700">
          Each correct prediction in{" "}
          <span className="font-semibold text-yellow-700">
            {ROUND_LABELS[activeRound]}
          </span>{" "}
          earns{" "}
          <span className="font-bold text-yellow-700">
            {ROUND_POINTS[activeRound]} points
          </span>
        </span>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
        {[
          { bg: "#dcfce7", border: "#16a34a", label: "Correct prediction ✓" },
          { bg: "#fee2e2", border: "#dc2626", label: "Wrong prediction ✗" },
          {
            bg: "#dbeafe",
            border: "#2563eb",
            label: "Predicted, awaiting result",
          },
          { bg: "#f3f4f6", border: "#d1d5db", label: "Not predicted yet" },
        ].map(({ bg, border, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ background: bg, border: `1.5px solid ${border}` }}
            />
            {label}
          </div>
        ))}
      </div>

      {/* Match cards */}
      {roundMatches.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl text-center py-12">
          <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-400">No matches for this round yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {roundMatches.map((match) => {
            const selected = predictions[match.id];
            const saved = savedPredictions[match.id];
            const isCompleted = match.status === "COMPLETED";
            const isStarted = new Date() >= new Date(match.scheduledAt);
            const locked =
              isCompleted || isStarted || match.status === "LIVE" || !!saved;

            let cardState: "correct" | "wrong" | "predicted" | "default" =
              "default";
            if (saved?.isCorrect === true) cardState = "correct";
            else if (saved?.isCorrect === false) cardState = "wrong";
            else if (saved) cardState = "predicted";

            const cardStyle = {
              correct: { bg: "#f0fdf4", border: "#86efac" },
              wrong: { bg: "#fff1f2", border: "#fca5a5" },
              predicted: { bg: "#eff6ff", border: "#93c5fd" },
              default: { bg: "#ffffff", border: "#e5e7eb" },
            }[cardState];

            return (
              <div
                key={match.id}
                className="rounded-2xl p-4 transition-all"
                style={{
                  background: cardStyle.bg,
                  border: `1.5px solid ${cardStyle.border}`,
                }}
              >
                {/* Card header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">
                      Match #{match.matchNumber}
                    </span>

                    {cardState === "correct" && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase bg-green-100 text-green-700 border border-green-300">
                        <CheckCircle className="w-3 h-3" /> Correct
                      </span>
                    )}
                    {cardState === "wrong" && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase bg-red-100 text-red-700 border border-red-300">
                        <XCircle className="w-3 h-3" /> Wrong
                      </span>
                    )}
                    {cardState === "predicted" && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase bg-blue-100 text-blue-700 border border-blue-300">
                        <TrendingUp className="w-3 h-3" /> Predicted
                      </span>
                    )}
                    {cardState === "default" && !locked && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase bg-yellow-100 text-yellow-700 border border-yellow-300">
                        Open
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    {locked && !saved && <Lock className="w-3 h-3" />}
                    <span>
                      {new Date(match.scheduledAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                {/* Teams */}
                <div className="grid grid-cols-3 gap-3 items-center">
                  <TeamButton
                    team={match.homeTeam as any}
                    selected={selected === match.homeTeam.id}
                    saved={saved?.predictedWinnerId === match.homeTeam.id}
                    isWinner={
                      isCompleted
                        ? match.winnerId === match.homeTeam.id
                        : undefined
                    }
                    predCorrect={saved?.isCorrect}
                    locked={locked}
                    onClick={() => handlePick(match.id, match.homeTeam.id)}
                  />

                  {/* Center */}
                  <div className="text-center">
                    {isCompleted ? (
                      <div>
                        <div className="text-2xl font-bold text-gray-800 tabular-nums">
                          {match.homeScore}
                          <span className="text-gray-300 mx-1">—</span>
                          {match.awayScore}
                        </div>
                        <div className="text-[10px] mt-1 tracking-widest uppercase text-gray-400">
                          Full Time
                        </div>
                        {saved && (
                          <div
                            className={`text-xs mt-1.5 font-bold ${saved.isCorrect ? "text-green-600" : "text-red-500"}`}
                          >
                            {saved.isCorrect
                              ? `+${saved.pointsEarned} pts`
                              : "0 pts"}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <div className="font-bold text-base tracking-widest text-gray-300">
                          VS
                        </div>
                        <div
                          className={`flex items-center justify-center gap-1 mt-1 text-[10px] tracking-wide uppercase font-medium ${locked ? "text-red-400" : "text-green-500"}`}
                        >
                          {locked ? (
                            <>
                              <Lock className="w-2.5 h-2.5" /> Locked
                            </>
                          ) : (
                            <>
                              <Clock className="w-2.5 h-2.5" /> Open
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <TeamButton
                    team={match.awayTeam as any}
                    selected={selected === match.awayTeam.id}
                    saved={saved?.predictedWinnerId === match.awayTeam.id}
                    isWinner={
                      isCompleted
                        ? match.winnerId === match.awayTeam.id
                        : undefined
                    }
                    predCorrect={saved?.isCorrect}
                    locked={locked}
                    onClick={() => handlePick(match.id, match.awayTeam.id)}
                  />
                </div>

                {/* Already saved notice */}
                {saved && !isCompleted && (
                  <div className="mt-3 flex items-center gap-2 text-xs rounded-lg px-3 py-2 bg-blue-50 text-blue-600 border border-blue-100">
                    <Lock className="w-3 h-3 flex-shrink-0" />
                    Prediction locked in — cannot be changed
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Save button bar */}
      {roundStats.unsaved > 0 && (
        <div className="sticky bottom-4 flex items-center justify-between bg-gray-900 rounded-2xl p-4 shadow-xl border border-gray-700">
          <div className="text-sm text-gray-400">
            <span className="font-semibold text-white">
              {roundStats.unsaved}
            </span>{" "}
            unsaved prediction{roundStats.unsaved > 1 ? "s" : ""}
          </div>
          <button
            onClick={handleSaveRound}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-opacity disabled:opacity-50"
            style={{ background: "#F5C518", color: "#1a1a2e" }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            {saving ? "Saving…" : "Save Predictions"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── TeamButton ──────────────────────────────────────────────────
function TeamButton({
  team,
  selected,
  saved,
  isWinner,
  predCorrect,
  locked,
  onClick,
}: {
  team: { id: string; name: string; code: string; flagUrl: string };
  selected: boolean;
  saved: boolean;
  isWinner?: boolean;
  predCorrect?: boolean | null;
  locked: boolean;
  onClick: () => void;
}) {
  let bg = "#f9fafb";
  let border = "#e5e7eb";
  let badge: React.ReactNode = null;

  if (saved) {
    if (predCorrect === true) {
      bg = "#f0fdf4";
      border = "#16a34a";
      badge = (
        <div className="flex items-center justify-center gap-1 mt-1.5">
          <CheckCircle className="w-3.5 h-3.5 text-green-600" />
          <span className="text-[10px] font-semibold text-green-700">Won</span>
        </div>
      );
    } else if (predCorrect === false) {
      bg = "#fff1f2";
      border = "#dc2626";
      badge = (
        <div className="flex items-center justify-center gap-1 mt-1.5">
          <XCircle className="w-3.5 h-3.5 text-red-500" />
          <span className="text-[10px] font-semibold text-red-600">Lost</span>
        </div>
      );
    } else {
      bg = "#eff6ff";
      border = "#2563eb";
      badge = (
        <div className="flex items-center justify-center gap-1 mt-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          <span className="text-[10px] font-semibold text-blue-600">
            Picked
          </span>
        </div>
      );
    }
  } else if (selected && !locked) {
    bg = "#fefce8";
    border = "#ca8a04";
    badge = (
      <div className="flex items-center justify-center gap-1 mt-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
        <span className="text-[10px] font-semibold text-yellow-700">
          Selected
        </span>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={locked}
      className="w-full rounded-xl p-3 text-center transition-all duration-200"
      style={{
        background: bg,
        border: `1.5px solid ${border}`,
        cursor: locked ? "default" : "pointer",
        opacity: locked && !saved && !selected ? 0.55 : 1,
        boxShadow:
          saved && predCorrect === true
            ? "0 0 0 3px rgba(22,163,74,0.15)"
            : saved && predCorrect === false
              ? "0 0 0 3px rgba(220,38,38,0.12)"
              : saved
                ? "0 0 0 3px rgba(37,99,235,0.12)"
                : "none",
      }}
      onMouseEnter={(e) => {
        if (!locked) e.currentTarget.style.borderColor = "#F5C518";
      }}
      onMouseLeave={(e) => {
        if (!locked) e.currentTarget.style.borderColor = border;
      }}
    >
      <div className="mb-1.5 relative inline-block">
        <img
          src={team.flagUrl}
          alt={team.name}
          className="w-10 h-auto mx-auto"
        />
        {isWinner === true && (
          <span className="absolute -top-1 -right-2 text-sm">🏆</span>
        )}
      </div>

      <div className="text-sm font-bold text-gray-800 leading-tight">
        {team.name}
      </div>
      <div className="text-[10px] mt-0.5 tracking-widest uppercase text-gray-400">
        {team.code}
      </div>

      {badge}
    </button>
  );
}

// ── SummaryPill ─────────────────────────────────────────────────
function SummaryPill({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueColor: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 shadow-sm">
        {icon}
      </div>
      <div>
        <div className={`text-sm font-bold ${valueColor}`}>{value}</div>
        <div className="text-[10px] text-gray-400">{label}</div>
      </div>
    </div>
  );
}
