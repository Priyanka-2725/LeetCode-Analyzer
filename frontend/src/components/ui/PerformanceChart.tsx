import { motion } from 'framer-motion';
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { ActivityData } from '../../types';

interface PerformanceChartProps {
  activityData: ActivityData[];
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-4 py-3 rounded-[14px] text-sm"
      style={{
        background: 'rgba(8,12,23,0.97)',
        border: '1px solid rgba(99,102,241,0.35)',
        boxShadow: '0 0 24px rgba(99,102,241,0.25), 0 8px 24px rgba(0,0,0,0.5)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <p className="text-[11px] text-slate-500 mb-1.5 font-medium uppercase tracking-wider">{label}</p>
      <div className="flex items-baseline gap-1.5">
        <span className="text-xl font-black" style={{ color: '#818CF8' }}>{payload[0].value}</span>
        <span className="text-xs text-slate-500 font-medium">solves</span>
      </div>
    </div>
  );
}

export default function PerformanceChart({ activityData }: PerformanceChartProps) {
  const monthlyData = activityData.reduce<Record<string, number>>((acc, d) => {
    const month = d.date.slice(0, 7);
    acc[month] = (acc[month] || 0) + d.count;
    return acc;
  }, {});

  const chartData = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([date, count]) => ({
      date: new Date(date + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      solves: count,
    }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      className="glass-card p-6"
    >
      {/* Top shimmer */}
      <div className="absolute top-0 left-0 right-0 h-px rounded-t-[20px]"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.4), transparent)' }} />

      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-[15px] font-bold text-white tracking-tight">Performance Over Time</h3>
          <p className="text-[12px] text-slate-500 mt-0.5 font-medium">Monthly solve activity · last 12 months</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
          <div className="w-2 h-2 rounded-full" style={{ background: '#818CF8', boxShadow: '0 0 8px #6366F1' }} />
          <span className="text-[11px] font-semibold text-slate-400">Solves</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={230}>
        <AreaChart data={chartData} margin={{ top: 8, right: 4, left: -22, bottom: 0 }}>
          <defs>
            <linearGradient id="solveGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#6366F1" stopOpacity={0.5} />
              <stop offset="60%"  stopColor="#6366F1" stopOpacity={0.1} />
              <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
            </linearGradient>
            <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis dataKey="date"
            tick={{ fill: '#475569', fontSize: 11, fontWeight: 500 }}
            axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fill: '#475569', fontSize: 11, fontWeight: 500 }}
            axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(99,102,241,0.2)', strokeWidth: 1, strokeDasharray: '4 4' }} />
          <Area
            type="monotone"
            dataKey="solves"
            stroke="#818CF8"
            strokeWidth={2.5}
            fill="url(#solveGradient)"
            dot={false}
            activeDot={{ r: 6, fill: '#818CF8', stroke: '#A78BFA', strokeWidth: 2.5, filter: 'url(#lineGlow)' }}
            style={{ filter: 'url(#lineGlow)' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
