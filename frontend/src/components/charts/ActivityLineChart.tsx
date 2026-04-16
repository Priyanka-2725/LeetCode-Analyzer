import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart,
} from 'recharts';
import { ActivityData } from '../../types';

interface Props {
  activityData: ActivityData[];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ActivityLineChart({ activityData }: Props) {
  if (activityData.length === 0) {
    return (
      <div className="card p-6 flex items-center justify-center h-64">
        <p className="text-slate-500">No activity data available</p>
      </div>
    );
  }

  // Sample every N points to avoid overcrowding
  const step = Math.max(1, Math.floor(activityData.length / 30));
  const sampled = activityData.filter((_, i) => i % step === 0);

  const chartData = sampled.map((d) => ({
    date: formatDate(d.date),
    submissions: d.count,
  }));

  return (
    <div className="card p-6">
      <h3 className="text-slate-200 font-semibold mb-4">Submission Activity</h3>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <defs>
            <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#64748b', fontSize: 11 }}
            interval="preserveStartEnd"
          />
          <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
            labelStyle={{ color: '#94a3b8' }}
            itemStyle={{ color: '#e2e8f0' }}
            formatter={(value: number) => [value, 'Submissions']}
          />
          <Area
            type="monotone"
            dataKey="submissions"
            stroke="#0ea5e9"
            strokeWidth={2}
            fill="url(#activityGradient)"
            dot={false}
            activeDot={{ r: 4, fill: '#0ea5e9' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
