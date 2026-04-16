import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { TopicMastery } from '../../types';

interface Props {
  topicMastery: TopicMastery[];
}

function masteryColor(mastery: number): string {
  if (mastery >= 75) return '#10b981'; // green
  if (mastery >= 40) return '#f59e0b'; // amber
  return '#f43f5e';                    // red
}

export default function TopicMasteryChart({ topicMastery }: Props) {
  if (topicMastery.length === 0) {
    return (
      <div className="card p-6 flex items-center justify-center h-64">
        <p className="text-slate-500">No topic data available</p>
      </div>
    );
  }

  const top12 = topicMastery.slice(0, 12);

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-slate-200 font-semibold">Topic Mastery %</h3>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Strong</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />Moderate</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />Weak</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={top12} margin={{ top: 5, right: 10, left: -10, bottom: 65 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="topic"
            tick={{ fill: '#64748b', fontSize: 10 }}
            angle={-40}
            textAnchor="end"
            interval={0}
          />
          <YAxis tick={{ fill: '#64748b', fontSize: 11 }} domain={[0, 100]} unit="%" />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
            labelStyle={{ color: '#94a3b8' }}
            itemStyle={{ color: '#e2e8f0' }}
            formatter={(v: number) => [`${v}%`, 'Mastery']}
          />
          <Bar dataKey="mastery" radius={[4, 4, 0, 0]}>
            {top12.map((entry, i) => (
              <Cell key={i} fill={masteryColor(entry.mastery)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
