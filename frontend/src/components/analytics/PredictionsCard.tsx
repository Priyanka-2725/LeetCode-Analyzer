import { Prediction } from '../../types';

interface Props {
  predictions: Prediction;
  totalSolved: number;
  streak: number;
}

export default function PredictionsCard({ predictions, totalSolved, streak }: Props) {
  const { daysToNextMilestone, nextMilestone, streakBreakRiskDays, projectedSolvesIn30Days } = predictions;

  return (
    <div className="card p-6">
      <h3 className="text-slate-200 font-semibold mb-5">Predictions</h3>
      <div className="space-y-4">

        {/* Milestone prediction */}
        <div className="flex items-start gap-3 bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <span className="text-xl">🎯</span>
          <div>
            <p className="text-slate-300 text-sm font-medium">Next milestone: {nextMilestone} problems</p>
            <p className="text-slate-500 text-xs mt-0.5">
              {daysToNextMilestone !== null
                ? `At your current pace, you'll reach it in ~${daysToNextMilestone} day${daysToNextMilestone !== 1 ? 's' : ''}`
                : 'Start solving to get a prediction'}
            </p>
          </div>
        </div>

        {/* 30-day projection */}
        <div className="flex items-start gap-3 bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <span className="text-xl">📈</span>
          <div>
            <p className="text-slate-300 text-sm font-medium">
              Projected total in 30 days: {projectedSolvesIn30Days}
            </p>
            <p className="text-slate-500 text-xs mt-0.5">
              +{projectedSolvesIn30Days - totalSolved} problems from today
            </p>
          </div>
        </div>

        {/* Streak risk */}
        {streakBreakRiskDays !== null ? (
          <div className="flex items-start gap-3 bg-rose-500/10 rounded-xl p-4 border border-rose-500/30">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="text-rose-300 text-sm font-medium">Streak at risk</p>
              <p className="text-rose-400/80 text-xs mt-0.5">
                Based on recent activity, your {streak}-day streak may break in ~{streakBreakRiskDays} day{streakBreakRiskDays !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        ) : streak > 0 ? (
          <div className="flex items-start gap-3 bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
            <span className="text-xl">🔥</span>
            <div>
              <p className="text-emerald-300 text-sm font-medium">{streak}-day streak is healthy</p>
              <p className="text-slate-500 text-xs mt-0.5">Keep solving daily to maintain it</p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <span className="text-xl">💤</span>
            <div>
              <p className="text-slate-300 text-sm font-medium">No active streak</p>
              <p className="text-slate-500 text-xs mt-0.5">Solve a problem today to start one</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
