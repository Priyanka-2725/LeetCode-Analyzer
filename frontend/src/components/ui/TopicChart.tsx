import { motion } from 'framer-motion';
import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from 'recharts';
import { TopicStat } from '../../types';

interface TopicChartProps {
  topics: TopicStat[];
}

const NEON_COLORS = [
  '#818CF8', '#A78BFA', '#22D3EE', '#4ADE80',
  '#F87171', '#FB923C', '#FBBF24', '#34D399',
];

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: TopicStat }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div
      className="px-4 py-3 rounded-[14px]"
      style={{
        background: 'rgba(8,12,23,0.97)',
        border: '1px solid rgba(99,102,241,0.35)',
        boxShadow: '0 0 24px rgba(99,102,241,0.25), 0 8px 24px rgba(0,0,0,0.5)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <p className="text-[13px] font-bold text-white mb-1">{d.topic}</p>
      <div className="flex items-center gap-3">
        <span className="text-[12px] font-semibold" style={{ color: '#818CF8' }}>{d.count} problems</span>
        <span className="text-[11px] text-slate-500">{d.percentage.toFixed(1)}%</span>
      </div>
    </div>
  );
}

export default function TopicChart({ topics }: TopicChartProps) {
  const top8 = [...topics].sort((a, b) => b.count - a.count).slice(0, 8);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="glass-card p-6"
    >
      {/* Top shimmer */}
      <div className="absolute top-0 left-0 right-0 h-px rounded-t-[20px]"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(167,139,250,0.4), transparent)' }} />

      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-[15px] font-bold text-white tracking-tight">Topic Analytics</h3>
          <p className="text-[12px] text-slate-500 mt-0.5 font-medium">Top 8 topics by solve count</p>
        </div>
        <div className="flex items-center gap-1.5">
          {NEON_COLORS.slice(0, 4).map((c, i) => (
            <div key={i} className="w-2 h-2 rounded-full" style={{ background: c, boxShadow: `0 0 6px ${c}` }} />
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={230}>
        <BarChart data={top8} margin={{ top: 8, right: 4, left: -22, bottom: 0 }} barSize={20}>
          <defs>
            {NEON_COLORS.map((color, i) => (
              <linearGradient key={i} id={`nbar-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={color} stopOpacity={1} />
                <stop offset="100%" stopColor={color} stopOpacity={0.35} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.04)" horizontal vertical={false} />
          <XAxis dataKey="topic"
            tick={{ fill: '#475569', fontSize: 10, fontWeight: 500 }}
            axisLine={false} tickLine={false}
            interval={0} angle={-28} textAnchor="end" height={44} />
          <YAxis
            tick={{ fill: '#475569', fontSize: 11, fontWeight: 500 }}
            axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.025)', radius: 8 }} />
          <Bar dataKey="count" radius={[8, 8, 0, 0]}>
            {top8.map((_, i) => (
              <Cell key={i} fill={`url(#nbar-${i % NEON_COLORS.length})`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
