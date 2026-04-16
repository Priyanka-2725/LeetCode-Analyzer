import { Insight, Recommendation } from '../../types';

interface Props {
  insights: Insight[];
  recommendations: Recommendation[];
}

const insightBg: Record<Insight['type'], string> = {
  warning: 'bg-amber-500/10 border-amber-500/30',
  success: 'bg-emerald-500/10 border-emerald-500/20',
  info: 'bg-slate-800/50 border-slate-700/50',
};

const insightText: Record<Insight['type'], string> = {
  warning: 'text-amber-300',
  success: 'text-emerald-300',
  info: 'text-slate-300',
};

const recBadge: Record<Recommendation['priority'], string> = {
  high: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
  medium: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  low: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
};

export default function InsightsAndRecs({ insights, recommendations }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* Insights */}
      <div className="card p-6">
        <h3 className="text-slate-200 font-semibold mb-4">🧠 Behavioral Insights</h3>
        {insights.length === 0 ? (
          <p className="text-slate-500 text-sm">No insights available yet</p>
        ) : (
          <div className="space-y-3">
            {insights.map((insight, i) => (
              <div
                key={i}
                className={`rounded-xl p-3 border text-sm leading-relaxed transition-all duration-300 ${insightBg[insight.type]} ${insightText[insight.type]}`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {insight.message}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommendations */}
      <div className="card p-6">
        <h3 className="text-slate-200 font-semibold mb-4">🎯 Recommendations</h3>
        {recommendations.length === 0 ? (
          <p className="text-slate-500 text-sm">No recommendations at this time</p>
        ) : (
          <div className="space-y-3">
            {recommendations.map((rec, i) => (
              <div
                key={i}
                className="flex items-start gap-3 bg-slate-800/50 rounded-xl p-3 border border-slate-700/50"
              >
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${recBadge[rec.priority]}`}>
                  {rec.priority}
                </span>
                <p className="text-slate-300 text-sm leading-relaxed">{rec.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
