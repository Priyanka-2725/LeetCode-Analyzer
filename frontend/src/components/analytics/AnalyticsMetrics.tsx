import { Analytics } from '../../types';

interface Props {
  analytics: Analytics;
}

interface MetricCardProps {
  label: string;
  value: string | number;
  sub: string;
  color: string;
  bg: string;
}

function MetricCard({ label, value, sub, color, bg }: MetricCardProps) {
  return (
    <div className={`card p-5 border ${bg}`}>
      <p className={`text-xs uppercase tracking-wider mb-1 ${color}`}>{label}</p>
      <p className="text-2xl font-bold text-slate-100">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{sub}</p>
    </div>
  );
}

export default function AnalyticsMetrics({ analytics }: Props) {
  const { consistencyScore, avgProblemsPerDay, growthRate, predictions } = analytics;

  const growthColor =
    growthRate > 0 ? 'text-emerald-400' : growthRate < 0 ? 'text-rose-400' : 'text-slate-400';
  const growthBg =
    growthRate > 0 ? 'border-emerald-500/20' : growthRate < 0 ? 'border-rose-500/20' : 'border-slate-700';

  const consistencyColor =
    consistencyScore >= 70 ? 'text-emerald-400' : consistencyScore < 30 ? 'text-rose-400' : 'text-amber-400';
  const consistencyBg =
    consistencyScore >= 70 ? 'border-emerald-500/20' : consistencyScore < 30 ? 'border-rose-500/20' : 'border-amber-500/20';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        label="Consistency Score"
        value={`${consistencyScore}%`}
        sub="active days / total days"
        color={consistencyColor}
        bg={consistencyBg}
      />
      <MetricCard
        label="Avg / Day"
        value={avgProblemsPerDay}
        sub="problems per active day"
        color="text-brand-400"
        bg="border-brand-500/20"
      />
      <MetricCard
        label="Growth Rate"
        value={`${growthRate > 0 ? '+' : ''}${growthRate}%`}
        sub="vs previous 30 days"
        color={growthColor}
        bg={growthBg}
      />
      <MetricCard
        label="Next Milestone"
        value={predictions.nextMilestone}
        sub={
          predictions.daysToNextMilestone !== null
            ? `~${predictions.daysToNextMilestone} days away`
            : 'keep solving!'
        }
        color="text-purple-400"
        bg="border-purple-500/20"
      />
    </div>
  );
}
