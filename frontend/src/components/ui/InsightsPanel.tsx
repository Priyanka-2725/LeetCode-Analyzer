import { motion } from 'framer-motion';
import { Insight } from '../../types';

interface InsightsPanelProps {
  insights: Insight[];
  suggestions?: string[];
}

const typeConfig = {
  warning: {
    color: '#F87171', bg: 'rgba(248,113,113,0.08)',
    border: 'rgba(248,113,113,0.2)', glow: 'rgba(248,113,113,0.15)',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  success: {
    color: '#4ADE80', bg: 'rgba(74,222,128,0.08)',
    border: 'rgba(74,222,128,0.2)', glow: 'rgba(74,222,128,0.12)',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  info: {
    color: '#22D3EE', bg: 'rgba(34,211,238,0.08)',
    border: 'rgba(34,211,238,0.2)', glow: 'rgba(34,211,238,0.12)',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

export default function InsightsPanel({ insights, suggestions = [] }: InsightsPanelProps) {
  const allInsights: Insight[] = [
    ...insights,
    ...suggestions.map((s) => ({ type: 'info' as const, message: s })),
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="glass-card p-6 flex flex-col"
    >
      {/* Top shimmer */}
      <div className="absolute top-0 left-0 right-0 h-px rounded-t-[20px]"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(248,113,113,0.4), transparent)' }} />

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-[11px] flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', boxShadow: '0 0 16px rgba(248,113,113,0.15)' }}>
          <svg className="w-4 h-4" style={{ color: '#F87171' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-[14px] font-bold text-white tracking-tight">Insights</h3>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">{allInsights.length} observations found</p>
        </div>
        <span className="text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider"
          style={{ background: 'rgba(248,113,113,0.1)', color: '#F87171', border: '1px solid rgba(248,113,113,0.2)' }}>
          Live
        </span>
      </div>

      {/* List */}
      <div className="space-y-2 overflow-y-auto flex-1" style={{ maxHeight: '260px' }}>
        {allInsights.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="text-2xl mb-2">✨</div>
            <p className="text-[13px] text-slate-500 font-medium">No insights yet</p>
          </div>
        ) : (
          allInsights.map((insight, i) => {
            const cfg = typeConfig[insight.type];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.04 * i, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-start gap-3 px-3.5 py-3 rounded-[13px]"
                style={{
                  background: cfg.bg,
                  border: `1px solid ${cfg.border}`,
                  boxShadow: `0 0 12px ${cfg.glow}`,
                }}
              >
                <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: `${cfg.color}20`, color: cfg.color }}>
                  {cfg.icon}
                </div>
                <p className="text-[12.5px] leading-relaxed font-medium" style={{ color: `${cfg.color}dd` }}>
                  {insight.message}
                </p>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
