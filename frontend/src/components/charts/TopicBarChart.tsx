import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { TopicStat } from '../../types';

interface Props {
  topics: TopicStat[];
}

const BAR_COLORS = [
  '#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f59e0b', '#10b981', '#14b8a6', '#06b6d4', '#3b82f6',
];

export default function TopicBarChart({ topics }: Props) {
  if (topics.length === 0) {
    return (
      <div className="card p-6 flex items-center justify-center h-64">
        <p className="text-slate-500">No topic data available</p>
      </div>
    );
  }

  const top10 = topics.slice(0, 10);

  return (
    <div className="card p-6">
      <h3 className="text-slate-200 font-semibold mb-4">Topic Strength (Top 10)</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={top10} margin={{ top: 5, right: 10, left: -10, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="topic"
            tick={{ fill: '#64748b', fontSize: 11 }}
            angle={-40}
            textAnchor="end"
            interval={0}
          />
          <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
            labelStyle={{ color: '#94a3b8' }}
            itemStyle={{ color: '#e2e8f0' }}
            formatter={(value: number) => [`${value} problems`, 'Solved']}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {top10.map((_, index) => (
              <Cell key={index} fill={BAR_COLORS[index % BAR_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
