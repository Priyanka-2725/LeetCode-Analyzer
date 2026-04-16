import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';

interface Props {
  weekdayDistribution: { day: string; avg: number }[];
}

export default function WeekdayChart({ weekdayDistribution }: Props) {
  if (weekdayDistribution.every((d) => d.avg === 0)) {
    return (
      <div className="card p-6 flex items-center justify-center h-48">
        <p className="text-slate-500">Not enough data</p>
      </div>
    );
  }

  const maxAvg = Math.max(...weekdayDistribution.map((d) => d.avg), 0.1);

  return (
    <div className="card p-6">
      <h3 className="text-slate-200 font-semibold mb-4">Activity by Day of Week</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={weekdayDistribution} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 12 }} />
          <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
            labelStyle={{ color: '#94a3b8' }}
            itemStyle={{ color: '#e2e8f0' }}
            formatter={(v: number) => [v, 'Avg submissions']}
          />
          <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
            {weekdayDistribution.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.avg >= maxAvg * 0.7 ? '#0ea5e9' : entry.avg >= maxAvg * 0.3 ? '#6366f1' : '#334155'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
