import { motion } from 'framer-motion';
import { AnalysisResult, CodingProfile } from '../../types';

interface ProfileCardProps {
  data: AnalysisResult;
}

// Fallback archetype derived from raw stats (used when engine profile is absent)
function deriveArchetype(data: AnalysisResult): CodingProfile & { emoji: string; color: string } {
  const { streak, totalSolved, analytics } = data;
  const consistency = analytics?.consistencyScore ?? 0;

  if (streak >= 30 && consistency >= 80)
    return { type: 'Consistency Grinder', description: 'You show up every single day. Discipline is your superpower.', traits: ['Daily habit', 'Long streaks', 'Steady progress'], emoji: '🔥', color: '#F87171' };
  if (totalSolved >= 300)
    return { type: 'Deep Solver', description: "Volume is your game. You've crushed hundreds of problems.", traits: ['High volume', 'Broad coverage', 'Experienced'], emoji: '⚔️', color: '#818CF8' };
  if (data.hard >= 50)
    return { type: 'Deep Solver', description: "You don't shy away from the toughest challenges.", traits: ['Hard problems', 'Thorough approach', 'Strong depth'], emoji: '🛡️', color: '#A78BFA' };
  if (consistency >= 70)
    return { type: 'Consistency Grinder', description: 'Consistent progress, day after day. Keep the momentum.', traits: ['Regular practice', 'Building habits', 'Steady climb'], emoji: '📈', color: '#22D3EE' };
  return { type: 'Rising Coder', description: "You're building your foundation. Every problem counts.", traits: ['Growing momentum', 'Building habits', 'Expanding skills'], emoji: '🚀', color: '#4ADE80' };
}

const profileEmoji: Record<string, string> = {
  'Speed Solver':        '⚡',
  'Consistency Grinder': '🔥',
  'Deep Solver':         '🧠',
  'Binge Coder':         '💥',
  'Rising Coder':        '🚀',
};

const profileColor: Record<string, string> = {
  'Speed Solver':        '#22D3EE',
  'Consistency Grinder': '#F87171',
  'Deep Solver':         '#A78BFA',
  'Binge Coder':         '#FBBF24',
  'Rising Coder':        '#4ADE80',
};

export default function ProfileCard({ data }: ProfileCardProps) {
  // Prefer engine profile, fall back to derived archetype
  const engineProfile = data.engine?.profile;
  const fallback = deriveArchetype(data);

  const type  = engineProfile?.type        ?? fallback.type;
  const desc  = engineProfile?.description ?? fallback.description;
  const traits = engineProfile?.traits     ?? fallback.traits;
  const emoji = profileEmoji[type] ?? fallback.emoji;
  const color = profileColor[type] ?? fallback.color;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-[22px] p-6 cursor-default"
      style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.14) 0%, rgba(167,139,250,0.07) 40%, rgba(8,12,23,0.95) 100%)',
        border: '1px solid rgba(99,102,241,0.25)',
        boxShadow: '0 0 0 1px rgba(99,102,241,0.08), 0 8px 40px rgba(0,0,0,0.5), 0 0 60px rgba(99,102,241,0.1)',
      }}
    >
      {/* Top shimmer */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(99,102,241,0.6) 40%, rgba(167,139,250,0.4) 60%, transparent 100%)' }} />

      {/* Ambient orbs */}
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl"
        style={{ background: color, opacity: 0.1 }} />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full blur-3xl"
        style={{ background: '#22D3EE', opacity: 0.07 }} />

      <div className="relative z-10 flex items-start gap-5">
        {/* Avatar */}
        <motion.div
          whileHover={{ scale: 1.08, rotate: 3 }}
          transition={{ type: 'spring', stiffness: 300 }}
          className="flex-shrink-0 w-16 h-16 rounded-[18px] flex items-center justify-center text-3xl"
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.25) 0%, rgba(167,139,250,0.15) 100%)',
            border: '1px solid rgba(99,102,241,0.35)',
            boxShadow: '0 0 24px rgba(99,102,241,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
          }}
        >
          {emoji}
        </motion.div>

        <div className="flex-1 min-w-0">
          {/* Badge */}
          <div className="flex items-center gap-2 mb-2">
            <span
              className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest"
              style={{ background: `${color}18`, color, border: `1px solid ${color}35`, boxShadow: `0 0 12px ${color}20` }}
            >
              Coding Profile
            </span>
            {engineProfile && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(99,102,241,0.1)', color: '#818CF8', border: '1px solid rgba(99,102,241,0.2)' }}>
                AI
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-[1.35rem] font-black tracking-tight text-white leading-tight mb-1.5"
            style={{ textShadow: `0 0 30px ${color}50` }}>
            {type}
          </h3>

          {/* Desc */}
          <p className="text-[13px] text-slate-400 leading-relaxed font-medium mb-3">{desc}</p>

          {/* Traits */}
          {traits.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {traits.map((trait) => (
                <span key={trait}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: `${color}12`, color: `${color}cc`, border: `1px solid ${color}25` }}>
                  {trait}
                </span>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center gap-3">
            <a
              href={`https://leetcode.com/u/${data.username}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[12px] font-semibold hover:opacity-80 transition-opacity"
              style={{ color: '#818CF8' }}
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              @{data.username}
              <svg className="w-2.5 h-2.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            {data.cached && (
              <span className="text-[10px] font-medium text-slate-600 px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                cached
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
