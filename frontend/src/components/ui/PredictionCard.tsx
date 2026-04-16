import { motion } from 'framer-motion';
import { StreakRiskPrediction, Analytics, MLPrediction } from '../../types';

interface PredictionCardProps {
  /** Engine rule-based prediction (always present when engine ran) */
  prediction?: StreakRiskPrediction | null;
  /** ML microservice prediction (present when Python service is up) */
  mlPrediction?: MLPrediction | null;
  /** Legacy analytics predictions for milestone / projection numbers */
  legacy?: Analytics['predictions'];
}

type RiskLevel = 'low' | 'medium' | 'high';

const riskConfig: Record<RiskLevel, {
  color: string; glow: string; border: string; bg: string; shimmer: string; label: string;
  icon: React.ReactNode;
}> = {
  low: {
    color: '#4ADE80', glow: 'rgba(74,222,128,0.25)', border: 'rgba(74,222,128,0.3)',
    bg: 'rgba(74,222,128,0.08)', shimmer: 'rgba(74,222,128,0.4)', label: 'Low Risk',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>,
  },
  medium: {
    color: '#FBBF24', glow: 'rgba(251,191,36,0.25)', border: 'rgba(251,191,36,0.3)',
    bg: 'rgba(251,191,36,0.08)', shimmer: 'rgba(251,191,36,0.4)', label: 'Medium Risk',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>,
  },
  high: {
    color: '#F87171', glow: 'rgba(248,113,113,0.25)', border: 'rgba(248,113,113,0.3)',
    bg: 'rgba(248,113,113,0.08)', shimmer: 'rgba(248,113,113,0.4)', label: 'High Risk',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>,
  },
};

const declineColor: Record<string, string> = {
  none: '#4ADE80', mild: '#FBBF24', moderate: '#FB923C', severe: '#F87171',
};

export default function PredictionCard({ prediction, mlPrediction, legacy }: PredictionCardProps) {
  // Prefer ML risk level, fall back to engine, fall back to 'low'
  const riskLevel: RiskLevel = mlPrediction?.streakRisk ?? prediction?.riskLevel ?? 'low';
  const cfg = riskConfig[riskLevel];

  const message = mlPrediction?.message ?? prediction?.message ?? 'No prediction data available.';
  const daysToBreak = prediction?.daysToBreak ?? null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="glass-card p-6 relative overflow-hidden"
    >
      {/* Top shimmer */}
      <div className="absolute top-0 left-0 right-0 h-px rounded-t-[20px]"
        style={{ background: `linear-gradient(90deg, transparent, ${cfg.shimmer}, transparent)` }} />
      {/* Ambient blob */}
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl"
        style={{ background: cfg.color, opacity: 0.08 }} />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0"
              style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, boxShadow: `0 0 16px ${cfg.glow}` }}>
              <span style={{ color: cfg.color }}>{cfg.icon}</span>
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-white tracking-tight">Streak Prediction</h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                {mlPrediction ? 'ML-powered · Python service' : 'Rule-based engine'}
              </p>
            </div>
          </div>

          {/* Pulsing risk badge */}
          <motion.span
            animate={{ boxShadow: [`0 0 8px ${cfg.glow}`, `0 0 20px ${cfg.glow}`, `0 0 8px ${cfg.glow}`] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            className="text-[11px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest"
            style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
          >
            {cfg.label}
          </motion.span>
        </div>

        {/* Message */}
        <div className="px-4 py-3.5 rounded-[14px] mb-5"
          style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
          <p className="text-[13px] font-medium leading-relaxed" style={{ color: `${cfg.color}ee` }}>
            {message}
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* ML: predicted solves next week */}
          {mlPrediction && (
            <StatCell
              label="Next 7 Days"
              value={`~${mlPrediction.predictedSolvesNextWeek}`}
              color="#818CF8"
            />
          )}

          {/* ML: predicted solves next month */}
          {mlPrediction && (
            <StatCell
              label="Next 30 Days"
              value={`~${mlPrediction.predictedSolvesNextMonth}`}
              color="#22D3EE"
            />
          )}

          {/* ML: confidence */}
          {mlPrediction && (
            <StatCell
              label="Confidence"
              value={`${Math.round(mlPrediction.confidence * 100)}%`}
              color="#A78BFA"
            />
          )}

          {/* ML: decline severity */}
          {mlPrediction && (
            <StatCell
              label="Decline"
              value={mlPrediction.declineSeverity === 'none' ? 'None' : mlPrediction.declineSeverity}
              color={declineColor[mlPrediction.declineSeverity]}
            />
          )}

          {/* Engine: days to break (when no ML) */}
          {!mlPrediction && daysToBreak !== null && (
            <StatCell label="Days to Break" value={String(daysToBreak)} color="#F87171" />
          )}

          {/* Legacy: next milestone */}
          {legacy && (
            <StatCell label="Next Milestone" value={String(legacy.nextMilestone)} color="#22D3EE" />
          )}

          {/* Legacy: 30d projection */}
          {legacy && !mlPrediction && (
            <StatCell
              label="30d Projection"
              value={String(legacy.projectedSolvesIn30Days)}
              color="#A78BFA"
            />
          )}
        </div>

        {/* ML risk score bar */}
        {mlPrediction && (
          <div className="mt-5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Risk Score</span>
              <span className="text-[11px] font-bold tabular-nums" style={{ color: cfg.color }}>
                {(mlPrediction.riskScore * 100).toFixed(1)}%
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${cfg.color}80, ${cfg.color})` }}
                initial={{ width: 0 }}
                animate={{ width: `${mlPrediction.riskScore * 100}%` }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function StatCell({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="text-center px-3 py-2.5 rounded-[12px]"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="text-[1.25rem] font-black tabular-nums leading-tight" style={{ color }}>
        {value}
      </div>
      <div className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider mt-0.5">
        {label}
      </div>
    </div>
  );
}
