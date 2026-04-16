import { motion } from 'framer-motion';
import { Problem } from '../../types';

interface Props {
  problems: Problem[];
  loading?: boolean;
}

const difficultyConfig = {
  Easy:   { color: '#4ADE80', bg: 'rgba(74,222,128,0.12)',  border: 'rgba(74,222,128,0.25)',  glow: 'rgba(74,222,128,0.2)'  },
  Medium: { color: '#FBBF24', bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.25)',  glow: 'rgba(251,191,36,0.2)'  },
  Hard:   { color: '#F87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.25)', glow: 'rgba(248,113,113,0.2)' },
};

function SkeletonCard() {
  return (
    <div className="glass-card p-5 animate-pulse">
      <div className="h-3 w-16 rounded-full mb-3" style={{ background: 'rgba(255,255,255,0.06)' }} />
      <div className="h-4 w-3/4 rounded-full mb-2" style={{ background: 'rgba(255,255,255,0.08)' }} />
      <div className="h-3 w-1/2 rounded-full mb-4" style={{ background: 'rgba(255,255,255,0.05)' }} />
      <div className="h-8 w-full rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }} />
    </div>
  );
}

export default function RecommendedQuestions({ problems, loading = false }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (!problems || problems.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {problems.map((problem, i) => {
        const cfg = difficultyConfig[problem.difficulty];
        const url = `https://leetcode.com/problems/${problem.slug}`;

        return (
          <motion.div
            key={problem.slug}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ scale: 1.02, y: -3 }}
            className="glass-card p-5 flex flex-col gap-3 cursor-default relative overflow-hidden"
          >
            {/* Top shimmer accent */}
            <div className="absolute top-0 left-0 right-0 h-px rounded-t-[20px]"
              style={{ background: `linear-gradient(90deg, transparent, ${cfg.color}60, transparent)` }} />

            {/* Recommended badge */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                style={{ color: '#A78BFA', background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)' }}>
                🔥 Recommended
              </span>
              {/* Difficulty badge */}
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`, boxShadow: `0 0 8px ${cfg.glow}` }}>
                {problem.difficulty}
              </span>
            </div>

            {/* Title */}
            <p className="text-[14px] font-bold text-white leading-snug line-clamp-2">
              {problem.title}
            </p>

            {/* Topics */}
            <div className="flex flex-wrap gap-1.5">
              {problem.topics.slice(0, 3).map((t) => (
                <span key={t} className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                  style={{ color: '#94A3B8', background: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.15)' }}>
                  {t}
                </span>
              ))}
            </div>

            {/* Solve Now button */}
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-auto flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-[12px] font-bold transition-all duration-200"
              style={{
                background: 'rgba(99,102,241,0.15)',
                border: '1px solid rgba(99,102,241,0.3)',
                color: '#818CF8',
                boxShadow: '0 0 12px rgba(99,102,241,0.1)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(99,102,241,0.28)';
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 0 20px rgba(99,102,241,0.3)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(99,102,241,0.15)';
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 0 12px rgba(99,102,241,0.1)';
              }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Solve Now
            </a>
          </motion.div>
        );
      })}
    </div>
  );
}
