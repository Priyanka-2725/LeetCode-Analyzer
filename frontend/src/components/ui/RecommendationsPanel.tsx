import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Recommendation } from '../../types';

interface RecommendationsPanelProps {
  recommendations: Recommendation[];
}

const priorityConfig = {
  high:   { color: '#F87171', bg: 'rgba(248,113,113,0.1)',  label: 'High',   dot: '#F87171' },
  medium: { color: '#FBBF24', bg: 'rgba(251,191,36,0.1)',   label: 'Med',    dot: '#FBBF24' },
  low:    { color: '#4ADE80', bg: 'rgba(74,222,128,0.1)',   label: 'Low',    dot: '#4ADE80' },
};

export default function RecommendationsPanel({ recommendations }: RecommendationsPanelProps) {
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const toggle = (i: number) => setChecked((prev) => {
    const next = new Set(prev);
    next.has(i) ? next.delete(i) : next.add(i);
    return next;
  });

  const sorted = [...recommendations].sort((a, b) =>
    ({ high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority])
  );

  const pct = sorted.length ? (checked.size / sorted.length) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="glass-card p-6 flex flex-col"
    >
      {/* Top shimmer */}
      <div className="absolute top-0 left-0 right-0 h-px rounded-t-[20px]"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.5), transparent)' }} />

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-[11px] flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', boxShadow: '0 0 16px rgba(99,102,241,0.15)' }}>
          <svg className="w-4 h-4" style={{ color: '#818CF8' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-[14px] font-bold text-white tracking-tight">Recommendations</h3>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">Your personalized learning path</p>
        </div>
        <span className="text-[11px] font-bold tabular-nums" style={{ color: pct === 100 ? '#4ADE80' : '#818CF8' }}>
          {checked.size}/{sorted.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative h-1.5 rounded-full mb-5 overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.05)' }}>
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: pct === 100 ? '#4ADE80' : 'linear-gradient(90deg, #6366F1, #A78BFA)' }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
        {pct > 0 && pct < 100 && (
          <motion.div
            className="absolute inset-y-0 rounded-full w-8 blur-sm"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(167,139,250,0.8), transparent)', left: `${pct - 4}%` }}
            animate={{ left: `${pct - 4}%` }}
            transition={{ duration: 0.5 }}
          />
        )}
      </div>

      {/* List */}
      <div className="space-y-2 overflow-y-auto flex-1" style={{ maxHeight: '260px' }}>
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="text-2xl mb-2">🎯</div>
            <p className="text-[13px] text-slate-500 font-medium">No recommendations yet</p>
          </div>
        ) : (
          sorted.map((rec, i) => {
            const cfg = priorityConfig[rec.priority];
            const done = checked.has(i);
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.04 * i, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ x: 2 }}
                onClick={() => toggle(i)}
                className="flex items-start gap-3 px-3.5 py-3 rounded-[13px] cursor-pointer"
                style={{
                  background: done ? 'rgba(74,222,128,0.06)' : 'rgba(255,255,255,0.025)',
                  border: `1px solid ${done ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.06)'}`,
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Checkbox */}
                <div
                  className="w-5 h-5 rounded-[6px] flex-shrink-0 mt-0.5 flex items-center justify-center"
                  style={{
                    background: done ? '#4ADE80' : 'transparent',
                    border: `1.5px solid ${done ? '#4ADE80' : 'rgba(255,255,255,0.18)'}`,
                    boxShadow: done ? '0 0 10px rgba(74,222,128,0.4)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <AnimatePresence>
                    {done && (
                      <motion.svg
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="w-3 h-3 text-black"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </motion.svg>
                    )}
                  </AnimatePresence>
                </div>

                <p className={`flex-1 text-[12.5px] leading-relaxed font-medium ${done ? 'line-through text-slate-600' : 'text-slate-300'}`}>
                  {rec.message}
                </p>

                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 uppercase tracking-wide"
                  style={{ background: cfg.bg, color: cfg.color }}
                >
                  {cfg.label}
                </span>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
