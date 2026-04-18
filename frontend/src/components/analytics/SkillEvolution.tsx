import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { SkillEvolution as SkillEvolutionType } from '../../types';

interface SkillEvolutionProps {
  skillEvolution?: SkillEvolutionType;
}

const LINE_COLORS = ['#22D3EE', '#A78BFA', '#4ADE80', '#FBBF24', '#F87171'];

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;

  return (
    <div
      className="px-4 py-3 rounded-[14px] text-sm"
      style={{
        background: 'rgba(8,12,23,0.97)',
        border: '1px solid rgba(34,211,238,0.32)',
        boxShadow: '0 0 24px rgba(34,211,238,0.2), 0 8px 24px rgba(0,0,0,0.5)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <p className="text-[11px] text-slate-500 mb-2 font-medium uppercase tracking-wider">{label}</p>
      <div className="space-y-1">
        {payload.map((item) => (
          <div key={item.name} className="flex items-center justify-between gap-5 text-xs">
            <span className="font-medium" style={{ color: item.color }}>{item.name}</span>
            <span className="text-slate-300">{Number(item.value).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SkillEvolution({ skillEvolution }: SkillEvolutionProps) {
  const masteryTimeline = skillEvolution?.masteryTimeline || {};
  const topics = useMemo(() => Object.keys(masteryTimeline), [masteryTimeline]);

  const topTopics = useMemo(
    () =>
      [...topics]
        .sort((a, b) => {
          const aLast = masteryTimeline[a]?.[masteryTimeline[a].length - 1]?.mastery || 0;
          const bLast = masteryTimeline[b]?.[masteryTimeline[b].length - 1]?.mastery || 0;
          return bLast - aLast;
        })
        .slice(0, 3),
    [topics, masteryTimeline],
  );

  const [topicFilter, setTopicFilter] = useState<string>('__TOP3__');

  const selectedTopics = useMemo(() => {
    if (topicFilter === '__TOP3__') return topTopics;
    return topicFilter ? [topicFilter] : topTopics;
  }, [topicFilter, topTopics]);

  const chartData = useMemo(() => {
    if (!selectedTopics.length) return [];

    const dateSet = new Set<string>();
    for (const topic of selectedTopics) {
      for (const point of masteryTimeline[topic] || []) {
        dateSet.add(point.date);
      }
    }

    const dates = Array.from(dateSet).sort((a, b) => a.localeCompare(b));
    return dates.map((date) => {
      const row: Record<string, string | number> = {
        date,
        label: date.slice(5),
      };

      for (const topic of selectedTopics) {
        const point = (masteryTimeline[topic] || []).find((p) => p.date === date);
        row[topic] = point?.mastery ?? 0;
      }

      return row;
    });
  }, [masteryTimeline, selectedTopics]);

  const growthInsights = skillEvolution?.growthInsights || [];
  const hasEnoughData = chartData.length >= 4 && selectedTopics.length > 0;

  if (!topics.length) {
    return (
      <div className="glass-card p-5">
        <p className="text-sm text-slate-400">Not enough data to show skill evolution yet.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="glass-card p-5"
    >
      <div className="absolute top-0 left-0 right-0 h-px rounded-t-[20px]"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.45), transparent)' }} />

      <div className="flex items-start justify-between mb-5 gap-3 flex-wrap">
        <div>
          <h3 className="text-[15px] font-bold text-white tracking-tight">Skill Evolution Timeline</h3>
          <p className="text-[12px] text-slate-500 mt-0.5 font-medium">Topic mastery progression over time</p>
        </div>

        <label className="text-xs text-slate-400">
          Topic Filter
          <select
            value={topicFilter}
            onChange={(e) => setTopicFilter(e.target.value)}
            className="mt-1 block bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-slate-200"
          >
            <option value="__TOP3__">Top 3 topics</option>
            {topics.map((topic) => (
              <option key={topic} value={topic}>{topic}</option>
            ))}
          </select>
        </label>
      </div>

      {!hasEnoughData ? (
        <p className="text-sm text-slate-500">Not enough data points to render a reliable trend yet.</p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={290}>
            <LineChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#64748B', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: '#64748B', fontSize: 11, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              {selectedTopics.map((topic, index) => (
                <Line
                  key={topic}
                  type="monotone"
                  dataKey={topic}
                  stroke={LINE_COLORS[index % LINE_COLORS.length]}
                  strokeWidth={2.4}
                  dot={false}
                  activeDot={{
                    r: 5,
                    fill: LINE_COLORS[index % LINE_COLORS.length],
                    stroke: '#0B0F1A',
                    strokeWidth: 2,
                  }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>

          <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
            {growthInsights.length > 0 ? (
              growthInsights.map((insight) => (
                <div key={insight} className="rounded-[13px] p-3 bg-white/[0.03] border border-white/6">
                  <p className="text-xs text-slate-300 leading-relaxed">{insight}</p>
                </div>
              ))
            ) : (
              <div className="rounded-[13px] p-3 bg-white/[0.03] border border-white/6">
                <p className="text-xs text-slate-500">No evolution insights are available yet.</p>
              </div>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
}
