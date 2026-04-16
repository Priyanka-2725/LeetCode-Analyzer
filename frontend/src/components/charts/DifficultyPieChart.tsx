import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AnalysisResult } from '../../types';

interface Props {
  data: AnalysisResult;
}

const COLORS = ['#10b981', '#f59e0b', '#f43f5e'];

export default function DifficultyPieChart({ data }: Props) {
  const chartData = [
    { name: 'Easy', value: data.easy },
    { name: 'Medium', value: data.medium },
    { name: 'Hard', value: data.hard },
  ].filter((d) => d.value > 0);

  if (chartData.length === 0) {
    return (
      <div className="card p-6 flex items-center justify-center h-64">
        <p className="text-slate-500">No solved problems yet</p>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h3 className="text-slate-200 font-semibold mb-4">Difficulty Distribution</h3>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={95}
            paddingAngle={3}
            dataKey="value"
          >
            {chartData.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
            labelStyle={{ color: '#94a3b8' }}
            itemStyle={{ color: '#e2e8f0' }}
          />
          <Legend
            formatter={(value) => <span style={{ color: '#94a3b8' }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
